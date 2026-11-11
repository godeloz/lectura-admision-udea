/* =====================================================================
   ENTRELÍNEAS · NÚCLEO
   Utilidades, rutas, diálogos y componentes que comparten todas las vistas.
   ===================================================================== */
window.LE = {
  cfg: window.LE_CONFIG,
  api: null,
  estado: { perfil: null, config: {}, insignias: [], tecnicas: [], grupos: [], sesion: null },
  acciones: {},
  rutas: []
};

(function (LE) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  LE.$ = $; LE.$$ = $$;

  LE.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Markdown mínimo para lecturas y enunciados: ### títulos, - listas, **negrita**, *cursiva*
  // y cuadros: filas que empiezan y terminan con «|». La primera fila es el encabezado.
  LE.md = (texto) => {
    const inline = (s) => LE.esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
    const celdas = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    return String(texto || "").trim().split(/\n\s*\n/).map((bloque) => {
      let html = "", parrafo = [], lista = [], tabla = [];
      const cerrar = () => { if (parrafo.length) html += "<p>" + parrafo.map(inline).join("<br>") + "</p>"; parrafo = []; };
      const cerrarLista = () => { if (lista.length) html += "<ul>" + lista.map((l) => "<li>" + inline(l) + "</li>").join("") + "</ul>"; lista = []; };
      const cerrarTabla = () => {
        if (!tabla.length) return;
        const [cab, ...filas] = tabla;
        html += `<div class="scroll-x"><table class="cuadro"><thead><tr>${cab.map((c) => "<th>" + inline(c) + "</th>").join("")}</tr></thead><tbody>${filas.map((f) => "<tr>" + f.map((c, k) => (k === 0 ? "<th>" : "<td>") + inline(c) + (k === 0 ? "</th>" : "</td>")).join("") + "</tr>").join("")}</tbody></table></div>`;
        tabla = [];
      };
      for (const l of bloque.split("\n")) {
        if (/^\s*\|.*\|\s*$/.test(l)) { cerrar(); cerrarLista(); if (!/^[\s|:-]+$/.test(l)) tabla.push(celdas(l)); continue; }
        cerrarTabla();
        if (/^###\s+/.test(l)) { cerrar(); cerrarLista(); html += "<h3>" + inline(l.replace(/^###\s+/, "")) + "</h3>"; }
        else if (/^\s*-\s+/.test(l)) { cerrar(); lista.push(l.replace(/^\s*-\s+/, "")); }
        else { cerrarLista(); parrafo.push(l); }
      }
      cerrar(); cerrarLista(); cerrarTabla();
      return html;
    }).join("");
  };

  // Un enunciado en una sola línea, sin marcas: para resúmenes, citas y títulos plegados.
  LE.plano = (texto, max = 0) => {
    const t = String(texto || "").split("\n").filter((l) => !/^\s*\|.*\|\s*$/.test(l)).join(" ")
      .replace(/\*\*?|###\s*/g, "").replace(/\s+-\s+/g, " · ").replace(/\s+/g, " ").trim();
    return max && t.length > max ? t.slice(0, max).replace(/\s+\S*$/, "") + "…" : t;
  };

  // Figuras: SVG que llega de la base de datos. Nunca se inserta tal cual:
  // se reconstruye dejando pasar solo formas, textos y atributos de dibujo.
  const FIG_TAGS = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "title", "defs", "pattern", "marker"]);
  const FIG_ATTRS = new Set(["viewBox", "width", "height", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "d", "points", "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "opacity", "fill-opacity", "stroke-opacity", "transform", "font-size", "font-weight", "font-style", "text-anchor", "dominant-baseline", "dx", "dy", "id", "patternUnits", "markerWidth", "markerHeight", "refX", "refY", "orient", "marker-end", "marker-start", "preserveAspectRatio"]);
  const limpiarSVG = (n) => {
    if (n.nodeType === 3) return LE.esc(n.nodeValue);
    if (n.nodeType !== 1 || !FIG_TAGS.has(n.nodeName)) return "";
    let at = "";
    for (const a of [...n.attributes]) {
      const v = a.value;
      if (!FIG_ATTRS.has(a.name)) continue;
      if (/javascript:|data:|expression|@import|<|>/i.test(v)) continue;
      if (/url\s*\(/i.test(v) && !/^url\(#[\w-]+\)$/.test(v.trim())) continue;
      at += ` ${a.name}="${LE.esc(v)}"`;
    }
    return `<${n.nodeName}${at}>${[...n.childNodes].map(limpiarSVG).join("")}</${n.nodeName}>`;
  };
  LE.figura = (svg, descripcion = "") => {
    if (!svg || !/<svg[\s>]/i.test(svg)) return "";
    try {
      const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
      const raiz = doc.documentElement;
      if (!raiz || raiz.nodeName !== "svg" || doc.getElementsByTagName("parsererror").length) return "";
      const limpio = limpiarSVG(raiz).replace(/^<svg/, `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${LE.esc(descripcion || raiz.getAttribute("aria-label") || "Figura del problema")}"`);
      return `<figure class="figura">${limpio}</figure>`;
    } catch (e) { return ""; }
  };

  // Los dos componentes del examen. Comparten XP, racha y tiempo de estudio;
  // cada uno tiene sus retos, su dominio y sus simulacros, y nunca se mezclan.
  LE.COMP = {
    lectura: { nombre: "Lectura", largo: "Competencia Lectora", icono: "📖", color: "rosa", ruta: "#/inicio", cats: ["literal", "inferencial", "critico", "cohesion"] },
    logica: { nombre: "Lógica", largo: "Razonamiento Lógico", icono: "🧩", color: "cian", ruta: "#/logica", cats: ["deductivo", "proporcional", "abstracto", "geometrico"] }
  };
  LE.CATS = LE.COMP.lectura.cats;
  LE.CATS_LOGICA = LE.COMP.logica.cats;
  LE.CATS_TODAS = [...LE.CATS, ...LE.CATS_LOGICA];
  LE.compDe = (cat) => (LE.CATS_LOGICA.includes(cat) ? "logica" : "lectura");
  const CAT_BASE = {
    deductivo: { nombre: "Deducción", color: "violeta", descripcion: "Condicionales, negaciones, quién dice la verdad, cuadros de descarte y ordenamientos." },
    proporcional: { nombre: "Proporciones", color: "amarillo", descripcion: "Fracciones, porcentajes, razones, promedios, conteo y probabilidad." },
    abstracto: { nombre: "Patrones", color: "rosa", descripcion: "Series, operadores inventados, ciclos y claves." },
    geometrico: { nombre: "Geometría", color: "menta", descripcion: "Áreas, perímetros, volúmenes, escalas y vistas." }
  };
  LE.cat = (c) => (LE.estado.config.categorias || {})[c] || CAT_BASE[c] || { nombre: c, color: "cian", descripcion: "" };
  // Lógica aparece en la app solo cuando el tutor cargó su paquete base (logica-base).
  LE.logicaActiva = () => !!LE.estado.config.retos_logica;
  // Clave de configuración según el componente: «retos» o «retos_logica».
  LE.cfgDe = (clave, comp) => LE.estado.config[comp === "logica" ? clave + "_logica" : clave];
  // Componente en el que la estudiante estuvo por última vez (para volver ahí).
  LE.compActual = (nuevo) => {
    try {
      if (nuevo) localStorage.setItem("le-componente", nuevo);
      const c = nuevo || localStorage.getItem("le-componente");
      return c === "logica" && LE.logicaActiva() ? "logica" : "lectura";
    } catch (e) { return nuevo === "logica" && LE.logicaActiva() ? "logica" : "lectura"; }
  };

  // Tipos de error: cada opción incorrecta de una pregunta de lógica nace de uno.
  const ERR_BASE = {
    enunciado: { nombre: "Leíste otra pregunta", consejo: "Antes de calcular, di con tus palabras qué te piden y en qué unidades. Al terminar, vuelve a leer la pregunta." },
    planteamiento: { nombre: "Planteamiento", consejo: "Traduce el enunciado frase por frase antes de operar: qué es el todo, qué es la parte, qué se compara con qué." },
    regla: { nombre: "Regla equivocada", consejo: "Antes de aplicar una regla, comprueba que el problema cumple sus condiciones. Abre la ficha de la técnica y mira su trampa típica." },
    incompleto: { nombre: "A mitad de camino", consejo: "Tu cuenta iba bien, pero paraste un paso antes. Cuando tengas un número, pregúntate si eso es lo que pedían." },
    calculo: { nombre: "Cuenta", consejo: "El camino era el correcto y falló una operación. Estima el resultado antes de calcular y compara al final." },
    inferencia: { nombre: "Salto lógico", consejo: "Concluiste más de lo que las premisas permiten. Busca un caso que cumpla todo lo dicho y haga falsa tu opción." }
  };
  LE.tipoError = (t) => (LE.estado.config.tipos_error || {})[t] || ERR_BASE[t] || { nombre: t || "Error", consejo: "" };
  LE.TIPOS_ERROR = () => Object.keys({ ...ERR_BASE, ...(LE.estado.config.tipos_error || {}) });
  LE.tecnica = (codigo) => (LE.estado.tecnicas || []).find((t) => t.codigo === codigo) || null;
  // Una técnica se da por dominada con 3 aciertos o más y al menos 75 % de aciertos.
  LE.estadoTecnica = (x) => (!x || !x.intentos ? "nueva" : x.aciertos >= 3 && x.aciertos >= 0.75 * x.intentos ? "dominada" : "proceso");

  LE.TIPOS = { ensayo: "Ensayo", divulgacion: "Divulgación científica", literario: "Texto literario", discontinuo: "Texto discontinuo", intertextual: "Dos textos en diálogo", argumentativo: "Texto argumentativo", periodistico: "Texto periodístico", otro: "Lectura", situacion: "Situación" };
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
  // Si la pantalla cambió mientras se cargaban datos (por ejemplo, se cerró la sesión), no pinta nada.
  LE.montar = (html) => { const v = $("#vista"); if (!v) return document.createElement("div"); v.innerHTML = html; window.scrollTo(0, 0); return v; };
  LE.ondas = (n = 7) => Array.from({ length: n }, (_, i) => `<span class="cr-${["cian", "rosa", "amarillo", "menta"][i % 4]}" style="--i:${i};height:${40 + ((i * 37) % 60)}%"></span>`).join("");
  LE.cargando = (txt = "Cargando…") => LE.montar(`<div class="cargando"><div class="ondas">${LE.ondas()}</div><p>${LE.esc(txt)}</p></div>`);

  LE.ruta = (patron, fn, opciones = {}) => LE.rutas.push({ re: new RegExp("^" + patron.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"), fn, ...opciones });
  LE.ir = (hash) => { if (location.hash === hash) LE.navegar(); else location.hash = hash; };
  LE.inicioPorRol = () => (LE.comoTutor() ? "#/tutor" : LE.COMP[LE.compActual()].ruta);
  LE.navegar = async () => {
    const h = location.hash.replace(/^#/, "") || LE.inicioPorRol().slice(1);
    for (const r of LE.rutas) {
      const m = h.match(r.re);
      if (!m) continue;
      if (r.tutor && !LE.esTutor()) return LE.ir("#/inicio");
      if (r.estudiante && LE.comoTutor()) return LE.ir("#/tutor");
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
  // esTutor: la cuenta tiene permisos de tutor. comoTutor: además está viendo
  // las pantallas de tutor (no está en modo práctica usando la app como estudiante).
  LE.esTutor = () => LE.estado.perfil?.rol === "tutor";
  LE.enPractica = () => {
    if (!LE.esTutor()) return false;
    try { return sessionStorage.getItem("le-practica") === "1"; } catch (e) { return !!LE.estado.practica; }
  };
  LE.fijarPractica = (si) => {
    LE.estado.practica = !!si;
    try { si ? sessionStorage.setItem("le-practica", "1") : sessionStorage.removeItem("le-practica"); } catch (e) { }
  };
  LE.comoTutor = () => LE.esTutor() && !LE.enPractica();

  // ---------- Instalar la app en el celular ----------
  // Android/Chrome ofrece su propio instalador; hay que guardar el evento apenas llega.
  LE.instalador = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); LE.instalador = e; document.dispatchEvent(new Event("le-instalador")); });
  addEventListener("appinstalled", () => { LE.instalador = null; LE.api?.marcarInstalada?.().catch(() => {}); });
  // ¿Está abierta desde el ícono instalado (y no desde el navegador)?
  LE.instalada = () => matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches || navigator.standalone === true;
  LE.dispositivo = () => {
    const ua = navigator.userAgent || "";
    const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    if (ios) return { so: "ios", safari: !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua), celular: true };
    if (/Android/i.test(ua)) return { so: "android", samsung: /SamsungBrowser/i.test(ua), celular: true };
    return { so: "otro", celular: false };
  };

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
  LE.ecualizador = (dominio, { vivo = false, detalle = true, cats = LE.CATS } = {}) => {
    const mapa = Object.fromEntries((dominio || []).map((d) => [d.categoria, d]));
    return `<div class="eq ${vivo ? "vivo" : ""}" role="list">` + cats.map((c) => {
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
    <article class="lectura ${plegable ? "plegada" : ""} ${t.tipologia === "situacion" ? "situacion" : ""}" id="lectura">
      <span class="tipo">${LE.esc(LE.TIPOS[t.tipologia] || "Lectura")}</span>
      <h2>${LE.esc(t.titulo)}</h2>
      ${LE.md(t.contenido)}
      ${LE.figura(t.figura, "Figura de la situación")}
      ${t.fuente ? `<p class="fuente">${LE.esc(t.fuente)}</p>` : ""}
    </article>
    ${plegable ? `<button class="btn suave chico plegar-lectura" data-accion="plegar">Mostrar lectura completa</button>` : ""}` : "";

  // ---------- Lógica: solución, diagnóstico del error y fichas ----------
  // Lo que se muestra después de responder una pregunta de lógica (en un reto,
  // en la revisión de un simulacro o en el cuaderno de errores).
  LE.diagnosticoError = (error) => {
    if (!error || !error.tipo) return "";
    const t = LE.tipoError(error.tipo);
    return `<div class="diag-error">
      <span class="etq-error">Qué pasó · ${LE.esc(t.nombre)}</span>
      ${error.nota ? `<p>${LE.esc(error.nota)}</p>` : ""}
      ${t.consejo ? `<p class="consejo">${LE.esc(t.consejo)}</p>` : ""}
    </div>`;
  };
  LE.pasosHTML = (pasos, { abierto = true, titulo = "Solución paso a paso" } = {}) => {
    if (!Array.isArray(pasos) || !pasos.length) return "";
    return `<details class="solucion" ${abierto ? "open" : ""}><summary>${LE.esc(titulo)}</summary><ol class="pasos">${pasos.map((p) => `<li>${LE.md(p)}</li>`).join("")}</ol></details>`;
  };
  LE.enlaceTecnica = (codigo) => {
    const t = LE.tecnica(codigo);
    return t ? `<button class="enlace pequeno tecnica-enlace" data-accion="verTecnica" data-cod="${LE.esc(t.codigo)}">Técnica: ${LE.esc(t.nombre)} · ver ficha</button>` : "";
  };
  LE.fichaHTML = (t) => `
    <article class="ficha cr-${LE.esc(t.categoria)}">
      <span class="etq">${LE.esc(LE.cat(t.categoria).nombre)}</span>
      <h2>${LE.esc(t.nombre)}</h2>
      ${t.cuando ? `<p class="sub"><b>Cuándo se usa.</b> ${LE.esc(t.cuando)}</p>` : ""}
      ${Array.isArray(t.pasos) && t.pasos.length ? `<div><h3>El procedimiento</h3><ol class="pasos">${t.pasos.map((p) => `<li>${LE.md(p)}</li>`).join("")}</ol></div>` : ""}
      ${t.ejemplo ? `<div class="ejemplo"><h3>Ejemplo resuelto</h3>${LE.md(t.ejemplo)}</div>` : ""}
      ${t.trampa ? `<div class="trampa"><h3>La trampa típica</h3><p>${LE.esc(t.trampa)}</p></div>` : ""}
    </article>`;
  LE.acciones.verTecnica = (b) => {
    const t = LE.tecnica(b.dataset.cod);
    if (t) LE.dialogo(`${LE.fichaHTML(t)}<div class="acciones" style="margin-top:1rem"><button class="btn" data-valor="ok">Cerrar</button></div>`);
  };
  // Barras con el reparto de errores por tipo. perfil = {tipo: cantidad}
  LE.perfilErrores = (perfil = {}) => {
    const filas = Object.entries(perfil).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
    const total = filas.reduce((a, [, n]) => a + n, 0);
    if (!total) return "";
    return `<div class="perfil-errores">${filas.map(([t, n]) => `
      <div class="pe-fila"><span class="pe-nombre">${LE.esc(LE.tipoError(t).nombre)}</span>
        <span class="pe-barra"><span style="width:${Math.round((100 * n) / total)}%"></span></span>
        <span class="pe-n">${n}</span></div>`).join("")}</div>`;
  };

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
