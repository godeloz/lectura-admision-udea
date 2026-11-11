/* =====================================================================
   ENTRELÍNEAS · CUENTAS, INSTALACIÓN Y COMUNIDAD (versión 1.2.0)
     · primer ingreso: cambiar la contraseña temporal e instalar la app
     · instrucciones para instalar la app en el celular (#/instalar)
     · Personas y Grupos, del tutor (#/tutor/personas, #/tutor/personas/grupos)
     · la semana de un grupo (#/grupo)
     · modo práctica del tutor (#/practicar)
   ===================================================================== */
(function (LE) {
  const { esc, $, $$ } = LE;
  const A = LE.acciones;
  const primerNombre = (n) => String(n || "").trim().split(/\s+/)[0] || "";
  const urlApp = () => location.href.split("#")[0].split("?")[0];

  // =================================================================
  //  INSTALAR LA APP EN EL CELULAR
  // =================================================================
  // El ícono de «Compartir» de Safari, dibujado para reconocerlo en pantalla.
  const ICO_COMPARTIR = `<svg class="ico-ui" viewBox="0 0 24 24" aria-label="botón Compartir"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const ICO_MENU = `<span class="ico-ui texto" aria-label="menú de tres puntos">⋮</span>`;
  const pasos = (lista) => `<ol class="pasos-instalar">${lista.map((p) => `<li><span>${p}</span></li>`).join("")}</ol>`;

  const pasosIOS = () => pasos([
    `Toca el botón <b>Compartir</b> ${ICO_COMPARTIR} en la barra de Safari. Si no lo ves, toca primero <b>«⋯»</b>.`,
    `Desliza la lista y toca <b>«Agregar a inicio»</b> (puede decir «Agregar a pantalla de inicio»).`,
    `Toca <b>«Agregar»</b>, arriba a la derecha.`,
    `Abre <b>Entrelíneas</b> desde el ícono nuevo. La primera vez te pide entrar otra vez con tu correo y tu contraseña.`
  ]);
  const pasosAndroid = (samsung = false) => pasos(samsung ? [
    `Toca el menú <b>≡</b>, abajo a la derecha.`,
    `Toca <b>«Añadir página a»</b> y después <b>«Pantalla de inicio»</b>.`,
    `Confirma con <b>«Añadir»</b>.`,
    `Abre <b>Entrelíneas</b> desde el ícono nuevo.`
  ] : [
    `Toca el menú ${ICO_MENU}, arriba a la derecha de Chrome.`,
    `Toca <b>«Instalar aplicación»</b> (o «Agregar a la pantalla principal»).`,
    `Confirma con <b>«Instalar»</b>.`,
    `Abre <b>Entrelíneas</b> desde el ícono nuevo.`
  ]);
  const cajaEnlace = () => `<div class="enlace-app"><code>${esc(urlApp())}</code><button type="button" class="btn suave chico" data-accion="copiarEnlace">Copiar enlace</button></div>`;

  // Las instrucciones que le sirven al teléfono que la persona tiene en la mano.
  LE.instruccionesInstalar = () => {
    if (LE.instalada()) return `<div class="instalada-ok"><b>✓ Ya estás usando la app instalada.</b><p class="sub">Ábrela siempre desde el ícono de Entrelíneas en tu pantalla de inicio.</p></div>`;
    const d = LE.dispositivo();
    if (d.so === "ios") return d.safari ? pasosIOS() : `
      <p class="sub">Estás en otro navegador. En iPhone la forma más segura es <b>Safari</b>: copia el enlace, ábrelo en Safari y sigue estos pasos.</p>
      ${cajaEnlace()}
      ${pasosIOS()}
      <p class="tenue pequeno">En Chrome para iPhone también se puede: botón Compartir junto a la dirección → «Agregar a inicio».</p>`;
    if (d.so === "android") return `
      ${LE.instalador ? `<button type="button" class="btn ancho grande" data-accion="instalarAhora">📲 Instalar Entrelíneas</button>
        <p class="tenue pequeno">Si el botón no responde, hazlo desde el menú:</p>` : ""}
      ${pasosAndroid(d.samsung)}`;
    return `
      <p class="sub">Esto se hace en el celular. Abre este enlace en el navegador de tu teléfono y sigue los pasos que te muestra la app:</p>
      ${cajaEnlace()}
      <details class="otros-pasos"><summary>Ver los pasos para iPhone</summary>${pasosIOS()}</details>
      <details class="otros-pasos"><summary>Ver los pasos para Android</summary>${pasosAndroid()}</details>`;
  };
  // Si Android ofrece su instalador después de pintar la pantalla, se repinta.
  document.addEventListener("le-instalador", () => { const c = $("#caja-instalar"); if (c) c.innerHTML = LE.instruccionesInstalar(); });

  A.instalarAhora = async (b) => {
    const ev = LE.instalador;
    if (!ev) return;
    b.disabled = true;
    try {
      ev.prompt();
      const r = await ev.userChoice;
      LE.instalador = null;
      if (r.outcome === "accepted") { LE.aviso("Listo: busca el ícono de Entrelíneas en tu pantalla de inicio"); LE.api.marcarInstalada?.().catch(() => {}); }
      const c = $("#caja-instalar"); if (c) c.innerHTML = LE.instruccionesInstalar();
    } catch (e) { b.disabled = false; }
  };
  A.copiarEnlace = (b) => copiar(urlApp(), b, "Enlace copiado");

  async function copiar(texto, b, aviso = "Copiado") {
    try { await navigator.clipboard.writeText(texto); }
    catch (e) {
      const t = document.createElement("textarea");
      t.value = texto; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      (b?.closest("dialog") || document.body).append(t); t.select();
      try { document.execCommand("copy"); } catch (e2) { /* sin portapapeles */ }
      t.remove();
    }
    LE.aviso(aviso);
  }

  LE.ruta("/instalar", () => {
    LE.montar(`<div class="pila" style="max-width:36rem;margin:0 auto;--pila:1.25rem">
      <div class="pila" style="--pila:.3rem">
        <h1>La app en tu celular</h1>
        <p class="sub">Instalada se abre con un toque desde la pantalla de inicio, a pantalla completa, como cualquier otra app. No ocupa casi espacio y no hay que buscarla en ninguna tienda.</p>
      </div>
      <section class="panel" id="caja-instalar">${LE.instruccionesInstalar()}</section>
      <a class="btn sec" href="${LE.inicioPorRol()}">Volver</a>
    </div>`);
  });

  // La franja de arriba: aparece en el celular mientras la app no esté instalada.
  // Se puede esconder tres días; después vuelve.
  LE.bandaInstalar = () => {
    if (LE.instalada() || !LE.dispositivo().celular) return "";
    try { if (Date.now() < +(localStorage.getItem("le-instalar-oculto") || 0)) return ""; } catch (e) { }
    return `<div class="banda instalar"><span>📲 Instala la app en tu celular</span><a href="#/instalar">Ver cómo</a><button type="button" data-accion="ocultarInstalar" aria-label="Esconder por tres días">✕</button></div>`;
  };
  A.ocultarInstalar = (b) => {
    try { localStorage.setItem("le-instalar-oculto", String(Date.now() + 3 * 86400e3)); } catch (e) { }
    b.closest(".banda")?.remove();
  };

  // =================================================================
  //  PRIMER INGRESO: contraseña propia y, en el celular, instalar
  // =================================================================
  // Pinta pantallas completas dentro de #app y se resuelve al terminar.
  LE.primerIngreso = (perfil) => new Promise((listo) => {
    const app = document.getElementById("app");
    app.innerHTML = `
      ${LE.api.modo === "demo" ? `<div class="banda demo">Modo demo: los datos viven solo en este navegador</div>` : ""}
      <div class="ingreso">
        <form class="ingreso-caja" id="f-clave" novalidate>
          <div class="ondas" aria-hidden="true">${LE.ondas(9)}</div>
          <h1 class="ingreso-marca">Entre<i>líneas</i></h1>
          <div class="pila" style="--pila:.4rem">
            <h2>Hola, ${esc(primerNombre(perfil.nombre))}</h2>
            <p class="sub">Entraste con una contraseña temporal. Elige ahora la tuya: es la que vas a usar cada vez que entres.</p>
          </div>
          ${camposClave()}
          <p class="error" id="error-clave" role="alert"></p>
          <button class="btn ancho">Guardar mi contraseña</button>
          <button type="button" class="enlace pequeno" data-accion="salir">¿No eres ${esc(primerNombre(perfil.nombre))}? Salir</button>
        </form>
      </div>`;
    const f = $("#f-clave");
    activarCamposClave(f);
    f.nueva.focus();
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = validarClave(f);
      if (err) { $("#error-clave").textContent = err; return; }
      const btn = f.querySelector("button.btn");
      btn.disabled = true; btn.textContent = "Guardando…";
      try {
        await LE.api.cambiarMiClave(f.nueva.value);
        perfil.debe_cambiar_clave = false;
        if (LE.instalada()) return listo();
        pasoInstalar(app, listo);
      } catch (ex) { $("#error-clave").textContent = ex.message; btn.disabled = false; btn.textContent = "Guardar mi contraseña"; }
    });
  });

  function pasoInstalar(app, listo) {
    app.innerHTML = `
      ${LE.api.modo === "demo" ? `<div class="banda demo">Modo demo: los datos viven solo en este navegador</div>` : ""}
      <div class="ingreso">
        <div class="ingreso-caja">
          <div class="pila" style="--pila:.4rem">
            <span class="paso-etq">Último paso</span>
            <h1>Instala la app en tu celular</h1>
            <p class="sub">Así la abres con un toque desde tu pantalla de inicio, como cualquier otra app. Toma menos de un minuto.</p>
          </div>
          <div class="panel" id="caja-instalar">${LE.instruccionesInstalar()}</div>
          <div class="pila" style="--pila:.6rem">
            <button class="btn ancho" id="b-instalada">Ya la instalé</button>
            <button class="btn sec ancho" id="b-despues">Lo hago después</button>
            <p class="tenue pequeno">Siempre puedes volver a ver estos pasos en tu perfil.</p>
          </div>
        </div>
      </div>`;
    $("#b-instalada").onclick = () => listo();
    $("#b-despues").onclick = () => listo();
  }

  // ---------- Contraseña: campos y validación compartidos ----------
  const camposClave = () => `
    <label class="campo">Contraseña nueva<input name="nueva" type="password" autocomplete="new-password" minlength="8" maxlength="72" required></label>
    <label class="campo">Escríbela otra vez<input name="repetir" type="password" autocomplete="new-password" minlength="8" maxlength="72" required></label>
    <label class="check"><input type="checkbox" name="ver"> Mostrar lo que escribo</label>
    <p class="tenue pequeno">Al menos 8 caracteres. Una frase corta que recuerdes sirve, por ejemplo «mi perro come mango».</p>`;
  const activarCamposClave = (f) => f.ver.addEventListener("change", () => { f.nueva.type = f.repetir.type = f.ver.checked ? "text" : "password"; });
  const validarClave = (f) => {
    if (f.nueva.value.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (!f.nueva.value.trim()) return "La contraseña no puede ser solo espacios.";
    if (f.nueva.value !== f.repetir.value) return "Las dos contraseñas no coinciden.";
    return "";
  };

  A.cambiarClave = async () => {
    let nueva = null;
    const v = await LE.dialogo(`
      <form class="pila" method="dialog" id="f-cambio" novalidate>
        <h2>Cambiar mi contraseña</h2>
        ${camposClave()}
        <p class="error" id="error-cambio" role="alert"></p>
        <div class="acciones"><button class="btn sec" type="button" data-valor="">Cancelar</button><button class="btn" value="ok">Guardar</button></div>
      </form>`, {
      alAbrir: (d) => {
        const f = d.querySelector("#f-cambio");
        activarCamposClave(f);
        f.addEventListener("submit", (e) => {
          const err = validarClave(f);
          if (err) { e.preventDefault(); d.querySelector("#error-cambio").textContent = err; return; }
          nueva = f.nueva.value;
        });
      }
    });
    if (v !== "ok" || !nueva) return;
    try { await LE.api.cambiarMiClave(nueva); LE.aviso("Contraseña cambiada"); }
    catch (e) { LE.error(e); }
  };

  // =================================================================
  //  MODO PRÁCTICA DEL TUTOR
  // =================================================================
  // El tutor usa la app como estudiante, con su propia cuenta. Lo que haga
  // no aparece en el panel, en las alertas ni en los grupos.
  LE.ruta("/practicar", async () => {
    LE.fijarPractica(true);
    LE.cronometro.iniciar();
    await LE.pintarEstructura(LE.COMP[LE.compActual()].ruta);
  }, { tutor: true });
  A.salirPractica = async () => {
    LE.fijarPractica(false);
    LE.cronometro.detener();
    LE.estado.sesion = null;
    document.body.classList.remove("en-sesion");
    await LE.pintarEstructura("#/tutor");
  };
  A.borrarPractica = async () => {
    if (!(await LE.confirmar("¿Borrar tu práctica?", "Se borran tus respuestas, retos, simulacros, insignias y XP de práctica. Nada de esto toca a tus estudiantes.", "Borrar todo"))) return;
    try { await LE.api.borrarMiPractica(); LE.aviso("Tu práctica quedó en cero"); LE.navegar(); }
    catch (e) { LE.error(e); }
  };

  // =================================================================
  //  PERSONAS (tutor)
  // =================================================================
  const pestanas = (activa) => `<nav class="segmentos" aria-label="Personas y grupos">
      <a href="#/tutor/personas" aria-current="${activa === "personas" ? "page" : "false"}">Personas</a>
      <a href="#/tutor/personas/grupos" aria-current="${activa === "grupos" ? "page" : "false"}">Grupos</a>
    </nav>`;

  LE.ruta("/tutor/personas", async () => {
    LE.cargando();
    const [gente, grupos] = await Promise.all([LE.api.personas(), LE.api.misGrupos()]);
    LE.estado.gente = gente; LE.estado.grupos = grupos;
    const ests = gente.filter((p) => p.rol === "estudiante");
    const activas = ests.filter((p) => p.activo);
    const yo = gente.find((p) => p.yo);
    LE.montar(`
      <div class="pila" style="--pila:1.5rem">
        <div class="fila entre">
          <div class="pila" style="--pila:.3rem">
            <h1>Personas</h1>
            <p class="sub">${activas.length === 1 ? "1 estudiante activo" : activas.length + " estudiantes activos"}${ests.length > activas.length ? ` · ${ests.length - activas.length} ${ests.length - activas.length === 1 ? "desactivado" : "desactivados"}` : ""} · ${grupos.length === 1 ? "1 grupo" : grupos.length + " grupos"}</p>
          </div>
          ${pestanas("personas")}
        </div>

        <section class="panel pila" style="--pila:.9rem">
          <h2>Agregar una persona</h2>
          <form class="pila" style="--pila:.8rem" id="f-persona" novalidate>
            <div class="dos-campos">
              <label class="campo">Nombre<input name="nombre" maxlength="60" required placeholder="Ej.: Laura Restrepo" autocomplete="off"></label>
              <label class="campo">Correo<input name="correo" type="email" inputmode="email" autocapitalize="none" spellcheck="false" required placeholder="laura@gmail.com" autocomplete="off"></label>
            </div>
            ${grupos.length ? `<label class="campo">Grupo (opcional)<select name="grupo"><option value="">Sin grupo</option>${grupos.map((g) => `<option value="${g.id}">${esc(g.emoji)} ${esc(g.nombre)}</option>`).join("")}</select></label>` : ""}
            <p class="error" id="error-persona" role="alert"></p>
            <div class="fila entre">
              <p class="tenue pequeno" style="max-width:32rem">La app le asigna una contraseña temporal y te la muestra para que se la envíes. Al entrar por primera vez, elige la suya.</p>
              <button class="btn">Crear cuenta</button>
            </div>
          </form>
        </section>

        <section class="pila" style="--pila:.75rem">
          <div class="titulo-seccion"><h2>Cuentas</h2><span class="sub pequeno">Toca un nombre para ver su avance</span></div>
          <div class="personas">${gente.map(tarjetaPersona).join("")}</div>
        </section>

        ${yo ? `<section class="panel pila" style="--pila:.6rem">
          <h2>Tu cuenta</h2>
          <p class="sub">Entras con <b style="color:var(--texto)">${esc(yo.correo || yo.usuario)}</b>.</p>
          <div class="fila"><button class="btn sec chico" data-accion="cambiarClave">Cambiar mi contraseña</button><a class="btn suave chico" href="#/instalar">Instalar la app en tu celular</a></div>
        </section>` : ""}
      </div>`);

    const f = $("#f-persona");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = f.querySelector("button.btn");
      const nombre = f.nombre.value.trim(), correo = f.correo.value.trim();
      if (!nombre || !correo) { $("#error-persona").textContent = "Escribe el nombre y el correo."; return; }
      btn.disabled = true; btn.textContent = "Creando…";
      try {
        const d = await LE.api.crearUsuario(nombre, correo, f.grupo?.value || null);
        await LE.credenciales(d, true);
        LE.navegar();
      } catch (ex) { $("#error-persona").textContent = ex.message; btn.disabled = false; btn.textContent = "Crear cuenta"; }
    });
  }, { tutor: true });

  function tarjetaPersona(p) {
    const tutor = p.rol === "tutor";
    const estados = [
      !p.activo ? `<span class="estado apagado">Desactivada</span>` : "",
      p.activo && p.debe_cambiar_clave ? `<span class="estado pendiente" title="Todavía entra con la contraseña temporal">⏳ Aún no elige su contraseña</span>` : "",
      p.instalada ? `<span class="estado ok">📲 App instalada</span>` : (!tutor && p.activo ? `<span class="estado">Sin instalar</span>` : "")
    ].join("");
    return `<article class="persona ${p.activo ? "" : "inactiva"}">
      <span class="av" aria-hidden="true">${esc(p.avatar)}</span>
      <div class="pila" style="--pila:.35rem">
        <div class="fila" style="gap:.5rem">
          ${!tutor && p.activo ? `<a href="#/tutor/estudiante/${p.id}"><b>${esc(p.nombre)}</b></a>` : `<b>${esc(p.nombre)}</b>`}
          ${tutor ? `<span class="etq cr-violeta">Tutor${p.yo ? " · tú" : ""}</span>` : ""}
          <span class="tenue pequeno">${esc(p.correo || "@" + p.usuario)}</span>
        </div>
        <div class="fila estados" style="gap:.4rem">
          ${(p.grupos || []).map((g) => `<span class="estado grupo">${esc(g.emoji)} ${esc(g.nombre)}</span>`).join("")}
          ${estados}
          ${!tutor ? `<span class="tenue pequeno">Última práctica: ${esc(LE.hace(p.ultima_actividad))}</span>` : ""}
        </div>
        ${!tutor ? `<div class="fila" style="gap:.5rem">
          ${p.activo ? `<button class="btn suave chico" data-accion="nuevaClave" data-id="${p.id}">Contraseña nueva</button>` : ""}
          <button class="btn ${p.activo ? "sec" : "suave"} chico" data-accion="estadoPersona" data-id="${p.id}" data-activo="${p.activo ? "0" : "1"}">${p.activo ? "Desactivar" : "Activar"}</button>
        </div>` : ""}
      </div>
    </article>`;
  }

  // El mensaje listo para enviar con los datos de entrada.
  const mensajeEntrada = (d, nueva) => [
    `Hola ${primerNombre(d.nombre)}, ${nueva ? "te creé una cuenta en Entrelíneas para practicar el examen de admisión de la UdeA." : "te puse una contraseña temporal nueva en Entrelíneas."}`,
    "",
    `1. Abre este enlace en tu celular: ${urlApp()}`,
    `2. Entra con tu correo: ${d.correo || d.usuario}`,
    `   Contraseña temporal: ${d.clave}`,
    `3. La app te pedirá elegir tu propia contraseña.`,
    ...(nueva ? [`4. Después instálala en tu celular: la misma app te muestra cómo.`] : [])
  ].join("\n");

  // Muestra la contraseña temporal una sola vez, con el mensaje para enviarla.
  LE.credenciales = (d, nueva) => {
    const msg = mensajeEntrada(d, nueva);
    return LE.dialogo(`
      <div class="pila" style="--pila:1rem">
        <div class="pila" style="--pila:.3rem">
          <h2>${nueva ? "Cuenta creada" : "Contraseña nueva"}</h2>
          <p class="sub">Envíale estos datos a ${esc(primerNombre(d.nombre))}. <b style="color:var(--amarillo)">La contraseña temporal solo se muestra ahora.</b></p>
        </div>
        <div class="credenciales">
          <div><span class="tenue pequeno">Correo para entrar</span><b>${esc(d.correo || d.usuario)}</b></div>
          <div><span class="tenue pequeno">Contraseña temporal</span><b class="clave">${esc(d.clave)}</b></div>
        </div>
        <label class="campo"><span class="sub pequeno">Mensaje listo para enviar</span><textarea readonly class="mensaje-listo">${esc(msg)}</textarea></label>
        <div class="acciones" style="justify-content:flex-start">
          <a class="btn" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Enviar por WhatsApp</a>
          <button type="button" class="btn sec" data-accion="copiarMensaje">Copiar mensaje</button>
        </div>
        <div class="acciones"><button class="btn suave" data-valor="ok">Listo</button></div>
      </div>`, { cerrable: false, alAbrir: (dlg) => { dlg.querySelector(".mensaje-listo").dataset.msg = msg; } });
  };
  A.copiarMensaje = (b) => copiar(b.closest("dialog").querySelector(".mensaje-listo").dataset.msg, b, "Mensaje copiado");

  A.nuevaClave = async (b) => {
    const p = (LE.estado.gente || []).find((x) => x.id === b.dataset.id);
    if (!(await LE.confirmar("¿Contraseña temporal nueva?", `${esc(p?.nombre || "")} deja de poder entrar con su contraseña actual. La app le pedirá elegir una nueva la próxima vez que entre.`, "Crear contraseña nueva"))) return;
    try { const d = await LE.api.restablecerClave(b.dataset.id); await LE.credenciales(d, false); LE.navegar(); }
    catch (e) { LE.error(e); }
  };
  A.estadoPersona = async (b) => {
    const activar = b.dataset.activo === "1";
    const p = (LE.estado.gente || []).find((x) => x.id === b.dataset.id);
    if (!activar && !(await LE.confirmar(`¿Desactivar a ${esc(p?.nombre || "")}?`, "No podrá entrar y sale de tu panel, de las alertas y de sus grupos. No se borra nada: si la activas otra vez, vuelve con todo su progreso.", "Desactivar"))) return;
    try { await LE.api.cambiarEstadoUsuario(b.dataset.id, activar); LE.aviso(activar ? "Cuenta activada" : "Cuenta desactivada"); LE.navegar(); }
    catch (e) { LE.error(e); }
  };

  // =================================================================
  //  GRUPOS (tutor)
  // =================================================================
  const EMOJIS = ["👥", "🎨", "📚", "🧩", "🚀", "🌱", "🔥", "🎧", "🦉", "⭐", "🎭", "🎵", "🧠", "🌙", "🏔️", "🌊"];

  LE.ruta("/tutor/personas/grupos", async () => {
    LE.cargando();
    const [grupos, gente] = await Promise.all([LE.api.misGrupos(), LE.api.personas()]);
    LE.estado.grupos = grupos; LE.estado.gente = gente;
    LE.montar(`
      <div class="pila" style="--pila:1.5rem">
        <div class="fila entre">
          <div class="pila" style="--pila:.3rem">
            <h1>Grupos</h1>
            <p class="sub">${grupos.length === 1 ? "1 grupo" : grupos.length + " grupos"}</p>
          </div>
          ${pestanas("grupos")}
        </div>
        <section class="panel pila" style="--pila:.6rem">
          <p class="sub">Quien está en un grupo ve la <b style="color:var(--texto)">semana del grupo</b>: XP ganado desde el lunes, días con práctica, racha y lo que hacen sus compañeros (retos terminados, simulacros, insignias). Nunca ve sus respuestas, sus errores ni tus mensajes. La tabla se reinicia cada lunes.</p>
          <div><button class="btn" data-accion="editarGrupo">Crear un grupo</button></div>
        </section>
        ${grupos.length ? `<div class="grupos">${grupos.map((g) => `
          <article class="grupo-tarjeta">
            <span class="av" aria-hidden="true">${esc(g.emoji)}</span>
            <div class="pila" style="--pila:.35rem">
              <b>${esc(g.nombre)}</b>
              ${g.descripcion ? `<p class="sub pequeno">${esc(g.descripcion)}</p>` : ""}
              <div class="fila estados" style="gap:.4rem">
                <span class="estado">${g.n === 1 ? "1 persona" : g.n + " personas"}</span>
                <span class="estado ${g.ver_simulacros ? "pendiente" : ""}">${g.ver_simulacros ? "Muestra puntajes de simulacro" : "Solo esfuerzo"}</span>
              </div>
              <div class="fila" style="gap:.5rem">
                <a class="btn suave chico" href="#/grupo/${g.id}">Ver su semana</a>
                <button class="btn sec chico" data-accion="miembrosGrupo" data-id="${g.id}">Personas del grupo</button>
                <button class="btn sec chico" data-accion="editarGrupo" data-id="${g.id}">Editar</button>
              </div>
            </div>
          </article>`).join("")}</div>`
        : `<div class="panel vacio"><p>Todavía no hay grupos. Crea uno y agrega a las personas que quieres que practiquen juntas.</p></div>`}
      </div>`);
  }, { tutor: true });

  A.editarGrupo = async (b) => {
    const g = (LE.estado.grupos || []).find((x) => x.id === b.dataset.id) || { emoji: "👥", ver_simulacros: false };
    let datos = null, emoji = g.emoji;
    const v = await LE.dialogo(`
      <form class="pila" method="dialog" id="f-grupo" novalidate>
        <h2>${g.id ? "Editar grupo" : "Crear un grupo"}</h2>
        <label class="campo">Nombre<input name="nombre" maxlength="50" required value="${esc(g.nombre || "")}" placeholder="Ej.: Artes UdeA"></label>
        <label class="campo">Descripción (opcional)<input name="descripcion" maxlength="120" value="${esc(g.descripcion || "")}" placeholder="Ej.: Nos preparamos para Artes plásticas"></label>
        <div class="campo"><span>Ícono</span><div class="avatares">${EMOJIS.map((x) => `<button type="button" aria-pressed="${x === emoji}" data-av="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
        <label class="check"><input type="checkbox" name="ver" ${g.ver_simulacros ? "checked" : ""}> Mostrar los puntajes de simulacro entre compañeros</label>
        <p class="tenue pequeno">Sin marcar, el grupo compara solo esfuerzo. Márcalo si el grupo ya se tiene confianza: ver puntajes motiva a unos y desanima a otros.</p>
        <p class="error" id="error-grupo" role="alert"></p>
        <div class="acciones">
          ${g.id ? `<button class="btn suave" type="button" data-valor="eliminar" style="margin-right:auto">Eliminar grupo</button>` : ""}
          <button class="btn sec" type="button" data-valor="">Cancelar</button><button class="btn" value="ok">Guardar</button>
        </div>
      </form>`, {
      alAbrir: (d) => {
        const f = d.querySelector("#f-grupo");
        f.querySelector(".avatares").addEventListener("click", (e) => {
          const x = e.target.closest("[data-av]"); if (!x) return;
          emoji = x.dataset.av;
          $$("[data-av]", f).forEach((y) => y.setAttribute("aria-pressed", y === x));
        });
        f.addEventListener("submit", (e) => {
          if (!f.nombre.value.trim()) { e.preventDefault(); d.querySelector("#error-grupo").textContent = "Escribe el nombre del grupo."; return; }
          datos = { id: g.id, nombre: f.nombre.value, descripcion: f.descripcion.value, emoji, ver_simulacros: f.ver.checked };
        });
      }
    });
    try {
      if (v === "eliminar") {
        if (!(await LE.confirmar(`¿Eliminar «${esc(g.nombre)}»?`, "Se borra el grupo y quiénes estaban en él. El progreso de cada persona no se toca.", "Eliminar"))) return;
        await LE.api.eliminarGrupo(g.id); LE.aviso("Grupo eliminado"); return LE.navegar();
      }
      if (v !== "ok" || !datos) return;
      const id = await LE.api.guardarGrupo(datos);
      LE.aviso(g.id ? "Grupo guardado" : "Grupo creado");
      if (!g.id) { await LE.navegar(); return A.miembrosGrupo({ dataset: { id } }); }
      LE.navegar();
    } catch (e) { LE.error(e); }
  };

  A.miembrosGrupo = async (b) => {
    const grupos = LE.estado.grupos?.some((g) => g.id === b.dataset.id) ? LE.estado.grupos : await LE.api.misGrupos();
    const g = grupos.find((x) => x.id === b.dataset.id);
    const gente = (LE.estado.gente || await LE.api.personas()).filter((p) => p.rol === "estudiante" && p.activo);
    if (!g) return;
    let ids = null;
    const dentro = new Set(g.miembros || []);
    const v = await LE.dialogo(`
      <form class="pila" method="dialog" id="f-miembros">
        <h2>${esc(g.emoji)} ${esc(g.nombre)}</h2>
        <p class="sub">Marca a quienes están en este grupo.</p>
        ${gente.length ? `<div class="lista-check">${gente.map((p) => `
          <label class="check"><input type="checkbox" value="${p.id}" ${dentro.has(p.id) ? "checked" : ""}> <span aria-hidden="true">${esc(p.avatar)}</span> ${esc(p.nombre)} <span class="tenue pequeno">${esc(p.correo || "")}</span></label>`).join("")}</div>`
        : `<p class="sub">Todavía no hay estudiantes. Créalos en Personas.</p>`}
        <div class="acciones"><button class="btn sec" type="button" data-valor="">Cancelar</button><button class="btn" value="ok">Guardar</button></div>
      </form>`, {
      alAbrir: (d) => d.querySelector("#f-miembros").addEventListener("submit", (e) => { ids = $$("input[type=checkbox]:checked", e.target).map((x) => x.value); })
    });
    if (v !== "ok" || !ids) return;
    try { const n = await LE.api.fijarMiembros(g.id, ids); LE.aviso(`El grupo quedó con ${n} ${n === 1 ? "persona" : "personas"}`); LE.navegar(); }
    catch (e) { LE.error(e); }
  };

  // =================================================================
  //  LA SEMANA DE UN GRUPO (lo ven sus miembros y el tutor)
  // =================================================================
  LE.ruta("/grupo", async () => {
    const grupos = await LE.api.misGrupos();
    LE.estado.grupos = grupos;
    if (!grupos.length) {
      return LE.montar(`<div class="vacio"><h2>Todavía no estás en un grupo</h2><p>Cuando tu tutor te agregue a uno, aquí vas a ver cómo va la semana de tus compañeros.</p></div>`);
    }
    let ult = null;
    try { ult = sessionStorage.getItem("le-grupo"); } catch (e) { }
    const g = grupos.find((x) => x.id === ult) || grupos[0];
    location.replace("#/grupo/" + g.id);
  });

  LE.ruta("/grupo/:id", async ({ id }) => {
    LE.cargando();
    const [d, grupos] = await Promise.all([LE.api.grupoSemana(id), LE.comoTutor() ? null : LE.api.misGrupos()]);
    try { sessionStorage.setItem("le-grupo", id); } catch (e) { }
    const g = d.grupo, ver = g.ver_simulacros;
    const yo = d.miembros.findIndex((m) => m.yo);
    const lunes = LE.fecha(d.semana + "T12:00");
    const alguien = d.miembros.some((m) => m.xp_semana > 0 || m.dias_semana > 0);
    const actividad = juntarInsignias(d.actividad);
    LE.montar(`
      <div class="pila" style="--pila:1.25rem;max-width:46rem">
        ${LE.comoTutor() ? `<a href="#/tutor/personas/grupos" class="pequeno">‹ Grupos</a>` : ""}
        <section class="panel saludo">
          <div class="fila">
            <div class="avatar-grande" aria-hidden="true">${esc(g.emoji)}</div>
            <div class="pila" style="--pila:.2rem">
              <h1>${esc(g.nombre)}</h1>
              <p class="sub">${g.descripcion ? esc(g.descripcion) + " · " : ""}${d.miembros.length === 1 ? "1 persona" : d.miembros.length + " personas"}</p>
            </div>
          </div>
          ${grupos && grupos.length > 1 ? `<nav class="segmentos" aria-label="Tus grupos" style="margin-top:1rem">${grupos.map((x) => `<a href="#/grupo/${x.id}" aria-current="${x.id === id ? "page" : "false"}">${esc(x.emoji)} ${esc(x.nombre)}</a>`).join("")}</nav>` : ""}
        </section>

        <section class="panel">
          <div class="titulo-seccion"><h2>La semana del grupo</h2><span class="sub pequeno">Desde el lunes ${esc(lunes)} · empieza de nuevo cada lunes</span></div>
          ${yo >= 0 && alguien ? `<p class="sub" style="margin-bottom:.9rem">${fraseSemana(d.miembros, yo)}</p>` : ""}
          <ol class="semana">${d.miembros.map((m, k) => `
            <li class="${m.yo ? "yo" : ""}">
              <span class="pos">${m.xp_semana > 0 ? k + 1 : "·"}</span>
              <span class="av" aria-hidden="true">${esc(m.avatar)}</span>
              <span class="quien">
                <b>${esc(m.nombre)}${m.yo ? " <span class='tenue'>(tú)</span>" : ""}</b>
                <span class="dias" aria-label="${m.dias_semana} de 7 días con práctica">${Array.from({ length: 7 }, (_, i) => `<i class="${i < m.dias_semana ? "on" : ""}"></i>`).join("")}<span class="tenue pequeno">${m.dias_semana} ${m.dias_semana === 1 ? "día" : "días"}</span></span>
                <span class="tenue pequeno">🔥 ${m.racha} de racha · ${m.retos_semana} ${m.retos_semana === 1 ? "reto" : "retos"}${m.simulacros_semana ? ` · ${m.simulacros_semana} ${m.simulacros_semana === 1 ? "simulacro" : "simulacros"}` : ""}</span>
                ${ver && m.simulacros?.length ? `<span class="sims">${m.simulacros.slice(0, 3).map((s) => `<span class="estado">${LE.COMP[s.componente || "lectura"].icono} ${esc(nivelSim(s))}: <b>${s.puntaje}%</b></span>`).join("")}</span>` : ""}
              </span>
              <span class="xp"><b>${Number(m.xp_semana).toLocaleString("es-CO")}</b><small>XP</small></span>
            </li>`).join("")}</ol>
          <p class="tenue pequeno" style="margin-top:1rem">Cuenta el esfuerzo: XP que se gana esta semana y días con práctica. Nadie ve las respuestas, los errores ni los mensajes de los demás${ver ? "" : ", ni sus puntajes"}.</p>
        </section>

        <section class="panel">
          <div class="titulo-seccion"><h2>Lo que está pasando</h2><span class="sub pequeno">Últimos 7 días</span></div>
          ${actividad.length ? `<ul class="actividad">${actividad.map((a) => `
            <li><span class="av" aria-hidden="true">${esc(a.avatar)}</span><span>${textoActividad(a)}<span class="tenue pequeno"> · ${esc(LE.hace(a.fecha))}</span></span></li>`).join("")}</ul>`
          : `<p class="sub">${alguien ? "Todavía no hay retos terminados esta semana." : "La semana empezó el lunes. El primer reto que alguien termine aparece aquí."}</p>`}
        </section>
      </div>`);
  });

  const nivelSim = (s) => {
    const n = (LE.cfgDe("simulacros", s.componente) || {})[s.nivel];
    return (s.componente === "logica" ? "Lógica " : "Lectura ") + (n?.nombre || s.nivel || "").toLowerCase();
  };
  function fraseSemana(ms, yo) {
    const m = ms[yo];
    if (!m.dias_semana) return "Esta semana todavía no has practicado. Un reto corto y ya apareces en la tabla.";
    if (yo === 0) return `Vas de primero esta semana con ${m.xp_semana} XP. Lo que cuenta es la constancia: ${m.dias_semana} ${m.dias_semana === 1 ? "día" : "días"} hasta ahora.`;
    const falta = ms[yo - 1].xp_semana - m.xp_semana + 1;
    return `Vas en el puesto ${yo + 1}, con ${m.xp_semana} XP en ${m.dias_semana} ${m.dias_semana === 1 ? "día" : "días"}. Te faltan ${falta} XP para pasar a ${esc(primerNombre(ms[yo - 1].nombre))}.`;
  }
  // Varias insignias seguidas de la misma persona (suelen llegar juntas) van en una sola línea.
  function juntarInsignias(lista) {
    const out = [];
    for (const a of lista) {
      const prev = out[out.length - 1];
      if (a.tipo === "insignia" && prev?.tipo === "insignia" && prev.user_id === a.user_id && Math.abs(new Date(prev.fecha) - new Date(a.fecha)) < 3 * 3600e3) prev.varias.push(a);
      else out.push(a.tipo === "insignia" ? { ...a, varias: [a] } : a);
    }
    return out;
  }
  function textoActividad(a) {
    const quien = `<b>${esc(primerNombre(a.nombre))}</b>`;
    const comp = LE.COMP[a.componente || "lectura"];
    if (a.tipo === "insignia" && a.varias?.length > 1) return `${quien} ganó ${a.varias.length} insignias: ${a.varias.map((x) => `${esc(x.icono || "")} <b>${esc(x.insignia || "")}</b>`).join(", ")}`;
    if (a.tipo === "insignia") return `${quien} ganó la insignia ${esc(a.icono || "")} <b>${esc(a.insignia || "")}</b>`;
    if (a.tipo === "simulacro") return `${quien} hizo un simulacro de ${comp.nombre.toLowerCase()} (${esc(nivelSim(a).split(" ").slice(1).join(" "))})${a.puntaje != null ? `: <b>${a.puntaje}%</b>` : ""}`;
    return `${quien} terminó un reto de ${comp.nombre.toLowerCase()} de ${a.total} preguntas`;
  }
})(window.LE);
