"""Genera los paquetes de Razonamiento Lógico a partir de tools/logica/.

  content/logica-base.json     niveles, retos, simulacros, tipos de error, insignias y fichas de técnica
  content/logica-001.json      preguntas (paquete 1)
  content/logica-002.json      preguntas (paquete 2)
  content/plantilla-logica.json  modelo para escribir paquetes nuevos

Cada pregunta trae, cuando aplica, una comprobación en código de su respuesta:
si alguna falla, este script se detiene. Además revisa formato, técnicas,
códigos repetidos y el reparto de la respuesta correcta entre A, B, C y D.

Ejecutar desde la carpeta raíz:  python3 tools/generar_logica.py
"""
import json, os, random, sys
from collections import Counter

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)

from logica import base
from logica.tecnicas import TECNICAS, CATEGORIA_DE
from logica.preguntas_a import PREGUNTAS
from logica.preguntas_b import SITUACIONES   # al importarlo también se agregan las preguntas de Patrones y Geometría

TIPOS = set(base.CONFIG["tipos_error"])
rng = random.Random(20261004)
tandas = {}

def posicion(paquete):
    """Reparte la correcta entre A, B, C y D por tandas de cuatro barajadas, paquete por paquete."""
    t = tandas.setdefault(paquete, [])
    if not t:
        t.extend([0, 1, 2, 3])
        rng.shuffle(t)
    return t.pop()

def armar(p, paquete, prefijo="L-"):
    assert p["tema"] in CATEGORIA_DE, f'{p["cod"]}: técnica desconocida {p["tema"]}'
    assert p["dif"] in (1, 2, 3), p["cod"]
    textos = [p["ok"]] + [m[0] for m in p["malas"]]
    assert len(set(textos)) == 4, f'{p["cod"]}: opciones repetidas'
    for _, tipo, nota in p["malas"]:
        assert tipo in TIPOS and nota, f'{p["cod"]}: tipo de error {tipo}'
    pos = posicion(paquete)
    opciones = [m[0] for m in p["malas"]]
    errores = [{"tipo": m[1], "nota": m[2]} for m in p["malas"]]
    opciones.insert(pos, p["ok"])
    errores.insert(pos, None)
    q = {"codigo": prefijo + p["cod"], "categoria": CATEGORIA_DE[p["tema"]], "tema": p["tema"], "dificultad": p["dif"],
         "enunciado": p["enun"], "opciones": opciones, "correcta": pos,
         "pista": p["pista"], "pasos": p["pasos"], "errores": errores, "explicacion": p["idea"]}
    if p.get("fig"):
        q["figura"] = p["fig"]
    return q

paquetes = {1: {"textos": [], "preguntas": []}, 2: {"textos": [], "preguntas": []}}
for p in PREGUNTAS:
    paquetes[p["paq"]]["preguntas"].append(armar(p, p["paq"]))
for s in SITUACIONES:
    t = {"codigo": "L-" + s["cod"], "titulo": s["titulo"], "tipologia": "situacion", "fuente": s["fuente"], "contenido": s["contenido"]}
    if s.get("fig"):
        t["figura"] = s["fig"]
    t["preguntas"] = [armar(x, s["paq"]) for x in s["preguntas"]]
    paquetes[s["paq"]]["textos"].append(t)

def escribir(nombre, datos):
    with open(os.path.join("content", nombre), "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
        f.write("\n")

escribir("logica-base.json", {"paquete": "logica-base", "novedad": base.NOVEDAD, "config": base.CONFIG,
                              "tecnicas": TECNICAS, "insignias": base.INSIGNIAS})
for n, d in paquetes.items():
    escribir(f"logica-00{n}.json", {"paquete": f"logica-00{n}", "textos": d["textos"], "preguntas": d["preguntas"]})

escribir("plantilla-logica.json", {
    "paquete": "logica-003",
    "novedad": {"version": "logica-003", "titulo": "Problemas nuevos de lógica", "cuerpo": "Llegaron problemas nuevos de proporciones."},
    "preguntas": [{
        "codigo": "L-POR-5", "categoria": "proporcional", "tema": "porcentajes", "dificultad": 2,
        "enunciado": "Enunciado del problema. Admite **negrita**, listas con «- » y cuadros con filas entre barras verticales.",
        "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"], "correcta": 1,
        "pista": "El primer movimiento, sin dar la respuesta.",
        "pasos": ["Paso 1 de la solución.", "Paso 2.", "Paso 3: el resultado."],
        "errores": [
            {"tipo": "incompleto", "nota": "Qué hizo quien marcó la A y qué le faltó."},
            None,
            {"tipo": "regla", "nota": "Qué regla equivocada lleva a la C."},
            {"tipo": "enunciado", "nota": "Qué respondió en realidad quien marcó la D."}],
        "explicacion": "La idea clave, en una frase."}],
    "textos": [{
        "codigo": "L-S05", "titulo": "Título de la situación", "tipologia": "situacion", "fuente": "Situación original para práctica.",
        "contenido": "Contexto que comparten varias preguntas.\n\n| Columna | A | B |\n| Fila 1 | 2 | 3 |\n| Fila 2 | 4 | 5 |",
        "preguntas": [{
            "codigo": "L-S05-1", "categoria": "proporcional", "tema": "tablas", "dificultad": 1,
            "enunciado": "Pregunta sobre la situación:", "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"], "correcta": 0,
            "pista": "Pista.", "pasos": ["Paso 1.", "Paso 2."],
            "errores": [None, {"tipo": "planteamiento", "nota": "…"}, {"tipo": "calculo", "nota": "…"}, {"tipo": "inferencia", "nota": "…"}],
            "explicacion": "Idea clave."}]}],
    "tecnicas": [{
        "codigo": "tecnica-nueva", "categoria": "proporcional", "nombre": "Nombre de la técnica", "orden": 300,
        "cuando": "En qué tipo de problema se usa.", "pasos": ["Paso 1.", "Paso 2."],
        "ejemplo": "Un ejemplo resuelto.", "trampa": "El error típico."}]
})

# ---------- informe ----------
todas = []
for n, d in paquetes.items():
    for q in d["preguntas"] + [x for t in d["textos"] for x in t["preguntas"]]:
        todas.append((n, q))
codigos = [q["codigo"] for _, q in todas]
assert len(codigos) == len(set(codigos)), "Hay códigos repetidos"
print(f"{len(todas)} preguntas · {len(SITUACIONES)} situaciones · {len(TECNICAS)} técnicas · {len(base.INSIGNIAS)} insignias")
for n in paquetes:
    qs = [q for k, q in todas if k == n]
    larga = sum(1 for q in qs if max(range(4), key=lambda i: len(q["opciones"][i])) == q["correcta"] and len(set(map(len, q["opciones"]))) > 1)
    print(f"  logica-00{n}: {len(qs)} preguntas · correcta en A-D {[Counter(q['correcta'] for q in qs)[i] for i in range(4)]} · la correcta es la más larga en {larga}")
print("  Nivel          fácil media difícil total")
for cat in ("deductivo", "proporcional", "abstracto", "geometrico"):
    c = Counter(q["dificultad"] for _, q in todas if q["categoria"] == cat)
    print(f"  {cat:13} {c[1]:5} {c[2]:5} {c[3]:7} {sum(c.values()):5}")
c = Counter(q["dificultad"] for _, q in todas)
print(f"  {'total':13} {c[1]:5} {c[2]:5} {c[3]:7} {sum(c.values()):5}")
porTema = Counter(q["tema"] for _, q in todas)
sin = [t["codigo"] for t in TECNICAS if not porTema[t["codigo"]]]
print("  Preguntas por técnica:", ", ".join(f"{t['codigo']} {porTema[t['codigo']]}" for t in TECNICAS))
if sin:
    print("  TÉCNICAS SIN PREGUNTAS:", sin)
print("  Tipos de error:", dict(Counter(e["tipo"] for _, q in todas for e in q["errores"] if e)))
print("  Con figura:", sum(1 for _, q in todas if q.get("figura")), "preguntas y", sum(1 for s in SITUACIONES if s.get("fig")), "situaciones")
