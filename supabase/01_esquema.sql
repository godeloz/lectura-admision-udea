-- =====================================================================
--  ENTRELÍNEAS · 01 · ESQUEMA
--  Ejecutar primero en Supabase > SQL Editor.
--  Todo lo que cambia con el tiempo (preguntas, insignias, rangos,
--  tiempos, distribución) vive en tablas, no en el código.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Perfiles ------------------------------------------------
create table if not exists perfiles (
  id              uuid primary key references auth.users on delete cascade,
  nombre          text not null default 'Estudiante',
  usuario         text unique,
  rol             text not null default 'estudiante' check (rol in ('estudiante','tutor')),
  avatar          text not null default '🎧',
  xp              integer not null default 0,
  meta_programa   text,
  ultima_novedad  integer not null default 0,
  activo          boolean not null default true,
  creado          timestamptz not null default now()
);

-- ---------- Contenido ----------------------------------------------
create table if not exists textos (
  id         uuid primary key default gen_random_uuid(),
  codigo     text unique not null,
  titulo     text not null,
  tipologia  text not null default 'otro'
             check (tipologia in ('ensayo','divulgacion','literario','discontinuo','intertextual','argumentativo','periodistico','otro')),
  contenido  text not null,
  fuente     text,
  paquete    text,
  activo     boolean not null default true,
  creado     timestamptz not null default now()
);

create table if not exists preguntas (
  id          uuid primary key default gen_random_uuid(),
  codigo      text unique not null,
  texto_id    uuid not null references textos on delete cascade,
  categoria   text not null check (categoria in ('literal','inferencial','critico','cohesion')),
  dificultad  smallint not null default 2 check (dificultad between 1 and 3),
  enunciado   text not null,
  opciones    jsonb not null check (jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) = 4),
  correcta    smallint not null check (correcta between 0 and 3),
  explicacion text not null default '',
  paquete     text,
  activo      boolean not null default true,
  creado      timestamptz not null default now()
);
create index if not exists preguntas_texto_idx on preguntas(texto_id);
create index if not exists preguntas_cat_idx on preguntas(categoria, dificultad) where activo;

-- ---------- Actividad ----------------------------------------------
create table if not exists sesiones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references perfiles on delete cascade,
  tipo        text not null check (tipo in ('reto','simulacro','mision')),
  nivel       text,
  total       integer not null default 0,
  correctas   integer,
  xp          integer not null default 0,
  preguntas   uuid[] not null default '{}',
  mensaje_id  uuid,
  inicio      timestamptz not null default now(),
  limite      timestamptz,
  fin         timestamptz,
  resultado   jsonb
);
create index if not exists sesiones_user_idx on sesiones(user_id, inicio desc);

create table if not exists respuestas (
  id           bigserial primary key,
  user_id      uuid not null references perfiles on delete cascade,
  pregunta_id  uuid not null references preguntas on delete cascade,
  sesion_id    uuid references sesiones on delete set null,
  opcion       smallint,
  correcta     boolean not null,
  tiempo_ms    integer,
  contexto     text not null check (contexto in ('reto','simulacro','mision')),
  creado       timestamptz not null default now()
);
create index if not exists respuestas_user_idx on respuestas(user_id, creado desc);
create index if not exists respuestas_user_preg_idx on respuestas(user_id, pregunta_id, creado desc);

create table if not exists actividad_diaria (
  user_id   uuid not null references perfiles on delete cascade,
  fecha     date not null,
  segundos  integer not null default 0,
  primary key (user_id, fecha)
);

-- ---------- Gamificación (configurable) -----------------------------
create table if not exists insignias (
  codigo       text primary key,
  nombre       text not null,
  descripcion  text not null,
  icono        text not null default '⭐',
  color        text not null default 'rosa',
  regla        jsonb not null,
  orden        integer not null default 100,
  activo       boolean not null default true
);

create table if not exists insignias_usuario (
  user_id   uuid not null references perfiles on delete cascade,
  codigo    text not null references insignias on delete cascade,
  obtenida  timestamptz not null default now(),
  primary key (user_id, codigo)
);

create table if not exists app_config (
  clave  text primary key,
  valor  jsonb not null
);

create table if not exists novedades (
  id      serial primary key,
  version text,
  titulo  text not null,
  cuerpo  text not null,
  creado  timestamptz not null default now()
);

-- ---------- Tutoría --------------------------------------------------
create table if not exists mensajes (
  id             uuid primary key default gen_random_uuid(),
  estudiante_id  uuid not null references perfiles on delete cascade,
  autor_id       uuid references perfiles on delete set null,
  tipo           text not null check (tipo in ('mensaje','mision','comentario')),
  titulo         text not null,
  cuerpo         text not null default '',
  mision         jsonb,          -- {"categoria":"critico","n":10}
  pregunta_id    uuid references preguntas on delete set null,
  leido          boolean not null default false,
  completado     boolean not null default false,
  sesion_id      uuid,
  creado         timestamptz not null default now()
);
create index if not exists mensajes_est_idx on mensajes(estudiante_id, creado desc);

create table if not exists alertas (
  id             uuid primary key default gen_random_uuid(),
  estudiante_id  uuid not null references perfiles on delete cascade,
  tipo           text not null,  -- inactividad | caida
  detalle        jsonb,
  sugerencia     text,
  estado         text not null default 'abierta' check (estado in ('abierta','atendida','descartada')),
  creado         timestamptz not null default now()
);

-- =====================================================================
--  SEGURIDAD
-- =====================================================================
create or replace function es_tutor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from perfiles where id = auth.uid() and rol = 'tutor' and activo);
$$;

alter table perfiles           enable row level security;
alter table textos             enable row level security;
alter table preguntas          enable row level security;
alter table sesiones           enable row level security;
alter table respuestas         enable row level security;
alter table actividad_diaria   enable row level security;
alter table insignias          enable row level security;
alter table insignias_usuario  enable row level security;
alter table app_config         enable row level security;
alter table novedades          enable row level security;
alter table mensajes           enable row level security;
alter table alertas            enable row level security;

-- Lectura: cada estudiante ve lo suyo; el tutor ve todo.
drop policy if exists p_perfiles_sel on perfiles;
create policy p_perfiles_sel on perfiles for select using (id = auth.uid() or es_tutor());
drop policy if exists p_perfiles_upd on perfiles;
create policy p_perfiles_upd on perfiles for update using (es_tutor());

drop policy if exists p_textos_sel on textos;
create policy p_textos_sel on textos for select using (auth.role() = 'authenticated');
drop policy if exists p_textos_all on textos;
create policy p_textos_all on textos for all using (es_tutor()) with check (es_tutor());

-- Las preguntas (con su respuesta correcta) solo las ve el tutor.
-- La estudiante las recibe sin clave a través de funciones.
drop policy if exists p_preguntas_all on preguntas;
create policy p_preguntas_all on preguntas for all using (es_tutor()) with check (es_tutor());

drop policy if exists p_sesiones_sel on sesiones;
create policy p_sesiones_sel on sesiones for select using (user_id = auth.uid() or es_tutor());

drop policy if exists p_respuestas_sel on respuestas;
create policy p_respuestas_sel on respuestas for select using (user_id = auth.uid() or es_tutor());

drop policy if exists p_actividad_sel on actividad_diaria;
create policy p_actividad_sel on actividad_diaria for select using (user_id = auth.uid() or es_tutor());

drop policy if exists p_insignias_sel on insignias;
create policy p_insignias_sel on insignias for select using (auth.role() = 'authenticated');
drop policy if exists p_insignias_all on insignias;
create policy p_insignias_all on insignias for all using (es_tutor()) with check (es_tutor());

drop policy if exists p_iu_sel on insignias_usuario;
create policy p_iu_sel on insignias_usuario for select using (user_id = auth.uid() or es_tutor());

drop policy if exists p_config_sel on app_config;
create policy p_config_sel on app_config for select using (auth.role() = 'authenticated');
drop policy if exists p_config_all on app_config;
create policy p_config_all on app_config for all using (es_tutor()) with check (es_tutor());

drop policy if exists p_nov_sel on novedades;
create policy p_nov_sel on novedades for select using (auth.role() = 'authenticated');
drop policy if exists p_nov_all on novedades;
create policy p_nov_all on novedades for all using (es_tutor()) with check (es_tutor());

drop policy if exists p_msg_sel on mensajes;
create policy p_msg_sel on mensajes for select using (estudiante_id = auth.uid() or es_tutor());
drop policy if exists p_msg_all on mensajes;
create policy p_msg_all on mensajes for all using (es_tutor()) with check (es_tutor());

drop policy if exists p_alertas_all on alertas;
create policy p_alertas_all on alertas for all using (es_tutor()) with check (es_tutor());

-- Perfil automático al crear un usuario en Authentication.
create or replace function crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, usuario)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'nombre', initcap(split_part(new.email, '@', 1))),
          lower(split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function crear_perfil();
