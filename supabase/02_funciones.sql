-- =====================================================================
--  ENTRELÍNEAS · 02 · FUNCIONES
--  La lógica que no debe poder manipularse desde el navegador
--  (calificar, dar XP, otorgar insignias) corre aquí.
--  Se puede volver a ejecutar completo cuando haya una versión nueva.
-- =====================================================================

-- ---------- Utilidades ----------------------------------------------
create or replace function hoy() returns date
language sql stable as $$ select (now() at time zone 'America/Bogota')::date $$;

create or replace function dia(ts timestamptz) returns date
language sql immutable as $$ select (ts at time zone 'America/Bogota')::date $$;

create or replace function cfg(p_clave text) returns jsonb
language sql stable security definer set search_path = public as $$
  select valor from app_config where clave = p_clave
$$;

create or replace function puede_ver(p_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_uid = auth.uid() or es_tutor()
$$;

-- ---------- Dominio por categoría (0-100) ---------------------------
-- Últimas 30 respuestas por categoría, ponderadas por dificultad.
-- Arranca en 35 para que las primeras preguntas sean amables.
create or replace function dominio_categorias(p_uid uuid)
returns table (categoria text, dominio integer, respondidas integer)
language sql stable security definer set search_path = public as $$
  with cats(categoria) as (values ('literal'),('inferencial'),('critico'),('cohesion')),
  ult as (
    select p.categoria, p.dificultad, r.correcta,
           row_number() over (partition by p.categoria order by r.creado desc) rn
    from respuestas r join preguntas p on p.id = r.pregunta_id
    where r.user_id = p_uid and puede_ver(p_uid)
  )
  select c.categoria,
         round(100.0 * (coalesce(sum(case when u.correcta then u.dificultad end), 0) + 0.7)
                     / (coalesce(sum(u.dificultad), 0) + 2))::int,
         count(u.dificultad)::int
  from cats c left join ult u on u.categoria = c.categoria and u.rn <= 30
  group by c.categoria
$$;

-- ---------- Rachas ---------------------------------------------------
create or replace function rachas(p_uid uuid, out actual integer, out mejor integer)
language plpgsql stable security definer set search_path = public as $$
declare
  v_ult date;
begin
  with dias as (
    select distinct dia(creado) d from respuestas where user_id = p_uid
  ), grupos as (
    select d, d - (row_number() over (order by d))::int g from dias
  ), islas as (
    select min(d) ini, max(d) fin, count(*)::int largo from grupos group by g
  )
  select coalesce(max(largo), 0),
         coalesce((select largo from islas order by fin desc limit 1), 0),
         (select max(fin) from islas)
    into mejor, actual, v_ult
  from islas;
  if v_ult is null or v_ult < hoy() - 1 then actual := 0; end if;
end $$;

-- ---------- Selección adaptativa -------------------------------------
create or replace function seleccionar_preguntas(p_uid uuid, p_n integer, p_categoria text)
returns uuid[]
language plpgsql volatile security definer set search_path = public as $$
declare
  v_dist  jsonb := coalesce(cfg('distribucion'), '{"literal":0.2,"inferencial":0.35,"critico":0.3,"cohesion":0.15}');
  v_rep_n integer := greatest(0, round(p_n * coalesce((cfg('retos')->>'repaso')::numeric, 0.2)))::int;
  v_rep   uuid[];
  v_sel   uuid[];
begin
  -- 1. Repaso espaciado: preguntas cuya última respuesta fue incorrecta (hace más de ~1 día).
  select coalesce(array_agg(id), '{}') into v_rep from (
    select u.pregunta_id id
    from (select distinct on (pregunta_id) pregunta_id, correcta, creado
            from respuestas where user_id = p_uid order by pregunta_id, creado desc) u
    join preguntas p on p.id = u.pregunta_id
    where p.activo and not u.correcta and u.creado < now() - interval '20 hours'
      and (p_categoria is null or p.categoria = p_categoria)
    order by u.creado limit v_rep_n
  ) x;

  -- 2. Preguntas nuevas, repartidas por categoría y ajustadas a su nivel.
  with ult as (
    select distinct on (pregunta_id) pregunta_id, correcta, creado
    from respuestas where user_id = p_uid order by pregunta_id, creado desc
  ), dom as (
    select categoria, dominio from dominio_categorias(p_uid)
  ), cand as (
    select p.id, p.categoria,
           row_number() over (partition by p.categoria order by
             abs(p.dificultad - case when d.dominio < 45 then 1 when d.dominio < 75 then 2 else 3 end)
             + case when u.pregunta_id is null then 0 else 1.5 end
             + random()) rn
    from preguntas p
    left join ult u on u.pregunta_id = p.id
    left join dom d on d.categoria = p.categoria
    where p.activo and not (p.id = any(v_rep))
      and (u.pregunta_id is null or u.creado < now() - interval '30 days')
      and (p_categoria is null or p.categoria = p_categoria)
  )
  select coalesce(array_agg(c.id), '{}') into v_sel
  from cand c
  where c.rn <= case when p_categoria is not null then p_n
                     else greatest(1, round((p_n - cardinality(v_rep)) * coalesce((v_dist->>c.categoria)::numeric, 0.25)))::int end;

  v_sel := v_rep || v_sel;

  -- 3. Si el banco se queda corto, completa con cualquier pregunta activa.
  if cardinality(v_sel) < p_n then
    v_sel := v_sel || coalesce((select array_agg(id) from (
      select id from preguntas
      where activo and not (id = any(v_sel)) and (p_categoria is null or categoria = p_categoria)
      order by random() limit p_n - cardinality(v_sel)) z), '{}');
  end if;

  v_sel := v_sel[1:p_n];
  -- Agrupa por texto para no saltar de lectura en lectura.
  return coalesce((select array_agg(id order by texto_id, codigo) from preguntas where id = any(v_sel)), '{}');
end $$;

-- Paquete de preguntas sin la clave de respuesta.
create or replace function empaquetar(p_ids uuid[]) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'preguntas', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'texto_id', p.texto_id, 'categoria', p.categoria,
        'dificultad', p.dificultad, 'enunciado', p.enunciado, 'opciones', p.opciones)
        order by array_position(p_ids, p.id))
      from preguntas p where p.id = any(p_ids)), '[]'),
    'textos', coalesce((select jsonb_object_agg(t.id, jsonb_build_object(
        'titulo', t.titulo, 'tipologia', t.tipologia, 'contenido', t.contenido, 'fuente', t.fuente))
      from textos t where t.id in (select texto_id from preguntas where id = any(p_ids))), '{}'))
$$;

-- ---------- Retos diarios --------------------------------------------
create or replace function iniciar_reto(p_n integer, p_categoria text default null, p_mensaje uuid default null)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_ids uuid[];
  v_ses uuid;
  v_tipo text := case when p_mensaje is null then 'reto' else 'mision' end;
begin
  if v_uid is null then raise exception 'Sesión no iniciada'; end if;
  if p_n < 1 or p_n > 30 then raise exception 'Cantidad de preguntas no válida'; end if;
  if p_categoria is not null and p_categoria not in ('literal','inferencial','critico','cohesion') then
    raise exception 'Categoría no válida';
  end if;
  if p_mensaje is not null and not exists (select 1 from mensajes where id = p_mensaje and estudiante_id = v_uid) then
    raise exception 'Misión no encontrada';
  end if;

  v_ids := seleccionar_preguntas(v_uid, p_n, p_categoria);
  if cardinality(v_ids) = 0 then raise exception 'Todavía no hay preguntas cargadas'; end if;

  insert into sesiones (user_id, tipo, nivel, total, preguntas, mensaje_id)
  values (v_uid, v_tipo, coalesce(p_categoria, p_n::text), cardinality(v_ids), v_ids, p_mensaje)
  returning id into v_ses;

  return jsonb_build_object('sesion_id', v_ses, 'tipo', v_tipo) || empaquetar(v_ids);
end $$;

create or replace function responder(p_sesion uuid, p_pregunta uuid, p_opcion integer, p_tiempo_ms integer)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  s     sesiones;
  p     preguntas;
  v_ok  boolean;
  v_xp  integer := 0;
  x     jsonb := coalesce(cfg('xp'), '{}');
begin
  select * into s from sesiones where id = p_sesion and user_id = v_uid;
  if s.id is null or s.tipo = 'simulacro' or s.fin is not null then raise exception 'Sesión no válida'; end if;
  if not (p_pregunta = any(s.preguntas)) then raise exception 'La pregunta no es de esta sesión'; end if;
  if exists (select 1 from respuestas where sesion_id = p_sesion and pregunta_id = p_pregunta) then
    raise exception 'Esta pregunta ya fue respondida';
  end if;

  select * into p from preguntas where id = p_pregunta;
  v_ok := (p_opcion = p.correcta);
  if v_ok then
    v_xp := coalesce((x->>'por_acierto')::int, 10) * p.dificultad;
    if p_tiempo_ms between 5000 and coalesce((x->>'segundos_bono')::int, 120) * 1000 then
      v_xp := v_xp + coalesce((x->>'bono_ritmo')::int, 5);
    end if;
  else
    v_xp := coalesce((x->>'por_intento')::int, 2);
  end if;

  insert into respuestas (user_id, pregunta_id, sesion_id, opcion, correcta, tiempo_ms, contexto)
  values (v_uid, p_pregunta, p_sesion, p_opcion, v_ok, least(greatest(p_tiempo_ms, 0), 3600000), s.tipo);
  update sesiones set xp = xp + v_xp where id = p_sesion;
  update perfiles set xp = xp + v_xp where id = v_uid;

  return jsonb_build_object('correcta', v_ok, 'opcion_correcta', p.correcta,
                            'explicacion', p.explicacion, 'xp', v_xp);
end $$;

create or replace function finalizar_reto(p_sesion uuid) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  s     sesiones;
  v_ok  integer;
  v_resp integer;
  v_bono integer := 0;
  x     jsonb := coalesce(cfg('xp'), '{}');
begin
  select * into s from sesiones where id = p_sesion and user_id = v_uid;
  if s.id is null or s.tipo = 'simulacro' then raise exception 'Sesión no válida'; end if;
  if s.fin is not null then return s.resultado; end if;

  select count(*) filter (where correcta), count(*) into v_ok, v_resp
  from respuestas where sesion_id = p_sesion;

  if v_resp = s.total then
    v_bono := coalesce((x->>'reto_completo')::int, 20);
    if v_ok = s.total then v_bono := v_bono + coalesce((x->>'reto_perfecto')::int, 30); end if;
    if s.tipo = 'mision' then v_bono := v_bono + coalesce((x->>'mision')::int, 40); end if;
  end if;

  update perfiles set xp = xp + v_bono where id = v_uid;
  update sesiones set fin = now(), correctas = v_ok, xp = xp + v_bono,
    resultado = jsonb_build_object('correctas', v_ok, 'respondidas', v_resp, 'total', s.total,
                                   'xp', s.xp + v_bono, 'bono', v_bono)
  where id = p_sesion;

  if s.mensaje_id is not null and v_resp = s.total then
    update mensajes set completado = true, sesion_id = p_sesion where id = s.mensaje_id;
  end if;

  return (select resultado from sesiones where id = p_sesion)
         || jsonb_build_object('nuevas_insignias', evaluar_insignias(v_uid), 'xp_total', (select xp from perfiles where id = v_uid));
end $$;

-- ---------- Simulacros -----------------------------------------------
create or replace function iniciar_simulacro(p_nivel text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_conf jsonb := cfg('simulacros')->p_nivel;
  v_n    integer;
  v_min  integer;
  v_obj  numeric;
  v_ids  uuid[];
  s      sesiones;
begin
  if v_uid is null then raise exception 'Sesión no iniciada'; end if;
  if v_conf is null then raise exception 'Nivel de simulacro no válido'; end if;
  v_n   := (v_conf->>'preguntas')::int;
  v_min := (v_conf->>'minutos')::int;
  v_obj := coalesce((v_conf->>'dificultad')::numeric, 2);

  -- Si hay uno abierto y con tiempo, se retoma.
  select * into s from sesiones
  where user_id = v_uid and tipo = 'simulacro' and fin is null and limite > now()
  order by inicio desc limit 1;
  if s.id is not null then
    return jsonb_build_object('sesion_id', s.id, 'nivel', s.nivel, 'limite', s.limite,
                              'ahora', now(), 'retomado', true) || empaquetar(s.preguntas);
  end if;
  -- Los vencidos sin entregar se cierran como abandonados.
  update sesiones set fin = now(), correctas = 0, resultado = '{"abandonado":true}'
  where user_id = v_uid and tipo = 'simulacro' and fin is null;

  -- Como en el examen real: textos completos con todas sus preguntas.
  with t as (
    select p.texto_id, count(*) n, avg(p.dificultad) dif
    from preguntas p join textos x on x.id = p.texto_id and x.activo
    where p.activo group by p.texto_id
  ), orden as (
    select texto_id, n, sum(n) over (order by abs(dif - v_obj) + random() * 1.2) acum from t
  )
  select array_agg(p.id order by o.acum, p.codigo) into v_ids
  from orden o join preguntas p on p.texto_id = o.texto_id and p.activo
  where o.acum - o.n < v_n;

  v_ids := v_ids[1:v_n];
  if v_ids is null or cardinality(v_ids) = 0 then raise exception 'Todavía no hay preguntas cargadas'; end if;

  insert into sesiones (user_id, tipo, nivel, total, preguntas, limite)
  values (v_uid, 'simulacro', p_nivel, cardinality(v_ids), v_ids,
          now() + make_interval(mins => round(v_min * cardinality(v_ids)::numeric / v_n)::int))
  returning * into s;

  return jsonb_build_object('sesion_id', s.id, 'nivel', s.nivel, 'limite', s.limite,
                            'ahora', now(), 'retomado', false) || empaquetar(v_ids);
end $$;

-- p_respuestas: {"<pregunta_id>": {"opcion": 2, "tiempo_ms": 61000}, ...}
create or replace function entregar_simulacro(p_sesion uuid, p_respuestas jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  s       sesiones;
  v_ok    integer;
  v_xp    integer;
  v_pct   numeric;
  v_res   jsonb;
  v_tarde boolean;
  x       jsonb := coalesce(cfg('xp'), '{}');
begin
  select * into s from sesiones where id = p_sesion and user_id = v_uid and tipo = 'simulacro';
  if s.id is null then raise exception 'Simulacro no encontrado'; end if;
  if s.fin is not null then return s.resultado; end if;
  v_tarde := now() > s.limite + interval '3 minutes';

  insert into respuestas (user_id, pregunta_id, sesion_id, opcion, correcta, tiempo_ms, contexto)
  select v_uid, p.id, p_sesion,
         (p_respuestas->(p.id::text)->>'opcion')::smallint,
         coalesce((p_respuestas->(p.id::text)->>'opcion')::int = p.correcta, false),
         (p_respuestas->(p.id::text)->>'tiempo_ms')::int,
         'simulacro'
  from preguntas p where p.id = any(s.preguntas);

  select count(*) filter (where correcta) into v_ok from respuestas where sesion_id = p_sesion;
  v_pct := round(100.0 * v_ok / greatest(s.total, 1), 1);
  v_xp  := v_ok * coalesce((x->>'simulacro_acierto')::int, 12) + coalesce((x->>'simulacro_completo')::int, 60);

  v_res := jsonb_build_object(
    'correctas', v_ok, 'total', s.total, 'puntaje', v_pct, 'xp', v_xp, 'tarde', v_tarde,
    'respondidas', (select count(*) from respuestas where sesion_id = p_sesion and opcion is not null),
    'minutos', round(extract(epoch from (least(now(), s.limite) - s.inicio)) / 60.0, 1),
    'por_categoria', (
      select jsonb_object_agg(categoria, jsonb_build_object('correctas', c, 'total', t))
      from (select p.categoria, count(*) filter (where r.correcta) c, count(*) t
            from respuestas r join preguntas p on p.id = r.pregunta_id
            where r.sesion_id = p_sesion group by p.categoria) z),
    'detalle', (
      select jsonb_agg(jsonb_build_object(
        'pregunta_id', p.id, 'texto_id', p.texto_id, 'categoria', p.categoria,
        'enunciado', p.enunciado, 'opciones', p.opciones, 'elegida', r.opcion,
        'correcta', p.correcta, 'acierto', r.correcta, 'explicacion', p.explicacion)
        order by array_position(s.preguntas, p.id))
      from respuestas r join preguntas p on p.id = r.pregunta_id where r.sesion_id = p_sesion));

  update sesiones set fin = now(), correctas = v_ok, xp = v_xp, resultado = v_res where id = p_sesion;
  update perfiles set xp = xp + v_xp where id = v_uid;

  return v_res || jsonb_build_object('nuevas_insignias', evaluar_insignias(v_uid),
                                     'xp_total', (select xp from perfiles where id = v_uid));
end $$;

-- Detalle de una sesión pasada (para revisar un simulacro).
create or replace function detalle_sesion(p_sesion uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s sesiones;
begin
  select * into s from sesiones where id = p_sesion;
  if s.id is null or not puede_ver(s.user_id) then raise exception 'Sesión no encontrada'; end if;
  return jsonb_build_object('sesion', to_jsonb(s) - 'preguntas', 'textos', empaquetar(s.preguntas)->'textos');
end $$;

-- ---------- Tiempo de estudio ---------------------------------------
create or replace function registrar_tiempo(p_segundos integer) returns void
language sql volatile security definer set search_path = public as $$
  insert into actividad_diaria (user_id, fecha, segundos)
  select auth.uid(), hoy(), least(greatest(p_segundos, 0), 90)
  where auth.uid() is not null
  on conflict (user_id, fecha) do update set segundos = actividad_diaria.segundos + excluded.segundos
$$;

-- ---------- Insignias -------------------------------------------------
-- Tipos de regla soportados (añadir insignias nuevas no requiere código):
--   {"tipo":"racha","valor":7}
--   {"tipo":"respuestas","valor":100}                 total respondidas
--   {"tipo":"aciertos","valor":250}                   total correctas
--   {"tipo":"retos","valor":10}                       retos terminados
--   {"tipo":"reto_perfecto","valor":10}               reto de ≥ N preguntas sin fallos
--   {"tipo":"dominio","categoria":"critico","valor":80}
--   {"tipo":"simulacro","nivel":"inicial","valor":0}  puntaje mínimo (%)
--   {"tipo":"minutos","valor":600}                    minutos totales de estudio
--   {"tipo":"misiones","valor":3}                     misiones del tutor cumplidas
--   {"tipo":"remontada"}                              reto ≥80% justo después de uno <50%
create or replace function evaluar_insignias(p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  i      insignias;
  r      jsonb;
  v      integer;
  ok     boolean;
  nuevas jsonb := '[]';
  v_racha integer;
begin
  select actual into v_racha from rachas(p_uid);
  for i in select * from insignias where activo and codigo not in
           (select codigo from insignias_usuario where user_id = p_uid) order by orden loop
    r := i.regla; v := coalesce((r->>'valor')::int, 0); ok := false;
    case r->>'tipo'
      when 'racha' then ok := v_racha >= v;
      when 'respuestas' then ok := (select count(*) from respuestas where user_id = p_uid) >= v;
      when 'aciertos' then ok := (select count(*) from respuestas where user_id = p_uid and correcta) >= v;
      when 'retos' then ok := (select count(*) from sesiones where user_id = p_uid and tipo in ('reto','mision') and fin is not null) >= v;
      when 'reto_perfecto' then ok := exists (select 1 from sesiones where user_id = p_uid and tipo in ('reto','mision')
                                              and fin is not null and total >= v and correctas = total);
      when 'dominio' then ok := exists (select 1 from dominio_categorias(p_uid) d
                                        where d.categoria = r->>'categoria' and d.dominio >= v and d.respondidas >= 15);
      when 'simulacro' then ok := exists (select 1 from sesiones where user_id = p_uid and tipo = 'simulacro'
                                          and nivel = r->>'nivel' and fin is not null
                                          and coalesce((resultado->>'puntaje')::numeric, -1) >= v);
      when 'minutos' then ok := (select coalesce(sum(segundos), 0) / 60 from actividad_diaria where user_id = p_uid) >= v;
      when 'misiones' then ok := (select count(*) from mensajes where estudiante_id = p_uid and tipo = 'mision' and completado) >= v;
      when 'remontada' then ok := exists (
        select 1 from (select correctas::numeric / nullif(total, 0) pct,
                              lag(correctas::numeric / nullif(total, 0)) over (order by fin) prev
                       from sesiones where user_id = p_uid and tipo in ('reto','mision') and fin is not null and total >= 5) z
        where z.prev < 0.5 and z.pct >= 0.8);
      else ok := false;
    end case;
    if ok then
      insert into insignias_usuario (user_id, codigo) values (p_uid, i.codigo) on conflict do nothing;
      nuevas := nuevas || jsonb_build_object('codigo', i.codigo, 'nombre', i.nombre,
                                             'descripcion', i.descripcion, 'icono', i.icono, 'color', i.color);
    end if;
  end loop;
  return nuevas;
end $$;

-- ---------- Resumen para perfil y panel -----------------------------
create or replace function resumen_estudiante(p_uid uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := coalesce(p_uid, auth.uid());
  v_r   record;
begin
  if not puede_ver(v_uid) then raise exception 'Sin permiso'; end if;
  select * into v_r from rachas(v_uid);
  return jsonb_build_object(
    'perfil', (select to_jsonb(p) from perfiles p where id = v_uid),
    'racha', v_r.actual, 'mejor_racha', v_r.mejor,
    'minutos_hoy', coalesce((select segundos / 60 from actividad_diaria where user_id = v_uid and fecha = hoy()), 0),
    'minutos_total', (select coalesce(sum(segundos), 0) / 60 from actividad_diaria where user_id = v_uid),
    'dias', (select jsonb_agg(jsonb_build_object('fecha', g::date,
                     'minutos', coalesce((select segundos / 60 from actividad_diaria a where a.user_id = v_uid and a.fecha = g::date), 0),
                     'respuestas', (select count(*) from respuestas r where r.user_id = v_uid and dia(r.creado) = g::date))
                     order by g)
             from generate_series((hoy() - 27)::timestamp, hoy()::timestamp, interval '1 day') g),
    'dominio', (select jsonb_agg(to_jsonb(d)) from dominio_categorias(v_uid) d),
    'tendencia', (select jsonb_agg(z order by semana) from (
        select date_trunc('week', dia(r.creado))::date semana, p.categoria,
               round(100.0 * count(*) filter (where r.correcta) / count(*))::int as precision, count(*)::int as n
        from respuestas r join preguntas p on p.id = r.pregunta_id
        where r.user_id = v_uid and r.creado > now() - interval '8 weeks'
        group by 1, 2) z),
    'totales', (select jsonb_build_object(
        'respuestas', count(*), 'aciertos', count(*) filter (where correcta),
        'segundos_promedio', round(avg(tiempo_ms) filter (where tiempo_ms is not null) / 1000.0))
        from respuestas where user_id = v_uid),
    'retos', (select count(*) from sesiones where user_id = v_uid and tipo in ('reto','mision') and fin is not null),
    'insignias', (select coalesce(jsonb_agg(jsonb_build_object('codigo', codigo, 'obtenida', obtenida)), '[]')
                  from insignias_usuario where user_id = v_uid),
    'simulacros', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'nivel', nivel, 'fecha', fin,
                        'correctas', correctas, 'total', total, 'puntaje', resultado->'puntaje',
                        'por_categoria', resultado->'por_categoria') order by fin desc), '[]')
                   from sesiones where user_id = v_uid and tipo = 'simulacro' and fin is not null
                     and not coalesce((resultado->>'abandonado')::boolean, false)),
    'ultima_actividad', (select max(creado) from respuestas where user_id = v_uid)
  );
end $$;

create or replace function actualizar_perfil(p_nombre text, p_avatar text, p_meta text default null) returns void
language sql volatile security definer set search_path = public as $$
  update perfiles set nombre = coalesce(nullif(trim(p_nombre), ''), nombre),
                      avatar = coalesce(nullif(p_avatar, ''), avatar),
                      meta_programa = coalesce(p_meta, meta_programa)
  where id = auth.uid()
$$;

create or replace function marcar_mensaje_leido(p_id uuid) returns void
language sql volatile security definer set search_path = public as $$
  update mensajes set leido = true where id = p_id and estudiante_id = auth.uid()
$$;

create or replace function marcar_novedades_vistas() returns void
language sql volatile security definer set search_path = public as $$
  update perfiles set ultima_novedad = coalesce((select max(id) from novedades), 0) where id = auth.uid()
$$;

-- =====================================================================
--  TUTOR
-- =====================================================================
create or replace function panel_tutor() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_tutor() then raise exception 'Solo para tutores'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id', p.id, 'nombre', p.nombre, 'usuario', p.usuario, 'avatar', p.avatar, 'xp', p.xp,
    'meta_programa', p.meta_programa,
    'racha', (select actual from rachas(p.id)),
    'ultima_actividad', (select max(creado) from respuestas where user_id = p.id),
    'minutos_7d', (select coalesce(sum(segundos), 0) / 60 from actividad_diaria where user_id = p.id and fecha > hoy() - 7),
    'respuestas_7d', (select count(*) from respuestas where user_id = p.id and creado > now() - interval '7 days'),
    'precision_7d', (select round(100.0 * count(*) filter (where correcta) / nullif(count(*), 0)) from respuestas
                      where user_id = p.id and creado > now() - interval '7 days'),
    'alertas', (select count(*) from alertas where estudiante_id = p.id and estado = 'abierta'))
    order by p.nombre)
  from perfiles p where p.rol = 'estudiante' and p.activo), '[]');
end $$;

-- Revisa a cada estudiante y deja alertas con un mensaje sugerido.
-- Se ejecuta cada vez que el tutor abre su panel.
create or replace function generar_alertas() returns integer
language plpgsql volatile security definer set search_path = public as $$
declare
  e       record;
  c       record;
  v_ult   timestamptz;
  v_dias  integer;
  v_n     integer := 0;
  v_umbral jsonb := coalesce(cfg('alertas'), '{"dias_inactividad":3,"caida_puntos":15,"minimo_respuestas":5}');
  v_nom   text;
begin
  if not es_tutor() then raise exception 'Solo para tutores'; end if;
  for e in select id, nombre from perfiles where rol = 'estudiante' and activo loop
    v_nom := split_part(e.nombre, ' ', 1);
    -- Inactividad
    select max(creado) into v_ult from respuestas where user_id = e.id;
    v_dias := hoy() - dia(coalesce(v_ult, (select creado from perfiles where id = e.id)));
    if v_dias >= (v_umbral->>'dias_inactividad')::int
       -- una sola alerta por cada racha de inactividad, aunque el tutor la descarte
       and not exists (select 1 from alertas where estudiante_id = e.id and tipo = 'inactividad'
                       and (estado = 'abierta' or creado > coalesce(v_ult, '-infinity'::timestamptz))) then
      insert into alertas (estudiante_id, tipo, detalle, sugerencia)
      values (e.id, 'inactividad', jsonb_build_object('dias', v_dias),
              format('Hola %s, hace %s días no te veo por aquí. Te dejé un reto corto de 5 preguntas para retomar el ritmo sin presión.', v_nom, v_dias));
      v_n := v_n + 1;
    end if;
    -- Caída en una categoría: últimos 7 días contra los 21 anteriores
    for c in
      select p.categoria,
             round(100.0 * count(*) filter (where r.correcta and r.creado > now() - interval '7 days')
                   / nullif(count(*) filter (where r.creado > now() - interval '7 days'), 0)) ahora,
             round(100.0 * count(*) filter (where r.correcta and r.creado <= now() - interval '7 days')
                   / nullif(count(*) filter (where r.creado <= now() - interval '7 days'), 0)) antes,
             count(*) filter (where r.creado > now() - interval '7 days') n_ahora,
             count(*) filter (where r.creado <= now() - interval '7 days') n_antes
      from respuestas r join preguntas p on p.id = r.pregunta_id
      where r.user_id = e.id and r.creado > now() - interval '28 days'
      group by p.categoria
    loop
      if c.n_ahora >= (v_umbral->>'minimo_respuestas')::int and c.n_antes >= (v_umbral->>'minimo_respuestas')::int
         and c.antes - c.ahora >= (v_umbral->>'caida_puntos')::int
         and not exists (select 1 from alertas where estudiante_id = e.id and tipo = 'caida'
                         and detalle->>'categoria' = c.categoria
                         and (estado = 'abierta' or creado > now() - interval '7 days')) then
        insert into alertas (estudiante_id, tipo, detalle, sugerencia)
        values (e.id, 'caida', jsonb_build_object('categoria', c.categoria, 'antes', c.antes, 'ahora', c.ahora),
                format('%s, esta semana el nivel %s se puso más difícil. Te armé una misión de 10 preguntas para trabajarlo juntos; después me cuentas cuál te costó más.',
                       v_nom, case c.categoria when 'literal' then 'literal' when 'inferencial' then 'inferencial'
                                  when 'critico' then 'crítico' else 'de cohesión' end));
        v_n := v_n + 1;
      end if;
    end loop;
  end loop;
  return v_n;
end $$;

create or replace function preguntas_falladas(p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_tutor() then raise exception 'Solo para tutores'; end if;
  return coalesce((select jsonb_agg(z) from (
    select p.id, p.codigo, p.categoria, p.dificultad, p.enunciado, p.opciones, p.correcta, p.explicacion,
           t.titulo texto, count(*) filter (where not r.correcta) fallos, count(*) intentos,
           (array_agg(r.opcion order by r.creado desc))[1] ultima_opcion
    from respuestas r join preguntas p on p.id = r.pregunta_id join textos t on t.id = p.texto_id
    where r.user_id = p_uid
    group by p.id, t.titulo
    having count(*) filter (where not r.correcta) > 0
    order by fallos desc, max(r.creado) desc limit 15) z), '[]');
end $$;

create or replace function resumen_contenido() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when es_tutor() then jsonb_build_object(
    'textos', (select count(*) from textos where activo),
    'preguntas', (select count(*) from preguntas where activo),
    'matriz', (select jsonb_object_agg(categoria, d) from (
        select categoria, jsonb_object_agg(dificultad, n) d from (
          select categoria, dificultad, count(*) n from preguntas where activo group by 1, 2) a group by 1) b),
    'paquetes', (select coalesce(jsonb_agg(jsonb_build_object('paquete', paquete, 'preguntas', n)), '[]') from (
        select paquete, count(*) n from preguntas group by paquete order by paquete) c))
  else null end
$$;

-- ---------- Paquetes de actualización --------------------------------
-- Un paquete JSON puede traer: textos con preguntas, insignias,
-- configuración y una novedad para mostrar a la estudiante.
-- Es idempotente: reimportar el mismo paquete actualiza, no duplica.
create or replace function aplicar_paquete(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  t      jsonb;
  q      jsonb;
  v_tid  uuid;
  v_nt   integer := 0;
  v_nq   integer := 0;
  v_ni   integer := 0;
  v_nc   integer := 0;
  v_paq  text := coalesce(p->>'paquete', 'sin-nombre');
  k      text;
begin
  for t in select * from jsonb_array_elements(coalesce(p->'textos', '[]')) loop
    insert into textos (codigo, titulo, tipologia, contenido, fuente, paquete, activo)
    values (t->>'codigo', t->>'titulo', coalesce(t->>'tipologia', 'otro'), t->>'contenido', t->>'fuente', v_paq,
            coalesce((t->>'activo')::boolean, true))
    on conflict (codigo) do update set titulo = excluded.titulo, tipologia = excluded.tipologia,
      contenido = excluded.contenido, fuente = excluded.fuente, paquete = excluded.paquete, activo = excluded.activo
    returning id into v_tid;
    v_nt := v_nt + 1;

    for q in select * from jsonb_array_elements(coalesce(t->'preguntas', '[]')) loop
      insert into preguntas (codigo, texto_id, categoria, dificultad, enunciado, opciones, correcta, explicacion, paquete, activo)
      values (q->>'codigo', v_tid, q->>'categoria', coalesce((q->>'dificultad')::int, 2), q->>'enunciado',
              q->'opciones', (q->>'correcta')::int, coalesce(q->>'explicacion', ''), v_paq,
              coalesce((q->>'activo')::boolean, true))
      on conflict (codigo) do update set texto_id = excluded.texto_id, categoria = excluded.categoria,
        dificultad = excluded.dificultad, enunciado = excluded.enunciado, opciones = excluded.opciones,
        correcta = excluded.correcta, explicacion = excluded.explicacion, paquete = excluded.paquete,
        activo = excluded.activo;
      v_nq := v_nq + 1;
    end loop;
  end loop;

  for q in select * from jsonb_array_elements(coalesce(p->'insignias', '[]')) loop
    insert into insignias (codigo, nombre, descripcion, icono, color, regla, orden, activo)
    values (q->>'codigo', q->>'nombre', q->>'descripcion', coalesce(q->>'icono', '⭐'), coalesce(q->>'color', 'rosa'),
            q->'regla', coalesce((q->>'orden')::int, 100), coalesce((q->>'activo')::boolean, true))
    on conflict (codigo) do update set nombre = excluded.nombre, descripcion = excluded.descripcion,
      icono = excluded.icono, color = excluded.color, regla = excluded.regla, orden = excluded.orden,
      activo = excluded.activo;
    v_ni := v_ni + 1;
  end loop;

  for k in select jsonb_object_keys(coalesce(p->'config', '{}')) loop
    insert into app_config (clave, valor) values (k, p->'config'->k)
    on conflict (clave) do update set valor = excluded.valor;
    v_nc := v_nc + 1;
  end loop;

  if p ? 'novedad' then
    insert into novedades (version, titulo, cuerpo)
    values (p->'novedad'->>'version', p->'novedad'->>'titulo', p->'novedad'->>'cuerpo');
  end if;

  return jsonb_build_object('paquete', v_paq, 'textos', v_nt, 'preguntas', v_nq,
                            'insignias', v_ni, 'config', v_nc, 'novedad', p ? 'novedad');
end $$;

create or replace function importar_paquete(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  if not es_tutor() then raise exception 'Solo para tutores'; end if;
  return aplicar_paquete(p);
end $$;

-- Permisos de ejecución
revoke execute on all functions in schema public from anon, public;
grant execute on all functions in schema public to authenticated;
revoke execute on function aplicar_paquete(jsonb) from authenticated;
revoke execute on function evaluar_insignias(uuid) from authenticated;
revoke execute on function seleccionar_preguntas(uuid, integer, text) from authenticated;
