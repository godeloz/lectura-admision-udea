"""Lógica · configuración, insignias y novedad del paquete base (logica-base.json)."""
import json, os

_base = json.load(open(os.path.join(os.path.dirname(__file__), "..", "..", "content", "base.json"), encoding="utf-8"))

# «categorias» se reemplaza completa al cargar: van las cuatro de lectura, tal como
# están en base.json, más las cuatro de lógica.
CATEGORIAS = dict(_base["config"]["categorias"])
for k in CATEGORIAS:
    CATEGORIAS[k] = {**CATEGORIAS[k], "componente": "lectura"}
CATEGORIAS.update({
    "deductivo": {"nombre": "Deducción", "color": "violeta", "componente": "logica",
                  "descripcion": "Condicionales, negaciones, quién dice la verdad, cuadros de descarte, ordenamientos y certeza."},
    "proporcional": {"nombre": "Proporciones", "color": "amarillo", "componente": "logica",
                     "descripcion": "Fracciones, porcentajes, razones, promedios, conteo, probabilidad y lectura de cuadros."},
    "abstracto": {"nombre": "Patrones", "color": "rosa", "componente": "logica",
                  "descripcion": "Series, operadores inventados, ciclos, claves y secuencias de figuras."},
    "geometrico": {"nombre": "Geometría", "color": "menta", "componente": "logica",
                   "descripcion": "Áreas, perímetros, escalas, volúmenes, vistas y triángulos."},
})

CONFIG = {
    "categorias": CATEGORIAS,
    "distribucion_logica": {"deductivo": 0.25, "proporcional": 0.30, "abstracto": 0.20, "geometrico": 0.25},
    "retos_logica": {"opciones": [
        {"n": 5, "nombre": "Riff", "minutos": 12, "descripcion": "Cinco problemas para calentar la cabeza."},
        {"n": 10, "nombre": "Solo", "minutos": 25, "descripcion": "La sesión de lógica de todos los días."},
        {"n": 15, "nombre": "Jam", "minutos": 38, "descripcion": "Para los días con tiempo y ganas."},
    ]},
    "simulacros_logica": {
        "inicial": {"nombre": "Inicial", "preguntas": 20, "minutos": 50, "dificultad": 1.6,
                    "descripcion": "Problemas más directos. Para medir el punto de partida."},
        "avanzado": {"nombre": "Avanzado", "preguntas": 40, "minutos": 90, "dificultad": 2.1,
                     "descripcion": "Igual al bloque de lógica del examen real: 40 preguntas."},
        "experto": {"nombre": "Experto", "preguntas": 40, "minutos": 75, "dificultad": 2.4,
                    "descripcion": "Las mismas 40 preguntas con menos tiempo y problemas más duros, para llegar con holgura."},
    },
    "referencias_logica": [
        {"programa": "Medicina y programas de corte muy alto", "porcentaje": 85,
         "detalle": "33 a 36 aciertos de 40 en Razonamiento Lógico"},
        {"programa": "Derecho, Ingeniería Civil y programas intermedios", "porcentaje": 70,
         "detalle": "28 a 33 aciertos de 40"},
        {"programa": "Programas regionales", "porcentaje": 55, "detalle": "Referencia aproximada"},
    ],
    "tipos_error": {
        "enunciado": {"nombre": "Leíste otra pregunta",
                      "consejo": "Antes de calcular, di con tus palabras qué te piden y en qué unidades. Al terminar, vuelve a leer la pregunta."},
        "planteamiento": {"nombre": "Planteamiento",
                          "consejo": "Traduce el enunciado frase por frase antes de operar: qué es el todo, qué es la parte, qué se compara con qué."},
        "regla": {"nombre": "Regla equivocada",
                  "consejo": "Antes de aplicar una regla, comprueba que el problema cumple sus condiciones. Abre la ficha de la técnica y mira su trampa típica."},
        "incompleto": {"nombre": "A mitad de camino",
                       "consejo": "Tu razonamiento iba bien, pero paraste antes de tiempo. Cuando tengas un resultado, pregúntate si eso es lo que pedían."},
        "calculo": {"nombre": "Cuenta",
                    "consejo": "El camino era el correcto y falló una operación. Estima el resultado antes de calcular y compara al final."},
        "inferencia": {"nombre": "Salto lógico",
                       "consejo": "Concluiste más de lo que las premisas permiten. Busca un caso que cumpla todo lo dicho y haga falsa tu opción."},
    },
}

def _i(codigo, nombre, descripcion, icono, color, orden, **regla):
    return {"codigo": codigo, "nombre": nombre, "descripcion": descripcion, "icono": icono, "color": color,
            "orden": orden, "regla": regla}

L = "logica"
INSIGNIAS = [
    _i("log-primera", "Primera pieza", "Respondiste tu primera pregunta de lógica.", "🧩", "cian", 200, tipo="respuestas", valor=1, componente=L),
    _i("log-aciertos-50", "50 en lógica", "Llevas 50 respuestas correctas de lógica.", "🎯", "amarillo", 201, tipo="aciertos", valor=50, componente=L),
    _i("log-aciertos-200", "200 en lógica", "Llevas 200 respuestas correctas de lógica.", "🥇", "amarillo", 202, tipo="aciertos", valor=200, componente=L),
    _i("log-retos-10", "Diez riffs", "Terminaste 10 retos de lógica.", "🎸", "cian", 210, tipo="retos", valor=10, componente=L),
    _i("log-solo-perfecto", "Solo limpio", "Un reto de lógica de 10 preguntas sin un solo error.", "🎼", "menta", 211, tipo="reto_perfecto", valor=10, componente=L),
    _i("log-recuperadas-5", "Error corregido", "Cinco preguntas de lógica que fallaste y después respondiste bien.", "🔧", "menta", 220, tipo="recuperadas", valor=5, componente=L),
    _i("log-recuperadas-25", "Taller de reparación", "Veinticinco errores de lógica corregidos.", "🛠️", "menta", 221, tipo="recuperadas", valor=25, componente=L),
    _i("log-tecnicas-5", "Caja de herramientas", "Cinco técnicas dominadas: tres aciertos o más en cada una.", "🧰", "cian", 230, tipo="tecnicas", valor=5, minimo=3),
    _i("log-tecnicas-15", "Manos expertas", "Quince técnicas dominadas.", "🪛", "cian", 231, tipo="tecnicas", valor=15, minimo=3),
    _i("dominio-deductivo", "Detective", "Dominio de 80 en deducción.", "🕵️", "violeta", 240, tipo="dominio", categoria="deductivo", valor=80),
    _i("dominio-proporcional", "Justa medida", "Dominio de 80 en proporciones y conteo.", "📊", "amarillo", 241, tipo="dominio", categoria="proporcional", valor=80),
    _i("dominio-abstracto", "Descifradora", "Dominio de 80 en patrones.", "🔐", "rosa", 242, tipo="dominio", categoria="abstracto", valor=80),
    _i("dominio-geometrico", "Ojo de arquitecta", "Dominio de 80 en geometría.", "📐", "menta", 243, tipo="dominio", categoria="geometrico", valor=80),
    _i("log-sim-inicial", "Primer simulacro lógico", "Terminaste un simulacro inicial de lógica.", "🧮", "violeta", 250, tipo="simulacro", nivel="inicial", valor=0, componente=L),
    _i("log-sim-avanzado-70", "Lógica al 70", "70 % o más en un simulacro avanzado de lógica.", "🎛️", "violeta", 251, tipo="simulacro", nivel="avanzado", valor=70, componente=L),
    _i("log-sim-experto-80", "Contrarreloj", "80 % o más en un simulacro experto de lógica.", "⏳", "violeta", 252, tipo="simulacro", nivel="experto", valor=80, componente=L),
]

NOVEDAD = {
    "version": "logica-1",
    "titulo": "Llegó Lógica",
    "cuerpo": "El examen tiene dos mitades y ahora la app también: Lectura y Lógica, cada una con sus retos, su ecualizador y sus simulacros. Tu XP, tu racha y tu rango son los mismos para las dos.\n\nEn Lógica, cada respuesta trae la solución paso a paso y te dice qué tipo de error cometiste. Lo que falles queda en tu cuaderno de errores, y en la caja de herramientas está la ficha de cada técnica. Ten papel y lápiz a la mano.",
}
