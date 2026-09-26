/* =====================================================================
   ENTRELÍNEAS · VISTAS DE LA ESTUDIANTE
   ===================================================================== */
(function (LE) {
  const { esc, $, $$ } = LE;
  const A = LE.acciones;

  // =================================================================
  //  INICIO
  // =================================================================
  LE.ruta("/inicio", async () => {
    LE.cargando();
    const [r, msgs] = await Promise.all([LE.api.resumen(), LE.api.mensajes()]);
    LE.estado.perfil = r.perfil;
    LE.actualizarPunto(msgs);
    const c = LE.estado.config;
    const pendientes = msgs.filter((m) => !m.leido || (m.tipo === "mision" && !m.completado));
    const nombre = esc((r.perfil.nombre || "").split(" ")[0]);
    const retos = c.retos?.opciones || [];
    const debil = [...(r.dominio || [])].sort((a, b) => a.dominio - b.dominio)[0];

    LE.montar(`
      <div class="rejilla inicio">
        <div class="pila" style="--pila:1.25rem">
          <section class="panel saludo">
            <div class="fila">
              <div class="avatar-grande" aria-hidden="true">${esc(r.perfil.avatar)}</div>
              <div class="pila" style="--pila:.2rem">
                <h1>Hola, ${nombre}</h1>
                <p class="sub">${saludoDia(r)}</p>
              </div>
            </div>
            ${LE.pistaXP(r.perfil.xp)}
            <div class="chips">
              <span class="chip" title="Días seguidos con al menos una pregunta respondida">🔥 <b>${r.racha}</b> ${r.racha === 1 ? "día" : "días"} de racha</span>
              <span class="chip">⏱️ <b>${LE.minutos(r.minutos_hoy)}</b> hoy</span>
              <span class="chip">🏅 <b>${r.insignias.length}</b> insignias</span>
            </div>
          </section>

          ${pendientes.length ? `
          <section class="pila" style="--pila:.7rem" aria-label="Mensajes de tu tutor">
            <div class="titulo-seccion"><h2>De tu tutor</h2><a href="#/mensajes" class="pequeno">Ver todos</a></div>
            ${pendientes.slice(0, 2).map(tarjetaMensaje).join("")}
          </section>` : ""}

          <section class="panel">
            <div class="titulo-seccion"><h2>Reto de hoy</h2><span class="sub pequeno">Elige cuánto tiempo tienes</span></div>
            <div class="tracklist">
              ${retos.map((o) => `
                <button class="track" data-accion="reto" data-n="${o.n}">
                  <span class="n">${o.n}<small>preguntas</small></span>
                  <span><strong>${esc(o.nombre)}</strong><span class="sub pequeno">${esc(o.descripcion)} Unos ${o.minutos} min.</span></span>
                  <span class="play" aria-hidden="true">▶</span>
                </button>`).join("")}
            </div>
          </section>
        </div>

        <div class="pila" style="--pila:1.25rem">
          <section class="panel">
            <div class="titulo-seccion"><h2>Tu ecualizador</h2><span class="sub pequeno">Dominio de 0 a 100</span></div>
            ${LE.ecualizador(r.dominio, { vivo: true })}
            ${debil && r.totales.respuestas >= 8 ? `
              <p class="sub pequeno" style="margin-top:1rem">Tu nivel más bajo ahora es <b style="color:var(--texto)">${esc(LE.cat(debil.categoria).nombre)}</b>: ${esc(LE.cat(debil.categoria).descripcion.toLowerCase())}</p>
              <button class="btn sec chico" style="margin-top:.8rem" data-accion="reto" data-n="5" data-cat="${debil.categoria}">Practicar 5 de ${esc(LE.cat(debil.categoria).nombre.toLowerCase())}</button>` : ""}
          </section>
          <section class="panel">
            <div class="titulo-seccion"><h2>Simulacro</h2></div>
            <p class="sub">${r.simulacros.length ? `Último: <b style="color:var(--texto)">${r.simulacros[0].puntaje}%</b> en nivel ${esc(c.simulacros?.[r.simulacros[0].nivel]?.nombre || r.simulacros[0].nivel)}, ${esc(LE.hace(r.simulacros[0].fecha))}.` : "Todavía no has hecho ninguno. El inicial te da tu punto de partida."}</p>
            <a class="btn sec" href="#/simulacro" style="margin-top:1rem">Ver niveles de simulacro</a>
          </section>
        </div>
      </div>`);
  }, { estudiante: true });

  function saludoDia(r) {
    if (r.minutos_hoy >= 20) return "Ya cumpliste tu práctica de hoy. Todo lo que sumes es extra.";
    if (r.racha >= 3) return `Llevas ${r.racha} días seguidos. Un reto hoy y la racha sigue.`;
    if (r.racha === 0 && r.mejor_racha > 0) return "Hoy es buen día para empezar una racha nueva.";
    return "Elige un reto y empieza a sumar.";
  }

  function tarjetaMensaje(m) {
    const cat = m.mision?.categoria;
    const tipo = m.tipo === "mision" ? "Misión" : m.tipo === "comentario" ? "Sobre una pregunta" : "Mensaje";
    return `<article class="mensaje ${m.tipo}">
      <span class="de">${tipo} · ${esc(LE.hace(m.creado))}${!m.leido ? '<span class="nuevo">nuevo</span>' : ""}</span>
      <h3>${esc(m.titulo)}</h3>
      ${m.cuerpo ? `<p>${esc(m.cuerpo)}</p>` : ""}
      ${m.tipo === "comentario" && m.mision?.cita ? `<div class="cita">«${esc(m.mision.cita)}»${m.mision.correcta ? `<br><span class="pequeno">Respuesta correcta: ${esc(m.mision.correcta)}</span>` : ""}</div>` : ""}
      ${m.tipo === "mision" ? (m.completado
        ? `<p class="hecho" style="margin-top:.6rem">✓ Misión cumplida</p>`
        : `<button class="btn chico" style="margin-top:.8rem" data-accion="mision" data-id="${m.id}" data-n="${m.mision?.n || 10}" data-cat="${cat || ""}">Empezar misión: ${m.mision?.n || 10} preguntas${cat ? " de " + esc(LE.cat(cat).nombre.toLowerCase()) : ""}</button>`)
        : !m.leido ? `<button class="enlace pequeno" style="margin-top:.6rem;display:block" data-accion="leido" data-id="${m.id}">Marcar como leído</button>` : ""}
    </article>`;
  }

  A.leido = async (b) => {
    await LE.api.marcarLeido(b.dataset.id);
    b.closest(".mensaje").querySelector(".nuevo")?.remove();
    b.remove();
    LE.actualizarPunto();
  };

  // =================================================================
  //  MENSAJES
  // =================================================================
  LE.ruta("/mensajes", async () => {
    LE.cargando();
    const msgs = await LE.api.mensajes();
    LE.montar(`<div class="pila" style="max-width:44rem">
      <h1>Mensajes</h1>
      <p class="sub">Todo lo que tu tutor te ha escrito: mensajes, misiones y comentarios sobre tus respuestas.</p>
      ${msgs.length ? msgs.map(tarjetaMensaje).join("") : `<div class="vacio"><p>Aún no hay mensajes. Cuando tu tutor te escriba, aparecerá aquí.</p></div>`}
    </div>`);
    const porLeer = msgs.filter((m) => !m.leido && m.tipo !== "mision");
    await Promise.all(porLeer.map((m) => LE.api.marcarLeido(m.id)));
    LE.actualizarPunto();
  }, { estudiante: true });

  // =================================================================
  //  RETO (y misión)
  // =================================================================
  A.reto = (b) => empezarReto(+b.dataset.n, b.dataset.cat || null, null, b);
  A.mision = (b) => { LE.api.marcarLeido(b.dataset.id).then(() => LE.actualizarPunto()); empezarReto(+b.dataset.n, b.dataset.cat || null, b.dataset.id, b); };

  async function empezarReto(n, cat, mensajeId, boton) {
    if (boton) boton.disabled = true;
    try {
      const datos = await LE.api.iniciarReto(n, cat, mensajeId);
      LE.estado.sesion = { datos, i: 0, marcas: [], xp: 0, sel: null, respondida: null, t0: performance.now(), mision: !!mensajeId, cat };
      LE.ir("#/reto");
    } catch (e) { LE.error(e); if (boton) boton.disabled = false; }
  }

  LE.ruta("/reto", () => {
    const s = LE.estado.sesion;
    if (!s || !s.datos?.preguntas) return LE.ir("#/inicio");
    if (s.final) return pintarFinal();
    pintarPregunta();
  }, { sesion: true, estudiante: true });

  function pintarPregunta() {
    const s = LE.estado.sesion;
    const p = s.datos.preguntas[s.i];
    const t = s.datos.textos[p.texto_id];
    const total = s.datos.preguntas.length;
    const r = s.respondida;
    const mismaLectura = s.i > 0 && s.datos.preguntas[s.i - 1].texto_id === p.texto_id;
    LE.montar(`
      <div class="sesion-cab">
        <button class="btn suave chico" data-accion="salirReto">Salir</button>
        <div class="progreso" aria-label="Pregunta ${s.i + 1} de ${total}">
          ${s.datos.preguntas.map((_, k) => `<i class="${k < s.marcas.length ? (s.marcas[k] ? "ok" : "mal") : k === s.i ? "act" : ""}"></i>`).join("")}
        </div>
        <span class="xp-vivo" aria-live="polite">+${s.xp} XP</span>
      </div>
      <div class="juego">
        <div>${LE.lecturaHTML(t, !mismaLectura)}</div>
        <section class="pregunta cr-${p.categoria}">
          <div class="meta"><span class="etq">${esc(LE.cat(p.categoria).nombre)}</span><span class="dif" title="Dificultad ${p.dificultad} de 3">${"●".repeat(p.dificultad)}${"○".repeat(3 - p.dificultad)}</span><span class="tenue">Pregunta ${s.i + 1} de ${total}</span></div>
          <p class="enunciado">${esc(p.enunciado)}</p>
          <div class="opciones" role="radiogroup">
            ${p.opciones.map((o, k) => {
              let cls = "";
              if (r) { if (k === r.opcion_correcta) cls = "bien"; else if (k === s.sel) cls = "malo"; }
              else if (k === s.sel) cls = "sel";
              return `<button class="opcion ${cls}" role="radio" aria-checked="${k === s.sel}" data-accion="elegir" data-k="${k}" ${r ? "disabled" : ""}><span class="letra">${LE.LETRAS[k]}</span><span>${esc(o)}</span></button>`;
            }).join("")}
          </div>
          ${r ? `<div class="retro ${r.correcta ? "bien" : "malo"}" role="status">
              <strong>${r.correcta ? "Correcto" : "La respuesta era la " + LE.LETRAS[r.opcion_correcta]} · +${r.xp} XP</strong>
              <p>${esc(r.explicacion)}</p>
            </div>
            <div class="acciones"><button class="btn" data-accion="siguiente" id="btn-sig">${s.i + 1 < total ? "Siguiente pregunta" : "Ver resultado"}</button></div>`
          : `<div class="acciones"><button class="btn" data-accion="confirmar" ${s.sel == null ? "disabled" : ""}>Confirmar respuesta</button></div>`}
        </section>
      </div>`);
    if (r) $("#btn-sig")?.focus();
  }

  A.elegir = (b) => {
    const s = LE.estado.sesion;
    if (s.respondida) return;
    s.sel = +b.dataset.k;
    $$(".opcion").forEach((o, k) => { o.classList.toggle("sel", k === s.sel); o.setAttribute("aria-checked", k === s.sel); });
    $('[data-accion="confirmar"]').disabled = false;
  };

  A.confirmar = async (b) => {
    const s = LE.estado.sesion;
    if (s.sel == null || s.respondida) return;
    b.disabled = true;
    try {
      const p = s.datos.preguntas[s.i];
      const r = await LE.api.responder(s.datos.sesion_id, p.id, s.sel, performance.now() - s.t0);
      s.respondida = r; s.marcas.push(r.correcta); s.xp += r.xp;
      pintarPregunta();
      window.scrollTo({ top: document.querySelector(".retro").getBoundingClientRect().top + scrollY - 120, behavior: "smooth" });
    } catch (e) { LE.error(e); b.disabled = false; }
  };

  A.siguiente = async (b) => {
    const s = LE.estado.sesion;
    if (s.i + 1 < s.datos.preguntas.length) {
      s.i++; s.sel = null; s.respondida = null; s.t0 = performance.now();
      pintarPregunta();
    } else {
      b.disabled = true;
      await terminarReto();
    }
  };

  A.salirReto = async () => {
    const s = LE.estado.sesion;
    const ok = await LE.confirmar("¿Terminar el reto ahora?", `Llevas ${s.marcas.length} de ${s.datos.preguntas.length} preguntas. Se guarda lo que respondiste, pero el bono por reto completo solo llega si terminas.`, "Terminar ahora", "Seguir");
    if (!ok) return;
    if (!s.marcas.length) { LE.estado.sesion = null; return LE.ir("#/inicio"); }
    await terminarReto();
  };

  async function terminarReto() {
    const s = LE.estado.sesion;
    try {
      s.final = await LE.api.finalizarReto(s.datos.sesion_id);
      LE.estado.perfil.xp = s.final.xp_total ?? LE.estado.perfil.xp;
      pintarFinal();
      await LE.premios(s.final.nuevas_insignias);
    } catch (e) { LE.error(e); }
  }

  function pintarFinal() {
    const s = LE.estado.sesion, f = s.final;
    const pct = f.total ? f.correctas / f.total : 0;
    const frase = pct === 1 ? "Perfecto. Ni una sola equivocación." : pct >= 0.8 ? "Muy buen ritmo." : pct >= 0.5 ? "Vas bien. Revisa las explicaciones de las que fallaste." : "Hoy costó. Las preguntas falladas volverán en unos días para que las domines.";
    const porCat = {};
    s.datos.preguntas.forEach((p, k) => { if (k < s.marcas.length) { const c = (porCat[p.categoria] ||= [0, 0]); c[1]++; if (s.marcas[k]) c[0]++; } });
    LE.montar(`
      <div class="pila" style="max-width:40rem;margin:0 auto;--pila:1.25rem">
        <div class="marcador">
          <span class="sub">${s.mision ? "Misión terminada" : "Reto terminado"}</span>
          <span class="pct" style="color:var(--rosa)">${f.correctas}/${f.total}</span>
          <p class="sub">${frase}</p>
        </div>
        <div class="progreso">${s.marcas.map((m) => `<i class="${m ? "ok" : "mal"}"></i>`).join("")}</div>
        <div class="stats">
          <div class="stat"><b style="color:var(--amarillo)">+${f.xp}</b><span>XP${f.bono ? ` (incluye ${f.bono} de bono)` : ""}</span></div>
          ${Object.entries(porCat).map(([c, [ok, t]]) => `<div class="stat cr-${c}"><b style="color:var(--c)">${ok}/${t}</b><span>${esc(LE.cat(c).nombre)}</span></div>`).join("")}
        </div>
        ${LE.pistaXP(LE.estado.perfil.xp)}
        <div class="acciones" style="justify-content:flex-start">
          <button class="btn" data-accion="otroReto" data-n="${s.datos.preguntas.length}">Otro reto igual</button>
          <button class="btn sec" data-accion="volverInicio">Volver al inicio</button>
        </div>
      </div>`);
  }

  A.otroReto = (b) => { const cat = LE.estado.sesion?.cat; LE.estado.sesion = null; empezarReto(+b.dataset.n, cat, null, b); };
  A.volverInicio = () => { LE.estado.sesion = null; LE.ir("#/inicio"); };

  // =================================================================
  //  SIMULACRO: niveles
  // =================================================================
  LE.ruta("/simulacro", async () => {
    LE.cargando();
    const r = await LE.api.resumen();
    const niveles = LE.estado.config.simulacros || {};
    LE.montar(`
      <div class="pila" style="--pila:1.5rem">
        <div class="pila" style="--pila:.4rem">
          <h1>Simulacro</h1>
          <p class="sub" style="max-width:60ch">Condiciones de examen: tiempo límite, sin explicaciones hasta el final y textos completos con todas sus preguntas. Cuando se acaba el tiempo, se entrega solo. Como en la prueba real, una respuesta vacía vale lo mismo que una incorrecta: responde todas.</p>
        </div>
        <div class="niveles">
          ${Object.entries(niveles).map(([k, n]) => `
            <article class="nivel">
              <h2>${esc(n.nombre)}</h2>
              <div class="grande">${n.preguntas}<small>preguntas</small></div>
              <p class="sub">${esc(n.descripcion || "")}</p>
              <p><b>${n.minutos} minutos</b> <span class="tenue">· ${Math.round((n.minutos * 60) / n.preguntas)} s por pregunta</span></p>
              <button class="btn color cr-violeta" data-accion="simulacro" data-nivel="${k}">Empezar ${esc(n.nombre.toLowerCase())}</button>
            </article>`).join("")}
        </div>
        <section class="panel">
          <div class="titulo-seccion"><h2>Tus simulacros</h2></div>
          ${r.simulacros.length ? `<div class="scroll-x"><table class="tabla">
            <thead><tr><th>Fecha</th><th>Nivel</th><th class="num">Aciertos</th><th class="num">Puntaje</th><th></th></tr></thead>
            <tbody>${r.simulacros.map((x) => `<tr><td>${LE.fecha(x.fecha)}</td><td>${esc(niveles[x.nivel]?.nombre || x.nivel)}</td><td class="num">${x.correctas}/${x.total}</td><td class="num"><b>${x.puntaje}%</b></td><td><a href="#/diagnostico/${x.id}">Ver diagnóstico</a></td></tr>`).join("")}</tbody>
          </table></div>` : `<p class="sub">Aquí verás tu evolución simulacro a simulacro.</p>`}
        </section>
      </div>`);
  }, { estudiante: true });

  A.simulacro = async (b) => {
    const n = LE.estado.config.simulacros[b.dataset.nivel];
    const ok = await LE.confirmar(`Simulacro ${n.nombre.toLowerCase()}`, `${n.preguntas} preguntas en ${n.minutos} minutos. El reloj arranca apenas empieces y no se detiene si cierras la app. ¿Tienes el tiempo libre ahora?`, "Empezar", "Todavía no");
    if (!ok) return;
    b.disabled = true;
    try {
      const d = await LE.api.iniciarSimulacro(b.dataset.nivel);
      if (!d.retomado && d.preguntas.length < n.preguntas) LE.aviso(`Por ahora el banco tiene ${d.preguntas.length} preguntas: este simulacro usa todas, con el tiempo ajustado.`);
      iniciarSimulacro(d);
    } catch (e) { LE.error(e); b.disabled = false; }
  };

  const leerLocal = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const escribirLocal = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

  function iniciarSimulacro(d) {
    const guardado = leerLocal("sim-" + d.sesion_id);
    LE.estado.sim = {
      datos: d, i: guardado?.i || 0, resp: guardado?.resp || {}, marcadas: new Set(guardado?.marcadas || []),
      desfase: new Date(d.ahora).getTime() - Date.now(), tEntrada: Date.now(), timer: null, entregando: false
    };
    if (d.retomado) LE.aviso("Retomaste el simulacro que tenías abierto.");
    LE.ir("#/simulacro/jugar");
  }

  const guardarSim = () => { const m = LE.estado.sim; escribirLocal("sim-" + m.datos.sesion_id, { i: m.i, resp: m.resp, marcadas: [...m.marcadas] }); };
  const restante = () => { const m = LE.estado.sim; return Math.max(0, new Date(m.datos.limite).getTime() - (Date.now() + m.desfase)); };
  const fmtReloj = (ms) => { const s = Math.ceil(ms / 1000); const h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = s % 60; return (h ? h + ":" + String(mi).padStart(2, "0") : mi) + ":" + String(se).padStart(2, "0"); };

  LE.ruta("/simulacro/jugar", () => {
    const m = LE.estado.sim;
    if (!m) return LE.ir("#/simulacro");
    clearInterval(m.timer);
    m.avisos = m.avisos || {};
    m.timer = setInterval(() => {
      if (!location.hash.startsWith("#/simulacro/jugar")) return clearInterval(m.timer);
      const ms = restante();
      const el = $("#reloj");
      if (el) { el.textContent = fmtReloj(ms); el.classList.toggle("aviso", ms < 600000 && ms >= 180000); el.classList.toggle("urgente", ms < 180000); }
      if (ms < 600000 && !m.avisos.diez) { m.avisos.diez = 1; LE.aviso("Quedan 10 minutos. Asegúrate de marcar todas."); }
      if (ms < 60000 && !m.avisos.uno) { m.avisos.uno = 1; LE.aviso("Queda 1 minuto."); }
      if (ms <= 0) { clearInterval(m.timer); entregar(true); }
    }, 1000);
    pintarSim();
  }, { sesion: true, estudiante: true });

  function pintarSim() {
    const m = LE.estado.sim;
    const ps = m.datos.preguntas;
    const p = ps[m.i];
    const t = m.datos.textos[p.texto_id];
    const elegida = m.resp[p.id]?.opcion;
    const nResp = Object.values(m.resp).filter((x) => x.opcion != null).length;
    const ms = restante();
    const mismaLectura = m.i > 0 && ps[m.i - 1].texto_id === p.texto_id;
    LE.montar(`
      <div class="sesion-cab">
        <span class="reloj ${ms < 180000 ? "urgente" : ms < 600000 ? "aviso" : ""}" id="reloj" role="timer" aria-label="Tiempo restante">${fmtReloj(ms)}</span>
        <span class="sub">${nResp} de ${ps.length} respondidas</span>
        <span style="flex:1"></span>
        <button class="btn chico color cr-violeta" data-accion="entregar">Entregar</button>
      </div>
      <div class="juego">
        <div>${LE.lecturaHTML(t, !mismaLectura)}</div>
        <section class="pregunta">
          <div class="meta"><span class="tenue">Pregunta ${m.i + 1} de ${ps.length}</span></div>
          <p class="enunciado">${esc(p.enunciado)}</p>
          <div class="opciones" role="radiogroup">
            ${p.opciones.map((o, k) => `<button class="opcion ${k === elegida ? "sel" : ""}" role="radio" aria-checked="${k === elegida}" data-accion="simElegir" data-k="${k}"><span class="letra">${LE.LETRAS[k]}</span><span>${esc(o)}</span></button>`).join("")}
          </div>
          <div class="acciones" style="justify-content:space-between">
            <button class="btn suave chico" data-accion="simMarcar">${m.marcadas.has(p.id) ? "Quitar marca" : "Marcar para revisar"}</button>
            <span class="fila">
              <button class="btn sec chico" data-accion="simIr" data-i="${m.i - 1}" ${m.i === 0 ? "disabled" : ""}>Anterior</button>
              <button class="btn chico" data-accion="simIr" data-i="${m.i + 1}" ${m.i + 1 >= ps.length ? "disabled" : ""}>Siguiente</button>
            </span>
          </div>
          <div>
            <p class="sub pequeno" style="margin-bottom:.5rem">Mapa del simulacro. El punto amarillo indica las que marcaste para revisar.</p>
            <div class="mapa">${ps.map((q, k) => `<button data-accion="simIr" data-i="${k}" class="${m.resp[q.id]?.opcion != null ? "resp" : ""} ${k === m.i ? "act" : ""} ${m.marcadas.has(q.id) ? "marca" : ""}" aria-label="Pregunta ${k + 1}">${k + 1}</button>`).join("")}</div>
          </div>
        </section>
      </div>`);
  }

  function acumularTiempo() {
    const m = LE.estado.sim, p = m.datos.preguntas[m.i];
    const r = (m.resp[p.id] ||= { opcion: null, tiempo_ms: 0 });
    r.tiempo_ms += Date.now() - m.tEntrada;
    m.tEntrada = Date.now();
  }
  A.simElegir = (b) => {
    const m = LE.estado.sim, p = m.datos.preguntas[m.i];
    acumularTiempo();
    m.resp[p.id].opcion = +b.dataset.k;
    guardarSim(); pintarSim();
  };
  A.simIr = (b) => {
    const m = LE.estado.sim, k = +b.dataset.i;
    if (k < 0 || k >= m.datos.preguntas.length) return;
    acumularTiempo(); m.i = k; guardarSim(); pintarSim();
  };
  A.simMarcar = () => {
    const m = LE.estado.sim, id = m.datos.preguntas[m.i].id;
    m.marcadas.has(id) ? m.marcadas.delete(id) : m.marcadas.add(id);
    guardarSim(); pintarSim();
  };
  A.entregar = async () => {
    const m = LE.estado.sim;
    const faltan = m.datos.preguntas.filter((q) => m.resp[q.id]?.opcion == null).length;
    const ok = await LE.confirmar("¿Entregar el simulacro?", faltan ? `Te faltan <b>${faltan}</b> preguntas. En el examen real una respuesta vacía no suma nada: si no sabes, elige la más razonable.` : `Respondiste todas${m.marcadas.size ? ` y tienes ${m.marcadas.size} marcadas para revisar` : ""}.`, "Entregar ahora", "Seguir respondiendo");
    if (ok) entregar(false);
  };

  async function entregar(automatico) {
    const m = LE.estado.sim;
    if (!m || m.entregando) return;
    m.entregando = true;
    clearInterval(m.timer);
    acumularTiempo();
    LE.cargando(automatico ? "Se acabó el tiempo. Calificando…" : "Calificando…");
    try {
      const res = await LE.api.entregarSimulacro(m.datos.sesion_id, m.resp);
      escribirLocal("sim-" + m.datos.sesion_id, null);
      LE.estado.diag = { resultado: res, textos: m.datos.textos, nivel: m.datos.nivel, recien: true };
      LE.estado.sim = null;
      LE.ir("#/diagnostico/nuevo");
      if (automatico) LE.aviso("Se acabó el tiempo. Así te fue.");
      await LE.premios(res.nuevas_insignias);
    } catch (e) {
      m.entregando = false;
      LE.error(e);
      pintarSim();
    }
  }

  // =================================================================
  //  DIAGNÓSTICO (lo comparten estudiante y tutor)
  // =================================================================
  LE.ruta("/diagnostico/:id", async ({ id }) => {
    if (id !== "nuevo" || !LE.estado.diag) {
      LE.cargando();
      const d = await LE.api.detalleSesion(id);
      LE.estado.diag = { resultado: d.sesion.resultado, textos: d.textos, nivel: d.sesion.nivel, fecha: d.sesion.fin };
    }
    LE.montar(LE.diagnosticoHTML(LE.estado.diag));
  });

  LE.diagnosticoHTML = ({ resultado: r, nivel, recien, fecha }) => {
    const n = LE.estado.config.simulacros?.[nivel] || { nombre: nivel };
    const refs = LE.estado.config.referencias || [];
    const cats = LE.CATS.map((c) => { const x = r.por_categoria?.[c] || { correctas: 0, total: 0 }; return { categoria: c, dominio: x.total ? Math.round((100 * x.correctas) / x.total) : 0, respondidas: x.total, x }; });
    const conPreg = cats.filter((c) => c.x.total > 0).sort((a, b) => a.dominio - b.dominio);
    const debil = conPreg[0], fuerte = conPreg[conPreg.length - 1];
    const vacias = r.total - (r.respondidas ?? r.total);
    return `
      <div class="pila" style="--pila:1.5rem">
        <div class="fila entre">
          <div class="marcador">
            <span class="sub">Simulacro ${esc(String(n.nombre).toLowerCase())}${fecha ? " · " + LE.fecha(fecha) : ""}</span>
            <span class="pct">${r.puntaje}%</span>
            <p class="sub"><b style="color:var(--texto)">${r.correctas} de ${r.total}</b> correctas${r.minutos != null ? ` en ${r.minutos} min` : ""}${recien ? ` · +${r.xp} XP` : ""}</p>
          </div>
          <button class="btn sec" data-accion="volverDiag">${LE.esTutor() ? "Volver" : "Volver a simulacros"}</button>
        </div>
        <div class="rejilla dos">
          <section class="panel">
            <div class="titulo-seccion"><h2>Por nivel de lectura</h2><span class="sub pequeno">% de aciertos</span></div>
            ${LE.ecualizador(cats, { vivo: true, detalle: false })}
            <div class="pila" style="--pila:.5rem;margin-top:1.1rem">
              ${debil && debil !== fuerte ? `<p class="sub">El punto fuerte fue <b style="color:var(--texto)">${esc(LE.cat(fuerte.categoria).nombre)}</b> (${fuerte.x.correctas}/${fuerte.x.total}). Donde más puntos se fueron: <b style="color:var(--texto)">${esc(LE.cat(debil.categoria).nombre)}</b> (${debil.x.correctas}/${debil.x.total}).</p>` : ""}
              ${vacias > 0 ? `<p class="sub">Quedaron <b style="color:var(--coral)">${vacias}</b> sin responder. En la prueba real no hay penalización por error: marcar siempre suma probabilidad.</p>` : ""}
            </div>
            ${!LE.esTutor() && debil ? `<button class="btn sec chico" style="margin-top:1rem" data-accion="reto" data-n="10" data-cat="${debil.categoria}">Practicar 10 de ${esc(LE.cat(debil.categoria).nombre.toLowerCase())}</button>` : ""}
          </section>
          <section class="panel">
            <div class="titulo-seccion"><h2>Frente a los puntajes de corte</h2></div>
            <div class="referencias">
              ${refs.map((f) => `<div class="ref">
                <div class="fila entre pequeno"><b>${esc(f.programa)}</b><span class="${r.puntaje >= f.porcentaje ? "" : "tenue"}">${r.puntaje >= f.porcentaje ? "✓ alcanzado" : `meta ${f.porcentaje}%`}</span></div>
                <div class="ref-barra"><span class="tu" style="width:${Math.min(100, r.puntaje)}%"></span><span class="meta" style="left:${f.porcentaje}%"></span></div>
                <span class="tenue pequeno">${esc(f.detalle || "")}</span>
              </div>`).join("")}
            </div>
            <p class="tenue pequeno" style="margin-top:1rem">Referencia aproximada. En la UdeA el puntaje final se estandariza frente a todos los aspirantes de la jornada y combina Lectura con Razonamiento Lógico.</p>
          </section>
        </div>
        ${r.detalle?.length ? `<section class="pila" style="--pila:.8rem">
          <div class="titulo-seccion"><h2>Revisión pregunta por pregunta</h2><span class="sub pequeno">Toca una para ver la explicación</span></div>
          <div class="revision">${r.detalle.map((d, k) => `
            <details class="${d.elegida == null ? "vacia" : d.acierto ? "ok" : ""}">
              <summary><span class="num">${k + 1}</span><span>${d.acierto ? "✓ " : d.elegida == null ? "— " : "✗ "}${esc(d.enunciado)}</span></summary>
              <div class="cuerpo">
                <div class="fila"><span class="etq cr-${d.categoria}">${esc(LE.cat(d.categoria).nombre)}</span><button class="enlace pequeno" data-accion="verLectura" data-t="${d.texto_id}">Ver la lectura</button></div>
                ${d.opciones.map((o, j) => `<div class="op ${j === d.correcta ? "ok" : ""} ${j === d.elegida ? "elegida" : ""}"><b>${LE.LETRAS[j]}.</b> ${esc(o)}${j === d.correcta ? " ✓" : j === d.elegida ? " (respuesta marcada)" : ""}</div>`).join("")}
                ${d.elegida == null ? `<p class="tenue pequeno">Sin responder.</p>` : ""}
                <p class="sub">${esc(d.explicacion)}</p>
              </div>
            </details>`).join("")}</div>
        </section>` : ""}
      </div>`;
  };

  A.volverDiag = () => (LE.esTutor() ? history.back() : LE.ir("#/simulacro"));
  A.verLectura = (b) => {
    const t = LE.estado.diag?.textos?.[b.dataset.t];
    if (t) LE.dialogo(`${LE.lecturaHTML(t, false)}<div class="acciones" style="margin-top:1rem"><button class="btn" data-valor="ok">Cerrar</button></div>`);
  };

  // =================================================================
  //  PERFIL
  // =================================================================
  LE.ruta("/perfil", async () => {
    LE.cargando();
    const r = await LE.api.resumen();
    LE.estado.perfil = r.perfil;
    const gan = Object.fromEntries(r.insignias.map((i) => [i.codigo, i.obtenida]));
    const cat = LE.estado.insignias;
    const t = r.totales;
    const precision = t.respuestas ? Math.round((100 * t.aciertos) / t.respuestas) : 0;
    const minSemana = r.dias.slice(-7).reduce((a, d) => a + d.minutos, 0);
    LE.montar(`
      <div class="pila" style="--pila:1.5rem">
        <section class="panel saludo">
          <div class="fila entre">
            <div class="fila">
              <div class="avatar-grande" aria-hidden="true">${esc(r.perfil.avatar)}</div>
              <div class="pila" style="--pila:.2rem">
                <h1>${esc(r.perfil.nombre)}</h1>
                <p class="sub">${esc(LE.rango(r.perfil.xp).actual.nombre)}${r.perfil.meta_programa ? " · rumbo a " + esc(r.perfil.meta_programa) : ""}</p>
              </div>
            </div>
            <button class="btn sec chico" data-accion="editarPerfil">Editar perfil</button>
          </div>
          ${LE.pistaXP(r.perfil.xp)}
        </section>

        <div class="stats">
          <div class="stat"><b>${r.racha}</b><span>días de racha (mejor: ${r.mejor_racha})</span></div>
          <div class="stat"><b>${LE.minutos(r.minutos_hoy)}</b><span>de estudio hoy</span></div>
          <div class="stat"><b>${LE.minutos(minSemana)}</b><span>en los últimos 7 días</span></div>
          <div class="stat"><b>${LE.minutos(r.minutos_total)}</b><span>en total</span></div>
          <div class="stat"><b>${t.respuestas}</b><span>preguntas respondidas</span></div>
          <div class="stat"><b>${precision}%</b><span>de aciertos</span></div>
          <div class="stat"><b>${t.segundos_promedio ?? "—"}${t.segundos_promedio != null ? " s" : ""}</b><span>por pregunta (el examen da ~2 min)</span></div>
          <div class="stat"><b>${r.retos}</b><span>retos terminados</span></div>
        </div>

        <div class="rejilla dos">
          <section class="panel">
            <div class="titulo-seccion"><h2>Últimas 4 semanas</h2><span class="sub pequeno">Más intenso, más minutos</span></div>
            ${LE.calor(r.dias)}
          </section>
          <section class="panel">
            <div class="titulo-seccion"><h2>Dominio</h2></div>
            ${LE.ecualizador(r.dominio)}
          </section>
        </div>

        <section class="pila" style="--pila:.8rem">
          <div class="titulo-seccion"><h2>Insignias</h2><span class="sub">${r.insignias.length} de ${cat.length}</span></div>
          <div class="insignias">${cat.map((i) => `
            <div class="insignia cr-${esc(i.color)} ${gan[i.codigo] ? "" : "bloq"}" title="${gan[i.codigo] ? "Obtenida el " + LE.fecha(gan[i.codigo]) : "Por desbloquear"}">
              <span class="ico" aria-hidden="true">${esc(i.icono)}</span><b>${esc(i.nombre)}</b><span>${esc(i.descripcion)}</span>
            </div>`).join("")}</div>
        </section>

        <div class="fila">
          <button class="btn sec" data-accion="salir">Cerrar sesión</button>
          ${LE.api.modo === "demo" ? `<button class="btn suave" data-accion="reiniciarDemo">Reiniciar datos del demo</button>` : ""}
        </div>
      </div>`);
  }, { estudiante: true });

  A.editarPerfil = async () => {
    const p = LE.estado.perfil;
    const avatares = LE.estado.config.avatares || ["🎧"];
    let elegido = p.avatar, v = null;
    const res = await LE.dialogo(`
      <form class="pila" method="dialog" id="f-perfil">
        <h2>Editar perfil</h2>
        <label class="campo">Nombre<input name="nombre" value="${esc(p.nombre)}" maxlength="40"></label>
        <label class="campo">Programa al que aspiras<input name="meta" value="${esc(p.meta_programa || "")}" maxlength="60" placeholder="Ej.: Medicina"></label>
        <div class="campo"><span>Avatar</span><div class="avatares">${avatares.map((a) => `<button type="button" aria-pressed="${a === p.avatar}" data-av="${esc(a)}">${esc(a)}</button>`).join("")}</div></div>
        <div class="acciones"><button class="btn sec" type="button" data-valor="">Cancelar</button><button class="btn" value="guardar">Guardar</button></div>
      </form>`, {
      alAbrir: (d) => {
        const f = d.querySelector("#f-perfil");
        f.querySelector(".avatares").addEventListener("click", (e) => {
          const b = e.target.closest("[data-av]"); if (!b) return;
          elegido = b.dataset.av;
          $$("[data-av]", f).forEach((x) => x.setAttribute("aria-pressed", x === b));
        });
        f.addEventListener("submit", () => { v = { nombre: f.nombre.value, meta: f.meta.value }; });
      }
    });
    if (res === "guardar" && v) {
      try { await LE.api.actualizarPerfil(v.nombre, elegido, v.meta); LE.aviso("Perfil guardado"); LE.navegar(); }
      catch (e) { LE.error(e); }
    }
  };

  A.reiniciarDemo = async () => {
    if (!(await LE.confirmar("¿Reiniciar el demo?", "Se borran los datos de prueba guardados en este navegador y se vuelve al estado inicial.", "Reiniciar"))) return;
    await LE.api.reiniciar();
    location.hash = ""; location.reload();
  };
})(window.LE);
