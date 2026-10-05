"""Lógica · figuras en SVG.

Convenciones: trazo con currentColor (la app pinta las figuras sobre papel claro),
relleno de las regiones sombreadas con SOMBRA y textos de 13 px. Solo se usan
etiquetas y atributos que la app deja pasar (ver LE.figura en js/nucleo.js).
"""
import math

SOMBRA = "#C9BDF2"
PAPEL = "#FBF8FF"

def svg(w, h, *partes):
    return f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}">' + "".join(partes) + "</svg>"

def linea(x1, y1, x2, y2, punteada=False, ancho=2):
    d = ' stroke-dasharray="5 4"' if punteada else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="currentColor" stroke-width="{ancho}" stroke-linecap="round"{d}/>'

def rect(x, y, w, h, relleno="none", ancho=2):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{relleno}" stroke="currentColor" stroke-width="{ancho}"/>'

def poli(puntos, relleno="none", ancho=2):
    pts = " ".join(f"{x},{y}" for x, y in puntos)
    return f'<polygon points="{pts}" fill="{relleno}" stroke="currentColor" stroke-width="{ancho}" stroke-linejoin="round"/>'

def circ(cx, cy, r, relleno="none", ancho=2):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{relleno}" stroke="currentColor" stroke-width="{ancho}"/>'

def punto(cx, cy, r=4):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="currentColor"/>'

def texto(x, y, s, tam=13, ancla="middle", negrita=False):
    b = ' font-weight="700"' if negrita else ""
    return f'<text x="{x}" y="{y}" font-size="{tam}" text-anchor="{ancla}" fill="currentColor"{b}>{s}</text>'

def camino(d, relleno="none", ancho=2):
    return f'<path d="{d}" fill="{relleno}" stroke="currentColor" stroke-width="{ancho}" stroke-linejoin="round"/>'


# ---------- Situación: arreglo de cubos visto desde arriba ----------
def plano_cubos():
    filas = [[2, 1, 0], [3, 2, 1], [1, 1, 0]]
    c, x0, y0 = 46, 46, 30
    p = [texto(x0 + c * 1.5, 20, "Atrás", 12)]
    for i, fila in enumerate(filas):
        for j, n in enumerate(fila):
            p.append(rect(x0 + j * c, y0 + i * c, c, c, SOMBRA if n else "none"))
            p.append(texto(x0 + j * c + c / 2, y0 + i * c + c / 2 + 6, str(n), 17, negrita=True))
    p.append(texto(x0 + c * 1.5, y0 + 3 * c + 20, "Frente", 12))
    p.append(texto(x0 - 8, y0 + c * 1.5 + 4, "Izq.", 12, "end"))
    p.append(texto(x0 + 3 * c + 8, y0 + c * 1.5 + 4, "Der.", 12, "start"))
    return svg(230, 200, *p)


# ---------- Situación: diagrama de barras ----------
def barras_libros():
    datos = [2, 5, 8, 6, 3, 1]
    x0, y0, u, b = 52, 150, 15, 30   # origen, píxeles por estudiante, ancho de barra
    p = []
    for k in range(0, 9):
        y = y0 - k * u
        p.append(f'<line x1="{x0}" y1="{y}" x2="{x0 + 6 * (b + 6) + 6}" y2="{y}" stroke="currentColor" stroke-width="1" opacity="0.18"/>')
        p.append(texto(x0 - 8, y + 4, str(k), 11, "end"))
    for i, n in enumerate(datos):
        x = x0 + 8 + i * (b + 6)
        p.append(rect(x, y0 - n * u, b, n * u, SOMBRA))
        p.append(texto(x + b / 2, y0 + 16, str(i), 12))
    p.append(linea(x0, y0, x0 + 6 * (b + 6) + 10, y0))
    p.append(linea(x0, y0, x0, y0 - 8 * u - 8))
    p.append(texto(x0 + 3 * (b + 6) + 6, y0 + 34, "Libros leídos en el semestre", 12))
    p.append(f'<text x="14" y="{y0 - 4 * u}" font-size="12" text-anchor="middle" fill="currentColor" transform="rotate(-90 14 {y0 - 4 * u})">Estudiantes</text>')
    return svg(290, 192, *p)


# ---------- Secuencias de figuras ----------
def palillos_triangulos():
    L, h, y = 34, 29, 62
    p = []
    # El primer triángulo pone 3 palillos; cada uno de los siguientes agrega 2.
    xs = [14, 84, 172]
    for i, x in enumerate(xs):
        n = i + 1
        for k in range(n):
            xa = x + k * L / 2
            if k % 2 == 0:
                if k == 0:
                    p.append(linea(xa, y, xa + L / 2, y - h))
                p += [linea(xa, y, xa + L, y), linea(xa + L, y, xa + L / 2, y - h)]
            else:
                p += [linea(xa, y - h, xa + L, y - h), linea(xa + L, y - h, xa + L / 2, y)]
        p.append(texto(x + (n + 1) * L / 4, y + 22, f"Figura {n}", 12))
    return svg(270, 96, *p)

def puntos_triangulares():
    p, d = [], 16
    xs = [26, 86, 158, 244]
    for i, x in enumerate(xs):
        n = i + 1
        for f in range(n):            # fila f tiene f+1 puntos
            for k in range(f + 1):
                p.append(punto(x + (k - f / 2) * d, 66 - (n - 1 - f) * d * 0.87, 4))
        p.append(texto(x, 90, f"Figura {n}", 12))
    return svg(290, 98, *p)

def baldosas():
    c, x0, y0, n = 30, 20, 12, 4
    p = []
    for i in range(n):
        for j in range(n):
            borde = i in (0, n - 1) or j in (0, n - 1)
            p.append(rect(x0 + j * c, y0 + i * c, c, c, "#7F6BC4" if borde else PAPEL))
    p.append(texto(x0 + n * c / 2, y0 + n * c + 20, "Piso de 4 × 4", 12))
    return svg(160, 158, *p)

def cuerdas():
    cx, cy, r, n = 80, 76, 56, 5
    pts = [(round(cx + r * math.sin(2 * math.pi * k / n), 1), round(cy - r * math.cos(2 * math.pi * k / n), 1)) for k in range(n)]
    p = [circ(cx, cy, r, ancho=1)]
    for a in range(n):
        for b in range(a + 1, n):
            p.append(linea(*pts[a], *pts[b], ancho=1.5))
    p += [punto(x, y, 4.5) for x, y in pts]
    p.append(texto(cx, 152, "5 puntos: 10 segmentos", 12))
    return svg(160, 160, *p)


# ---------- Áreas ----------
def tapete():
    p = [rect(48, 16, 180, 120), rect(108, 46, 60, 60, SOMBRA),
         texto(138, 154, "6 m"), texto(40, 80, "4 m", ancla="end"), texto(138, 81, "2 m", 12)]
    return svg(244, 162, *p)

def circulo_inscrito():
    p = [rect(30, 14, 130, 130, SOMBRA), circ(95, 79, 65, PAPEL), texto(95, 162, "10 cm")]
    return svg(190, 170, *p)

def triangulo_en_rectangulo():
    p = [rect(52, 14, 176, 110, SOMBRA), poli([(52, 124), (228, 124), (172, 14)], PAPEL),
         texto(140, 142, "8 cm"), texto(44, 73, "5 cm", ancla="end")]
    return svg(244, 150, *p)

def corona():
    cx, cy, R, r = 92, 88, 72, 24
    cuarto = f"M {cx + r},{cy} L {cx + R},{cy} A {R} {R} 0 0 0 {cx},{cy - R} L {cx},{cy - r} A {r} {r} 0 0 1 {cx + r},{cy} Z"
    p = [circ(cx, cy, R), camino(cuarto, "#E0524F"), circ(cx, cy, r, PAPEL),
         linea(cx, cy, cx - R, cy, punteada=True, ancho=1.5), texto(cx - 46, cy - 6, "6 cm", 12),
         linea(cx, cy, cx, cy + r, punteada=True, ancho=1.5), texto(cx + 6, cy + 42, "2 cm", 12, "start")]
    return svg(184, 176, *p)


# ---------- Perímetros ----------
def tres_cuadrados():
    p = [rect(20 + k * 46, 16, 46, 46) for k in range(3)]
    p += [texto(43, 80, "4 cm"), texto(89, 80, "4 cm"), texto(135, 80, "4 cm"), texto(170, 43, "4 cm", ancla="start")]
    return svg(214, 90, *p)

def figura_ele():
    e = 18
    x0, y0 = 52, 30
    pts = [(x0, y0), (x0 + 6 * e, y0), (x0 + 6 * e, y0 + 2 * e), (x0 + 10 * e, y0 + 2 * e), (x0 + 10 * e, y0 + 6 * e), (x0, y0 + 6 * e)]
    p = [poli(pts, SOMBRA),
         linea(x0 + 6 * e, y0, x0 + 10 * e, y0, punteada=True, ancho=1.5), linea(x0 + 10 * e, y0, x0 + 10 * e, y0 + 2 * e, punteada=True, ancho=1.5),
         texto(x0 + 5 * e, y0 + 6 * e + 18, "10 cm"), texto(x0 - 8, y0 + 3 * e + 4, "6 cm", ancla="end"),
         texto(x0 + 8 * e, y0 - 8, "4 cm"), texto(x0 + 10 * e + 8, y0 + e + 4, "2 cm", ancla="start")]
    return svg(284, 162, *p)

def pista():
    e, x0, y0 = 16, 50, 26
    r = 2 * e
    d = f"M {x0},{y0} L {x0 + 10 * e},{y0} A {r} {r} 0 0 1 {x0 + 10 * e},{y0 + 4 * e} L {x0},{y0 + 4 * e} A {r} {r} 0 0 1 {x0},{y0} Z"
    p = [camino(d, SOMBRA),
         linea(x0, y0, x0, y0 + 4 * e, punteada=True, ancho=1.5), linea(x0 + 10 * e, y0, x0 + 10 * e, y0 + 4 * e, punteada=True, ancho=1.5),
         texto(x0 + 5 * e, y0 - 8, "10 m"), texto(x0 + 8, y0 + 2 * e + 4, "4 m", ancla="start")]
    return svg(260, 112, *p)


# ---------- Triángulos ----------
def escalera():
    p = [linea(40, 12, 40, 150, ancho=3), linea(20, 150, 170, 150, ancho=3), linea(40, 30, 130, 150),
         camino("M 40,138 L 52,138 L 52,150", ancho=1.5),
         texto(100, 84, "5 m", ancla="start"), texto(85, 168, "3 m"), texto(30, 94, "?", 16, "end", True)]
    return svg(190, 176, *p)

def triangulo_segmento():
    e = 20
    C, B, A = (36, 150), (36 + 8 * e, 150), (36, 150 - 6 * e)
    pie = (36 + 2 * e, 150)
    alto = (36 + 2 * e, 150 - 4.5 * e)
    # cotas: la de 2 cm va pegada a la base; la de 8 cm abarca toda la base, más abajo
    cota = lambda x1, x2, y: linea(x1, y, x2, y, ancho=1) + linea(x1, y - 4, x1, y + 4, ancho=1) + linea(x2, y - 4, x2, y + 4, ancho=1)
    p = [poli([C, B, A]), camino(f"M {C[0]},{C[1] - 12} L {C[0] + 12},{C[1] - 12} L {C[0] + 12},{C[1]}", ancho=1.5),
         linea(*pie, *alto, ancho=3),
         cota(C[0], pie[0], 162), texto(C[0] + e, 176, "2 cm", 12),
         cota(C[0], B[0], 188), texto(C[0] + 4 * e, 204, "8 cm"),
         texto(C[0] - 8, 150 - 3 * e + 4, "6 cm", ancla="end"),
         texto(pie[0] + 8, 150 - 2 * e, "?", 16, "start", True)]
    return svg(220, 212, *p)
