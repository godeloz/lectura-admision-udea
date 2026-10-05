/* =====================================================================
   ENTRELÍNEAS · API DEMO
   Replica en el navegador la lógica de las funciones SQL para poder
   probar la app sin Supabase. Usuarios: sofia / demo  ·  tutor / demo
   ===================================================================== */
window.LE_ApiDemo = function () {
  const CLAVE = "entrelineas-demo-v2";
  const LECTURA = ["literal", "inferencial", "critico", "cohesion"];
  const LOGICA = ["deductivo", "proporcional", "abstracto", "geometrico"];
  const compDe = (cat) => (LOGICA.includes(cat) ? "logica" : "lectura");
  let db = null;
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const ahora = () => new Date().toISOString();
  const dia = (ts) => new Date(ts).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const hoy = () => dia(Date.now());
  const restarDias = (f, n) => { const d = new Date(f + "T12:00:00"); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(db)); } catch (e) { /* sin almacenamiento: el demo vive en memoria */ } };
  const espera = (x) => new Promise((r) => setTimeout(() => r(x === undefined ? x : JSON.parse(JSON.stringify(x))), 120));
  const yo = () => db.usuarios.find((u) => u.id === db.actual);
  const cfg = (k) => db.config[k];
  const barajar = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const pregunta = (id) => db.preguntas.find((p) => p.id === id);
  const texto = (id) => db.textos.find((t) => t.id === id);
  const sinClave = (u) => { const { clave, ...resto } = u; return resto; };
  const xpc = (k, d) => cfg("xp")?.[k] ?? d;
  const errorDe = (p, opcion) => (opcion == null ? null : (p.errores || [])[opcion] || null);

  async function cargarDatos() {
    if (window.LE_DATOS_DEMO) return window.LE_DATOS_DEMO;
    const leer = (f) => fetch(f).then((r) => { if (!r.ok) throw new Error("No se encontró " + f); return r.json(); });
    const opcional = (f) => leer(f).catch(() => null);
    const paquetes = [await leer("content/paquete-001.json")];
    for (const f of ["content/logica-base.json", "content/logica-001.json", "content/logica-002.json"]) { const p = await opcional(f); if (p) paquetes.push(p); }
    return { base: await leer("content/base.json"), paquetes };
  }

  function aplicarPregunta(q, textoId, paquete) {
    let pr = db.preguntas.find((x) => x.codigo === q.codigo);
    if (!pr) { pr = { id: uuid(), codigo: q.codigo }; db.preguntas.push(pr); }
    Object.assign(pr, {
      texto_id: textoId, categoria: q.categoria, componente: compDe(q.categoria), dificultad: q.dificultad || 2,
      enunciado: q.enunciado, opciones: q.opciones, correcta: q.correcta, explicacion: q.explicacion || "",
      paquete, activo: q.activo !== false,
      tema: q.tema || null, pista: q.pista || null, pasos: q.pasos || null, errores: q.errores || null, figura: q.figura || null
    });
  }

  function aplicar(p) {
    let nt = 0, nq = 0, ni = 0, nc = 0, nk = 0;
    for (const t of p.textos || []) {
      let tx = db.textos.find((x) => x.codigo === t.codigo);
      if (!tx) { tx = { id: uuid(), codigo: t.codigo }; db.textos.push(tx); }
      Object.assign(tx, { titulo: t.titulo, tipologia: t.tipologia || "otro", contenido: t.contenido, fuente: t.fuente, paquete: p.paquete, activo: t.activo !== false, figura: t.figura || null, componente: t.tipologia === "situacion" ? "logica" : "lectura" });
      nt++;
      for (const q of t.preguntas || []) { aplicarPregunta(q, tx.id, p.paquete); nq++; }
    }
    for (const q of p.preguntas || []) { aplicarPregunta(q, null, p.paquete); nq++; }
    for (const k of p.tecnicas || []) {
      const j = db.tecnicas.findIndex((x) => x.codigo === k.codigo);
      const fila = { componente: "logica", cuando: "", pasos: [], ejemplo: "", trampa: "", orden: 100, activo: true, ...k };
      if (j >= 0) db.tecnicas[j] = fila; else db.tecnicas.push(fila);
      nk++;
    }
    for (const i of p.insignias || []) {
      const k = db.insignias.findIndex((x) => x.codigo === i.codigo);
      const fila = { icono: "⭐", color: "rosa", orden: 100, activo: true, ...i };
      if (k >= 0) db.insignias[k] = fila; else db.insignias.push(fila);
      ni++;
    }
    for (const [k, v] of Object.entries(p.config || {})) { db.config[k] = v; nc++; }
    if (p.novedad) db.novedades.push({ id: db.novedades.length + 1, creado: ahora(), ...p.novedad });
    db.insignias.sort((a, b) => a.orden - b.orden);
    db.tecnicas.sort((a, b) => a.orden - b.orden);
    return { paquete: p.paquete, textos: nt, preguntas: nq, tecnicas: nk, insignias: ni, config: nc, novedad: !!p.novedad };
  }

  // ---------- lógica espejo de 02_funciones.sql ----------
  // Devuelve las ocho categorías (cuatro de lectura y cuatro de lógica).
  function dominio(uid) {
    return [...LECTURA, ...LOGICA].map((c) => {
      const rs = db.respuestas.filter((r) => r.user_id === uid && pregunta(r.pregunta_id)?.categoria === c)
        .sort((a, b) => b.creado.localeCompare(a.creado)).slice(0, 30);
      let ok = 0, tot = 0;
      rs.forEach((r) => { const d = pregunta(r.pregunta_id).dificultad; tot += d; if (r.correcta) ok += d; });
      return { categoria: c, dominio: Math.round((100 * (ok + 0.7)) / (tot + 2)), respondidas: rs.length };
    });
  }

  function rachas(uid) {
    const dias = [...new Set(db.respuestas.filter((r) => r.user_id === uid).map((r) => dia(r.creado)))].sort();
    let mejor = 0, run = 0, prev = null;
    const islas = [];
    for (const d of dias) {
      run = prev && restarDias(d, 1) === prev ? run + 1 : 1;
      if (run === 1) islas.push({ fin: d, largo: 1 }); else { islas[islas.length - 1].fin = d; islas[islas.length - 1].largo = run; }
      mejor = Math.max(mejor, run); prev = d;
    }
    const ult = islas[islas.length - 1];
    const actual = ult && ult.fin >= restarDias(hoy(), 1) ? ult.largo : 0;
    return { actual, mejor };
  }

  function ultimas(uid) {
    const m = {};
    db.respuestas.filter((r) => r.user_id === uid).forEach((r) => { if (!m[r.pregunta_id] || m[r.pregunta_id].creado < r.creado) m[r.pregunta_id] = r; });
    return m;
  }

  const agrupar = (ids) => ids.map(pregunta).sort((a, b) => ((a.texto_id || a.id) + a.codigo).localeCompare((b.texto_id || b.id) + b.codigo)).map((p) => p.id);

  function seleccionar(uid, n, cat, comp = "lectura", tema = null) {
    const dist = comp === "logica"
      ? cfg("distribucion_logica") || { deductivo: 0.25, proporcional: 0.3, abstracto: 0.2, geometrico: 0.25 }
      : cfg("distribucion") || { literal: 0.2, inferencial: 0.35, critico: 0.3, cohesion: 0.15 };
    const u = ultimas(uid);
    // Reto de repaso: solo lo pendiente en el cuaderno de errores, de lo más antiguo a lo más reciente.
    if (tema === "@errores") {
      return agrupar(db.preguntas.filter((p) => p.activo && p.componente === comp && u[p.id] && !u[p.id].correcta)
        .sort((a, b) => u[a.id].creado.localeCompare(u[b.id].creado)).slice(0, n).map((p) => p.id));
    }
    const activas = db.preguntas.filter((p) => p.activo && p.componente === comp && (!cat || p.categoria === cat) && (!tema || p.tema === tema));
    const hace = (h) => new Date(Date.now() - h * 3600e3).toISOString();
    const repN = Math.round(n * (cfg("retos")?.repaso ?? 0.2));
    const rep = activas.filter((p) => u[p.id] && !u[p.id].correcta && u[p.id].creado < hace(20))
      .sort((a, b) => u[a.id].creado.localeCompare(u[b.id].creado)).slice(0, repN).map((p) => p.id);
    const dom = Object.fromEntries(dominio(uid).map((d) => [d.categoria, d.dominio]));
    const objetivo = (c) => ((dom[c] ?? 35) < 45 ? 1 : dom[c] < 75 ? 2 : 3);
    const cand = activas.filter((p) => !rep.includes(p.id) && (!u[p.id] || u[p.id].creado < hace(24 * 30)))
      .map((p) => ({ p, s: Math.abs(p.dificultad - objetivo(p.categoria)) + (u[p.id] ? 1.5 : 0) + Math.random() }));
    const sel = [];
    const filtrado = !!(cat || tema);
    for (const c of filtrado ? [...new Set(activas.map((p) => p.categoria))] : Object.keys(dist)) {
      const cupo = filtrado ? n : Math.max(1, Math.round((n - rep.length) * (dist[c] || 0.25)));
      cand.filter((x) => x.p.categoria === c).sort((a, b) => a.s - b.s).slice(0, cupo).forEach((x) => sel.push(x.p.id));
    }
    let ids = [...rep, ...sel];
    if (ids.length < n) ids = ids.concat(barajar(activas.filter((p) => !ids.includes(p.id))).slice(0, n - ids.length).map((p) => p.id));
    return agrupar(ids.slice(0, n));
  }

  const textoPublico = (t) => ({ titulo: t.titulo, tipologia: t.tipologia, contenido: t.contenido, fuente: t.fuente, figura: t.figura || null, componente: t.componente || "lectura" });

  // Preguntas sin la clave de respuesta ni los pasos de la solución.
  function empaquetar(ids) {
    const ps = ids.map(pregunta);
    return {
      preguntas: ps.map((p) => ({ id: p.id, texto_id: p.texto_id, categoria: p.categoria, componente: p.componente || "lectura", dificultad: p.dificultad, enunciado: p.enunciado, opciones: p.opciones, figura: p.figura || null, pista: p.pista || null })),
      textos: Object.fromEntries([...new Set(ps.map((p) => p.texto_id).filter(Boolean))].map((id) => [id, textoPublico(texto(id))]))
    };
  }

  const recuperadas = (uid, comp) => {
    const porP = {};
    db.respuestas.filter((r) => r.user_id === uid && (!comp || pregunta(r.pregunta_id)?.componente === comp))
      .sort((a, b) => a.creado.localeCompare(b.creado))
      .forEach((r) => { const x = (porP[r.pregunta_id] ||= { fallo: false, rec: false }); if (!r.correcta) x.fallo = true; else if (x.fallo) x.rec = true; });
    return Object.values(porP).filter((x) => x.rec).length;
  };
  const temasDe = (uid, comp) => {
    const m = {};
    db.respuestas.filter((r) => r.user_id === uid).forEach((r) => {
      const p = pregunta(r.pregunta_id);
      if (!p || !p.tema || (comp && p.componente !== comp)) return;
      const x = (m[p.tema] ||= { tema: p.tema, intentos: 0, aciertos: 0, ultima: r.creado });
      x.intentos++; if (r.correcta) x.aciertos++; if (r.creado > x.ultima) x.ultima = r.creado;
    });
    return Object.values(m);
  };

  function evaluarInsignias(uid) {
    const tengo = new Set(db.iu.filter((x) => x.user_id === uid).map((x) => x.codigo));
    const todas = db.respuestas.filter((r) => r.user_id === uid);
    const sesTodas = db.sesiones.filter((s) => s.user_id === uid && s.fin);
    const dom = dominio(uid);
    const r = rachas(uid).actual;
    const minutos = Object.values(db.actividad[uid] || {}).reduce((a, b) => a + b, 0) / 60;
    const nuevas = [];
    for (const i of db.insignias.filter((x) => x.activo && !tengo.has(x.codigo))) {
      const g = i.regla, v = g.valor || 0, c = g.componente || null;
      const mias = c ? todas.filter((x) => pregunta(x.pregunta_id)?.componente === c) : todas;
      const retos = sesTodas.filter((s) => s.tipo !== "simulacro" && (!c || (s.componente || "lectura") === c)).sort((a, b) => a.fin.localeCompare(b.fin));
      let ok = false;
      switch (g.tipo) {
        case "racha": ok = r >= v; break;
        case "respuestas": ok = mias.length >= v; break;
        case "aciertos": ok = mias.filter((x) => x.correcta).length >= v; break;
        case "retos": ok = retos.length >= v; break;
        case "reto_perfecto": ok = retos.some((s) => s.total >= v && s.correctas === s.total); break;
        case "dominio": ok = dom.some((d) => d.categoria === g.categoria && d.dominio >= v && d.respondidas >= 15); break;
        case "simulacro": ok = sesTodas.some((s) => s.tipo === "simulacro" && s.nivel === g.nivel && (s.componente || "lectura") === (c || "lectura") && (s.resultado?.puntaje ?? -1) >= v); break;
        case "minutos": ok = minutos >= v; break;
        case "misiones": ok = db.mensajes.filter((m) => m.estudiante_id === uid && m.tipo === "mision" && m.completado).length >= v; break;
        case "remontada": ok = retos.filter((s) => s.total >= 5).some((s, k, a) => k > 0 && a[k - 1].correctas / a[k - 1].total < 0.5 && s.correctas / s.total >= 0.8); break;
        case "recuperadas": ok = recuperadas(uid, c) >= v; break;
        case "tecnicas": ok = temasDe(uid, null).filter((t) => t.aciertos >= (g.minimo || 3) && t.aciertos >= 0.75 * t.intentos).length >= v; break;
      }
      if (ok) { db.iu.push({ user_id: uid, codigo: i.codigo, obtenida: ahora() }); nuevas.push({ codigo: i.codigo, nombre: i.nombre, descripcion: i.descripcion, icono: i.icono, color: i.color }); }
    }
    return nuevas;
  }

  function resumen(uid) {
    const u = db.usuarios.find((x) => x.id === uid);
    const mias = db.respuestas.filter((r) => r.user_id === uid);
    const act = db.actividad[uid] || {};
    const r = rachas(uid);
    const dias = Array.from({ length: 28 }, (_, i) => { const f = restarDias(hoy(), 27 - i); return { fecha: f, minutos: Math.floor((act[f] || 0) / 60), respuestas: mias.filter((x) => dia(x.creado) === f).length }; });
    const tiempos = mias.filter((x) => x.tiempo_ms != null);
    const hace8 = new Date(Date.now() - 56 * 86400e3).toISOString();
    const tend = {};
    mias.filter((x) => x.creado > hace8).forEach((x) => {
      const d = new Date(dia(x.creado) + "T12:00:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const k = d.toISOString().slice(0, 10) + "|" + pregunta(x.pregunta_id).categoria;
      const t = (tend[k] ||= { ok: 0, n: 0 }); t.n++; if (x.correcta) t.ok++;
    });
    const dom = dominio(uid);
    const porComp = {};
    mias.forEach((x) => {
      const c = pregunta(x.pregunta_id)?.componente || "lectura";
      const k = (porComp[c] ||= { respuestas: 0, aciertos: 0, ms: 0, nms: 0, ultima: x.creado });
      k.respuestas++; if (x.correcta) k.aciertos++; if (x.tiempo_ms != null) { k.ms += x.tiempo_ms; k.nms++; } if (x.creado > k.ultima) k.ultima = x.creado;
    });
    Object.values(porComp).forEach((k) => { k.segundos_promedio = k.nms ? Math.round(k.ms / k.nms / 1000) : null; delete k.ms; delete k.nms; });
    return {
      perfil: sinClave(u), racha: r.actual, mejor_racha: r.mejor,
      minutos_hoy: Math.floor((act[hoy()] || 0) / 60),
      minutos_total: Math.floor(Object.values(act).reduce((a, b) => a + b, 0) / 60),
      dias,
      dominio: dom.filter((d) => LECTURA.includes(d.categoria)),
      dominio_logica: dom.filter((d) => LOGICA.includes(d.categoria)),
      tendencia: Object.entries(tend).sort().map(([k, v]) => { const [semana, categoria] = k.split("|"); return { semana, categoria, precision: Math.round((100 * v.ok) / v.n), n: v.n }; }),
      totales: { respuestas: mias.length, aciertos: mias.filter((x) => x.correcta).length, segundos_promedio: tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b.tiempo_ms, 0) / tiempos.length / 1000) : null },
      por_componente: porComp,
      retos: db.sesiones.filter((s) => s.user_id === uid && s.tipo !== "simulacro" && s.fin).length,
      insignias: db.iu.filter((x) => x.user_id === uid).map(({ codigo, obtenida }) => ({ codigo, obtenida })),
      simulacros: db.sesiones.filter((s) => s.user_id === uid && s.tipo === "simulacro" && s.fin && !s.resultado?.abandonado)
        .sort((a, b) => b.fin.localeCompare(a.fin))
        .map((s) => ({ id: s.id, nivel: s.nivel, componente: s.componente || "lectura", fecha: s.fin, correctas: s.correctas, total: s.total, puntaje: s.resultado.puntaje, por_categoria: s.resultado.por_categoria })),
      ultima_actividad: mias.map((x) => x.creado).sort().pop() || null
    };
  }

  // Cuaderno de errores de un componente (espejo de cuaderno_errores en SQL).
  function cuaderno(uid, comp) {
    const mias = db.respuestas.filter((r) => r.user_id === uid && pregunta(r.pregunta_id)?.componente === comp);
    const perfil = {};
    mias.filter((r) => !r.correcta && r.opcion != null).sort((a, b) => b.creado.localeCompare(a.creado)).slice(0, 60)
      .forEach((r) => { const t = errorDe(pregunta(r.pregunta_id), r.opcion)?.tipo; if (t) perfil[t] = (perfil[t] || 0) + 1; });
    const u = ultimas(uid);
    const pendientes = Object.values(u).filter((r) => !r.correcta).map((r) => ({ r, p: pregunta(r.pregunta_id) }))
      .filter(({ p }) => p && p.activo && p.componente === comp)
      .sort((a, b) => b.r.creado.localeCompare(a.r.creado)).slice(0, 40)
      .map(({ r, p }) => {
        const mis = mias.filter((x) => x.pregunta_id === p.id);
        const t = p.texto_id ? texto(p.texto_id) : null;
        return { id: p.id, codigo: p.codigo, categoria: p.categoria, dificultad: p.dificultad, tema: p.tema, enunciado: p.enunciado, opciones: p.opciones, figura: p.figura || null,
          correcta: p.correcta, pasos: p.pasos || null, explicacion: p.explicacion, elegida: r.opcion, fecha: r.creado, error: errorDe(p, r.opcion),
          fallos: mis.filter((x) => !x.correcta).length, intentos: mis.length, texto: t ? textoPublico(t) : null };
      });
    return { perfil, errores_total: mias.filter((r) => !r.correcta).length, respuestas_total: mias.length, temas: temasDe(uid, comp), pendientes, recuperadas: recuperadas(uid, comp) };
  }

  function sumarXP(uid, n) { db.usuarios.find((u) => u.id === uid).xp += n; }

  // ---------- historial de muestra para que el demo no arranque vacío ----------
  function sembrar() {
    const est = db.usuarios.find((u) => u.usuario === "sofia");
    const tut = db.usuarios.find((u) => u.usuario === "tutor");
    const dias = [18, 17, 16, 14, 13, 12, 11, 9, 8, 6, 5, 4];
    const prob = { literal: 0.8, inferencial: 0.72, critico: 0.5, cohesion: 0.62 };
    const lectura = db.preguntas.filter((p) => p.componente === "lectura");
    for (const d of dias) {
      const n = d % 3 === 0 ? 15 : 10;
      const f = restarDias(hoy(), d);
      const s = { id: uuid(), user_id: est.id, tipo: "reto", componente: "lectura", nivel: String(n), total: n, preguntas: [], inicio: f + "T21:00:00.000Z", fin: f + "T21:20:00.000Z", xp: 0, correctas: 0 };
      barajar(lectura).slice(0, n).forEach((p, k) => {
        // en la última semana, el nivel inferencial cae (para que el tutor vea una alerta)
        const base = p.categoria === "inferencial" && d <= 6 ? 0.25 : prob[p.categoria] + (18 - d) * 0.008;
        const ok = Math.random() < base;
        const xp = ok ? 10 * p.dificultad + 5 : 2;
        db.respuestas.push({ id: db.respuestas.length + 1, user_id: est.id, pregunta_id: p.id, sesion_id: s.id, opcion: ok ? p.correcta : (p.correcta + 1) % 4, correcta: ok, tiempo_ms: 40000 + Math.random() * 60000, contexto: "reto", pista: false, creado: `${f}T21:${String(k * 2).padStart(2, "0")}:00.000Z` });
        s.xp += xp; s.correctas += ok ? 1 : 0; s.preguntas.push(p.id);
      });
      s.xp += 20; s.resultado = { correctas: s.correctas, total: n, respondidas: n, xp: s.xp };
      db.sesiones.push(s); est.xp += s.xp;
      (db.actividad[est.id] ||= {})[f] = (12 + Math.round(Math.random() * 25)) * 60;
    }
    const sim = { id: uuid(), user_id: est.id, tipo: "simulacro", componente: "lectura", nivel: "inicial", total: 30, correctas: 17, xp: 264, preguntas: lectura.slice(0, 30).map((p) => p.id), inicio: restarDias(hoy(), 9) + "T14:00:00.000Z", fin: restarDias(hoy(), 9) + "T15:02:00.000Z" };
    sim.resultado = { correctas: 17, total: 30, puntaje: 56.7, minutos: 62, respondidas: 29, xp: 264, componente: "lectura", por_categoria: { literal: { correctas: 6, total: 7 }, inferencial: { correctas: 6, total: 10 }, critico: { correctas: 2, total: 8 }, cohesion: { correctas: 3, total: 5 } }, detalle: [] };
    db.sesiones.push(sim); est.xp += 264;

    // Lógica: cuatro días de retos, flojos en proporciones, para que el cuaderno
    // de errores, el perfil de errores y la caja de herramientas tengan qué mostrar.
    const logica = db.preguntas.filter((p) => p.componente === "logica");
    if (logica.length) {
      const probL = { deductivo: 0.7, proporcional: 0.42, abstracto: 0.75, geometrico: 0.58 };
      let pila = barajar(logica);
      [7, 5, 3, 2].forEach((d) => {
        const f = restarDias(hoy(), d);
        const lote = pila.splice(0, Math.min(8, pila.length));
        if (!lote.length) return;
        const s = { id: uuid(), user_id: est.id, tipo: "reto", componente: "logica", nivel: String(lote.length), total: lote.length, preguntas: [], inicio: f + "T22:00:00.000Z", fin: f + "T22:25:00.000Z", xp: 0, correctas: 0 };
        lote.forEach((p, k) => {
          const ok = Math.random() < probL[p.categoria] - (p.dificultad - 2) * 0.12;
          // al fallar, marca una opción incorrecta cualquiera (cada una lleva su diagnóstico)
          const malas = [0, 1, 2, 3].filter((o) => o !== p.correcta);
          const opcion = ok ? p.correcta : malas[Math.floor(Math.random() * 3)];
          const xp = ok ? 10 * p.dificultad + 5 : 2;
          db.respuestas.push({ id: db.respuestas.length + 1, user_id: est.id, pregunta_id: p.id, sesion_id: s.id, opcion, correcta: ok, tiempo_ms: 60000 + Math.random() * 110000, contexto: "reto", pista: !ok && Math.random() < 0.3, creado: `${f}T22:${String(k * 3).padStart(2, "0")}:00.000Z` });
          s.xp += xp; s.correctas += ok ? 1 : 0; s.preguntas.push(p.id);
        });
        s.xp += 20; s.resultado = { correctas: s.correctas, total: s.total, respondidas: s.total, xp: s.xp, componente: "logica" };
        db.sesiones.push(s); est.xp += s.xp;
        (db.actividad[est.id] ||= {})[f] = ((db.actividad[est.id][f] || 0) / 60 + 22) * 60;
      });
    }

    db.actual = est.id; evaluarInsignias(est.id); db.actual = null;
    db.mensajes.push({ id: uuid(), estudiante_id: est.id, autor_id: tut.id, tipo: "mision", titulo: "Misión: nivel crítico", cuerpo: "Vi tu simulacro: el nivel crítico es donde más puntos se te escapan. Te dejé 10 preguntas solo de ese nivel. Antes de elegir, pregúntate qué necesitaría el autor para que su argumento se cayera.", mision: { categoria: "critico", n: 10, componente: "lectura" }, leido: false, completado: false, creado: new Date(Date.now() - 86400e3).toISOString() });
    db.mensajes.push({ id: uuid(), estudiante_id: est.id, autor_id: tut.id, tipo: "mensaje", titulo: "¡Buena semana!", cuerpo: "Doce días de práctica en tres semanas. Así se construye. Sigue con los EP diarios.", leido: true, completado: false, creado: new Date(Date.now() - 4 * 86400e3).toISOString() });
  }

  async function iniciarBD(forzar = false) {
    if (db && !forzar) return;
    try { if (!forzar) db = JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { db = null; }
    if (db) return;
    const datos = await cargarDatos();
    db = { usuarios: [], textos: [], preguntas: [], tecnicas: [], respuestas: [], sesiones: [], actividad: {}, insignias: [], iu: [], config: {}, novedades: [], mensajes: [], alertas: [], actual: null };
    aplicar(datos.base);
    datos.paquetes.forEach(aplicar);
    const t0 = new Date(Date.now() - 20 * 86400e3).toISOString();
    db.usuarios.push({ id: uuid(), usuario: "sofia", clave: "demo", rol: "estudiante", nombre: "Sofía", avatar: "🎧", xp: 0, meta_programa: "Medicina", ultima_novedad: 0, activo: true, creado: t0 });
    db.usuarios.push({ id: uuid(), usuario: "tutor", clave: "demo", rol: "tutor", nombre: "Tutor", avatar: "🎓", xp: 0, meta_programa: null, ultima_novedad: 99, activo: true, creado: t0 });
    sembrar();
    db.usuarios.forEach((u) => (u.ultima_novedad = db.novedades.length));
    guardar();
  }

  const soloTutor = () => { if (yo()?.rol !== "tutor") throw new Error("Solo para tutores"); };

  return {
    modo: "demo",
    async reiniciar() { try { localStorage.removeItem(CLAVE); } catch (e) { } db = null; await iniciarBD(true); },
    async sesionActual() { await iniciarBD(); return db.actual ? espera(sinClave(yo())) : null; },
    async entrar(usuario, clave) {
      await iniciarBD();
      const u = db.usuarios.find((x) => x.usuario === usuario.trim().toLowerCase() && x.clave === clave);
      if (!u) throw new Error("Usuario o contraseña incorrectos.");
      db.actual = u.id; guardar();
      return espera(sinClave(u));
    },
    async salir() { db.actual = null; guardar(); },
    async perfil() { return espera(sinClave(yo())); },
    async config() { return espera(db.config); },
    async insignias() { return espera(db.insignias.filter((i) => i.activo)); },
    async tecnicas() { return espera(db.tecnicas.filter((t) => t.activo)); },
    async novedadesPendientes(ultima) { return espera(db.novedades.filter((n) => n.id > (ultima || 0))); },
    async marcarNovedades() { yo().ultima_novedad = db.novedades.length; guardar(); },
    async actualizarPerfil(nombre, avatar, meta) { const u = yo(); if (nombre?.trim()) u.nombre = nombre.trim(); if (avatar) u.avatar = avatar; if (meta != null) u.meta_programa = meta; guardar(); },

    // El componente sale de la categoría si viene una; si no, del parámetro.
    async iniciarReto(n, categoria = null, mensajeId = null, componente = null, tema = null) {
      const comp = categoria ? compDe(categoria) : tema ? "logica" : componente || "lectura";
      const ids = seleccionar(db.actual, n, categoria, comp, tema);
      if (!ids.length) throw new Error(tema === "@errores" ? "No tienes errores pendientes por repasar" : "Todavía no hay preguntas cargadas");
      const s = { id: uuid(), user_id: db.actual, tipo: mensajeId ? "mision" : "reto", componente: comp, nivel: tema || categoria || String(n), total: ids.length, preguntas: ids, mensaje_id: mensajeId, inicio: ahora(), fin: null, xp: 0 };
      db.sesiones.push(s); guardar();
      return espera({ sesion_id: s.id, tipo: s.tipo, componente: comp, ...empaquetar(ids) });
    },
    async responder(sesionId, preguntaId, opcion, ms, pista = false) {
      const s = db.sesiones.find((x) => x.id === sesionId && x.user_id === db.actual);
      if (!s || s.tipo === "simulacro" || s.fin) throw new Error("Sesión no válida");
      if (db.respuestas.some((r) => r.sesion_id === sesionId && r.pregunta_id === preguntaId)) throw new Error("Esta pregunta ya fue respondida");
      const p = pregunta(preguntaId);
      const ok = opcion === p.correcta;
      const seg = p.componente === "logica" ? xpc("segundos_bono_logica", 180) : xpc("segundos_bono", 120);
      const xp = ok ? xpc("por_acierto", 10) * p.dificultad + (!pista && ms >= 5000 && ms <= seg * 1000 ? xpc("bono_ritmo", 5) : 0) : xpc("por_intento", 2);
      db.respuestas.push({ id: db.respuestas.length + 1, user_id: db.actual, pregunta_id: preguntaId, sesion_id: sesionId, opcion, correcta: ok, tiempo_ms: Math.round(ms), contexto: s.tipo, pista: !!pista, creado: ahora() });
      s.xp += xp; sumarXP(db.actual, xp); guardar();
      return espera({ correcta: ok, opcion_correcta: p.correcta, explicacion: p.explicacion, xp, pasos: p.pasos || null, tema: p.tema || null, error: ok ? null : errorDe(p, opcion) });
    },
    async finalizarReto(sesionId) {
      const s = db.sesiones.find((x) => x.id === sesionId && x.user_id === db.actual);
      if (s.fin) return espera(s.resultado);
      const rs = db.respuestas.filter((r) => r.sesion_id === sesionId);
      const ok = rs.filter((r) => r.correcta).length;
      let bono = 0;
      if (rs.length === s.total) {
        bono = xpc("reto_completo", 20) + (ok === s.total ? xpc("reto_perfecto", 30) : 0) + (s.tipo === "mision" ? xpc("mision", 40) : 0);
        if (s.mensaje_id) { const m = db.mensajes.find((x) => x.id === s.mensaje_id); if (m) { m.completado = true; m.sesion_id = s.id; } }
      }
      sumarXP(db.actual, bono);
      s.fin = ahora(); s.correctas = ok; s.xp += bono;
      s.resultado = { correctas: ok, respondidas: rs.length, total: s.total, xp: s.xp, bono, componente: s.componente || "lectura" };
      const nuevas = evaluarInsignias(db.actual);
      guardar();
      return espera({ ...s.resultado, nuevas_insignias: nuevas, xp_total: yo().xp });
    },
    async iniciarSimulacro(nivel, componente = "lectura") {
      const comp = componente || "lectura";
      const abierto = db.sesiones.find((s) => s.user_id === db.actual && s.tipo === "simulacro" && !s.fin && s.limite > ahora());
      if (abierto) return espera({ sesion_id: abierto.id, nivel: abierto.nivel, componente: abierto.componente || "lectura", limite: abierto.limite, ahora: ahora(), retomado: true, ...empaquetar(abierto.preguntas) });
      const c = (cfg(comp === "logica" ? "simulacros_logica" : "simulacros") || {})[nivel];
      if (!c) throw new Error("Nivel de simulacro no válido");
      db.sesiones.filter((s) => s.user_id === db.actual && s.tipo === "simulacro" && !s.fin).forEach((s) => { s.fin = ahora(); s.correctas = 0; s.resultado = { abandonado: true }; });
      let ids = [];
      if (comp === "lectura") {
        // Como en el examen real: lecturas completas con todas sus preguntas.
        const porTexto = {};
        db.preguntas.filter((p) => p.activo && p.componente === "lectura").forEach((p) => (porTexto[p.texto_id] ||= []).push(p));
        const orden = Object.values(porTexto).map((ps) => ({ ps, s: Math.abs(ps.reduce((a, p) => a + p.dificultad, 0) / ps.length - (c.dificultad || 2)) + Math.random() * 1.2 })).sort((a, b) => a.s - b.s);
        for (const o of orden) { if (ids.length >= c.preguntas) break; ids = ids.concat(o.ps.sort((a, b) => a.codigo.localeCompare(b.codigo)).map((p) => p.id)); }
        ids = ids.slice(0, c.preguntas);
      } else {
        // Lógica: cupo por nivel, cerca de la dificultad objetivo, y primero lo no visto en tres semanas.
        const dist = cfg("distribucion_logica") || { deductivo: 0.25, proporcional: 0.3, abstracto: 0.2, geometrico: 0.25 };
        const hace21 = new Date(Date.now() - 21 * 86400e3).toISOString();
        const recientes = new Set(db.respuestas.filter((r) => r.user_id === db.actual && r.creado > hace21).map((r) => r.pregunta_id));
        const activas = db.preguntas.filter((p) => p.activo && p.componente === "logica");
        for (const cat of Object.keys(dist)) {
          const cupo = Math.max(1, Math.round(c.preguntas * (dist[cat] || 0.25)));
          activas.filter((p) => p.categoria === cat)
            .map((p) => ({ p, s: Math.abs(p.dificultad - (c.dificultad || 2)) + Math.random() * 1.2 + (recientes.has(p.id) ? 0.8 : 0) }))
            .sort((a, b) => a.s - b.s).slice(0, cupo).forEach((x) => ids.push(x.p.id));
        }
        if (ids.length < c.preguntas) ids = ids.concat(barajar(activas.filter((p) => !ids.includes(p.id))).slice(0, c.preguntas - ids.length).map((p) => p.id));
        ids = ids.slice(0, c.preguntas);
        // Las preguntas de una misma situación quedan juntas; el resto, mezcladas.
        const sal = {};
        const llave = (p) => (sal[p.texto_id || p.id] ||= Math.random());
        ids = ids.map(pregunta).sort((a, b) => llave(a) - llave(b) || a.codigo.localeCompare(b.codigo)).map((p) => p.id);
      }
      if (!ids.length) throw new Error("Todavía no hay preguntas cargadas");
      const limite = new Date(Date.now() + Math.round((c.minutos * ids.length) / c.preguntas) * 60000).toISOString();
      const s = { id: uuid(), user_id: db.actual, tipo: "simulacro", componente: comp, nivel, total: ids.length, preguntas: ids, inicio: ahora(), limite, fin: null, xp: 0 };
      db.sesiones.push(s); guardar();
      return espera({ sesion_id: s.id, nivel, componente: comp, limite, ahora: ahora(), retomado: false, ...empaquetar(ids) });
    },
    async entregarSimulacro(sesionId, resp) {
      const s = db.sesiones.find((x) => x.id === sesionId && x.user_id === db.actual);
      if (s.fin) return espera(s.resultado);
      const porCat = {}, porError = {}, porTema = {};
      const detalle = s.preguntas.map((id) => {
        const p = pregunta(id), r = resp[id] || {};
        const elegida = r.opcion ?? null, ok = elegida === p.correcta;
        db.respuestas.push({ id: db.respuestas.length + 1, user_id: db.actual, pregunta_id: id, sesion_id: s.id, opcion: elegida, correcta: ok, tiempo_ms: r.tiempo_ms ?? null, contexto: "simulacro", pista: false, creado: ahora() });
        const c = (porCat[p.categoria] ||= { correctas: 0, total: 0 }); c.total++; if (ok) c.correctas++;
        const error = ok ? null : errorDe(p, elegida);
        if (error?.tipo) porError[error.tipo] = (porError[error.tipo] || 0) + 1;
        if (p.tema) { const t = (porTema[p.tema] ||= { correctas: 0, total: 0 }); t.total++; if (ok) t.correctas++; }
        return { pregunta_id: id, texto_id: p.texto_id, categoria: p.categoria, enunciado: p.enunciado, opciones: p.opciones, elegida, correcta: p.correcta, acierto: ok, explicacion: p.explicacion,
          figura: p.figura || null, tema: p.tema || null, pasos: p.pasos || null, tiempo_ms: r.tiempo_ms ?? null, error };
      });
      const ok = detalle.filter((d) => d.acierto).length;
      const xp = ok * xpc("simulacro_acierto", 12) + xpc("simulacro_completo", 60);
      s.fin = ahora(); s.correctas = ok; s.xp = xp;
      s.resultado = { correctas: ok, total: s.total, puntaje: Math.round((1000 * ok) / s.total) / 10, xp, tarde: false, componente: s.componente || "lectura", respondidas: detalle.filter((d) => d.elegida != null).length, minutos: Math.round((Math.min(Date.now(), new Date(s.limite)) - new Date(s.inicio)) / 6000) / 10, por_categoria: porCat, por_error: porError, por_tema: porTema, detalle };
      sumarXP(db.actual, xp);
      const nuevas = evaluarInsignias(db.actual);
      guardar();
      return espera({ ...s.resultado, nuevas_insignias: nuevas, xp_total: yo().xp });
    },
    async detalleSesion(id) {
      const s = db.sesiones.find((x) => x.id === id);
      if (!s || (s.user_id !== db.actual && yo().rol !== "tutor")) throw new Error("Sesión no encontrada");
      const { preguntas, ...resto } = s;
      return espera({ sesion: { componente: "lectura", ...resto }, textos: empaquetar(preguntas).textos });
    },
    async registrarTiempo(seg) { const a = (db.actividad[db.actual] ||= {}); a[hoy()] = (a[hoy()] || 0) + Math.min(Math.max(seg, 0), 90); guardar(); },
    async resumen(id = null) {
      const uid = id || db.actual;
      if (uid !== db.actual) soloTutor();
      return espera(resumen(uid));
    },
    async cuaderno(componente = "logica", id = null) {
      const uid = id || db.actual;
      if (uid !== db.actual) soloTutor();
      return espera(cuaderno(uid, componente));
    },
    async mensajes(estudianteId = db.actual) { return espera(db.mensajes.filter((m) => m.estudiante_id === estudianteId).sort((a, b) => b.creado.localeCompare(a.creado))); },
    async marcarLeido(id) { const m = db.mensajes.find((x) => x.id === id && x.estudiante_id === db.actual); if (m) m.leido = true; guardar(); },

    // Tutor
    async panel() {
      soloTutor();
      const hace7 = new Date(Date.now() - 7 * 86400e3).toISOString();
      return espera(db.usuarios.filter((u) => u.rol === "estudiante" && u.activo).map((u) => {
        const rs = db.respuestas.filter((r) => r.user_id === u.id);
        const r7 = rs.filter((r) => r.creado > hace7);
        const act = db.actividad[u.id] || {};
        return { id: u.id, nombre: u.nombre, usuario: u.usuario, avatar: u.avatar, xp: u.xp, meta_programa: u.meta_programa, racha: rachas(u.id).actual,
          ultima_actividad: rs.map((r) => r.creado).sort().pop() || null,
          minutos_7d: Math.floor(Object.entries(act).filter(([f]) => f > restarDias(hoy(), 7)).reduce((a, [, s]) => a + s, 0) / 60),
          respuestas_7d: r7.length, precision_7d: r7.length ? Math.round((100 * r7.filter((r) => r.correcta).length) / r7.length) : null,
          logica_7d: r7.filter((r) => pregunta(r.pregunta_id)?.componente === "logica").length,
          alertas: db.alertas.filter((a) => a.estudiante_id === u.id && a.estado === "abierta").length };
      }));
    },
    async generarAlertas() {
      soloTutor();
      const um = cfg("alertas") || { dias_inactividad: 3, caida_puntos: 15, minimo_respuestas: 5 };
      const nombres = { literal: "el nivel literal", inferencial: "el nivel inferencial", critico: "el nivel crítico", cohesion: "el nivel de cohesión", deductivo: "la deducción lógica", proporcional: "el trabajo con proporciones y conteo", abstracto: "la búsqueda de patrones", geometrico: "la geometría" };
      let n = 0;
      for (const e of db.usuarios.filter((u) => u.rol === "estudiante" && u.activo)) {
        const nom = e.nombre.split(" ")[0];
        const hace7 = new Date(Date.now() - 7 * 86400e3).toISOString();
        const yaAvisada = (tipo, cat, desde) => db.alertas.some((a) => a.estudiante_id === e.id && a.tipo === tipo && (!cat || a.detalle.categoria === cat) && (a.estado === "abierta" || a.creado > desde));
        const rs = db.respuestas.filter((r) => r.user_id === e.id);
        const ult = rs.map((r) => r.creado).sort().pop() || e.creado;
        const dias = Math.round((new Date(hoy()) - new Date(dia(ult))) / 86400e3);
        if (dias >= um.dias_inactividad && !yaAvisada("inactividad", null, ult)) {
          db.alertas.push({ id: uuid(), estudiante_id: e.id, tipo: "inactividad", detalle: { dias }, sugerencia: `Hola ${nom}, hace ${dias} días no te veo por aquí. Te dejé un reto corto de 5 preguntas para retomar el ritmo sin presión.`, estado: "abierta", creado: ahora() }); n++;
        }
        const t7 = new Date(Date.now() - 7 * 86400e3).toISOString(), t28 = new Date(Date.now() - 28 * 86400e3).toISOString();
        for (const c of [...LECTURA, ...LOGICA]) {
          const rc = rs.filter((r) => pregunta(r.pregunta_id)?.categoria === c && r.creado > t28);
          const a = rc.filter((r) => r.creado > t7), b = rc.filter((r) => r.creado <= t7);
          if (a.length < um.minimo_respuestas || b.length < um.minimo_respuestas) continue;
          const ahoraP = Math.round((100 * a.filter((r) => r.correcta).length) / a.length), antes = Math.round((100 * b.filter((r) => r.correcta).length) / b.length);
          if (antes - ahoraP >= um.caida_puntos && !yaAvisada("caida", c, hace7)) {
            db.alertas.push({ id: uuid(), estudiante_id: e.id, tipo: "caida", detalle: { categoria: c, antes, ahora: ahoraP, componente: compDe(c) }, sugerencia: `${nom}, esta semana ${nombres[c]} se puso más difícil. Te armé una misión de 10 preguntas para trabajarlo juntos; después me cuentas cuál te costó más.`, estado: "abierta", creado: ahora() }); n++;
          }
        }
      }
      guardar();
      return n;
    },
    async alertas() {
      soloTutor();
      return espera(db.alertas.filter((a) => a.estado === "abierta").map((a) => { const u = db.usuarios.find((x) => x.id === a.estudiante_id); return { ...a, perfiles: { nombre: u.nombre, avatar: u.avatar } }; }));
    },
    async cerrarAlerta(id, estado) { soloTutor(); db.alertas.find((a) => a.id === id).estado = estado; guardar(); },
    async enviarMensaje(m) { soloTutor(); const f = { id: uuid(), autor_id: db.actual, leido: false, completado: false, creado: ahora(), cuerpo: "", ...m }; db.mensajes.push(f); guardar(); return espera(f); },
    async borrarMensaje(id) { soloTutor(); db.mensajes = db.mensajes.filter((m) => m.id !== id); guardar(); },
    async preguntasFalladas(uid) {
      soloTutor();
      const m = {};
      db.respuestas.filter((r) => r.user_id === uid).sort((a, b) => a.creado.localeCompare(b.creado)).forEach((r) => {
        const x = (m[r.pregunta_id] ||= { fallos: 0, intentos: 0 }); x.intentos++; if (!r.correcta) x.fallos++; x.ultima_opcion = r.opcion; x.ult = r.creado;
      });
      return espera(Object.entries(m).filter(([, x]) => x.fallos > 0).sort((a, b) => b[1].fallos - a[1].fallos || b[1].ult.localeCompare(a[1].ult)).slice(0, 15)
        .map(([id, x]) => { const p = pregunta(id); return { id, codigo: p.codigo, categoria: p.categoria, componente: p.componente || "lectura", tema: p.tema || null, dificultad: p.dificultad, enunciado: p.enunciado, opciones: p.opciones, correcta: p.correcta, explicacion: p.explicacion, texto: p.texto_id ? texto(p.texto_id).titulo : "Problema suelto", fallos: x.fallos, intentos: x.intentos, ultima_opcion: x.ultima_opcion, error: errorDe(p, x.ultima_opcion) }; }));
    },
    async resumenContenido() {
      soloTutor();
      const act = db.preguntas.filter((p) => p.activo);
      const matriz = {}, temas = {};
      act.forEach((p) => { (matriz[p.categoria] ||= {})[p.dificultad] = (matriz[p.categoria][p.dificultad] || 0) + 1; if (p.tema) temas[p.tema] = (temas[p.tema] || 0) + 1; });
      const paq = {};
      db.preguntas.forEach((p) => (paq[p.paquete] = (paq[p.paquete] || 0) + 1));
      return espera({
        textos: db.textos.filter((t) => t.activo && t.componente !== "logica").length,
        situaciones: db.textos.filter((t) => t.activo && t.componente === "logica").length,
        preguntas: act.filter((p) => p.componente !== "logica").length,
        preguntas_logica: act.filter((p) => p.componente === "logica").length,
        tecnicas: db.tecnicas.filter((t) => t.activo).length, temas,
        matriz, paquetes: Object.entries(paq).sort().map(([paquete, preguntas]) => ({ paquete, preguntas }))
      });
    },
    async importarPaquete(p) { soloTutor(); const r = aplicar(p); guardar(); return espera(r); }
  };
};
