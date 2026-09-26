/* =====================================================================
   ENTRELÍNEAS · NÚCLEO
   Utilidades, rutas, diálogos y componentes que comparten todas las vistas.
   ===================================================================== */
window.LE = {
  cfg: window.LE_CONFIG,
  api: null,
  estado: { perfil: null, config: {}, insignias: [], sesion: null },
  acciones: {},
  rutas: []
};

(function (LE) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  LE.$ = $; LE.$$ = $$;

  LE.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Markdown mínimo para lecturas: ### títulos, - listas, **negrita**, *cursiva*
  LE.md = (texto) => {
    const inline = (s) => LE.esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
    return String(texto || "").trim().split(/\n\s*\n/).map((bloque) => {
      let html = "", parrafo = [], lista = [];
      const cerrar = () => { if (parrafo.length) html += "<p>" + parrafo.map(inline).join("<br>") + "</p>"; parrafo = []; };
      const cerrarLista = () => { if (lista.length) html += "<ul>" + lista.map((l) => "<li>" + inline(l) + "</li>").join("") + "</ul>"; lista = []; };
      for (const l of bloque.split("\n")) {
        if (/^###\s+/.test(l)) { cerrar(); cerrarLista(); html += "<h3>" + inline(l.replace(/^###\s+/, "")) + "</h3>"; }
        else if (/^\s*-\s+/.test(l)) { cerrar(); lista.push(l.replace(/^\s*-\s+/, "")); }
        else { cerrarLista(); parrafo.push(l); }
      }
      cerrar(); cerrarLista();
      return html;
    }).join("");
  };

  LE.CATS = ["literal", "inferencial", "critico", "cohesion"];
  LE.cat = (c) => (LE.estado.config.categorias || {})[c] || { nombre: c, color: "cian", descripcion: "" };
  LE.TIPOS = { ensayo: "Ensayo", divulgacion: "Divulgación científica", literario: "Texto literario", discontinuo: "Texto discontinuo", intertextual: "Dos textos en diálogo", argumentativo: "Texto argumentativo", periodistico: "Texto periodístico", otro: "Lectura" };
  LE.LETRAS = ["A", "B", "C", "D"];

  LE.minutos = (m) => {
    m = Math.round(m || 0);
    if (m < 60) return m + " min";
    const h = Math.floor(m / 60), r = m % 60;
    return h + " h" + (r ? " " + r + " min" : "");
  };
  LE.hace = (fecha) => {
    if (!fecha) return "sin actividad";
    const d = (Date.now() - new Date(fecha).getTime()) / 1000;
    if (d < 90) return "hace un momento";
    if (d < 3600) return "hace " + Math.round(d / 60) + " min";
    if (d < 86400) return "hace " + Math.round(d / 3600) + " h";
    const dias = Math.round(d / 86400);
    return dias === 1 ? "ayer" : "hace " + dias + " días";
  };
  LE.fecha = (f) => new Date(f).toLocaleDateString("es-CO", { day: "numeric", month: "short" });

  LE.rango = (xp) => {
    const rs = LE.estado.config.rangos || [{ nombre: "Demo", xp: 0 }];
    let i = 0;
    rs.forEach((r, k) => { if (xp >= r.xp) i = k; });
    const act = rs[i], sig = rs[i + 1];
    const prog = sig ? (xp - act.xp) / (sig.xp - act.xp) : 1;
    return { actual: act, siguiente: sig, progreso: Math.max(0, Math.min(1, prog)), indice: i };
  };

  // ---------- Montaje y rutas ----------
  LE.montar = (html) => { const v = $("#vista"); v.innerHTML = html; window.scrollTo(0, 0); return v; };
  LE.ondas = (n = 7) => Array.from({ length: n }, (_, i) => `<span class="cr-${["cian", "rosa", "amarillo", "menta"][i % 4]}" style="--i:${i};height:${40 + ((i * 37) % 60)}%"></span>`).join("");
  LE.cargando = (txt = "Cargando…") => LE.montar(`<div class="cargando"><div class="ondas">${LE.ondas()}</div><p>${LE.esc(txt)}</p></div>`);

  LE.ruta = (patron, fn, opciones = {}) => LE.rutas.push({ re: new RegExp("^" + patron.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"), fn, ...opciones });
  LE.ir = (hash) => { if (location.hash === hash) LE.navegar(); else location.hash = hash; };
  LE.inicioPorRol = () => (LE.esTutor() ? "#/tutor" : "#/inicio");
  LE.navegar = async () => {
    const h = location.hash.replace(/^#/, "") || LE.inicioPorRol().slice(1);
    for (const r of LE.rutas) {
      const m = h.match(r.re);
      if (!m) continue;
      if (r.tutor && !LE.esTutor()) return LE.ir("#/inicio");
      if (r.estudiante && LE.esTutor()) return LE.ir("#/tutor");
      document.body.classList.toggle("en-sesion", !!r.sesion);
      LE.marcarNav(h);
      try { await r.fn(m.groups || {}); }
      catch (e) {
        console.error(e);
        LE.montar(`<div class="vacio"><h2>No se pudo cargar esta pantalla</h2><p>${LE.esc(e.message || e)}</p><button class="btn sec" data-accion="irInicio">Volver al inicio</button></div>`);
      }
      return;
    }
    LE.ir(LE.inicioPorRol());
  };
  LE.marcarNav = (h) => {
    const links = $$(".nav a");
    const mejor = links.map((a) => a.getAttribute("href").slice(1)).filter((r) => h.startsWith(r)).sort((a, b) => b.length - a.length)[0];
    links.forEach((a) => (a.getAttribute("href").slice(1) === mejor ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  };
  LE.esTutor = () => LE.estado.perfil?.rol === "tutor";

  // ---------- Acciones delegadas ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-accion]");
    if (!b) return;
    const fn = LE.acciones[b.dataset.accion];
    if (fn) { e.preventDefault(); fn(b, e); }
  });
  LE.acciones.irInicio = () => LE.ir(LE.inicioPorRol());

  // ---------- Avisos y diálogos ----------
  LE.aviso = (msg, tipo = "") => {
    let c = $(".avisos");
    if (!c) { c = document.createElement("div"); c.className = "avisos"; c.setAttribute("role", "status"); document.body.append(c); }
    const a = document.createElement("div");
    a.className = "aviso " + tipo; a.textContent = msg; c.append(a);
    setTimeout(() => a.remove(), tipo === "error" ? 6000 : 3500);
  };
  LE.error = (e) => { console.error(e); LE.aviso(e?.message || String(e), "error"); };

  // Abre un diálogo. Cualquier botón con data-valor lo cierra y devuelve ese valor.
  LE.dialogo = (html, { cerrable = true, alAbrir } = {}) => new Promise((resolver) => {
    const d = document.createElement("dialog");
    d.innerHTML = html;
    document.body.append(d);
    d.addEventListener("click", (e) => {
      const b = e.target.closest("[data-valor]");
      if (b && !(b.form && b.type === "submit")) d.close(b.dataset.valor);
      else if (cerrable && e.target === d) d.close("");
    });
    d.addEventListener("cancel", (e) => { if (!cerrable) e.preventDefault(); });
    d.addEventListener("close", () => { resolver(d.returnValue); d.remove(); });
    d.showModal();
    if (alAbrir) alAbrir(d);
  });
  LE.confirmar = (titulo, texto, si = "Continuar", no = "Cancelar") =>
    LE.dialogo(`<div class="pila"><h2>${LE.esc(titulo)}</h2><p class="sub">${texto}</p><div class="acciones"><button class="btn sec" data-valor="no">${LE.esc(no)}</button><button class="btn" data-valor="si">${LE.esc(si)}</button></div></div>`).then((v) => v === "si");

  LE.premios = async (lista = []) => {
    for (const i of lista) {
      await LE.dialogo(`<div class="premio cr-${LE.esc(i.color)}"><div class="ico">${LE.esc(i.icono)}</div><p class="sub">Insignia nueva</p><h2>${LE.esc(i.nombre)}</h2><p class="sub">${LE.esc(i.descripcion)}</p><button class="btn" data-valor="ok">Guardar en mi perfil</button></div>`);
    }
  };

  // ---------- Componentes compartidos ----------
  LE.ecualizador = (dominio, { vivo = false, detalle = true } = {}) => {
    const mapa = Object.fromEntries((dominio || []).map((d) => [d.categoria, d]));
    return `<div class="eq ${vivo ? "vivo" : ""}" role="list">` + LE.CATS.map((c) => {
      const d = mapa[c] || { dominio: 0, respondidas: 0 };
      const on = Math.round((d.dominio || 0) / 5);
      const segs = Array.from({ length: 20 }, (_, i) => `<i class="eq-seg ${i < on ? "on" : ""} ${i === on - 1 ? "pico" : ""}" style="--i:${i}"></i>`).join("");
      return `<div class="eq-col cr-${c}" role="listitem" aria-label="${LE.esc(LE.cat(c).nombre)}: ${d.dominio} de 100">
        <span class="eq-valor">${d.dominio ?? 0}</span>
        <div class="eq-barra">${segs}</div>
        <span class="eq-nombre">${LE.esc(LE.cat(c).nombre)}</span>
        ${detalle ? `<span class="eq-det">${d.respondidas ?? 0} resp.</span>` : ""}
      </div>`;
    }).join("") + `</div>`;
  };

  LE.pistaXP = (xp) => {
    const r = LE.rango(xp);
    const n = (x) => Number(x).toLocaleString("es-CO");
    return `<div class="pista">
      <div class="pista-etiquetas"><span><b>${LE.esc(r.actual.nombre)}</b></span><span>${r.siguiente ? `${n(xp)} / ${n(r.siguiente.xp)} XP para ${LE.esc(r.siguiente.nombre)}` : `${n(xp)} XP · rango máximo`}</span></div>
      <div class="pista-barra" role="progressbar" aria-label="Progreso al siguiente rango" aria-valuenow="${Math.round(r.progreso * 100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${r.progreso * 100}%"></span></div>
    </div>`;
  };

  LE.calor = (dias = []) => {
    const n = (m) => (m <= 0 ? 0 : m < 15 ? 1 : m < 40 ? 2 : 3);
    return `<div class="calor">` + dias.map((d, i) => `<i data-n="${n(d.minutos || (d.respuestas ? 5 : 0))}" class="${i === dias.length - 1 ? "hoy" : ""}" title="${LE.fecha(d.fecha + "T12:00")}: ${d.minutos} min, ${d.respuestas} respuestas"></i>`).join("") + `</div>`;
  };

  LE.lecturaHTML = (t, plegable = true) => t ? `
    <article class="lectura ${plegable ? "plegada" : ""}" id="lectura">
      <span class="tipo">${LE.esc(LE.TIPOS[t.tipologia] || "Lectura")}</span>
      <h2>${LE.esc(t.titulo)}</h2>
      ${LE.md(t.contenido)}
      ${t.fuente ? `<p class="fuente">${LE.esc(t.fuente)}</p>` : ""}
    </article>
    ${plegable ? `<button class="btn suave chico plegar-lectura" data-accion="plegar">Mostrar lectura completa</button>` : ""}` : "";

  LE.acciones.plegar = (b) => {
    const l = $("#lectura");
    const pl = l.classList.toggle("plegada");
    b.textContent = pl ? "Mostrar lectura completa" : "Ocultar lectura";
  };

  // ---------- Cronómetro de estudio ----------
  // Suma tiempo solo si la pestaña está visible y hubo interacción en los últimos 2 minutos.
  LE.cronometro = {
    ultimo: Date.now(), acumulado: 0, timer: null, listo: false,
    iniciar() {
      if (this.timer) return;
      if (!this.listo) {
        ["pointerdown", "keydown", "scroll", "touchstart"].forEach((ev) => addEventListener(ev, () => (this.ultimo = Date.now()), { passive: true }));
        addEventListener("pagehide", () => this.vaciar());
        document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") this.vaciar(); });
        this.listo = true;
      }
      this.ultimo = Date.now();
      this.timer = setInterval(() => {
        if (document.visibilityState === "visible" && Date.now() - this.ultimo < 120000) this.acumulado += 15;
        if (this.acumulado >= 60) this.vaciar();
      }, 15000);
    },
    vaciar() { if (this.acumulado > 0 && LE.api) { const s = this.acumulado; this.acumulado = 0; LE.api.registrarTiempo(s).catch(() => {}); } },
    detener() { this.vaciar(); clearInterval(this.timer); this.timer = null; }
  };
})(window.LE);
