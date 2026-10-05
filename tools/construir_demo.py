"""Construye demo.html: la app completa en un solo archivo, en modo demo.
Sirve para probarla con doble clic, sin servidor y sin Supabase.
Incluye todos los paquetes de content/: los de lectura (paquete-*.json) y
los de lógica (logica-base.json y logica-0*.json).
Ejecutar desde la carpeta raíz:  python3 tools/construir_demo.py
"""
import glob, json, os, re

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
leer = lambda p: open(p, encoding="utf-8").read()
cargar = lambda p: json.load(open(p, encoding="utf-8"))

html = leer("index.html")
# El orden importa: primero lectura, luego la base de lógica y después sus preguntas.
archivos = sorted(glob.glob("content/paquete-*.json"))
if os.path.exists("content/logica-base.json"):
    archivos.append("content/logica-base.json")
archivos += sorted(f for f in glob.glob("content/logica-*.json") if not f.endswith("logica-base.json"))
paquetes = []
for f in archivos:
    p = cargar(f)
    p.pop("novedad", None)  # en el demo no se muestran las novedades de cada carga
    paquetes.append(p)
datos = {"base": cargar("content/base.json"), "paquetes": paquetes}

# Primero se retiran las etiquetas que no aplican al demo; después se incrusta el ícono.
html = re.sub(r'\s*<link rel="(manifest|apple-touch-icon)"[^>]*>', "", html)

css = "\n".join(leer(f) for f in ["css/tema.css", "css/app.css"])
html = re.sub(r'\s*<link rel="stylesheet" href="css/[^"]+">', "", html)
html = html.replace("</head>", f"<style>\n{css}\n</style>\n</head>")

scripts = ["js/config.js", "js/nucleo.js", "js/api-demo.js", "js/vistas-estudiante.js", "js/vistas-logica.js", "js/vistas-tutor.js", "js/app.js"]
js = "window.LE_DATOS_DEMO = " + json.dumps(datos, ensure_ascii=False) + ";\n"
js += "\n".join(leer(f) for f in scripts)
js = js.replace('SUPABASE_URL: "', 'SUPABASE_URL_IGNORADA: "')  # el demo nunca usa Supabase
js = js.replace("</script", "<\\/script")
html = re.sub(r'\s*<script src="js/[^"]+"></script>', "", html)
html = html.replace("</body>", "<script>\n" + js + "\n</script>\n</body>")

icono = leer("icono.svg").replace('"', "'").replace("\n", "")
html = html.replace('href="icono.svg"', f'href="data:image/svg+xml,{icono.replace("#", "%23")}"')
html = html.replace("<title>Entrelíneas · Examen UdeA</title>", "<title>Entrelíneas · Demo</title>")

open("demo.html", "w", encoding="utf-8").write(html)
print("demo.html", round(len(html) / 1024), "KB ·", ", ".join(os.path.basename(f) for f in archivos))
