"""Construye demo.html: la app completa en un solo archivo, en modo demo.
Sirve para probarla con doble clic, sin servidor y sin Supabase.
Ejecutar desde la carpeta raíz:  python3 tools/construir_demo.py
"""
import json, os, re

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
leer = lambda p: open(p, encoding="utf-8").read()

html = leer("index.html")
datos = {"base": json.load(open("content/base.json")), "paquetes": [json.load(open("content/paquete-001.json"))]}

css = "\n".join(leer(f) for f in ["css/tema.css", "css/app.css"])
html = re.sub(r'\s*<link rel="stylesheet" href="css/[^"]+">', "", html)
html = html.replace("</head>", f"<style>\n{css}\n</style>\n</head>")

scripts = ["js/config.js", "js/nucleo.js", "js/api-demo.js", "js/vistas-estudiante.js", "js/vistas-tutor.js", "js/app.js"]
js = "window.LE_DATOS_DEMO = " + json.dumps(datos, ensure_ascii=False) + ";\n"
js += "\n".join(leer(f) for f in scripts)
js = js.replace('SUPABASE_URL: "', 'SUPABASE_URL_IGNORADA: "')  # el demo nunca usa Supabase
js = js.replace("</script", "<\\/script")
html = re.sub(r'\s*<script src="js/[^"]+"></script>', "", html)
html = html.replace("</body>", f"<script>\n{js}\n</script>\n</body>")

icono = leer("icono.svg").replace('"', "'").replace("\n", "")
html = html.replace('href="icono.svg"', f'href="data:image/svg+xml,{icono.replace("#", "%23")}"')
html = re.sub(r'\s*<link rel="(manifest|apple-touch-icon)"[^>]*>', "", html)
html = html.replace("<title>Entrelíneas · Lectura UdeA</title>", "<title>Entrelíneas · Demo</title>")

open("demo.html", "w", encoding="utf-8").write(html)
print("demo.html", round(len(html) / 1024), "KB")
