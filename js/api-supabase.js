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
    if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
    if (/banned/i.test(m)) return "Esta cuenta está desactivada. Habla con tu tutor.";
    if (/JWT|expired/i.test(m)) return "Tu sesión expiró. Vuelve a entrar.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "No hay conexión con el servidor. Revisa tu internet.";
    return m;
  };
  const ok = ({ data, error }) => { if (error) throw new Error(traducir(error.message)); return data; };
  const rpc = async (fn, args) => ok(await sb.rpc(fn, args));
  // Si la app nueva llega antes que el SQL nuevo (02_funciones de la 1.1.0), las
  // funciones todavía no aceptan los parámetros de componente. Para que Lectura
  // no se quede sin funcionar mientras tanto, se reintenta con la forma anterior.
  const rpcCompat = async (fn, args, anterior) => {
    try { return await rpc(fn, args); }
    catch (e) {
      if (anterior && /Could not find the function|PGRST202|schema cache/i.test(e.message)) return rpc(fn, anterior);
      throw e;
    }
  };

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
    // Fichas de la caja de herramientas (lógica). Si la base todavía no tiene la tabla, la lista queda vacía.
    async tecnicas() {
      const { data, error } = await sb.from("tecnicas").select("*").eq("activo", true).order("orden");
      return error ? [] : data;
    },
    async novedadesPendientes(ultima) { return ok(await sb.from("novedades").select("*").gt("id", ultima || 0).order("id")); },
    marcarNovedades: () => rpc("marcar_novedades_vistas"),
    actualizarPerfil: (nombre, avatar, meta) => rpc("actualizar_perfil", { p_nombre: nombre, p_avatar: avatar, p_meta: meta }),

    // Estudiante
    iniciarReto: (n, categoria = null, mensajeId = null, componente = null, tema = null) =>
      rpcCompat("iniciar_reto", { p_n: n, p_categoria: categoria, p_mensaje: mensajeId, p_componente: componente, p_tema: tema },
        componente === "logica" || tema ? null : { p_n: n, p_categoria: categoria, p_mensaje: mensajeId }),
    responder: (sesion, pregunta, opcion, ms, pista = false) =>
      rpcCompat("responder", { p_sesion: sesion, p_pregunta: pregunta, p_opcion: opcion, p_tiempo_ms: Math.round(ms), p_pista: !!pista },
        { p_sesion: sesion, p_pregunta: pregunta, p_opcion: opcion, p_tiempo_ms: Math.round(ms) }),
    finalizarReto: (sesion) => rpc("finalizar_reto", { p_sesion: sesion }),
    iniciarSimulacro: (nivel, componente = "lectura") =>
      rpcCompat("iniciar_simulacro", { p_nivel: nivel, p_componente: componente }, componente === "logica" ? null : { p_nivel: nivel }),
    entregarSimulacro: (sesion, respuestas) => rpc("entregar_simulacro", { p_sesion: sesion, p_respuestas: respuestas }),
    detalleSesion: (sesion) => rpc("detalle_sesion", { p_sesion: sesion }),
    registrarTiempo: (s) => rpc("registrar_tiempo", { p_segundos: s }),
    resumen: (id = null) => rpc("resumen_estudiante", { p_uid: id }),
    cuaderno: (componente = "logica", id = null) => rpc("cuaderno_errores", { p_componente: componente, p_uid: id }),
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
    importarPaquete: (p) => rpc("importar_paquete", { p }),

    // Banco completo, con claves, para explorar y probar preguntas (solo tutor).
    async banco() {
      const todas = async (tabla, campos) => {
        let filas = [], desde = 0;
        for (;;) {
          const lote = ok(await sb.from(tabla).select(campos).order("codigo").range(desde, desde + 999));
          filas = filas.concat(lote);
          if (lote.length < 1000) return filas;
          desde += 1000;
        }
      };
      const [textos, preguntas] = await Promise.all([
        todas("textos", "id, codigo, titulo, tipologia, contenido, fuente, figura, componente, paquete, activo"),
        todas("preguntas", "id, codigo, texto_id, categoria, componente, tema, dificultad, enunciado, opciones, correcta, explicacion, pista, pasos, errores, figura, paquete, activo")
      ]);
      return { textos, preguntas };
    },

    // Cuentas y contraseñas (1.2.0)
    cambiarMiClave: (nueva) => rpc("cambiar_mi_clave", { p_nueva: nueva }),
    marcarInstalada: () => rpc("marcar_instalada"),
    personas: () => rpc("personas"),
    crearUsuario: (nombre, correo, grupo = null) => rpc("crear_usuario", { p_nombre: nombre, p_correo: correo, p_grupo: grupo }),
    restablecerClave: (id) => rpc("restablecer_clave", { p_uid: id }),
    cambiarEstadoUsuario: (id, activo) => rpc("cambiar_estado_usuario", { p_uid: id, p_activo: activo }),
    borrarMiPractica: () => rpc("borrar_mi_practica"),

    // Grupos (1.2.0). Si la base todavía no tiene el SQL de la 1.2.0, no hay grupos.
    async misGrupos() {
      try { return await rpc("mis_grupos"); }
      catch (e) { if (/Could not find the function|PGRST202|schema cache/i.test(e.message)) return []; throw e; }
    },
    grupoSemana: (id) => rpc("grupo_semana", { p_grupo: id }),
    guardarGrupo: (g) => rpc("guardar_grupo", { p_id: g.id || null, p_nombre: g.nombre, p_descripcion: g.descripcion || "", p_emoji: g.emoji || "👥", p_ver_simulacros: !!g.ver_simulacros }),
    eliminarGrupo: (id) => rpc("eliminar_grupo", { p_id: id }),
    fijarMiembros: (id, ids) => rpc("fijar_miembros", { p_grupo: id, p_ids: ids })
  };
};
