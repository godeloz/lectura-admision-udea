/* =====================================================================
   ENTRELÍNEAS · ARRANQUE
   Elige el servidor (Supabase o demo), maneja el ingreso, pinta la
   estructura y avisa cuando hay una versión nueva publicada.
   ===================================================================== */
(async function (LE) {
  const { esc, $ } = LE;
  const cfg = LE.cfg;
  const app = document.getElementById("app");

  const cargarScript = (src) => new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = () => mal(new Error("No se pudo cargar " + src));
    document.head.append(s);
  });

  // ---------- Servidor ----------
  try {
    if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) {
      if (!window.supabase) await cargarScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      LE.api = window.LE_ApiSupabase(cfg);
    } else {
      LE.api = window.LE_ApiDemo();
    }
  } catch (e) {
    app.innerHTML = `<div class="ingreso"><div class="ingreso-caja"><h1>No hay conexión</h1><p class="sub">${esc(e.message)}. Revisa tu internet y recarga la página.</p></div></div>`;
    return;
  }

  // ---------- Ingreso ----------
  function pintarIngreso(msg = "") {
    document.title = "Entrelíneas · Examen UdeA";
    if (location.hash === "#/salir") history.replaceState(null, "", location.pathname + location.search);
    app.innerHTML = `
      ${LE.api.modo === "demo" ? `<div class="banda demo">Modo demo: los datos viven solo en este navegador</div>` : ""}
      <div class="ingreso">
        <form class="ingreso-caja" id="f-ingreso" novalidate>
          <div class="ondas" aria-hidden="true">${LE.ondas(9)}</div>
          <h1 class="ingreso-marca">Entre<i>líneas</i></h1>
          <p class="sub">Práctica diaria de Competencia Lectora y Razonamiento Lógico para el examen de admisión de la Universidad de Antioquia.</p>
          <label class="campo">Correo<input name="usuario" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false" required placeholder="tu correo"></label>
          <label class="campo">Contraseña<input name="clave" type="password" autocomplete="current-password" required></label>
          <p class="error" id="error-ingreso" role="alert">${esc(msg)}</p>
          <button class="btn ancho">Entrar</button>
          ${LE.api.modo === "demo" ? `<div class="demo-caja">Para probar escribe un usuario en lugar del correo: estudiante <b>sofia</b> · tutor <b>tutor</b> · compañeros de grupo <b>mateo</b> y <b>valentina</b>. Contraseña de todos: <b>demo</b>.</div>` : `<p class="tenue pequeno">¿Olvidaste la contraseña? Pídele una nueva a tu tutor.</p>`}
        </form>
      </div>`;
    const f = $("#f-ingreso");
    f.usuario.focus();
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = f.querySelector("button");
      if (!f.usuario.value.trim() || !f.clave.value) { $("#error-ingreso").textContent = "Escribe tu correo y tu contraseña."; return; }
      btn.disabled = true; btn.textContent = "Entrando…";
      try { await arrancar(await LE.api.entrar(f.usuario.value, f.clave.value)); }
      catch (err) { $("#error-ingreso").textContent = err.message; btn.disabled = false; btn.textContent = "Entrar"; }
    });
  }

  // ---------- Estructura ----------
  // Con Lógica activada, cada componente tiene su propia entrada en la navegación.
  // «Grupo» aparece solo para quien está en al menos un grupo.
  const navEst = () => {
    const grupo = !LE.esTutor() && (LE.estado.grupos || []).length ? [["#/grupo", "🤝", "Grupo"]] : [];
    return LE.logicaActiva()
      ? [["#/inicio", "📖", "Lectura"], ["#/logica", "🧩", "Lógica"], ["#/simulacro", "⏱️", "Simulacro"], ...grupo, ["#/mensajes", "✉️", "Mensajes"], ["#/perfil", "👤", "Perfil"]]
      : [["#/inicio", "🏠", "Inicio"], ["#/simulacro", "⏱️", "Simulacro"], ...grupo, ["#/mensajes", "✉️", "Mensajes"], ["#/perfil", "👤", "Perfil"]];
  };
  const NAV_TUT = [["#/tutor", "📊", "Estudiantes"], ["#/tutor/personas", "👥", "Personas"], ["#/tutor/contenido", "📚", "Contenido"], ["#/practicar", "🎯", "Practicar"], ["#/salir", "🚪", "Salir"]];

  LE.recargarConfig = async () => {
    const [c, ins, tec, grupos] = await Promise.all([LE.api.config(), LE.api.insignias(), LE.api.tecnicas().catch(() => []), LE.api.misGrupos ? LE.api.misGrupos().catch(() => []) : []]);
    LE.estado.config = c; LE.estado.insignias = ins; LE.estado.tecnicas = tec || []; LE.estado.grupos = grupos || [];
  };

  // Pinta la barra, la navegación y las franjas de aviso. Se vuelve a llamar al
  // entrar o salir del modo práctica del tutor. «destino» es la pantalla a mostrar.
  LE.pintarEstructura = async (destino = null) => {
    const tutor = LE.comoTutor();
    const nav = tutor ? NAV_TUT : navEst();
    document.title = tutor ? "Tutoría · Entrelíneas" : "Entrelíneas · Examen UdeA";
    const version = document.querySelector(".banda.version");
    app.innerHTML = `
      <div id="bandas">
        ${LE.api.modo === "demo" ? `<div class="banda demo">Modo demo: los datos viven solo en este navegador</div>` : ""}
        ${LE.enPractica() ? `<div class="banda practica"><span>🎯 Modo práctica: usas la app como estudiante. Nada de esto aparece en tu panel.</span><button type="button" data-accion="salirPractica">Volver al panel</button></div>` : ""}
        ${LE.bandaInstalar()}
      </div>
      <header class="barra"><div class="barra-in">
        <a class="marca" href="${LE.inicioPorRol()}" aria-label="Entrelíneas, inicio">Entre<i>líneas</i></a>
        <nav class="nav ${nav.length > 5 ? "seis" : ""}" aria-label="Principal">
          ${nav.map(([h, i, t]) => `<a href="${h}"><span class="ico" aria-hidden="true">${i}</span>${t}${h === "#/mensajes" ? '<span class="punto" hidden></span>' : ""}</a>`).join("")}
        </nav>
      </div></header>
      <main id="vista" tabindex="-1"></main>`;
    if (version) $("#bandas").append(version);
    if (destino) history.replaceState(null, "", location.pathname + location.search + destino);
    else if (location.hash === "#/salir" || location.hash === "#/practicar") history.replaceState(null, "", location.pathname + location.search);
    window.onhashchange = LE.navegar;
    await LE.navegar();
  };

  async function arrancar(perfil) {
    if (perfil.activo === false) {
      await LE.api.salir();
      return pintarIngreso("Esta cuenta está desactivada. Habla con tu tutor.");
    }
    LE.estado.perfil = perfil;
    // Primer ingreso: la persona elige su contraseña (y, en el celular, instala la app).
    if (perfil.debe_cambiar_clave) await LE.primerIngreso(perfil);
    await LE.recargarConfig();
    if (LE.instalada()) LE.api.marcarInstalada?.().catch(() => {});
    await LE.pintarEstructura();
    if (!LE.comoTutor()) {
      LE.cronometro.iniciar();
      if (!LE.esTutor()) mostrarNovedades(perfil).catch(console.warn);
    }
    vigilarVersion();
  }

  LE.actualizarPunto = async (msgs) => {
    const p = document.querySelector(".nav .punto");
    if (!p || LE.comoTutor()) return;
    try {
      msgs = msgs || await LE.api.mensajes();
      p.hidden = !msgs.some((m) => !m.leido || (m.tipo === "mision" && !m.completado));
    } catch (e) { /* no es crítico */ }
  };

  async function mostrarNovedades(perfil) {
    const nov = (await LE.api.novedadesPendientes(perfil.ultima_novedad)).slice(-3);
    if (!nov.length) return;
    await LE.dialogo(`<div class="pila">
      <div class="ondas" aria-hidden="true">${LE.ondas(7)}</div>
      ${nov.map((n) => `<div class="pila" style="--pila:.4rem"><h2>${esc(n.titulo)}</h2><p class="sub" style="white-space:pre-line">${esc(n.cuerpo)}</p></div>`).join("")}
      <div class="acciones"><button class="btn" data-valor="ok">Entendido</button></div>
    </div>`);
    await LE.api.marcarNovedades();
  }

  // ---------- Salir ----------
  LE.ruta("/salir", () => LE.acciones.salir());
  LE.acciones.salir = async () => {
    LE.cronometro.detener();
    window.onhashchange = null;
    await LE.api.salir();
    LE.fijarPractica(false);
    LE.estado = { perfil: null, config: {}, insignias: [], tecnicas: [], grupos: [], sesion: null };
    history.replaceState(null, "", location.pathname + location.search);
    pintarIngreso();
  };

  // ---------- Aviso de versión nueva ----------
  // Al publicar cambios en GitHub se sube VERSION en js/config.js y en version.json.
  // Quien tenga la app abierta con la versión anterior ve un aviso para recargar.
  let vigilando = false;
  function vigilarVersion() {
    if (vigilando || location.protocol === "file:") return;
    vigilando = true;
    const revisar = async () => {
      try {
        const r = await fetch("version.json?t=" + Date.now(), { cache: "no-store" });
        if (!r.ok) return;
        const { version, notas } = await r.json();
        if (version && version !== cfg.VERSION && !$(".banda.version")) {
          const b = document.createElement("div");
          b.className = "banda version";
          b.innerHTML = `<span>Hay una versión nueva de la app${notas ? ": " + esc(notas) : ""}.</span><button type="button">Actualizar</button>`;
          b.querySelector("button").onclick = () => location.reload();
          $("#bandas")?.append(b);
        }
      } catch (e) { /* sin red o sin archivo: no pasa nada */ }
    };
    revisar();
    setInterval(revisar, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") revisar(); });
  }

  // ---------- Instalación ----------
  // Un service worker mínimo: no guarda nada en caché (para que siempre llegue la
  // versión publicada) y solo muestra una página amable cuando no hay conexión.
  // Además, es lo que Android pide para ofrecer «Instalar aplicación».
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* sin service worker la app funciona igual */ });
  }

  // ---------- Inicio ----------
  try {
    const perfil = await LE.api.sesionActual();
    if (perfil && location.hash === "#/salir") { await LE.api.salir(); pintarIngreso(); }
    else if (perfil) await arrancar(perfil); else pintarIngreso();
  } catch (e) {
    console.error(e);
    pintarIngreso(e.message);
  }
})(window.LE);
