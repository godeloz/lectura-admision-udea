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
          <div class="titulo-seccion"><h2>Estudiantes</h2><span class="sub pequeno">Últimos 7 días</span></div>
          ${ests.length ? `<div class="estudiantes">${ests.map((e) => `
            <a class="est" href="#/tutor/estudiante/${e.id}">
              <span class="av" aria-hidden="true">${esc(e.avatar)}</span>
              <span>
                <b>${esc(e.nombre)}</b> <span class="tenue pequeno">@${esc(e.usuario || "")}${e.meta_programa ? " · " + esc(e.meta_programa) : ""}</span>
                <span class="datos">
                  <span>🔥 <b>${e.racha}</b> días</span>
                  <span>⏱️ <b>${LE.minutos(e.minutos_7d)}</b></span>
                  <span><b>${e.respuestas_7d}</b> respuestas</span>
                  <span><b>${e.precision_7d ?? "—"}${e.precision_7d != null ? "%" : ""}</b> aciertos</span>
                  <span>Última vez: <b>${esc(LE.hace(e.ultima_actividad))}</b></span>
                </span>
              </span>
              <span>${e.alertas ? `<span class="nuevo">${e.alertas}</span>` : ""} <span aria-hidden="true">›</span></span>
            </a>`).join("")}</div>`
          : `<div class="panel vacio"><p>Todavía no hay estudiantes. Créalos en Supabase (Authentication → Users → Add user) con un correo del tipo <b>nombre@${esc(LE.cfg.DOMINIO_USUARIOS)}</b>; aparecerán aquí solos.</p></div>`}
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
        titulo: cat ? `Misión: nivel ${LE.cat(cat).nombre.toLowerCase()}` : "Misión: volver al ritmo",
        cuerpo, mision: { n, categoria: cat }
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
    const [r, msgs, falladas] = await Promise.all([LE.api.resumen(id), LE.api.mensajes(id), LE.api.preguntasFalladas(id)]);
    LE.estado.vistaEst = { id, r, falladas };
    const p = r.perfil, t = r.totales;
    const precision = t.respuestas ? Math.round((100 * t.aciertos) / t.respuestas) : 0;
    const min7 = r.dias.slice(-7).reduce((a, d) => a + d.minutos, 0);
    const diasActivos7 = r.dias.slice(-7).filter((d) => d.respuestas > 0).length;
    const niveles = LE.estado.config.simulacros || {};

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
          <div class="stat"><b>${t.respuestas}</b><span>preguntas · ${precision}% aciertos</span></div>
          <div class="stat"><b>${t.segundos_promedio ?? "—"}${t.segundos_promedio != null ? " s" : ""}</b><span>por pregunta</span></div>
          <div class="stat"><b>${r.retos}</b><span>retos y misiones</span></div>
        </div>

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
        </div>

        ${tablaTendencia(r.tendencia)}

        <section class="panel">
          <div class="titulo-seccion"><h2>Simulacros</h2></div>
          ${r.simulacros.length ? `<div class="scroll-x"><table class="tabla">
            <thead><tr><th>Fecha</th><th>Nivel</th><th class="num">Puntaje</th>${LE.CATS.map((c) => `<th class="num">${esc(LE.cat(c).nombre)}</th>`).join("")}<th></th></tr></thead>
            <tbody>${r.simulacros.map((x) => `<tr><td>${LE.fecha(x.fecha)}</td><td>${esc(niveles[x.nivel]?.nombre || x.nivel)}</td><td class="num"><b>${x.puntaje}%</b></td>${LE.CATS.map((c) => { const k = x.por_categoria?.[c]; return `<td class="num">${k ? k.correctas + "/" + k.total : "—"}</td>`; }).join("")}<td><a href="#/diagnostico/${x.id}">Ver</a></td></tr>`).join("")}</tbody>
          </table></div>` : `<p class="sub">Aún no ha hecho simulacros.</p>`}
        </section>

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
              <div class="fila entre"><span class="fila"><span class="etq">${esc(LE.cat(f.categoria).nombre)}</span><span class="tenue pequeno">${esc(f.texto)}</span></span><span class="pequeno"><b>${f.fallos}</b> de ${f.intentos} intentos mal</span></div>
              <b>${esc(f.enunciado)}</b>
              <div class="ops">${f.opciones.map((o, j) => `<span class="${j === f.correcta ? "ok" : j === f.ultima_opcion ? "ult" : ""}">${LE.LETRAS[j]}. ${esc(o)}${j === f.correcta ? " ✓" : j === f.ultima_opcion ? " ← su última respuesta" : ""}</span>`).join("")}</div>
              <details><summary class="pequeno sub" style="cursor:pointer">Explicación del banco</summary><p class="sub pequeno" style="margin-top:.4rem">${esc(f.explicacion)}</p></details>
              <div><button class="btn sec chico" data-accion="comentar" data-k="${k}">Comentarle esta pregunta</button></div>
            </article>`).join("") + (falladas.length > 6 ? "</details>" : "") : `<p class="sub">Sin errores registrados todavía.</p>`}
        </section>
      </div>`);
    activarCompositor();
  }, { tutor: true });

  function tablaTendencia(tend = []) {
    if (!tend?.length) return "";
    const semanas = [...new Set(tend.map((t) => t.semana))].sort();
    const celda = (sem, c) => {
      const x = tend.find((t) => t.semana === sem && t.categoria === c);
      return x ? `<td class="num"><span class="celda-mapa cr-${c}" style="--p:${Math.round(x.precision * 0.7)}" title="${x.n} respuestas">${x.precision}%</span></td>` : `<td class="num tenue">—</td>`;
    };
    return `<section class="panel">
      <div class="titulo-seccion"><h2>Evolución semanal</h2><span class="sub pequeno">% de aciertos por semana y nivel</span></div>
      <div class="scroll-x"><table class="tabla">
        <thead><tr><th>Semana del</th>${LE.CATS.map((c) => `<th class="num">${esc(LE.cat(c).nombre)}</th>`).join("")}</tr></thead>
        <tbody>${semanas.map((s) => `<tr><td>${LE.fecha(s + "T12:00")}</td>${LE.CATS.map((c) => celda(s, c)).join("")}</tr>`).join("")}</tbody>
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
        <label class="campo">Nivel<select name="cat"><option value="">Mezcla de todos</option>${LE.CATS.map((c) => `<option value="${c}">${esc(LE.cat(c).nombre)}</option>`).join("")}</select></label>
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
          mision: tipo === "mision" ? { n: +f.n.value, categoria: f.cat.value || null } : null
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
        <p class="sub">«${esc(f.enunciado)}»</p>
        <p class="pequeno">Respuesta correcta: <b style="color:var(--menta)">${LE.LETRAS[f.correcta]}. ${esc(f.opciones[f.correcta])}</b></p>
        <label class="campo">Tu comentario<textarea name="c" required placeholder="Explícale con tus palabras por qué, o dale una pista para la próxima."></textarea></label>
        <div class="acciones"><button class="btn sec" type="button" data-valor="">Cancelar</button><button class="btn" value="enviar">Enviar</button></div>
      </form>`, { alAbrir: (d) => d.querySelector("form").addEventListener("submit", (e) => { texto = e.target.c.value.trim(); }) });
    if (v !== "enviar" || !texto) return;
    try {
      await LE.api.enviarMensaje({ estudiante_id: id, tipo: "comentario", titulo: "Sobre una pregunta que se te complicó", cuerpo: texto, pregunta_id: f.id, mision: { cita: f.enunciado, correcta: `${LE.LETRAS[f.correcta]}. ${f.opciones[f.correcta]}` } });
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
    const dist = LE.estado.config.distribucion || {};
    LE.montar(`
      <div class="pila" style="--pila:1.5rem">
        <div class="pila" style="--pila:.3rem">
          <h1>Contenido</h1>
          <p class="sub">${c.textos} lecturas y ${c.preguntas} preguntas activas.</p>
        </div>

        <div class="rejilla dos">
          <section class="panel">
            <div class="titulo-seccion"><h2>Banco de preguntas</h2><span class="sub pequeno">Por nivel y dificultad</span></div>
            <div class="scroll-x"><table class="tabla">
              <thead><tr><th>Nivel</th><th class="num">Fácil</th><th class="num">Media</th><th class="num">Difícil</th><th class="num">Total</th><th class="num">Meta</th></tr></thead>
              <tbody>${LE.CATS.map((cat) => `<tr><td><span class="etq cr-${cat}">${esc(LE.cat(cat).nombre)}</span></td>${[1, 2, 3].map((d) => `<td class="num">${m[cat]?.[d] || 0}</td>`).join("")}<td class="num"><b>${total(cat)}</b></td><td class="num tenue">${Math.round((dist[cat] || 0) * 100)}%</td></tr>`).join("")}</tbody>
            </table></div>
            <p class="tenue pequeno" style="margin-top:.8rem">La columna «Meta» es el peso de cada nivel en retos y simulacros. Un banco sano tiene al menos 3 veces las preguntas del simulacro más largo (150).</p>
          </section>
          <section class="panel">
            <div class="titulo-seccion"><h2>Paquetes cargados</h2></div>
            <table class="tabla"><tbody>${(c.paquetes || []).map((p) => `<tr><td>${esc(p.paquete)}</td><td class="num">${p.preguntas} preguntas</td></tr>`).join("") || `<tr><td class="tenue">Ninguno</td></tr>`}</tbody></table>
          </section>
        </div>

        <section class="panel pila" style="--pila:.9rem">
          <h2>Cargar un paquete</h2>
          <p class="sub">Un paquete es un archivo .json que puede traer lecturas con preguntas, insignias nuevas, ajustes de la gamificación y una novedad que la estudiante verá al entrar. Si una lectura o pregunta ya existe (mismo código), se actualiza; no se duplica.</p>
          <div class="fila">
            <label class="btn sec" style="cursor:pointer">Elegir archivo .json<input type="file" accept=".json,application/json" id="archivo-paquete" hidden></label>
            <a class="enlace" href="content/plantilla-paquete.json" download>Descargar plantilla</a>
          </div>
          <label class="campo">O pega aquí el contenido del paquete<textarea id="texto-paquete" style="min-height:8rem;font-family:ui-monospace,monospace;font-size:.85rem" placeholder='{"paquete": "paquete-002", "textos": [ ... ]}'></textarea></label>
          <div id="revision-paquete"></div>
          <div class="acciones"><button class="btn" data-accion="revisarPaquete">Revisar paquete</button></div>
        </section>

        <section class="panel pila" style="--pila:.6rem">
          <h2>Cómo llegan las actualizaciones</h2>
          <p class="sub"><b style="color:var(--texto)">Preguntas y lecturas nuevas:</b> con un paquete, desde aquí. La estudiante las ve en su siguiente reto.</p>
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

  LE.validarPaquete = (p) => {
    const err = [];
    if (!p || typeof p !== "object" || Array.isArray(p)) return ["El archivo no es un objeto JSON."];
    if (!p.paquete) err.push("Falta el nombre del paquete (campo «paquete»).");
    const codigos = new Set();
    (p.textos || []).forEach((t, i) => {
      const donde = `Lectura ${i + 1}${t.codigo ? " (" + t.codigo + ")" : ""}`;
      if (!t.codigo) err.push(`${donde}: falta «codigo».`);
      if (!t.titulo) err.push(`${donde}: falta «titulo».`);
      if (!t.contenido) err.push(`${donde}: falta «contenido».`);
      if (t.tipologia && !LE.TIPOS[t.tipologia]) err.push(`${donde}: tipología «${t.tipologia}» no reconocida.`);
      (t.preguntas || []).forEach((q, j) => {
        const d2 = `${donde}, pregunta ${j + 1}`;
        if (!q.codigo) err.push(`${d2}: falta «codigo».`);
        else if (codigos.has(q.codigo)) err.push(`${d2}: el código ${q.codigo} está repetido.`);
        codigos.add(q.codigo);
        if (!LE.CATS.includes(q.categoria)) err.push(`${d2}: «categoria» debe ser literal, inferencial, critico o cohesion.`);
        if (!Array.isArray(q.opciones) || q.opciones.length !== 4) err.push(`${d2}: necesita exactamente 4 opciones.`);
        if (!(Number.isInteger(q.correcta) && q.correcta >= 0 && q.correcta <= 3)) err.push(`${d2}: «correcta» debe ser 0, 1, 2 o 3 (A, B, C o D).`);
        if (q.dificultad != null && ![1, 2, 3].includes(q.dificultad)) err.push(`${d2}: «dificultad» debe ser 1, 2 o 3.`);
        if (!q.enunciado) err.push(`${d2}: falta «enunciado».`);
      });
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
    const nq = (p.textos || []).reduce((a, t) => a + (t.preguntas || []).length, 0);
    const porCat = {};
    (p.textos || []).forEach((t) => (t.preguntas || []).forEach((q) => (porCat[q.categoria] = (porCat[q.categoria] || 0) + 1)));
    LE.estado.paqueteListo = p;
    caja.innerHTML = `<div class="mensaje" style="--c:var(--menta)">
      <h3>«${esc(p.paquete)}» está listo</h3>
      <p>${(p.textos || []).length} lecturas · ${nq} preguntas${nq ? " (" + Object.entries(porCat).map(([c, n]) => `${n} ${LE.cat(c).nombre.toLowerCase()}`).join(", ") + ")" : ""}${p.insignias?.length ? ` · ${p.insignias.length} insignias` : ""}${p.config ? ` · ajustes: ${Object.keys(p.config).join(", ")}` : ""}${p.novedad ? " · con novedad para la estudiante" : ""}</p>
      <button class="btn chico" style="margin-top:.8rem" data-accion="importarPaquete">Cargar paquete</button>
    </div>`;
  };

  A.importarPaquete = async (b) => {
    b.disabled = true;
    try {
      const r = await LE.api.importarPaquete(LE.estado.paqueteListo);
      await LE.recargarConfig();
      LE.aviso(`Cargado: ${r.textos} lecturas, ${r.preguntas} preguntas${r.insignias ? ", " + r.insignias + " insignias" : ""}.`);
      LE.estado.paqueteListo = null;
      LE.navegar();
    } catch (e) { LE.error(e); b.disabled = false; }
  };
})(window.LE);
