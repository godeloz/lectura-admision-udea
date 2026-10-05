"""Recorrido del tutor sobre demo.html: panel, detalle de la estudiante, misiones de lógica,
contenido y validador de paquetes (válidos y con errores). Después entra la estudiante,
ve las misiones y cumple una.

Antes: python3 tools/construir_demo.py. Necesita Playwright con Chromium.
"""
import asyncio, json, os, tempfile
from playwright.async_api import async_playwright
RAIZ=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..",".."))
APP="file://"+RAIZ+"/demo.html"
SH=tempfile.mkdtemp(prefix="entrelineas-capturas-")+"/"   # las capturas van a una carpeta temporal
async def premios(pg):
    await asyncio.sleep(.4)
    while await pg.query_selector("dialog .premio"):
        await pg.click("dialog [data-valor]"); await asyncio.sleep(.3)
async def entrar(pg, u):
    await pg.goto(APP); await pg.wait_for_selector("#f-ingreso")
    await pg.fill("[name=usuario]",u); await pg.fill("[name=clave]","demo"); await pg.click("#f-ingreso button")
    await pg.wait_for_selector(".nav")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs=[]
        ctx = await b.new_context(viewport={"width":390,"height":844})
        pg = await ctx.new_page()
        pg.on("console", lambda m: errs.append(m.text) if m.type=="error" and "ERR_TUNNEL" not in m.text else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERROR "+str(e)))
        await entrar(pg,"sofia"); await pg.wait_for_selector(".tracklist")
        r = await pg.eval_on_selector(".nav","e=>{const r=e.getBoundingClientRect();return [Math.round(r.top),Math.round(r.bottom),innerHeight, Math.round(r.width), document.documentElement.scrollWidth]}")
        print("nav celular top/bottom/alto/ancho/scrollWidth:", r)
        await pg.click('.nav a[href="#/logica"]'); await pg.wait_for_selector(".comp-logica .tracklist")
        await pg.screenshot(path=SH+"m11-nav.png")
        await pg.click('[href="#/salir"], [data-accion="salir"]') if await pg.query_selector('[data-accion="salir"]') else None
        # ===== tutor (escritorio, mismo almacenamiento) =====
        await pg.set_viewport_size({"width":1280,"height":900})
        await pg.goto(APP+"#/salir"); await pg.wait_for_selector("#f-ingreso")
        await pg.fill("[name=usuario]","tutor"); await pg.fill("[name=clave]","demo"); await pg.click("#f-ingreso button")
        await pg.wait_for_selector(".estudiantes"); await pg.screenshot(path=SH+"t01-panel.png", full_page=True)
        print("panel:", (await pg.inner_text(".est .datos")).replace("\n"," "))
        await pg.click(".est"); await pg.wait_for_selector("#f-msg")
        print("detalle h2:", await pg.eval_on_selector_all("h2","xs=>xs.map(x=>x.textContent)"))
        await pg.screenshot(path=SH+"t02-detalle.png", full_page=True)
        # misión de lógica (geometría)
        await pg.click('[data-tipo="mision"]')
        print("opciones nivel:", await pg.eval_on_selector_all('select[name=cat] option',"xs=>xs.map(x=>x.value)"))
        await pg.fill("[name=titulo]","Misión: geometría"); await pg.fill("[name=cuerpo]","Cinco de geometría."); await pg.select_option("select[name=n]","5"); await pg.select_option("select[name=cat]","logica|geometrico")
        await pg.click('#f-msg button:not([type])'); await asyncio.sleep(.8)
        await pg.click('[data-tipo="mision"]'); await pg.fill("[name=titulo]","Misión: lógica mezclada"); await pg.select_option("select[name=n]","5"); await pg.select_option("select[name=cat]","logica|")
        await pg.click('#f-msg button:not([type])'); await asyncio.sleep(.8)
        # contenido
        await pg.goto(APP+"#/tutor/contenido"); await pg.wait_for_selector("#texto-paquete"); await pg.screenshot(path=SH+"t03-contenido.png", full_page=True)
        print("contenido:", await pg.inner_text("main p.sub"))
        async def revisar(txt):
            await pg.fill("#texto-paquete", txt); await pg.click('[data-accion="revisarPaquete"]'); await asyncio.sleep(.2)
            return (await pg.inner_text("#revision-paquete")).replace("\n"," | ")[:600]
        for f in ("logica-base","logica-001","logica-002","plantilla-logica","plantilla-paquete","paquete-005"):
            print(f, "->", await revisar(open(f"{RAIZ}/content/{f}.json",encoding="utf-8").read()))
        malo = json.load(open(RAIZ+"/content/plantilla-logica.json",encoding="utf-8"))
        malo["preguntas"][0]["categoria"]="literal"; malo["preguntas"][0]["errores"][1]={"tipo":"raro","nota":"x"}; malo["textos"][0]["preguntas"][0]["tema"]="no-existe"; malo["tecnicas"][0]["categoria"]="critico"
        print("roto ->", await revisar(json.dumps(malo, ensure_ascii=False)))
        # cargar la plantilla de lógica de verdad
        await revisar(open(RAIZ+"/content/plantilla-logica.json",encoding="utf-8").read()); await pg.click('[data-accion="importarPaquete"]'); await asyncio.sleep(1)
        print("tras cargar plantilla:", await pg.inner_text("main p.sub"))
        # ===== estudiante: ve las dos misiones de lógica =====
        await pg.goto(APP+"#/salir"); await pg.wait_for_selector("#f-ingreso")
        await pg.fill("[name=usuario]","sofia"); await pg.fill("[name=clave]","demo"); await pg.click("#f-ingreso button"); await pg.wait_for_selector(".nav")
        await asyncio.sleep(.8)
        while await pg.query_selector("dialog"):
            print("novedad:", (await pg.inner_text("dialog h2"))); await pg.click("dialog [data-valor]"); await asyncio.sleep(.3)
        await pg.goto(APP+"#/mensajes"); await pg.wait_for_selector(".mensaje")
        print("misiones:", await pg.eval_on_selector_all('[data-accion="mision"]',"xs=>xs.map(x=>x.textContent+' ['+x.dataset.comp+'/'+x.dataset.cat+']')"))
        await pg.click('[data-accion="mision"][data-cat="geometrico"]'); await pg.wait_for_selector(".pregunta .opcion")
        cats=set()
        for i in range(5):
            await pg.wait_for_selector(".pregunta .opcion"); cats.add(await pg.inner_text(".pregunta .etq"))
            await pg.click('.opcion[data-k="2"]'); await pg.click('[data-accion="confirmar"]'); await pg.wait_for_selector(".retro"); await pg.click("#btn-sig")
        await pg.wait_for_selector(".marcador"); await premios(pg)
        print("misión geometría:", cats, "|", (await pg.inner_text(".marcador")).replace("\n"," | "))
        await pg.click('[data-accion="volverInicio"]'); await pg.wait_for_selector(".tracklist"); print("vuelve a:", await pg.evaluate("location.hash"))
        await pg.goto(APP+"#/mensajes"); await pg.wait_for_selector(".mensaje"); print("cumplidas:", await pg.eval_on_selector_all(".hecho","x=>x.length"))
        # tutor: detalle tras actividad, diagnóstico de un simulacro de lógica visto por el tutor
        print("ERRORES:", errs)
        await b.close()
asyncio.run(main())
print("Capturas en", SH)
