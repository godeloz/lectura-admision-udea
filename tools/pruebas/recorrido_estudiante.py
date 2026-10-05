"""Recorrido de la estudiante sobre demo.html, en tamaño de celular: una Canción de lectura,
un Solo de lógica, reto por técnica, repaso de errores, simulacro de lógica con recarga a
mitad de camino, diagnóstico, perfil y mensajes. Comprueba que los componentes no se mezclan.

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
        b = await p.chromium.launch()
        errs=[]
        # ===== celular =====
        ctx = await b.new_context(viewport={"width":390,"height":844}, device_scale_factor=2)
        pg = await ctx.new_page()
        pg.on("console", lambda m: errs.append(m.text) if m.type=="error" and "ERR_TUNNEL" not in m.text else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERROR "+str(e)))
        await entrar(pg,"sofia"); await pg.wait_for_selector(".tracklist")
        await pg.screenshot(path=SH+"m01-lectura.png")
        # --- Lectura sigue funcionando: una Canción ---
        await pg.click('.track[data-n="5"]'); await pg.wait_for_selector(".pregunta")
        comps=set()
        for i in range(5):
            await pg.wait_for_selector(".pregunta .opcion")
            comps.add(await pg.inner_text(".pregunta .etq"))
            await pg.click('.opcion[data-k="1"]'); await pg.click('[data-accion="confirmar"]'); await pg.wait_for_selector(".retro")
            assert not await pg.query_selector('[data-accion="pedirPista"]')
            await pg.click("#btn-sig")
        await pg.wait_for_selector(".marcador"); await premios(pg)
        print("Canción de lectura, niveles vistos:", comps)
        assert not (comps & {"Deducción","Proporciones","Patrones","Geometría"}), "se mezcló lógica en lectura"
        await pg.click('[data-accion="volverInicio"]'); await pg.wait_for_selector(".tracklist")
        assert (await pg.evaluate("location.hash"))=="#/inicio"
        # --- Lógica: reto de 10, nunca trae lectura ---
        await pg.click('.nav a[href="#/logica"]'); await pg.wait_for_selector(".comp-logica .tracklist")
        await pg.screenshot(path=SH+"m02-logica.png", full_page=True)
        await pg.click('.track[data-n="10"]'); await pg.wait_for_selector(".pregunta")
        comps=set(); sit=0
        for i in range(10):
            await pg.wait_for_selector(".pregunta .opcion")
            comps.add(await pg.inner_text(".pregunta .etq"))
            if await pg.query_selector(".lectura.situacion"):
                sit+=1
                if sit==1: await pg.screenshot(path=SH+"m03-situacion.png", full_page=True)
            if await pg.query_selector(".pregunta .figura") and not getattr(main,"f",0):
                main.f=1; await pg.screenshot(path=SH+"m04-figura.png", full_page=True)
            await pg.click(f'.opcion[data-k="{(i*3)%4}"]'); await pg.click('[data-accion="confirmar"]'); await pg.wait_for_selector(".retro")
            if i==1: await pg.screenshot(path=SH+"m05-retro.png", full_page=True)
            await pg.click("#btn-sig")
        await pg.wait_for_selector(".marcador"); await premios(pg)
        print("Solo de lógica, niveles vistos:", comps, "preguntas con situación:", sit)
        assert not (comps & {"Literal","Inferencial","Crítico","Cohesión"}), "se mezcló lectura en lógica"
        await pg.screenshot(path=SH+"m06-final.png", full_page=True)
        # practicar una técnica desde el final
        if await pg.query_selector('.repaso-fila [data-accion="reto"]'):
            await pg.click('.repaso-fila [data-accion="reto"]'); await pg.wait_for_selector(".pregunta .opcion")
            n = await pg.eval_on_selector_all(".progreso i","x=>x.length"); print("reto por técnica:", n, "preguntas")
            await pg.click('[data-accion="salirReto"]'); await pg.click('dialog [data-valor="si"]'); await pg.wait_for_selector(".comp-logica .tracklist")
        # reto de repaso de errores
        await pg.click('[data-tema="@errores"]'); await pg.wait_for_selector(".pregunta .opcion")
        n = await pg.eval_on_selector_all(".progreso i","x=>x.length"); print("repaso de errores:", n, "preguntas")
        await pg.click('.opcion[data-k="0"]'); await pg.click('[data-accion="confirmar"]'); await pg.wait_for_selector(".retro")
        await pg.click('[data-accion="salirReto"]'); await pg.click('dialog [data-valor="si"]'); await pg.wait_for_selector(".marcador"); await premios(pg)
        print("final repaso:", (await pg.inner_text(".marcador")).replace("\n"," | "))
        # --- Simulacro de lógica ---
        await pg.goto(APP+"#/simulacro"); await pg.wait_for_selector(".niveles")
        print("comp simulacro:", await pg.eval_on_selector('.segmentos [aria-pressed="true"]',"e=>e.textContent.trim()"), "| niveles:", await pg.eval_on_selector_all(".nivel","xs=>xs.map(x=>x.querySelector('h2').textContent+' '+x.querySelector('.grande').textContent)"))
        await pg.screenshot(path=SH+"m07-simulacros.png", full_page=True)
        await pg.click('[data-accion="simulacro"][data-nivel="inicial"]'); await pg.click('dialog [data-valor="si"]'); await pg.wait_for_selector("#reloj")
        total = await pg.eval_on_selector_all(".mapa button","x=>x.length"); print("simulacro inicial lógica:", total, "preguntas, reloj", await pg.inner_text("#reloj"))
        for i in range(total-4):
            await pg.click(f'.opcion[data-k="{(i*7+1)%4}"]')
            if i==2: await pg.click('[data-accion="simMarcar"]')
            await pg.click(f'.mapa button:nth-child({i+2})')
        await pg.screenshot(path=SH+"m08-sim.png", full_page=True)
        await pg.reload(); await pg.wait_for_selector(".niveles, #reloj, .tracklist")
        if not await pg.query_selector("#reloj"):
            await pg.goto(APP+"#/simulacro"); await pg.wait_for_selector(".niveles")
            await pg.click('[data-accion="simulacro"][data-nivel="inicial"]'); await pg.click('dialog [data-valor="si"]'); await pg.wait_for_selector("#reloj")
        print("tras recargar:", await pg.inner_text(".sesion-cab .sub"))
        await pg.click('[data-accion="entregar"]'); await pg.click('dialog [data-valor="si"]'); await pg.wait_for_selector(".marcador .pct"); await premios(pg)
        print("diagnóstico:", (await pg.inner_text(".marcador")).replace("\n"," | "))
        print("secciones:", await pg.eval_on_selector_all("h2","xs=>xs.map(x=>x.textContent)"))
        await pg.click(".revision details:nth-child(2) summary")
        await pg.screenshot(path=SH+"m09-diagnostico.png", full_page=True)
        await pg.click('[data-accion="volverDiag"]'); await pg.wait_for_selector(".niveles")
        print("historial lógica:", await pg.eval_on_selector_all(".tabla tbody tr","x=>x.length"))
        await pg.click('[data-accion="cambiarComp"][data-comp="lectura"]'); await pg.wait_for_selector('.segmentos [data-comp="lectura"][aria-pressed="true"]')
        print("historial lectura:", await pg.eval_on_selector_all(".tabla tbody tr","x=>x.length"), "| niveles:", await pg.eval_on_selector_all(".nivel .grande","xs=>xs.map(x=>x.textContent)"))
        await pg.goto(APP+"#/perfil"); await pg.wait_for_selector(".insignias"); await pg.screenshot(path=SH+"m10-perfil.png", full_page=True)
        print("insignias:", await pg.eval_on_selector_all(".titulo-seccion","xs=>xs.map(x=>x.textContent.trim().replace(/\\s+/g,' '))"))
        # misión de lectura pendiente sigue funcionando
        await pg.goto(APP+"#/mensajes"); await pg.wait_for_selector(".mensaje")
        print("misión:", await pg.inner_text('[data-accion="mision"]'))
        await ctx.close()
        print("ERRORES celular:", errs)
        await b.close()
asyncio.run(main())
print("Capturas en", SH)
