/* =====================================================================
   ENTRELÍNEAS · API SUPABASE
   Todas las vistas hablan con esta interfaz. api-demo.js implementa
   exactamente los mismos métodos para probar sin servidor.
   ===================================================================== */
window.LE_ApiSupabase = function (cfg) {
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  let uid = null;

  const traducir = (m) => {
    if (/Invalid login credentials/i.test(m)) return "Usuario o contraseña incorrectos.";
    if (/JWT|expired/i.test(m)) return "Tu sesión expiró. Vuelve a entrar.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "No hay conexión con el servidor. Revisa tu internet.";
    return m;
  };
  const ok = ({ data, error }) => { if (error) throw new Error(traducir(error.message)); return data; };
  const rpc = async (fn, args) => ok(await sb.rpc(fn, args));

  return {
    modo: "supabase",

    async sesionActual() {
      const { data } = await sb.auth.getSession();
      uid = data.session?.user?.id || null;
      return uid ? this.perfil() : null;
    },
    async entrar(usuario, clave) {
      const u = usuario.trim().toLowerCase();
      const email = u.includes("@") ? u : `${u}@${cfg.DOMINIO_USUARIOS}`;
      const r = ok(await sb.auth.signInWithPassword({ email, password: clave }));
      uid = r.user.id;
      return this.perfil();
    },
    async salir() { await sb.auth.signOut(); uid = null; },
    async perfil() { return ok(await sb.from("perfiles").select("*").eq("id", uid).single()); },

    async config() {
      const filas = ok(await sb.from("app_config").select("clave, valor"));
      return Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
    },
    async insignias() { return ok(await sb.from("insignias").select("*").eq("activo", true).order("orden")); },
    async novedadesPendientes(ultima) { return ok(await sb.from("novedades").select("*").gt("id", ultima || 0).order("id")); },
    marcarNovedades: () => rpc("marcar_novedades_vistas"),
    actualizarPerfil: (nombre, avatar, meta) => rpc("actualizar_perfil", { p_nombre: nombre, p_avatar: avatar, p_meta: meta }),

    // Estudiante
    iniciarReto: (n, categoria = null, mensajeId = null) => rpc("iniciar_reto", { p_n: n, p_categoria: categoria, p_mensaje: mensajeId }),
    responder: (sesion, pregunta, opcion, ms) => rpc("responder", { p_sesion: sesion, p_pregunta: pregunta, p_opcion: opcion, p_tiempo_ms: Math.round(ms) }),
    finalizarReto: (sesion) => rpc("finalizar_reto", { p_sesion: sesion }),
    iniciarSimulacro: (nivel) => rpc("iniciar_simulacro", { p_nivel: nivel }),
    entregarSimulacro: (sesion, respuestas) => rpc("entregar_simulacro", { p_sesion: sesion, p_respuestas: respuestas }),
    detalleSesion: (sesion) => rpc("detalle_sesion", { p_sesion: sesion }),
    registrarTiempo: (s) => rpc("registrar_tiempo", { p_segundos: s }),
    resumen: (id = null) => rpc("resumen_estudiante", { p_uid: id }),
    async mensajes(estudianteId = uid) {
      return ok(await sb.from("mensajes").select("*").eq("estudiante_id", estudianteId).order("creado", { ascending: false }).limit(60));
    },
    marcarLeido: (id) => rpc("marcar_mensaje_leido", { p_id: id }),

    // Tutor
    panel: () => rpc("panel_tutor"),
    generarAlertas: () => rpc("generar_alertas"),
    async alertas() {
      return ok(await sb.from("alertas").select("*, perfiles(nombre, avatar)").eq("estado", "abierta").order("creado", { ascending: false }));
    },
    async cerrarAlerta(id, estado) { ok(await sb.from("alertas").update({ estado }).eq("id", id)); },
    async enviarMensaje(m) { return ok(await sb.from("mensajes").insert({ ...m, autor_id: uid }).select().single()); },
    async borrarMensaje(id) { ok(await sb.from("mensajes").delete().eq("id", id)); },
    preguntasFalladas: (id) => rpc("preguntas_falladas", { p_uid: id }),
    resumenContenido: () => rpc("resumen_contenido"),
    importarPaquete: (p) => rpc("importar_paquete", { p })
  };
};
