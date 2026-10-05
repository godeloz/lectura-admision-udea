"""Compara la forma (las claves) de lo que responden las funciones SQL y el modo demo.

Las pantallas solo se prueban sobre el demo; si una función SQL devuelve una clave
con otro nombre, la app real falla aunque el demo funcione. Este guion llama los
mismos métodos en los dos lados e informa cualquier diferencia de estructura.

Necesita la base «le_prueba» que deja prueba_sql.py, psycopg2 y Playwright con Chromium.

    python3 tools/pruebas/prueba_sql.py && python3 tools/pruebas/comparar_formas.py
"""
import json, os, asyncio, psycopg2
from playwright.async_api import async_playwright
APP=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..",".."))
def forma(x, prof=0):
    """Estructura de claves de un JSON (los diccionarios cuyas claves son ids se resumen)."""
    if isinstance(x, dict):
        ks=list(x)
        if ks and all(len(k)>=30 or k in ("literal","inferencial","critico","cohesion","deductivo","proporcional","abstracto","geometrico","lectura","logica") or k in TEMAS or k in TIPOS for k in ks):
            return {"<clave>": forma(x[ks[0]], prof+1)}
        return {k: forma(v, prof+1) for k,v in sorted(x.items())}
    if isinstance(x, list): return [forma(x[0], prof+1)] if x else []
    return "nulo" if x is None else type(x).__name__.replace("int","num").replace("float","num")
TEMAS=set(t["codigo"] for t in json.load(open(APP+"/content/logica-base.json",encoding="utf-8"))["tecnicas"])
TIPOS={"enunciado","planteamiento","regla","incompleto","calculo","inferencia"}
def comparar(nombre, a, b, ruta=""):
    difs=[]
    if isinstance(a,dict) and isinstance(b,dict):
        for k in sorted(set(a)|set(b)):
            if k not in a: difs.append(f"{ruta}.{k}: falta en SQL")
            elif k not in b: difs.append(f"{ruta}.{k}: falta en demo")
            else: difs+=comparar(nombre,a[k],b[k],ruta+"."+k)
    elif isinstance(a,list) and isinstance(b,list):
        if a and b: difs+=comparar(nombre,a[0],b[0],ruta+"[]")
    elif a!=b and "nulo" not in (a,b) and not (a==[] or b==[] or a=={} or b=={}): difs.append(f"{ruta}: SQL {a} / demo {b}")
    return difs

con=psycopg2.connect(host=os.environ.get("PGHOST","/tmp"),port=os.environ.get("PGPORT","5544"),user="postgres",dbname="le_prueba"); con.autocommit=True
cur=con.cursor()
cur.execute("select id from perfiles where usuario='sofia'"); est=str(cur.fetchone()[0])
cur.execute("select id from perfiles where usuario='diego'"); tut=str(cur.fetchone()[0])
def como(uid, sql, args=None):
    cur.execute("reset role"); cur.execute("select set_config('request.jwt.claim.sub', %s, false)",(uid,)); cur.execute("set role authenticated")
    cur.execute(sql,args); r=cur.fetchone()[0]; cur.execute("reset role"); return r
cur.execute("select id::text, correcta from preguntas"); claves=dict(cur.fetchall())
S={}
r=como(est,"select iniciar_reto(5,null,null,'logica',null)"); S["iniciarReto"]=r
S["responder_mal"]=como(est,"select responder(%s,%s,%s,30000,false)",(r["sesion_id"],r["preguntas"][0]["id"],(claves[r["preguntas"][0]["id"]]+1)%4))
S["responder_bien"]=como(est,"select responder(%s,%s,%s,30000,true)",(r["sesion_id"],r["preguntas"][1]["id"],claves[r["preguntas"][1]["id"]]))
S["finalizarReto"]=como(est,"select finalizar_reto(%s)",(r["sesion_id"],))
s=como(est,"select iniciar_simulacro('inicial','logica')"); S["iniciarSimulacro"]=s
S["entregarSimulacro"]=como(est,"select entregar_simulacro(%s,%s::jsonb)",(s["sesion_id"],json.dumps({p["id"]:{"opcion":(claves[p["id"]]+i)%4,"tiempo_ms":40000} for i,p in enumerate(s["preguntas"][:15])})))
S["detalleSesion"]=como(est,"select detalle_sesion(%s)",(s["sesion_id"],))
S["resumen"]=como(est,"select resumen_estudiante(null)")
S["cuaderno"]=como(est,"select cuaderno_errores('logica',null)")
S["panel"]=como(tut,"select panel_tutor()")
S["preguntasFalladas"]=como(tut,"select preguntas_falladas(%s)",(est,))
S["resumenContenido"]=como(tut,"select resumen_contenido()")
r=como(est,"select iniciar_reto(5)"); S["iniciarReto_lectura"]=r
S["responder_lectura"]=como(est,"select responder(%s,%s,%s,30000)",(r["sesion_id"],r["preguntas"][0]["id"],(claves[r["preguntas"][0]["id"]]+1)%4))

JS="""async () => {
  const a = LE.api, D = {};
  let r = await a.iniciarReto(5, null, null, 'logica', null); D.iniciarReto = r;
  const db = JSON.parse(localStorage.getItem('entrelineas-demo-v2'));
  const clave = Object.fromEntries(db.preguntas.map(p => [p.id, p.correcta]));
  D.responder_mal = await a.responder(r.sesion_id, r.preguntas[0].id, (clave[r.preguntas[0].id]+1)%4, 30000, false);
  D.responder_bien = await a.responder(r.sesion_id, r.preguntas[1].id, clave[r.preguntas[1].id], 30000, true);
  D.finalizarReto = await a.finalizarReto(r.sesion_id);
  const s = await a.iniciarSimulacro('inicial','logica'); D.iniciarSimulacro = s;
  const resp = {}; s.preguntas.slice(0,15).forEach((p,i) => resp[p.id] = {opcion:(clave[p.id]+i)%4, tiempo_ms:40000});
  D.entregarSimulacro = await a.entregarSimulacro(s.sesion_id, resp);
  D.detalleSesion = await a.detalleSesion(s.sesion_id);
  D.resumen = await a.resumen(); D.cuaderno = await a.cuaderno('logica');
  r = await a.iniciarReto(5); D.iniciarReto_lectura = r;
  D.responder_lectura = await a.responder(r.sesion_id, r.preguntas[0].id, (clave[r.preguntas[0].id]+1)%4, 30000);
  const est = db.usuarios.find(u => u.usuario==='sofia').id;
  await a.salir(); await a.entrar('tutor','demo');
  D.panel = await a.panel(); D.preguntasFalladas = await a.preguntasFalladas(est); D.resumenContenido = await a.resumenContenido();
  return D;
}"""
async def demo():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.goto("file://"+APP+"/demo.html"); await pg.wait_for_selector("#f-ingreso")
        await pg.fill("[name=usuario]","sofia"); await pg.fill("[name=clave]","demo"); await pg.click("#f-ingreso button"); await pg.wait_for_selector(".tracklist")
        d=await pg.evaluate(JS); await b.close(); return d
D=asyncio.run(demo())
total=0
for k in S:
    difs=comparar(k, forma(S[k]), forma(D[k]))
    total+=len(difs)
    print(("✓ " if not difs else "✗ ")+k, "" if not difs else difs)
print("diferencias:", total)
