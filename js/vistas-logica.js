/* =====================================================================
   ENTRELÍNEAS · VISTAS DE LÓGICA
   El segundo componente del examen: Razonamiento Lógico. Los retos, el
   simulacro y el diagnóstico usan las pantallas comunes de
   vistas-estudiante.js. Aquí está lo que es solo de Lógica:
     · la portada (#/logica)
     · la caja de herramientas: una ficha por técnica (#/logica/tecnicas)
     · el cuaderno de errores (#/logica/errores)
   ===================================================================== */
(function (LE) {
  const { esc } = LE;
  const A = LE.acciones;

  const noActiva = () => LE.montar(`<div class="vacio"><h2>Lógica todavía no está activada</h2><p>Tu tutor debe cargar primero el paquete de Razonamiento Lógico.</p><button class="btn sec" data-accion="irInicio">Volver</button></div>`);
  const protegida = (fn) => async (params) => (LE.logicaActiva() ? fn(params) : noActiva());

  // Índice de avance por técnica a partir del cuaderno: {codigo: {intentos, aciertos}}
  const porTema = (cua) => Object.fromEntries((cua?.temas || []).map((t) => [t.tema, t]));
  const ETQ_ESTADO = { nueva: "Sin practicar", proceso: "En proceso", dominada: "Dominada" };

  // ---------- Portada ----------
  LE.ruta("/logica", protegida(() => LE.portada("logica")), { estudiante: true });

  // Panel de la portada: lo que la estudiante hace con sus errores.
  LE.panelAprender = (cua) => {
    const tecnicas = LE.estado.tecnicas || [];
    const avance = porTema(cua);
    const dominadas = tecnicas.filter((t) => LE.estadoTecnica(avance[t.codigo]) === "dominada").length;
    const pend = cua?.pendientes?.length || 0;
    const top = Object.entries(cua?.perfil || {}).sort((a, b) => b[1] - a[1])[0];
    const totalErr = Object.values(cua?.perfil || {}).reduce((a, b) => a + b, 0);
    if (!cua || !cua.respuestas_total) {
      return `<section class="panel pila" style="--pila:.8rem">
        <div class="titulo-seccion" style="margin-bottom:0"><h2>Cómo se aprende aquí</h2></div>
        <ul class="lista-simple">
          <li><b>Si te trabas, pide la pista.</b> Te da el primer movimiento, no la respuesta.</li>
          <li><b>Al responder ves la solución paso a paso</b> y, si fallaste, qué error fue: leer otra cosa, plantear mal, parar a mitad de camino, la cuenta.</li>
          <li><b>Cada pregunta enlaza a la ficha de su técnica</b>, con el procedimiento y la trampa típica.</li>
          <li><b>Lo que falles queda en tu cuaderno de errores</b> y vuelve en retos posteriores hasta que lo domines.</li>
        </ul>
        <div class="fila"><a class="btn sec chico" href="#/logica/tecnicas">Abrir la caja de herramientas</a></div>
      </section>`;
    }
    return `<section class="panel pila" style="--pila:.9rem">
      <div class="titulo-seccion" style="margin-bottom:0"><h2>Aprende de tus errores</h2><span class="sub pequeno">${cua.recuperadas} ${cua.recuperadas === 1 ? "error corregido" : "errores corregidos"}</span></div>
      ${top ? `<p class="sub">Tu error más frecuente: <b style="color:var(--texto)">${esc(LE.tipoError(top[0]).nombre)}</b> (${top[1]} de tus últimos ${totalErr} fallos). ${esc(LE.tipoError(top[0]).consejo)}</p>
        ${LE.perfilErrores(cua.perfil)}` : `<p class="sub">Todavía no hay errores registrados. Cuando falles una, aquí verás qué tipo de error fue.</p>`}
      <div class="stats dos">
        <a class="stat enlace-stat" href="#/logica/errores"><b>${pend}</b><span>${pend === 1 ? "pregunta pendiente" : "preguntas pendientes"} en tu cuaderno de errores ›</span></a>
        <a class="stat enlace-stat" href="#/logica/tecnicas"><b>${dominadas}<small>/${tecnicas.length}</small></b><span>técnicas dominadas en tu caja de herramientas ›</span></a>
      </div>
      ${pend ? `<div class="fila"><button class="btn sec chico" data-accion="reto" data-n="${Math.min(10, pend)}" data-tema="@errores" data-comp="logica">Repasar ${Math.min(10, pend)} de mis errores</button></div>` : ""}
    </section>`;
  };

  // ---------- Caja de herramientas ----------
  LE.ruta("/logica/tecnicas", protegida(async () => {
    LE.cargando();
    const cua = await LE.api.cuaderno("logica");
    const avance = porTema(cua);
    const tecnicas = LE.estado.tecnicas || [];
    const dominadas = tecnicas.filter((t) => LE.estadoTecnica(avance[t.codigo]) === "dominada").length;
    LE.montar(`
      <div class="pila comp-logica" style="--pila:1.5rem">
        <div class="pila" style="--pila:.4rem">
          <a href="#/logica" class="pequeno">‹ Lógica</a>
          <h1>Caja de herramientas</h1>
          <p class="sub" style="max-width:62ch">El examen no pide fórmulas de memoria: pide reconocer qué tipo de problema tienes delante y aplicar un procedimiento corto. Estas son las técnicas que más se repiten. Una técnica queda dominada con tres aciertos o más y al menos tres de cada cuatro respuestas bien.</p>
          <p class="sub"><b style="color:var(--texto)">${dominadas} de ${tecnicas.length}</b> dominadas.</p>
        </div>
        ${LE.CATS_LOGICA.map((c) => {
          const lista = tecnicas.filter((t) => t.categoria === c);
          if (!lista.length) return "";
          return `<section class="pila cr-${c}" style="--pila:.7rem">
            <div class="titulo-seccion" style="margin-bottom:0"><h2><span class="punto-cat"></span>${esc(LE.cat(c).nombre)}</h2><span class="sub pequeno">${esc(LE.cat(c).descripcion)}</span></div>
            <div class="tecnicas">${lista.map((t) => {
              const x = avance[t.codigo], est = LE.estadoTecnica(x);
              return `<a class="tecnica ${est}" href="#/logica/tecnica/${encodeURIComponent(t.codigo)}">
                <span class="tec-estado">${ETQ_ESTADO[est]}${x?.intentos ? ` · ${x.aciertos}/${x.intentos}` : ""}</span>
                <b>${esc(t.nombre)}</b>
                <span class="sub pequeno">${esc(t.cuando)}</span>
              </a>`;
            }).join("")}</div>
          </section>`;
        }).join("")}
      </div>`);
  }), { estudiante: true });

  LE.ruta("/logica/tecnica/:cod", protegida(async ({ cod }) => {
    const t = LE.tecnica(decodeURIComponent(cod));
    if (!t) return LE.ir("#/logica/tecnicas");
    LE.cargando();
    const cua = await LE.api.cuaderno("logica");
    const x = porTema(cua)[t.codigo], est = LE.estadoTecnica(x);
    const pendientes = (cua.pendientes || []).filter((p) => p.tema === t.codigo).length;
    LE.montar(`
      <div class="pila comp-logica" style="max-width:46rem;--pila:1.25rem">
        <a href="#/logica/tecnicas" class="pequeno">‹ Caja de herramientas</a>
        <div class="panel">${LE.fichaHTML(t)}</div>
        <section class="panel pila" style="--pila:.7rem">
          <div class="titulo-seccion" style="margin-bottom:0"><h2>Tu avance</h2><span class="tec-estado ${est}">${ETQ_ESTADO[est]}</span></div>
          <p class="sub">${x?.intentos ? `Has respondido <b style="color:var(--texto)">${x.intentos}</b> ${x.intentos === 1 ? "pregunta" : "preguntas"} de esta técnica y acertaste <b style="color:var(--texto)">${x.aciertos}</b>.` : "Todavía no has respondido preguntas de esta técnica."}${pendientes ? ` Tienes ${pendientes} en el cuaderno de errores.` : ""}</p>
          <div class="fila"><button class="btn" data-accion="reto" data-n="5" data-tema="${esc(t.codigo)}" data-comp="logica">Practicar esta técnica</button></div>
        </section>
      </div>`);
  }), { estudiante: true });

  // ---------- Cuaderno de errores ----------
  // Una pregunta pendiente, con todo lo necesario para entender el fallo.
  LE.pendienteHTML = (p) => `
    <details class="pendiente cr-${p.categoria}">
      <summary><span class="etq">${esc(LE.cat(p.categoria).nombre)}</span><span class="resumen-enunciado">${esc(LE.plano(p.enunciado, 150))}</span><span class="tenue pequeno">${esc(LE.hace(p.fecha))}</span></summary>
      <div class="cuerpo">
        ${p.texto ? LE.lecturaHTML(p.texto, false).replace('id="lectura"', "") : ""}
        <div class="enunciado md">${LE.md(p.enunciado)}</div>
        ${LE.figura(p.figura)}
        ${p.opciones.map((o, j) => `<div class="op ${j === p.correcta ? "ok" : ""} ${j === p.elegida ? "elegida" : ""}"><b>${LE.LETRAS[j]}.</b> ${esc(o)}${j === p.correcta ? " ✓" : j === p.elegida ? " (tu respuesta)" : ""}</div>`).join("")}
        ${p.elegida == null ? `<p class="tenue pequeno">La dejaste sin responder en un simulacro.</p>` : ""}
        ${LE.diagnosticoError(p.error)}
        ${LE.pasosHTML(p.pasos)}
        ${p.explicacion ? `<p class="sub idea">${esc(p.explicacion)}</p>` : ""}
        ${p.intentos > 1 ? `<p class="tenue pequeno">La has fallado ${p.fallos} de ${p.intentos} veces.</p>` : ""}
      </div>
    </details>`;

  LE.ruta("/logica/errores", protegida(async () => {
    LE.cargando();
    const cua = await LE.api.cuaderno("logica");
    const pend = cua.pendientes || [];
    const top = Object.entries(cua.perfil || {}).sort((a, b) => b[1] - a[1])[0];
    const grupos = {};
    pend.forEach((p) => (grupos[p.tema || "_"] ||= []).push(p));
    const orden = Object.entries(grupos).sort((a, b) => b[1].length - a[1].length);
    LE.montar(`
      <div class="pila comp-logica" style="--pila:1.5rem">
        <div class="pila" style="--pila:.4rem">
          <a href="#/logica" class="pequeno">‹ Lógica</a>
          <h1>Cuaderno de errores</h1>
          <p class="sub" style="max-width:62ch">Aquí están las preguntas de lógica cuya última respuesta fue incorrecta. Una pregunta sale del cuaderno cuando la respondes bien en un reto. Antes de reintentarla, lee qué pasó y rehaz la solución en papel sin mirar.</p>
        </div>
        <div class="rejilla dos">
          <section class="panel pila" style="--pila:.8rem">
            <div class="titulo-seccion" style="margin-bottom:0"><h2>Cómo te equivocas</h2><span class="sub pequeno">Tus últimos fallos, por tipo</span></div>
            ${top ? `${LE.perfilErrores(cua.perfil)}
              <p class="sub pequeno"><b style="color:var(--texto)">${esc(LE.tipoError(top[0]).nombre)}:</b> ${esc(LE.tipoError(top[0]).consejo)}</p>` : `<p class="sub">Todavía no hay errores con diagnóstico.</p>`}
          </section>
          <section class="panel pila" style="--pila:.8rem">
            <div class="titulo-seccion" style="margin-bottom:0"><h2>Tu balance</h2></div>
            <div class="stats dos">
              <div class="stat"><b>${pend.length}</b><span>pendientes</span></div>
              <div class="stat"><b style="color:var(--menta)">${cua.recuperadas}</b><span>corregidos: los fallaste y después los acertaste</span></div>
            </div>
            ${pend.length ? `<div class="fila"><button class="btn" data-accion="reto" data-n="${Math.min(10, pend.length)}" data-tema="@errores" data-comp="logica">Repasar ${Math.min(10, pend.length)} ahora</button></div>
              <p class="tenue pequeno">El repaso trae primero los errores más antiguos.</p>` : ""}
          </section>
        </div>
        ${pend.length ? orden.map(([cod, lista]) => {
          const t = LE.tecnica(cod);
          return `<section class="pila" style="--pila:.6rem">
            <div class="titulo-seccion" style="margin-bottom:0"><h2>${esc(t ? t.nombre : "Otras preguntas")}</h2>
              <span class="fila">${t ? `<button class="btn suave chico" data-accion="verTecnica" data-cod="${esc(cod)}">Ver ficha</button><button class="btn sec chico" data-accion="reto" data-n="5" data-tema="${esc(cod)}" data-comp="logica">Practicar</button>` : ""}</span></div>
            <div class="revision">${lista.map(LE.pendienteHTML).join("")}</div>
          </section>`;
        }).join("") : `<div class="panel vacio"><p>${cua.respuestas_total ? "No tienes errores pendientes. Buen trabajo." : "Cuando respondas preguntas de lógica, las que falles aparecerán aquí con su solución."}</p><a class="btn sec" href="#/logica">Ir a los retos de lógica</a></div>`}
      </div>`);
  }), { estudiante: true });
})(window.LE);
