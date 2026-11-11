/* =====================================================================
   ENTRELÍNEAS · VISTAS DEL TUTOR
   ===================================================================== */
(function (LE) {
  const { esc, $, $$ } = LE;
  const A = LE.acciones;
  const nombreCorto = (n) => esc(String(n || "").split(" ")[0]);

  // =================================================================
  //  PANEL: alertas + estudiantes
  // =================================================================
  LE.ruta("/tutor", async () => {
    LE.cargando("Revisando cómo van tus estudiantes…");
    try { await LE.api.generarAlertas(); } catch (e) { console.warn(e); }
    const [ests, alertas] = await Promise.all([LE.api.panel(), LE.api.alertas()]);
    LE.estado.alertas = alertas;

    LE.montar(`
      <div class="pila" style="--pila:1.5rem">
        <div class="pila" style="--pila:.3rem">
          <h1>Tutoría</h1>
          <p class="sub">${ests.length === 1 ? "Una estudiante" : ests.length + " estudiantes"} · ${alertas.length ? `${alertas.length} ${alertas.length === 1 ? "situación necesita" : "situaciones necesitan"} tu atención` : "nada urgente por ahora"}</p>
        </div>

        ${alertas.length ? `<section class="pila" style="--pila:.8rem">
          <div class="titulo-seccion"><h2>Necesitan tu atención</h2><span class="sub pequeno">Mensaje sugerido: edítalo antes de enviar</span></div>
          ${alertas.map(tarjetaAlerta).join("")}
        </section>` : ""}

        <section class="pila" style="--pila:.8rem">
          <div class="titulo-seccion"><h2>Estudiantes</h2><span class="sub pequeno">Últimos 7 días · <a href="#/tutor/personas">Agregar personas</a></span></div>
          ${ests.length ? `<div class="estudiantes">${ests.map((e) => `
            <a class="est" href="#/tutor/estudiante/${e.id}">
              <span class="av" aria-hidden="true">${esc(e.avatar)}</span>
              <span>
                <b>${esc(e.nombre)}</b> <span class="tenue pequeno">@${esc(e.usuario || "")}${e.meta_programa ? " · " + esc(e.meta_programa) : ""}${e.debe_cambiar_clave ? " · aún no entra por primera vez" : ""}</span>
                <span class="datos">
                  <span>🔥 <b>${e.racha}</b> días</span>
                  <span>⏱️ <b>${LE.minutos(e.minutos_7d)}</b></span>
                  <span><b>${e.respuestas_7d}</b> respuestas${LE.logicaActiva() ? ` (${e.logica_7d ?? 0} de lógica)` : ""}</span>
                  <span><b>${e.precision_7d ?? "—"}${e.precision_7d != null ? "%" : ""}</b> aciertos</span>
                  <span>Última vez: <b>${esc(LE.hace(e.ultima_actividad))}</b></span>
                </span>
              </span>
              <span>${e.alertas ? `<span class="nuevo">${e.alertas}</span>` : ""} <span aria-hidden="true">›</span></span>
            </a>`).join("")}</div>`
          : `<div class="panel vacio"><p>Todavía no hay estudiantes.</p><a class="btn" href="#/tutor/personas">Agregar personas</a></div>`}
        </section>
      </div>`);
  }, { tutor: true });

  function tarjetaAlerta(a) {
    const d = a.detalle || {};
    const esCaida = a.tipo === "caida";
    const titulo = esCaida
      ? `Bajó en ${esc(LE.cat(d.categoria).nombre)}: de ${d.antes}% a ${d.ahora}% de aciertos esta semana`
      : `${d.dias} días sin practicar`;
    const n = esCaida ? 10 : 5;
    return `<article class="alerta ${esCaida ? "caida" : ""}" data-alerta="${a.id}">
      <div class="fila entre"><b>${esc(a.perfiles?.avatar || "")} ${esc(a.perfiles?.nombre || "")}</b><span class="tenue pequeno">${esc(LE.hace(a.creado))}</span></div>
      <p>${titulo}</p>
      <label class="campo"><span class="sub pequeno">Mensaje para ${nombreCorto(a.perfiles?.nombre)}</span><textarea data-campo="cuerpo">${esc(a.sugerencia || "")}</textarea></label>
      <div class="fila entre">
        <span class="sub pequeno">Incluye una misión de <b>${n}</b> preguntas${esCaida ? ` de ${esc(LE.cat(d.categoria).nombre.toLowerCase())}` : ""}.</span>
        <span class="fila">
          <button class="btn sec chico" data-accion="descartarAlerta" data-id="${a.id}">Descartar</button>
          <button class="btn chico" data-accion="enviarAlerta" data-id="${a.id}" data-est="${a.estudiante_id}" data-n="${n}" data-cat="${esCaida ? d.categoria : ""}">Enviar misión</button>
        </span>
      </div>
    </article>`;
  }

  A.enviarAlerta = async (b) => {
    const card = b.closest("[data-alerta]");
    const cuerpo = card.querySelector('[data-campo="cuerpo"]').value.trim();
    const cat = b.dataset.cat || null, n = +b.dataset.n;
    b.disabled = true;
    try {
      await LE.api.enviarMensaje({
        estudiante_id: b.dataset.est, tipo: "mision",
        titulo: cat ? (LE.compDe(cat) === "logica" ? `Misión de lógica: ${LE.cat(cat).nombre.toLowerCase()}` : `Misión: nivel ${LE.cat(cat).nombre.toLowerCase()}`) : "Misión: volver al ritmo",
        cuerpo, mision: { n, categoria: cat, componente: cat ? LE.compDe(cat) : "lectura" }
      });
      await LE.api.cerrarAlerta(b.dataset.id, "atendida");
      card.remove();
      LE.aviso("Misión enviada");
    } catch (e) { LE.error(e); b.disabled = false; }
  };
  A.descartarAlerta = async (b) => {
    try { await LE.api.cerrarAlerta(b.dataset.id, "descartada"); b.closest("[data-alerta]").remove(); }
    catch (e) { LE.error(e); }
  };

  // =================================================================
  //  DETALLE DE UNA ESTUDIANTE
  // =================================================================
  LE.ruta("/tutor/estudiante/:id", async ({ id }) => {
    LE.cargando();
    const conLogica = LE.logicaActiva();
    const [r, msgs, falladas, cua] = await Promise.all([LE.api.resumen(id), LE.api.mensajes(id), LE.api.preguntasFalladas(id), conLogica ? LE.api.cuaderno("logica", id).catch(() => null) : null]);
    LE.estado.vistaEst = { id, r, falladas };
    const p = r.perfil, t = r.totales;
    const precision = t.respuestas ? Math.round((100 * t.aciertos) / t.respuestas) : 0;
    const min7 = r.dias.slice(-7).reduce((a, d) => a + d.minutos, 0);
    const diasActivos7 = r.dias.slice(-7).filter((d) => d.respuestas > 0).length;
    const pc = r.por_componente || {};
    const tablaSims = (comp) => {
      const sims = (r.simulacros || []).filter((x) => (x.componente || "lectura") === comp);
      const niveles = LE.cfgDe("simulacros", comp) || {};
      const cats = LE.COMP[comp].cats;
      if (!sims.length) return comp === "lectura" || !conLogica ? `<p class="sub">Aún no ha hecho simulacros${conLogica ? " de lectura" : ""}.</p>` : `<p class="sub">Aún no ha hecho simulacros de lógica.</p>`;
      return `<div class="scroll-x"><table class="tabla">
            <thead><tr><th>Fecha</th><th>Nivel</th><th class="num">Puntaje</th>${cats.map((c) => `<th class="num">${esc(LE.cat(c).nombre)}</th>`).join("")}<th></th></tr></thead>
            <tbody>${sims.map((x) => `<tr><td>${LE.fecha(x.fecha)}</td><td>${esc(niveles[x.nivel]?.nombre || x.nivel)}</td><td class="num"><b>${x.puntaje}%</b></td>${cats.map((c) => { const k = x.por_categoria?.[c]; return `<td class="num">${k ? k.correctas + "/" + k.total : "—"}</td>`; }).join("")}<td><a href="#/diagnostico/${x.id}">Ver</a></td></tr>`).join("")}</tbody>
          </table></div>`;
    };

    LE.montar(`
      <div class="pila" style="--pila:1.5rem">
        <a href="#/tutor" class="pequeno">‹ Todas las estudiantes</a>
        <section class="panel saludo">
          <div class="fila">
            <div class="avatar-grande" aria-hidden="true">${esc(p.avatar)}</div>
            <div class="pila" style="--pila:.2rem">
              <h1>${esc(p.nombre)}</h1>
              <p class="sub">${esc(LE.rango(p.xp).actual.nombre)} · ${Number(p.xp).toLocaleString("es-CO")} XP${p.meta_programa ? " · aspira a " + esc(p.meta_programa) : ""} · última actividad ${esc(LE.hace(r.ultima_actividad))}</p>
            </div>
          </div>
        </section>

        <div class="stats">
          <div class="stat"><b>${r.racha}</b><span>días de racha (mejor: ${r.mejor_racha})</span></div>
          <div class="stat"><b>${diasActivos7}/7</b><span>días con práctica esta semana</span></div>
          <div class="stat"><b>${LE.minutos(r.minutos_hoy)}</b><span>hoy</span></div>
          <div class="stat"><b>${LE.minutos(min7)}</b><span>últimos 7 días</span></div>
          <div class="stat"><b>${LE.minutos(r.minutos_total)}</b><span>en total</span></div>
          <div class="stat"><b>${t.respuestas}</b><span>preguntas · ${precision}% aciertos${conLogica ? ` · ${pc.logica?.respuestas || 0} de lógica` : ""}</span></div>
          <div class="stat"><b>${t.segundos_promedio ?? "—"}${t.segundos_promedio != null ? " s" : ""}</b><span>por pregunta</span></div>
          <div class="stat"><b>${r.retos}</b><span>retos y misiones</span></div>
        </div>

        ${conLogica ? `
        <section class="panel">
          <div class="titulo-seccion"><h2>Uso diario</h2><span class="sub pequeno">Últimas 4 semanas, los dos componentes</span></div>
          ${LE.calor(r.dias)}
          <p class="tenue pequeno" style="margin-top:.8rem">Pasa el cursor por un día para ver minutos y respuestas.</p>
        </section>
        <div class="rejilla dos">
          <section class="panel">
            <div class="titulo-seccion"><h2>Dominio · Lectura</h2><span class="sub pequeno">${pc.lectura?.respuestas || 0} respuestas</span></div>
            ${LE.ecualizador(r.dominio)}
          </section>
          <section class="panel">
            <div class="titulo-seccion"><h2>Dominio · Lógica</h2><span class="sub pequeno">${pc.logica?.respuestas || 0} respuestas</span></div>
            ${LE.ecualizador(r.dominio_logica, { cats: LE.CATS_LOGICA })}
          </section>
        </div>` : `
        <div class="rejilla dos">
          <section class="panel">
            <div class="titulo-seccion"><h2>Dominio actual</h2><span class="sub pequeno">Últimas 30 por nivel</span></div>
            ${LE.ecualizador(r.dominio)}
          </section>
          <section class="panel">
            <div class="titulo-seccion"><h2>Uso diario</h2><span class="sub pequeno">Últimas 4 semanas</span></div>
            ${LE.calor(r.dias)}
            <p class="tenue pequeno" style="margin-top:.8rem">Pasa el cursor por un día para ver minutos y respuestas.</p>
          </section>
        </div>`}

        ${conLogica && cua ? panelErrores(cua, p) : ""}

        ${tablaTendencia(r.tendencia, "lectura", conLogica)}
        ${conLogica ? tablaTendencia(r.tendencia, "logica", true) : ""}

        <section class="panel">
          <div class="titulo-seccion"><h2>Simulacros${conLogica ? " de lectura" : ""}</h2></div>
          ${tablaSims("lectura")}
        </section>
        ${conLogica ? `<section class="panel">
          <div class="titulo-seccion"><h2>Simulacros de lógica</h2></div>
          ${tablaSims("logica")}
        </section>` : ""}

        <div class="rejilla dos">
          <section class="panel">
            <div class="titulo-seccion"><h2>Escribirle</h2></div>
            ${compositor(p)}
          </section>
          <section class="panel">
            <div class="titulo-seccion"><h2>Mensajes enviados</h2><span class="sub pequeno">${msgs.length}</span></div>
            <div class="pila" style="--pila:.6rem;max-height:28rem;overflow:auto">
              ${msgs.length ? msgs.map((m) => `
                <article class="mensaje ${m.tipo}">
                  <div class="fila entre"><span class="de">${m.tipo === "mision" ? "Misión" : m.tipo === "comentario" ? "Comentario" : "Mensaje"} · ${esc(LE.hace(m.creado))}</span>
                  <span class="pequeno ${m.completado ? "hecho" : "tenue"}">${m.tipo === "mision" ? (m.completado ? "✓ cumplida" : "pendiente") : m.leido ? "leído" : "sin leer"}</span></div>
                  <h3>${esc(m.titulo)}</h3>
                  ${m.cuerpo ? `<p>${esc(m.cuerpo)}</p>` : ""}
                  <button class="enlace pequeno" style="margin-top:.4rem" data-accion="borrarMensaje" data-id="${m.id}">Borrar</button>
                </article>`).join("") : `<p class="sub">Todavía no le has escrito.</p>`}
            </div>
          </section>
        </div>

        <section class="pila" style="--pila:.8rem">
          <div class="titulo-seccion"><h2>Preguntas que más falla</h2><span class="sub pequeno">Coméntale una: le llega con la pregunta citada</span></div>
          ${falladas.length ? falladas.map((f, k) => (k === 6 ? `<details class="pila" style="--pila:.8rem"><summary class="enlace" style="list-style:none">Ver ${falladas.length - 6} más</summary>` : "") + `
            <article class="fallada cr-${f.categoria}">
              <div class="fila entre"><span class="fila">${conLogica ? `<span class="tenue pequeno">${LE.COMP[f.componente || "lectura"].icono} ${LE.COMP[f.componente || "lectura"].nombre}</span>` : ""}<span class="etq">${esc(LE.cat(f.categoria).nombre)}</span><span class="tenue pequeno">${esc(f.tema && LE.tecnica(f.tema) ? LE.tecnica(f.tema).nombre : f.texto)}</span></span><span class="pequeno"><b>${f.fallos}</b> de ${f.intentos} intentos mal</span></div>
              ${f.componente === "logica" ? `<div class="enunciado md" style="font-size:1rem">${LE.md(f.enunciado)}</div>` : `<b>${esc(f.enunciado)}</b>`}
              ${f.error?.tipo ? `<p class="pequeno sub"><span class="etq-error">${esc(LE.tipoError(f.error.tipo).nombre)}</span> ${esc(f.error.nota || "")}</p>` : ""}
              <div class="ops">${f.opciones.map((o, j) => `<span class="${j === f.correcta ? "ok" : j === f.ultima_opcion ? "ult" : ""}">${LE.LETRAS[j]}. ${esc(o)}${j === f.correcta ? " ✓" : j === f.ultima_opcion ? " ← su última respuesta" : ""}</span>`).join("")}</div>
              <details><summary class="pequeno sub" style="cursor:pointer">Explicación del banco</summary><p class="sub pequeno" style="margin-top:.4rem">${esc(f.explicacion)}</p></details>
              <div><button class="btn sec chico" data-accion="comentar" data-k="${k}">Comentarle esta pregunta</button></div>
            </article>`).join("") + (falladas.length > 6 ? "</details>" : "") : `<p class="sub">Sin errores registrados todavía.</p>`}
        </section>
      </div>`);
    activarCompositor();
  }, { tutor: true });

  // Lógica: cómo se equivoca y qué técnicas le cuestan (lo mismo que ella ve en su cuaderno).
  function panelErrores(cua, p) {
    const top = Object.entries(cua.perfil || {}).sort((a, b) => b[1] - a[1])[0];
    const flojas = (cua.temas || []).filter((t) => t.intentos >= 2 && t.aciertos < t.intentos && LE.tecnica(t.tema)).map((t) => ({ ...t, pct: Math.round((100 * t.aciertos) / t.intentos) }))
      .sort((a, b) => a.pct - b.pct || b.intentos - a.intentos).slice(0, 6);
    const dominadas = (cua.temas || []).filter((t) => LE.estadoTecnica(t) === "dominada").length;
    return `<div class="rejilla dos">
      <section class="panel pila" style="--pila:.8rem">
        <div class="titulo-seccion" style="margin-bottom:0"><h2>Lógica: cómo se equivoca</h2><span class="sub pequeno">Últimos fallos, por tipo de error</span></div>
        ${top ? `${LE.perfilErrores(cua.perfil)}
          <p class="sub pequeno">Lo que más se repite es <b style="color:var(--texto)">${esc(LE.tipoError(top[0]).nombre.toLowerCase())}</b>. ${esc(LE.tipoError(top[0]).consejo)}</p>` : `<p class="sub">Todavía no hay errores de lógica con diagnóstico.</p>`}
        <p class="tenue pequeno">${(cua.pendientes || []).length} preguntas pendientes en su cuaderno de errores · ${cua.recuperadas} corregidas.</p>
      </section>
      <section class="panel pila" style="--pila:.6rem">
        <div class="titulo-seccion" style="margin-bottom:0"><h2>Lógica: técnicas que más le cuestan</h2><span class="sub pequeno">${dominadas} de ${(LE.estado.tecnicas || []).length} dominadas</span></div>
        ${flojas.length ? flojas.map((t) => `<div class="repaso-fila">
          <span><b>${esc(LE.tecnica(t.tema).nombre)}</b><span class="tenue pequeno"> · ${t.aciertos} de ${t.intentos} (${t.pct}%)</span></span>
          <button class="btn suave chico" data-accion="verTecnica" data-cod="${esc(t.tema)}">Ver ficha</button>
        </div>`).join("") : `<p class="sub">Todavía no hay técnicas con fallos repetidos.</p>`}
      </section>
    </div>`;
  }

  function tablaTendencia(tend = [], comp = "lectura", rotular = false) {
    const cats = LE.COMP[comp].cats;
    tend = (tend || []).filter((t) => cats.includes(t.categoria));
    if (!tend?.length) return "";
    const semanas = [...new Set(tend.map((t) => t.semana))].sort();
    const celda = (sem, c) => {
      const x = tend.find((t) => t.semana === sem && t.categoria === c);
      return x ? `<td class="num"><span class="celda-mapa cr-${c}" style="--p:${Math.round(x.precision * 0.7)}" title="${x.n} respuestas">${x.precision}%</span></td>` : `<td class="num tenue">—</td>`;
    };
    return `<section class="panel">
      <div class="titulo-seccion"><h2>Evolución semanal${rotular ? " · " + LE.COMP[comp].nombre : ""}</h2><span class="sub pequeno">% de aciertos por semana y nivel</span></div>
      <div class="scroll-x"><table class="tabla">
        <thead><tr><th>Semana del</th>${cats.map((c) => `<th class="num">${esc(LE.cat(c).nombre)}</th>`).join("")}</tr></thead>
        <tbody>${semanas.map((s) => `<tr><td>${LE.fecha(s + "T12:00")}</td>${cats.map((c) => celda(s, c)).join("")}</tr>`).join("")}</tbody>
      </table></div>
    </section>`;
  }

  function compositor(p) {
    return `<form class="pila" style="--pila:.8rem" id="f-msg" data-est="${p.id}">
      <div class="segmentos" role="group" aria-label="Tipo">
        <button type="button" aria-pressed="true" data-tipo="mensaje">Mensaje</button>
        <button type="button" aria-pressed="false" data-tipo="mision">Misión</button>
      </div>
      <label class="campo">Título<input name="titulo" required maxlength="80" placeholder="Ej.: ¡Qué buena semana!"></label>
      <label class="campo">Mensaje<textarea name="cuerpo" maxlength="1200" placeholder="Escríbele a ${nombreCorto(p.nombre)}…"></textarea></label>
      <div class="dos-campos" data-solo-mision hidden>
        <label class="campo">Preguntas<select name="n"><option>5</option><option selected>10</option><option>15</option></select></label>
        <label class="campo">${LE.logicaActiva() ? "Componente y nivel" : "Nivel"}<select name="cat">${LE.logicaActiva()
          ? ["lectura", "logica"].map((k) => `<optgroup label="${LE.COMP[k].nombre}"><option value="${k}|">${LE.COMP[k].nombre}: mezcla de todos</option>${LE.COMP[k].cats.map((c) => `<option value="${k}|${c}">${esc(LE.cat(c).nombre)}</option>`).join("")}</optgroup>`).join("")
          : `<option value="lectura|">Mezcla de todos</option>${LE.CATS.map((c) => `<option value="lectura|${c}">${esc(LE.cat(c).nombre)}</option>`).join("")}`}</select></label>
      </div>
      <div class="acciones"><button class="btn">Enviar</button></div>
    </form>`;
  }

  function activarCompositor() {
    const f = $("#f-msg");
    if (!f) return;
    let tipo = "mensaje";
    f.querySelector(".segmentos").addEventListener("click", (e) => {
      const b = e.target.closest("[data-tipo]"); if (!b) return;
      tipo = b.dataset.tipo;
      $$("[data-tipo]", f).forEach((x) => x.setAttribute("aria-pressed", x === b));
      f.querySelector("[data-solo-mision]").hidden = tipo !== "mision";
      f.titulo.placeholder = tipo === "mision" ? "Ej.: Misión: conectores" : "Ej.: ¡Qué buena semana!";
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = f.querySelector("button:not([type])");
      btn.disabled = true;
      try {
        await LE.api.enviarMensaje({
          estudiante_id: f.dataset.est, tipo, titulo: f.titulo.value.trim(), cuerpo: f.cuerpo.value.trim(),
          mision: tipo === "mision" ? { n: +f.n.value, categoria: f.cat.value.split("|")[1] || null, componente: f.cat.value.split("|")[0] || "lectura" } : null
        });
        LE.aviso(tipo === "mision" ? "Misión enviada" : "Mensaje enviado");
        LE.navegar();
      } catch (err) { LE.error(err); btn.disabled = false; }
    });
  }

  A.comentar = async (b) => {
    const { id, falladas } = LE.estado.vistaEst;
    const f = falladas[+b.dataset.k];
    let texto = "";
    const v = await LE.dialogo(`
      <form class="pila" method="dialog">
        <h2>Comentario sobre una pregunta</h2>
        <p class="sub">«${esc(LE.plano(f.enunciado, 260))}»</p>
        <p class="pequeno">Respuesta correcta: <b style="color:var(--menta)">${LE.LETRAS[f.correcta]}. ${esc(f.opciones[f.correcta])}</b></p>
        <label class="campo">Tu comentario<textarea name="c" required placeholder="Explícale con tus palabras por qué, o dale una pista para la próxima."></textarea></label>
        <div class="acciones"><button class="btn sec" type="button" data-valor="">Cancelar</button><button class="btn" value="enviar">Enviar</button></div>
      </form>`, { alAbrir: (d) => d.querySelector("form").addEventListener("submit", (e) => { texto = e.target.c.value.trim(); }) });
    if (v !== "enviar" || !texto) return;
    try {
      await LE.api.enviarMensaje({ estudiante_id: id, tipo: "comentario", titulo: "Sobre una pregunta que se te complicó", cuerpo: texto, pregunta_id: f.id, mision: { cita: LE.plano(f.enunciado, 260), correcta: `${LE.LETRAS[f.correcta]}. ${f.opciones[f.correcta]}` } });
      LE.aviso("Comentario enviado");
      LE.navegar();
    } catch (e) { LE.error(e); }
  };

  A.borrarMensaje = async (b) => {
    if (!(await LE.confirmar("¿Borrar este mensaje?", "Desaparece también de la bandeja de la estudiante.", "Borrar"))) return;
    try { await LE.api.borrarMensaje(b.dataset.id); b.closest(".mensaje").remove(); } catch (e) { LE.error(e); }
  };

  // =================================================================
  //  CONTENIDO Y ACTUALIZACIONES
  // =================================================================
  LE.ruta("/tutor/contenido", async () => {
    LE.cargando();
    const c = await LE.api.resumenContenido();
    const m = c.matriz || {};
    const total = (cat) => [1, 2, 3].reduce((a, d) => a + (m[cat]?.[d] || 0), 0);
    const matrizDe = (comp) => {
      const dist = LE.cfgDe("distribucion", comp) || {};
      return `<div class="scroll-x"><table class="tabla">
              <thead><tr><th>Nivel</th><th class="num">Fácil</th><th class="num">Media</th><th class="num">Difícil</th><th class="num">Total</th><th class="num">Meta</th></tr></thead>
              <tbody>${LE.COMP[comp].cats.map((cat) => `<tr><td><span class="etq cr-${cat}">${esc(LE.cat(cat).nombre)}</span></td>${[1, 2, 3].map((d) => `<td class="num">${m[cat]?.[d] || 0}</td>`).join("")}<td class="num"><b>${total(cat)}</b></td><td class="num tenue">${Math.round((dist[cat] || 0) * 100)}%</td></tr>`).join("")}</tbody>
            </table></div>`;
    };
    const nLog = c.preguntas_logica || 0;
    const temas = c.temas || {};
    const sinPreguntas = (LE.estado.tecnicas || []).filter((t) => !temas[t.codigo]);
    LE.montar(`
      <div class="pila" style="--pila:1.5rem">
        <div class="pila" style="--pila:.3rem">
          <h1>Contenido</h1>
          <p class="sub">Lectura: ${c.textos} lecturas y ${c.preguntas} preguntas activas.${nLog || LE.logicaActiva() ? ` Lógica: ${nLog} preguntas, ${c.situaciones || 0} situaciones y ${c.tecnicas || 0} fichas de técnica.` : ""}</p>
        </div>

        <section class="panel pila destacado" style="--pila:.8rem">
          <h2>Ver y probar el contenido</h2>
          <p class="sub">Revisa cualquier lectura o problema tal como lo ve la estudiante y respóndelo para ver la clave, la explicación y lo que dice cada opción. O usa la app completa como estudiante, con tu cuenta: retos, simulacros, pistas, cuaderno de errores e insignias.</p>
          <div class="fila"><a class="btn" href="#/tutor/contenido/banco">Explorar el banco</a><a class="btn sec" href="#/practicar">Practicar como estudiante</a></div>
        </section>

        <div class="rejilla dos">
          <section class="panel">
            <div class="titulo-seccion"><h2>Banco de lectura</h2><span class="sub pequeno">Por nivel y dificultad</span></div>
            ${matrizDe("lectura")}
            <p class="tenue pequeno" style="margin-top:.8rem">La columna «Meta» es el peso de cada nivel en los retos. Un banco sano tiene al menos 3 veces las preguntas del simulacro más largo (150).</p>
          </section>
          <section class="panel">
            <div class="titulo-seccion"><h2>Banco de lógica</h2><span class="sub pequeno">Por nivel y dificultad</span></div>
            ${nLog ? `${matrizDe("logica")}
              <p class="tenue pequeno" style="margin-top:.8rem">En lógica la meta vale para retos y simulacros. Para que un simulacro de 40 no repita casi todo, conviene pasar de 120 preguntas.${sinPreguntas.length ? ` Técnicas sin preguntas: ${sinPreguntas.map((t) => esc(t.nombre)).join(", ")}.` : ""}</p>`
              : `<p class="sub">${LE.logicaActiva() ? "Lógica está activada pero todavía no hay preguntas: carga <b>logica-001</b> y <b>logica-002</b>." : "Lógica no está activada. Carga primero <b>logica-base</b> (niveles, técnicas e insignias) y después los paquetes de preguntas <b>logica-001</b> y <b>logica-002</b>."}</p>`}
          </section>
        </div>

        <section class="panel">
          <div class="titulo-seccion"><h2>Paquetes cargados</h2></div>
          <table class="tabla"><tbody>${(c.paquetes || []).map((p) => `<tr><td>${esc(p.paquete)}</td><td class="num">${p.preguntas} preguntas</td></tr>`).join("") || `<tr><td class="tenue">Ninguno</td></tr>`}</tbody></table>
        </section>

        <section class="panel pila" style="--pila:.9rem">
          <h2>Cargar un paquete</h2>
          <p class="sub">Un paquete es un archivo .json que puede traer lecturas con preguntas, problemas de lógica, fichas de técnica, insignias nuevas, ajustes de la gamificación y una novedad que la estudiante verá al entrar. Si una lectura, pregunta o ficha ya existe (mismo código), se actualiza; no se duplica.</p>
          <div class="fila">
            <label class="btn sec" style="cursor:pointer">Elegir archivo .json<input type="file" accept=".json,application/json" id="archivo-paquete" hidden></label>
            <a class="enlace" href="content/plantilla-paquete.json" download>Plantilla de lectura</a>
            <a class="enlace" href="content/plantilla-logica.json" download>Plantilla de lógica</a>
          </div>
          <label class="campo">O pega aquí el contenido del paquete<textarea id="texto-paquete" style="min-height:8rem;font-family:ui-monospace,monospace;font-size:.85rem" placeholder='{"paquete": "paquete-002", "textos": [ ... ]}'></textarea></label>
          <div id="revision-paquete"></div>
          <div class="acciones"><button class="btn" data-accion="revisarPaquete">Revisar paquete</button></div>
        </section>

        <section class="panel pila" style="--pila:.6rem">
          <h2>Cómo llegan las actualizaciones</h2>
          <p class="sub"><b style="color:var(--texto)">Preguntas, lecturas, problemas de lógica y fichas de técnica:</b> con un paquete, desde aquí. La estudiante los ve en su siguiente reto.</p>
          <p class="sub"><b style="color:var(--texto)">Insignias, rangos, XP, tiempos y niveles del simulacro:</b> también con un paquete (campos <code>insignias</code> y <code>config</code>). No hay que tocar código.</p>
          <p class="sub"><b style="color:var(--texto)">Diseño y funciones nuevas:</b> se reemplazan los archivos en GitHub y se sube el número de versión. La app le muestra a la estudiante un aviso para actualizar.</p>
        </section>
      </div>`);
    $("#archivo-paquete").addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      $("#texto-paquete").value = await f.text();
      A.revisarPaquete();
    });
  }, { tutor: true });

  // =================================================================
  //  EXPLORAR EL BANCO: cada lectura y pregunta como la ve la estudiante,
  //  con la clave a la vista después de responder. No guarda nada.
  // =================================================================
  LE.ruta("/tutor/contenido/banco", async () => {
    LE.cargando("Trayendo el banco de preguntas…");
    LE.estado.banco = await LE.api.banco();
    LE.estado.filtroBanco ||= { comp: "lectura", cat: "", dif: "", paquete: "", q: "", inactivas: false };
    pintarBanco();
  }, { tutor: true });

  function pintarBanco() {
    const { textos, preguntas } = LE.estado.banco;
    const f = LE.estado.filtroBanco;
    const comp = f.comp === "logica" && !preguntas.some((p) => p.componente === "logica") ? "lectura" : f.comp;
    const paquetes = [...new Set(preguntas.filter((p) => p.componente === comp).map((p) => p.paquete))].filter(Boolean).sort();
    const q = f.q.trim().toLowerCase();
    const porTexto = Object.fromEntries(textos.map((t) => [t.id, t]));
    const lista = preguntas.filter((p) => p.componente === comp && (f.inactivas || p.activo) && (!f.cat || p.categoria === f.cat)
      && (!f.dif || p.dificultad === +f.dif) && (!f.paquete || p.paquete === f.paquete)
      && (!q || [p.codigo, p.enunciado, porTexto[p.texto_id]?.titulo, LE.tecnica(p.tema)?.nombre].some((x) => String(x || "").toLowerCase().includes(q))));
    // Bloques: una lectura o situación con sus preguntas; los problemas sueltos, por técnica.
    const bloques = [];
    const idx = {};
    for (const p of lista) {
      const llave = p.texto_id || "tema:" + (p.tema || "otros");
      if (!idx[llave]) {
        const t = p.texto_id ? porTexto[p.texto_id] : null;
        idx[llave] = { llave, t, titulo: t ? t.titulo : "Problemas sueltos · " + (LE.tecnica(p.tema)?.nombre || "sin técnica"), tipo: t ? LE.TIPOS[t.tipologia] || "Lectura" : "Técnica", codigo: t?.codigo || "", paquete: t?.paquete || p.paquete, preguntas: [] };
        bloques.push(idx[llave]);
      }
      idx[llave].preguntas.push(p);
    }
    LE.estado.bloquesBanco = idx;
    const cats = LE.COMP[comp].cats;
    LE.montar(`
      <div class="pila" style="--pila:1.25rem">
        <a href="#/tutor/contenido" class="pequeno">‹ Contenido</a>
        <div class="fila entre">
          <div class="pila" style="--pila:.3rem">
            <h1>Explorar el banco</h1>
            <p class="sub">Así ve cada pregunta la estudiante. Responde para ver la clave y la explicación. Aquí no se guarda nada.</p>
          </div>
          <a class="btn sec chico" href="#/practicar">Practicar como estudiante</a>
        </div>
        <section class="panel filtros" id="filtros-banco">
          ${LE.logicaActiva() || preguntas.some((p) => p.componente === "logica") ? `<div class="segmentos" role="group" aria-label="Componente">
            ${["lectura", "logica"].map((k) => `<button type="button" data-comp="${k}" aria-pressed="${k === comp}">${LE.COMP[k].icono} ${LE.COMP[k].nombre}</button>`).join("")}
          </div>` : ""}
          <div class="filtros-campos">
            <label class="campo">Nivel<select name="cat"><option value="">Todos</option>${cats.map((c) => `<option value="${c}" ${f.cat === c ? "selected" : ""}>${esc(LE.cat(c).nombre)}</option>`).join("")}</select></label>
            <label class="campo">Dificultad<select name="dif"><option value="">Todas</option>${[1, 2, 3].map((d) => `<option value="${d}" ${+f.dif === d ? "selected" : ""}>${["", "Fácil", "Media", "Difícil"][d]}</option>`).join("")}</select></label>
            <label class="campo">Paquete<select name="paquete"><option value="">Todos</option>${paquetes.map((x) => `<option ${f.paquete === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
            <label class="campo">Buscar<input name="q" value="${esc(f.q)}" placeholder="Código, palabra del enunciado o título"></label>
          </div>
          <label class="check"><input type="checkbox" name="inactivas" ${f.inactivas ? "checked" : ""}> Incluir las desactivadas</label>
        </section>
        <p class="sub pequeno">${bloques.length} ${comp === "logica" ? "bloques" : bloques.length === 1 ? "lectura" : "lecturas"} · ${lista.length} ${lista.length === 1 ? "pregunta" : "preguntas"}</p>
        <div class="banco">${bloques.map((b) => `
          <details class="bloque-banco" data-bloque="${esc(b.llave)}">
            <summary>
              <span class="etq cr-${b.t ? (comp === "logica" ? "cian" : "rosa") : "violeta"}">${esc(b.tipo)}</span>
              <b>${esc(b.titulo)}</b>
              <span class="tenue pequeno">${[b.codigo, b.paquete, b.preguntas.length + (b.preguntas.length === 1 ? " pregunta" : " preguntas")].filter(Boolean).map(esc).join(" · ")}</span>
            </summary>
            <div class="cuerpo"></div>
          </details>`).join("") || `<div class="panel vacio"><p>Ninguna pregunta cumple esos filtros.</p></div>`}</div>
      </div>`);
    const caja = $("#filtros-banco");
    caja.addEventListener("click", (e) => { const b = e.target.closest("[data-comp]"); if (!b) return; Object.assign(f, { comp: b.dataset.comp, cat: "", paquete: "" }); pintarBanco(); });
    caja.addEventListener("change", (e) => { const x = e.target; if (!x.name) return; f[x.name] = x.type === "checkbox" ? x.checked : x.value; if (x.name !== "q") pintarBanco(); });
    let espera = null;
    caja.querySelector("[name=q]").addEventListener("input", (e) => { clearTimeout(espera); espera = setTimeout(() => { f.q = e.target.value; pintarBanco(); const i = $("#filtros-banco [name=q]"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 350); });
    // El contenido de cada bloque se pinta al abrirlo.
    $$(".bloque-banco").forEach((d) => d.addEventListener("toggle", () => {
      const cuerpo = d.querySelector(".cuerpo");
      if (!d.open || cuerpo.dataset.listo) return;
      const b = LE.estado.bloquesBanco[d.dataset.bloque];
      cuerpo.innerHTML = `${b.t ? `<div class="lectura-banco">${LE.lecturaHTML(b.t, false)}</div>` : ""}${b.preguntas.map((p) => preguntaBanco(p)).join("")}`;
      cuerpo.dataset.listo = "1";
    }));
  }

  const buscarPregunta = (id) => LE.estado.banco.preguntas.find((p) => p.id === id);

  function preguntaBanco(p, respuesta = null, pista = false) {
    const logica = p.componente === "logica";
    const r = respuesta;
    return `<section class="pregunta probar cr-${p.categoria}" data-q="${p.id}">
      <div class="meta"><span class="etq">${esc(LE.cat(p.categoria).nombre)}</span><span class="dif" title="Dificultad ${p.dificultad} de 3">${"●".repeat(p.dificultad)}${"○".repeat(3 - p.dificultad)}</span>
        <span class="tenue">${esc(p.codigo)}${p.tema && LE.tecnica(p.tema) ? " · " + esc(LE.tecnica(p.tema).nombre) : ""}</span>${p.activo ? "" : `<span class="estado apagado">Desactivada</span>`}</div>
      ${logica ? `<div class="enunciado md">${LE.md(p.enunciado)}</div>${LE.figura(p.figura)}` : `<p class="enunciado">${esc(p.enunciado)}</p>`}
      <div class="opciones">${p.opciones.map((o, k) => {
        const cls = r == null ? "" : k === p.correcta ? "bien" : k === r ? "malo" : "";
        return `<button class="opcion ${cls}" data-accion="probarOpcion" data-q="${p.id}" data-k="${k}" ${r != null ? "disabled" : ""}><span class="letra">${LE.LETRAS[k]}</span><span>${esc(o)}</span></button>`;
      }).join("")}</div>
      ${r == null
        ? (p.pista ? (pista ? `<div class="pista-caja" role="note"><b>Pista</b><p>${esc(p.pista)}</p></div>` : `<div><button class="btn suave chico" data-accion="probarPista" data-q="${p.id}">Ver la pista</button></div>`) : "")
        : `<div class="retro ${r === p.correcta ? "bien" : "malo"}" role="status">
            <strong>${r === p.correcta ? "Correcto" : "La respuesta era la " + LE.LETRAS[p.correcta]}</strong>
            ${logica ? `${r === p.correcta ? "" : LE.diagnosticoError((p.errores || [])[r])}${LE.pasosHTML(p.pasos, { abierto: r !== p.correcta })}${p.explicacion ? `<p class="idea">${esc(p.explicacion)}</p>` : ""}${LE.enlaceTecnica(p.tema)}` : `<p>${esc(p.explicacion)}</p>`}
            ${logica && Array.isArray(p.errores) && p.errores.some(Boolean) ? `<details class="solucion"><summary>Qué error lleva a cada opción incorrecta</summary><ul class="errores-opciones">${p.errores.map((e, k) => e ? `<li><b>${LE.LETRAS[k]}.</b> ${esc(LE.tipoError(e.tipo).nombre)}${e.nota ? ": " + esc(e.nota) : ""}</li>` : "").join("")}</ul></details>` : ""}
          </div>
          <div><button class="btn suave chico" data-accion="probarOtraVez" data-q="${p.id}">Responder otra vez</button></div>`}
    </section>`;
  }
  const repintarPregunta = (id, r = null, pista = false) => {
    const el = $(`.pregunta.probar[data-q="${id}"]`);
    if (el) el.outerHTML = preguntaBanco(buscarPregunta(id), r, pista);
  };
  A.probarOpcion = (b) => repintarPregunta(b.dataset.q, +b.dataset.k);
  A.probarPista = (b) => repintarPregunta(b.dataset.q, null, true);
  A.probarOtraVez = (b) => repintarPregunta(b.dataset.q);

  LE.validarPaquete = (p) => {
    const err = [];
    if (!p || typeof p !== "object" || Array.isArray(p)) return ["El archivo no es un objeto JSON."];
    if (!p.paquete) err.push("Falta el nombre del paquete (campo «paquete»).");
    const codigos = new Set();
    const tecnicasConocidas = new Set([...(LE.estado.tecnicas || []).map((t) => t.codigo), ...(p.tecnicas || []).map((t) => t.codigo)]);
    const tiposError = LE.TIPOS_ERROR();
    // Revisa una pregunta. «esperado» es el componente que debe tener según dónde está.
    const revisar = (q, d2, esperado) => {
      if (!q.codigo) err.push(`${d2}: falta «codigo».`);
      else if (codigos.has(q.codigo)) err.push(`${d2}: el código ${q.codigo} está repetido.`);
      codigos.add(q.codigo);
      if (!LE.CATS_TODAS.includes(q.categoria)) err.push(`${d2}: «categoria» debe ser literal, inferencial, critico o cohesion (lectura), o deductivo, proporcional, abstracto o geometrico (lógica).`);
      else if (LE.compDe(q.categoria) !== esperado) err.push(`${d2}: la categoría «${q.categoria}» es de ${LE.COMP[LE.compDe(q.categoria)].nombre.toLowerCase()} y está en un lugar de ${LE.COMP[esperado].nombre.toLowerCase()}. Los dos componentes no se mezclan.`);
      if (!Array.isArray(q.opciones) || q.opciones.length !== 4) err.push(`${d2}: necesita exactamente 4 opciones.`);
      if (!(Number.isInteger(q.correcta) && q.correcta >= 0 && q.correcta <= 3)) err.push(`${d2}: «correcta» debe ser 0, 1, 2 o 3 (A, B, C o D).`);
      if (q.dificultad != null && ![1, 2, 3].includes(q.dificultad)) err.push(`${d2}: «dificultad» debe ser 1, 2 o 3.`);
      if (!q.enunciado) err.push(`${d2}: falta «enunciado».`);
      if (q.pasos != null && (!Array.isArray(q.pasos) || q.pasos.some((x) => typeof x !== "string"))) err.push(`${d2}: «pasos» debe ser una lista de textos.`);
      if (q.errores != null) {
        if (!Array.isArray(q.errores) || q.errores.length !== 4) err.push(`${d2}: «errores» debe tener 4 posiciones, una por opción (null en la correcta).`);
        else q.errores.forEach((e, k) => {
          if (k === q.correcta && e) err.push(`${d2}: «errores» trae diagnóstico en la opción correcta.`);
          if (e && !tiposError.includes(e.tipo)) err.push(`${d2}: tipo de error «${e.tipo}» no reconocido (${tiposError.join(", ")}).`);
        });
      }
      if (q.figura != null && !/^\s*<svg[\s>]/i.test(q.figura)) err.push(`${d2}: «figura» debe ser un SVG.`);
      if (q.tema && LE.compDe(q.categoria) === "logica" && !tecnicasConocidas.has(q.tema)) err.push(`${d2}: la técnica «${q.tema}» no existe. Carga primero su ficha o inclúyela en «tecnicas».`);
    };
    (p.textos || []).forEach((t, i) => {
      const situacion = t.tipologia === "situacion";
      const donde = `${situacion ? "Situación" : "Lectura"} ${i + 1}${t.codigo ? " (" + t.codigo + ")" : ""}`;
      if (!t.codigo) err.push(`${donde}: falta «codigo».`);
      if (!t.titulo) err.push(`${donde}: falta «titulo».`);
      if (!t.contenido) err.push(`${donde}: falta «contenido».`);
      if (t.tipologia && !LE.TIPOS[t.tipologia]) err.push(`${donde}: tipología «${t.tipologia}» no reconocida.`);
      if (t.figura != null && !/^\s*<svg[\s>]/i.test(t.figura)) err.push(`${donde}: «figura» debe ser un SVG.`);
      (t.preguntas || []).forEach((q, j) => revisar(q, `${donde}, pregunta ${j + 1}`, situacion ? "logica" : "lectura"));
    });
    (p.preguntas || []).forEach((q, j) => revisar(q, `Problema suelto ${j + 1}${q.codigo ? " (" + q.codigo + ")" : ""}`, "logica"));
    (p.tecnicas || []).forEach((t, k) => {
      if (!t.codigo || !t.nombre) err.push(`Técnica ${k + 1}: necesita codigo y nombre.`);
      if (!LE.CATS_LOGICA.includes(t.categoria)) err.push(`Técnica ${k + 1}${t.codigo ? " (" + t.codigo + ")" : ""}: «categoria» debe ser deductivo, proporcional, abstracto o geometrico.`);
      if (t.pasos != null && !Array.isArray(t.pasos)) err.push(`Técnica ${k + 1}: «pasos» debe ser una lista.`);
    });
    (p.insignias || []).forEach((i, k) => { if (!i.codigo || !i.nombre || !i.regla?.tipo) err.push(`Insignia ${k + 1}: necesita codigo, nombre y regla.tipo.`); });
    return err;
  };

  A.revisarPaquete = () => {
    const caja = $("#revision-paquete");
    let p;
    try { p = JSON.parse($("#texto-paquete").value); }
    catch (e) { caja.innerHTML = `<p class="error">No es JSON válido: ${esc(e.message)}</p>`; return; }
    const err = LE.validarPaquete(p);
    if (err.length) { caja.innerHTML = `<div class="pila" style="--pila:.3rem"><p class="error">Hay que corregir ${err.length} ${err.length === 1 ? "cosa" : "cosas"}:</p>${err.slice(0, 12).map((e) => `<p class="sub pequeno">· ${esc(e)}</p>`).join("")}</div>`; return; }
    const todas = [...(p.textos || []).flatMap((t) => t.preguntas || []), ...(p.preguntas || [])];
    const nq = todas.length;
    const porCat = {};
    todas.forEach((q) => (porCat[q.categoria] = (porCat[q.categoria] || 0) + 1));
    const nLect = (p.textos || []).filter((t) => t.tipologia !== "situacion").length, nSit = (p.textos || []).length - nLect;
    LE.estado.paqueteListo = p;
    caja.innerHTML = `<div class="mensaje" style="--c:var(--menta)">
      <h3>«${esc(p.paquete)}» está listo</h3>
      <p>${[nLect ? `${nLect} lecturas` : "", nSit ? `${nSit} situaciones de lógica` : "", `${nq} preguntas${nq ? " (" + Object.entries(porCat).map(([c, n]) => `${n} ${LE.cat(c).nombre.toLowerCase()}`).join(", ") + ")" : ""}`, p.tecnicas?.length ? `${p.tecnicas.length} fichas de técnica` : "", p.insignias?.length ? `${p.insignias.length} insignias` : "", p.config ? `ajustes: ${Object.keys(p.config).join(", ")}` : "", p.novedad ? "con novedad para la estudiante" : ""].filter(Boolean).join(" · ")}</p>
      <button class="btn chico" style="margin-top:.8rem" data-accion="importarPaquete">Cargar paquete</button>
    </div>`;
  };

  A.importarPaquete = async (b) => {
    b.disabled = true;
    try {
      const r = await LE.api.importarPaquete(LE.estado.paqueteListo);
      await LE.recargarConfig();
      LE.aviso(`Cargado: ${r.textos} lecturas o situaciones, ${r.preguntas} preguntas${r.tecnicas ? ", " + r.tecnicas + " técnicas" : ""}${r.insignias ? ", " + r.insignias + " insignias" : ""}.`);
      LE.estado.paqueteListo = null;
      LE.navegar();
    } catch (e) { LE.error(e); b.disabled = false; }
  };
})(window.LE);
