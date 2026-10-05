"""Prueba las funciones SQL de Entrelíneas contra un Postgres local.

El demo no ejecuta SQL: este guion es la forma de saber que supabase/*.sql
funciona antes de tocar la base real. Monta una base desde cero (01, 04, 02, 03),
carga todos los paquetes de content/ y recorre lo que hacen la estudiante y el tutor.

Necesita un servidor Postgres local y el módulo psycopg2. Variables de entorno:
  PGHOST (por defecto /tmp) y PGPORT (por defecto 5544), con usuario postgres sin clave.

    python3 tools/pruebas/prueba_sql.py

Al terminar deja la base «le_prueba» para inspeccionarla o para comparar_formas.py.
"""
import json, os, subprocess, sys
import psycopg2
AQUI=os.path.dirname(os.path.abspath(__file__)); APP=os.path.abspath(os.path.join(AQUI,"..",".."))
HOST=os.environ.get("PGHOST","/tmp"); PORT=os.environ.get("PGPORT","5544"); DB="le_prueba"
PSQL=["psql","-h",HOST,"-p",PORT,"-U","postgres","-v","ON_ERROR_STOP=1","-q"]
def sql_file(db, f):
    r=subprocess.run(PSQL+["-d",db,"-f",f],capture_output=True,text=True)
    if r.returncode: print(r.stderr[-2000:]); sys.exit("FALLA "+f)
def nueva_db(db):
    subprocess.run(PSQL+["-c",f"drop database if exists {db}","-c",f"create database {db}"],check=True,capture_output=True)
    sql_file(db,os.path.join(AQUI,"imitacion_supabase.sql"))
def conectar(db):
    c=psycopg2.connect(host=HOST,port=PORT,user="postgres",dbname=db); c.autocommit=True; return c
class U:
    """Ejecuta como un usuario autenticado (rol authenticated + auth.uid())."""
    def __init__(s, con, uid): s.con=con; s.uid=uid
    def q(s, sql, args=None):
        cur=s.con.cursor()
        cur.execute("reset role"); cur.execute("select set_config('request.jwt.claim.sub', %s, false), set_config('request.jwt.claim.role','authenticated',false)", (s.uid or "",))
        cur.execute("set role authenticated" if s.uid else "set role anon")
        try:
            cur.execute(sql, args); r=cur.fetchall() if cur.description else None
        finally:
            cur.execute("reset role")
        return r
    def f(s, sql, args=None):
        r=s.q(sql,args); return r[0][0] if r else None
def admin(con, sql, args=None):
    cur=con.cursor(); cur.execute("reset role"); cur.execute(sql,args); return cur.fetchall() if cur.description else None
J=lambda x: json.dumps(x, ensure_ascii=False)
ok=lambda c, m: print(("  ✓ " if c else "  ✗ FALLA: ")+m) or (c or FALLAS.append(m))
FALLAS=[]
cargar=lambda f: json.load(open(f"{APP}/content/{f}.json",encoding="utf-8"))

# ============ 1 y 2. Base desde cero, con los paquetes de lectura y datos de uso ============
print("1. Base desde cero: 01, 04, 02, 03 y paquetes de lectura")
nueva_db(DB)
for f in ("01_esquema.sql","04_razonamiento_logico.sql","02_funciones.sql","03_carga_inicial.sql"): sql_file(DB, f"{APP}/supabase/{f}")
con=conectar(DB)
tut=admin(con,"insert into auth.users(email) values('diego@entrelineas.app') returning id")[0][0]
est=admin(con,"insert into auth.users(email) values('sofia@entrelineas.app') returning id")[0][0]
otra=admin(con,"insert into auth.users(email) values('otra@entrelineas.app') returning id")[0][0]
admin(con,"update perfiles set rol='tutor' where usuario='diego'")
T=U(con,tut); E=U(con,est); O=U(con,otra); A=U(con,None)
for p in ("paquete-002","paquete-003","paquete-004","paquete-005"): T.f("select importar_paquete(%s::jsonb)",(J(cargar(p)),))
ok(admin(con,"select count(*) from preguntas")[0][0]==150, "150 preguntas de lectura cargadas")
claves={str(i): c for i,c in admin(con,"select id, correcta from preguntas")}
r=E.f("select iniciar_reto(p_n => 5, p_categoria => null, p_mensaje => null)")
for k,p in enumerate(r["preguntas"]):
    E.f("select responder(p_sesion => %s, p_pregunta => %s, p_opcion => %s, p_tiempo_ms => 30000)",(r["sesion_id"],p["id"], claves[p["id"]] if k%2==0 else (claves[p["id"]]+1)%4))
E.f("select finalizar_reto(%s)",(r["sesion_id"],))
s=E.f("select iniciar_simulacro(p_nivel => 'inicial')")
E.f("select entregar_simulacro(%s, %s::jsonb)",(s["sesion_id"], J({p["id"]:{"opcion":claves[p["id"]] if i%3 else 0,"tiempo_ms":50000} for i,p in enumerate(s["preguntas"][:25])})))
m=T.q("insert into mensajes(estudiante_id, autor_id, tipo, titulo, mision) values(%s,%s,'mision','Misión de lectura','{\"n\":5,\"categoria\":\"critico\"}') returning id",(est,tut))[0][0]
res_antes=E.f("select resumen_estudiante(null)")
print("2. 04 y 02 se pueden ejecutar otra vez sin perder nada")
antes=admin(con,"select (select count(*) from respuestas),(select count(*) from sesiones),(select xp from perfiles where usuario='sofia')")[0]
for f in ("04_razonamiento_logico.sql","02_funciones.sql"): sql_file(DB, f"{APP}/supabase/{f}")
ok(antes==admin(con,"select (select count(*) from respuestas),(select count(*) from sesiones),(select xp from perfiles where usuario='sofia')")[0], "no se perdió ni cambió ningún dato")
ok(admin(con,"select count(*) from pg_proc where proname in ('iniciar_reto','responder','iniciar_simulacro','seleccionar_preguntas') and pronamespace='public'::regnamespace")[0][0]==4, "no quedaron funciones duplicadas")

# ============ 3. La app vieja (1.0.0) contra el SQL nuevo ============
print("3. Llamadas con la forma de la versión 1.0.0 (antes de cargar lógica)")
res=E.f("select resumen_estudiante(null)")
ok(sorted(d["categoria"] for d in res["dominio"])==["cohesion","critico","inferencial","literal"], "resumen.dominio sigue trayendo solo los 4 niveles de lectura")
ok(res["dominio"]==res_antes["dominio"] and res["totales"]==res_antes["totales"] and res["racha"]==res_antes["racha"] and len(res["simulacros"])==1, "dominio, totales, racha y simulacros iguales que antes")
r=E.f("select iniciar_reto(p_n => 10, p_categoria => null, p_mensaje => null)")
ok(len(r["preguntas"])==10 and all(admin(con,"select componente from preguntas where id=%s",(p["id"],))[0][0]=="lectura" for p in r["preguntas"]), "iniciar_reto con los 3 parámetros viejos: 10 de lectura")
x=E.f("select responder(p_sesion => %s, p_pregunta => %s, p_opcion => %s, p_tiempo_ms => 20000)",(r["sesion_id"], r["preguntas"][0]["id"], claves[r["preguntas"][0]["id"]]))
ok(x["correcta"] and x["xp"]>=15 and "explicacion" in x, "responder con los 4 parámetros viejos (con bono de ritmo)")
E.f("select finalizar_reto(%s)",(r["sesion_id"],))
r=E.f("select iniciar_reto(p_n => 5, p_categoria => 'critico', p_mensaje => %s)",(m,))
for p in r["preguntas"]: E.f("select responder(%s,%s,%s,20000)",(r["sesion_id"],p["id"],claves[p["id"]]))
f=E.f("select finalizar_reto(%s)",(r["sesion_id"],))
ok(r["tipo"]=="mision" and f["bono"]>=90 and admin(con,"select completado from mensajes where id=%s",(m,))[0][0], "misión vieja de lectura se cumple")
s=E.f("select iniciar_simulacro(p_nivel => 'avanzado')")
ok(len(s["preguntas"])==40 and s["componente"]=="lectura", "iniciar_simulacro(p_nivel) viejo: 40 de lectura")
e=E.f("select entregar_simulacro(%s, %s::jsonb)",(s["sesion_id"], J({p["id"]:{"opcion":claves[p["id"]],"tiempo_ms":60000} for p in s["preguntas"][:30]})))
ok(e["correctas"]==30 and e["respondidas"]==30 and e["puntaje"]==75 and set(e["por_categoria"])<= {"literal","inferencial","critico","cohesion"}, "entregar_simulacro de lectura: 30/40, 75 %")
ok(len(T.f("select panel_tutor()"))==2 and T.f("select generar_alertas()") is not None and isinstance(T.f("select preguntas_falladas(%s)",(est,)),list), "panel, alertas y preguntas falladas del tutor")
ok(E.q("select count(*) from tecnicas")[0][0]==0, "la tabla tecnicas existe y está vacía")

# ============ 4. Cargar lógica ============
print("4. Cargar los paquetes de lógica")
for p in ("logica-base","logica-001","logica-002"):
    x=T.f("select importar_paquete(%s::jsonb)",(J(cargar(p)),)); print("   ", x)
c=T.f("select resumen_contenido()")
ok(c["preguntas"]==150 and c["preguntas_logica"]==109 and c["situaciones"]==4 and c["textos"]==25 and c["tecnicas"]==26, f"banco: 150 lectura, 109 lógica, 4 situaciones, 26 técnicas ({c['preguntas']}, {c['preguntas_logica']}, {c['situaciones']}, {c['tecnicas']})")
ok(admin(con,"select count(*) from preguntas where componente='logica' and (tema is null or pasos is null or errores is null or pista is null)")[0][0]==0, "todas las de lógica tienen técnica, pista, pasos y errores")
ok(admin(con,"select count(*) from preguntas p where componente='logica' and not exists(select 1 from tecnicas t where t.codigo=p.tema)")[0][0]==0, "todas las técnicas referidas existen")
ok(admin(con,"select count(*) from preguntas where componente='logica' and errores->correcta <> 'null'::jsonb")[0][0]==0, "ningún diagnóstico de error cae sobre la opción correcta")
ok(admin(con,"select count(*) from insignias")[0][0]==39, "39 insignias (23 + 16)")
for p in ("logica-001",):   # recargar no duplica
    T.f("select importar_paquete(%s::jsonb)",(J(cargar(p)),))
ok(T.f("select resumen_contenido()")["preguntas_logica"]==109, "recargar un paquete no duplica")
try:
    T.f("select importar_paquete(%s::jsonb)",(J({"paquete":"malo","preguntas":[{"codigo":"X1","categoria":"inventada","enunciado":"x","opciones":["a","b","c","d"],"correcta":0}]}),)); ok(False,"categoría inventada rechazada")
except Exception as ex: ok("no válida" in str(ex), "una categoría inventada se rechaza con mensaje claro")
clavesL={str(i):(c,e) for i,c,e in admin(con,"select id, correcta, errores from preguntas where componente='logica'")}
claves={str(i): c for i,c in admin(con,"select id, correcta from preguntas")}

# ============ 5. Estudiante en lógica ============
print("5. Retos de lógica")
ok(len(E.q("select codigo from tecnicas where activo"))==26, "la estudiante puede leer las técnicas")
try: n=E.q("select count(*) from preguntas")[0][0]
except Exception: n=0
ok(n==0, "la estudiante no puede leer la tabla de preguntas")
r=E.f("select iniciar_reto(p_n => 10, p_categoria => null, p_mensaje => null, p_componente => 'logica', p_tema => null)")
cats=[p["categoria"] for p in r["preguntas"]]
ok(r["componente"]=="logica" and len(cats)==10 and all(p["componente"]=="logica" for p in r["preguntas"]), f"reto de lógica: 10 preguntas, todas de lógica {sorted(set(cats))}")
ok(all(not ({"correcta","pasos","errores","explicacion","tema"} & set(p)) for p in r["preguntas"]) and all(p.get("pista") for p in r["preguntas"]), "el paquete no trae clave, pasos, errores ni técnica; sí la pista")
ok(len(set(cats))==4, "trae los cuatro niveles de lógica")
ses=r["sesion_id"]; p0,p1,p2=r["preguntas"][:3]
c0,e0=clavesL[p0["id"]]; mala=(c0+1)%4
x=E.f("select responder(p_sesion => %s, p_pregunta => %s, p_opcion => %s, p_tiempo_ms => 90000, p_pista => false)",(ses,p0["id"],mala))
ok((not x["correcta"]) and x["xp"]==2 and x["error"]==e0[mala] and x["error"]["tipo"] and isinstance(x["pasos"],list) and x["tema"], f"fallo: llega el diagnóstico de esa opción ({x['error']['tipo']}), los pasos y la técnica")
c1,_=clavesL[p1["id"]]; d1=p1["dificultad"]
x=E.f("select responder(%s,%s,%s,150000,false)",(ses,p1["id"],c1))
ok(x["correcta"] and x["xp"]==10*d1+5 and x["error"] is None, "acierto a los 150 s sin pista: con bono de ritmo (en lógica el margen es 180 s)")
c2,_=clavesL[p2["id"]]; d2=p2["dificultad"]
x=E.f("select responder(%s,%s,%s,60000,true)",(ses,p2["id"],c2))
ok(x["correcta"] and x["xp"]==10*d2 and admin(con,"select pista from respuestas where sesion_id=%s and pregunta_id=%s",(ses,p2["id"]))[0][0], "acierto con pista: sin bono de ritmo, y la pista queda registrada")
try: E.f("select responder(%s,%s,0,1000)",(ses,p2["id"])); ok(False,"doble respuesta")
except Exception as ex: ok("ya fue respondida" in str(ex), "no se puede responder dos veces")
for p in r["preguntas"][3:]: E.f("select responder(%s,%s,%s,40000)",(ses,p["id"],clavesL[p["id"]][0]))
f=E.f("select finalizar_reto(%s)",(ses,))
ok(f["correctas"]==9 and f["componente"]=="logica" and any(i["codigo"]=="log-primera" for i in f["nuevas_insignias"]), f"cierre: 9/10 y llega la insignia «Primera pieza» ({[i['codigo'] for i in f['nuevas_insignias']]})")
r=E.f("select iniciar_reto(p_n => 15, p_categoria => null, p_mensaje => null, p_componente => 'lectura', p_tema => null)")
ok(all(p["componente"]=="lectura" for p in r["preguntas"]) and len(r["preguntas"])==15, "reto de lectura: ninguna de lógica")
for _ in range(6):
    a=E.f("select iniciar_reto(15, null, null, 'logica', null)"); b=E.f("select iniciar_reto(15)")
    assert all(p["componente"]=="logica" for p in a["preguntas"]) and all(p["componente"]=="lectura" for p in b["preguntas"])
ok(True, "seis retos de cada componente más: nunca se mezclan")
r=E.f("select iniciar_reto(5, 'geometrico')")
ok(r["componente"]=="logica" and {p["categoria"] for p in r["preguntas"]}=={"geometrico"}, "reto por nivel (geometría): el componente sale de la categoría")
r=E.f("select iniciar_reto(p_n => 5, p_tema => 'porcentajes')")
ok(len(r["preguntas"])==4 and all(admin(con,"select tema from preguntas where id=%s",(p["id"],))[0][0]=="porcentajes" for p in r["preguntas"]), "reto por técnica: solo preguntas de esa técnica (las 4 que hay)")
r=E.f("select iniciar_reto(p_n => 10, p_componente => 'logica', p_tema => '@errores')")
ok(len(r["preguntas"])==1 and r["preguntas"][0]["id"]==p0["id"], "reto de repaso: trae justo la pregunta que tiene pendiente")
x=E.f("select responder(%s,%s,%s,30000)",(r["sesion_id"],p0["id"],c0)); E.f("select finalizar_reto(%s)",(r["sesion_id"],))
try: E.f("select iniciar_reto(p_n => 10, p_componente => 'logica', p_tema => '@errores')"); ok(False,"repaso vacío")
except Exception as ex: ok("No tienes errores pendientes" in str(ex), "sin errores pendientes, el repaso lo dice")
m2=T.q("insert into mensajes(estudiante_id, autor_id, tipo, titulo, mision) values(%s,%s,'mision','Lógica','{\"n\":5,\"categoria\":null,\"componente\":\"logica\"}') returning id",(est,tut))[0][0]
r=E.f("select iniciar_reto(p_n => 5, p_categoria => null, p_mensaje => %s, p_componente => 'logica')",(m2,))
ok(r["tipo"]=="mision" and all(p["componente"]=="logica" for p in r["preguntas"]), "misión de lógica mezclada")

print("6. Cuaderno de errores")
# falla a propósito varias preguntas con opciones distintas
r=E.f("select iniciar_reto(15, null, null, 'logica', null)"); falladas=[]
for k,p in enumerate(r["preguntas"]):
    c,e=clavesL[p["id"]]; op=c if k%3==0 else (c+1+k)%4
    if op!=c: falladas.append((p["id"],op))
    E.f("select responder(%s,%s,%s,70000)",(r["sesion_id"],p["id"],op))
E.f("select finalizar_reto(%s)",(r["sesion_id"],))
cu=E.f("select cuaderno_errores('logica', null)")
ok(len(cu["pendientes"])==len(falladas) and sum(cu["perfil"].values())==len(falladas)+1, f"{len(cu['pendientes'])} pendientes y perfil de errores {cu['perfil']}")
pe=cu["pendientes"][0]; c,e=clavesL[pe["id"]]
ok(pe["error"]==e[pe["elegida"]] and pe["correcta"]==c and pe["pasos"] and pe["tema"] and "opciones" in pe, "cada pendiente trae su opción, el diagnóstico de esa opción, la clave y los pasos")
ok(cu["recuperadas"]==1 and any(t["tema"] for t in cu["temas"]), "cuenta 1 error corregido (el del repaso) y el avance por técnica")
ok(all(admin(con,"select exists(select 1 from respuestas where user_id=%s and pregunta_id=%s)",(est,x["id"]))[0][0] for x in cu["pendientes"]), "solo devuelve preguntas que ella ya respondió")
try: O.f("select cuaderno_errores('logica', %s)",(est,)); ok(False,"otra estudiante no ve el cuaderno")
except Exception as ex: ok("Sin permiso" in str(ex), "otra estudiante no puede ver su cuaderno")
ok(len(T.f("select cuaderno_errores('logica', %s)",(est,))["pendientes"])==len(falladas), "el tutor sí lo ve")
ok(O.f("select cuaderno_errores('logica', null)")["pendientes"]==[], "cuaderno vacío para quien no ha respondido")

print("7. Simulacro de lógica")
for nivel, n in (("inicial",20),("avanzado",40),("experto",40)):
    s=E.f("select iniciar_simulacro(p_nivel => %s, p_componente => 'logica')",(nivel,))
    ps=s["preguntas"]; cc={}
    for p in ps: cc[p["categoria"]]=cc.get(p["categoria"],0)+1
    dif=sum(p["dificultad"] for p in ps)/len(ps)
    min_=admin(con,"select round(extract(epoch from (limite-inicio))/60) from sesiones where id=%s",(s["sesion_id"],))[0][0]
    # las preguntas de una misma situación quedan juntas
    tx=[p["texto_id"] for p in ps]; juntas=all(tx[i]==tx[i-1] or tx[i] not in tx[:i] for i in range(1,len(tx)) if tx[i])
    ok(len(ps)==n and all(p["componente"]=="logica" for p in ps) and s["componente"]=="logica" and juntas and len(set(p["id"] for p in ps))==n, f"{nivel}: {n} preguntas {cc}, dificultad media {dif:.2f}, {min_} min")
    ok(all(not ({"correcta","pasos","errores"} & set(p)) for p in ps), f"{nivel}: sin clave ni pasos")
    s2=E.f("select iniciar_simulacro(p_nivel => 'inicial', p_componente => 'lectura')")
    ok(s2["retomado"] and s2["sesion_id"]==s["sesion_id"] and s2["componente"]=="logica", f"{nivel}: si hay uno abierto, se retoma ese")
    resp={}
    for i,p in enumerate(ps):
        c,e=clavesL[p["id"]]
        if i%5==4: continue                         # en blanco
        resp[p["id"]]={"opcion": c if i%2==0 else (c+2)%4, "tiempo_ms": 250000 if i==1 else 80000}
    e=E.f("select entregar_simulacro(%s,%s::jsonb)",(s["sesion_id"],J(resp)))
    blancos=n//5; malas=sum(1 for i in range(n) if i%5!=4 and i%2==1)
    ok(e["componente"]=="logica" and e["total"]==n and e["respondidas"]==n-blancos and e["correctas"]==n-blancos-malas and sum(e["por_error"].values())==malas, f"{nivel}: {e['correctas']}/{n}, {e['puntaje']} %, errores por tipo {e['por_error']}")
    d=e["detalle"]
    ok(len(d)==n and all(("pasos" in x and "tema" in x) for x in d) and all((x["error"] is None)==(x["acierto"] or x["elegida"] is None) for x in d) and d[1]["tiempo_ms"]==250000 and sum(v["total"] for v in e["por_tema"].values())==n, f"{nivel}: detalle con pasos, técnica, tiempo y diagnóstico solo en las falladas")
    print("     insignias:", [i["codigo"] for i in e["nuevas_insignias"]])
ds=E.f("select detalle_sesion(%s)",(s["sesion_id"],))
ok(ds["sesion"]["componente"]=="logica" and "preguntas" not in ds["sesion"], "detalle_sesion trae el componente")

print("8. Resumen, insignias y tutor")
res=E.f("select resumen_estudiante(null)")
ok(sorted(d["categoria"] for d in res["dominio"])==["cohesion","critico","inferencial","literal"] and sorted(d["categoria"] for d in res["dominio_logica"])==["abstracto","deductivo","geometrico","proporcional"], "resumen: dominio (lectura) y dominio_logica por separado")
ok(set(res["por_componente"])=={"lectura","logica"} and res["por_componente"]["logica"]["respuestas"]>100 and {x["componente"] for x in res["simulacros"]}=={"lectura","logica"}, f"por_componente y simulacros con componente (lógica: {res['por_componente']['logica']['respuestas']} respuestas)")
ganadas={r[0] for r in admin(con,"select codigo from insignias_usuario where user_id=%s",(est,))}
print("     insignias ganadas:", sorted(ganadas))
ok({"log-primera","log-sim-inicial"}<=ganadas and "sim-avanzado-70" in ganadas and "log-sim-avanzado-70" not in ganadas, "las insignias de simulacro distinguen componente (avanzado al 70 de lectura sí; de lógica no, sacó 40 %)")
pn=T.f("select panel_tutor()"); yo=[x for x in pn if x["id"]==est][0]
ok(yo["logica_7d"]>100 and yo["respuestas_7d"]>yo["logica_7d"], f"panel del tutor con respuestas de lógica ({yo['logica_7d']})")
pf=T.f("select preguntas_falladas(%s)",(est,))
ok(any(x["componente"]=="logica" and x["error"] and x["texto"] for x in pf), "preguntas falladas: con componente, técnica y diagnóstico del último error")
rc=T.f("select resumen_contenido()")
ok(set(rc["matriz"])>={"deductivo","proporcional","abstracto","geometrico","literal"} and len(rc["temas"])==26, "resumen de contenido con la matriz de los dos componentes")
# alerta de caída en una categoría de lógica: se simula historia vieja buena y semana mala
admin(con,"update respuestas r set creado = r.creado - interval '10 days', correcta = true from preguntas p where p.id=r.pregunta_id and p.categoria='geometrico' and r.user_id=%s and r.id %% 2 = 0",(est,))
admin(con,"update respuestas r set correcta = false from preguntas p where p.id=r.pregunta_id and p.categoria='geometrico' and r.user_id=%s and r.id %% 2 = 1",(est,))
n=T.f("select generar_alertas()"); al=admin(con,"select detalle, sugerencia from alertas where tipo='caida' and detalle->>'categoria'='geometrico'")
ok(len(al)==1 and al[0][0]["componente"]=="logica" and "geometría" in al[0][1], f"alerta de caída en geometría con texto propio: «{al[0][1][:60]}…»" if al else "alerta de caída en geometría")
try: E.f("select importar_paquete('{}'::jsonb)"); ok(False,"estudiante importando")
except Exception as ex: ok("Solo para tutores" in str(ex), "la estudiante no puede importar paquetes")
for fn in ("aplicar_pregunta('{}'::jsonb, null, 'x')","seleccionar_preguntas('%s'::uuid, 5, null, 'logica', null)"%est,"evaluar_insignias('%s'::uuid)"%est):
    try: E.f("select "+fn); ok(False,"función interna expuesta: "+fn)
    except Exception as ex: ok("permission denied" in str(ex), "función interna protegida: "+fn.split("(")[0])
try: A.f("select resumen_estudiante(null)"); ok(False,"anónimo")
except Exception as ex: ok("permission denied" in str(ex), "sin sesión no se puede ejecutar nada")

print("\nFALLAS:", FALLAS if FALLAS else "ninguna")
sys.exit(1 if FALLAS else 0)
