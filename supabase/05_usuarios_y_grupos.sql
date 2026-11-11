-- =====================================================================
--  ENTRELÍNEAS · 05 · USUARIOS Y GRUPOS (migración, versión 1.2.0)
--  Lo que necesita la app para que el tutor cree cuentas desde el celular,
--  para el cambio de contraseña del primer ingreso y para los grupos.
--  Solo agrega columnas y tablas: no toca el progreso de nadie.
--  Se puede ejecutar más de una vez.
--
--  En una base que ya está en uso:   05  y después  02_funciones.sql
--  En una instalación desde cero:    01, 04, 05, 02, 03
-- =====================================================================

-- ---------- Perfiles -------------------------------------------------
alter table perfiles add column if not exists correo text;
-- true mientras la persona no haya cambiado la contraseña temporal
alter table perfiles add column if not exists debe_cambiar_clave boolean not null default false;
-- cuándo abrió la app por primera vez desde el ícono instalado en el celular
alter table perfiles add column if not exists instalada timestamptz;

-- El correo de las cuentas que ya existían (para verlo en Personas).
update perfiles p set correo = lower(u.email)
from auth.users u where u.id = p.id and p.correo is null;

-- Perfil automático al crear una cuenta. Ahora guarda el correo y evita que
-- dos correos con la misma parte inicial (ana@gmail.com y ana@hotmail.com)
-- choquen en el nombre de usuario: el segundo queda como «ana2».
create or replace function crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_base    text := coalesce(nullif(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9._-]', '', 'g'), ''), 'usuario');
  v_usuario text := v_base;
  v_n       integer := 1;
begin
  while exists (select 1 from perfiles where usuario = v_usuario and id <> new.id) loop
    v_n := v_n + 1;
    v_usuario := v_base || v_n;
  end loop;
  insert into perfiles (id, nombre, usuario, correo, debe_cambiar_clave)
  values (new.id,
          coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), initcap(split_part(new.email, '@', 1))),
          v_usuario,
          lower(new.email),
          coalesce((new.raw_user_meta_data->>'debe_cambiar_clave')::boolean, false))
  on conflict (id) do nothing;
  return new;
end $$;

-- ---------- Grupos ---------------------------------------------------
-- Quien está en un grupo ve, de sus compañeros, el esfuerzo de la semana
-- (XP ganado, días con práctica, racha) y la actividad reciente. Nunca sus
-- respuestas, sus errores, sus mensajes ni sus alertas: eso lo entrega solo
-- la función grupo_semana(), no las tablas.
create table if not exists grupos (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  descripcion     text not null default '',
  emoji           text not null default '👥',
  ver_simulacros  boolean not null default false,  -- los compañeros ven los puntajes de simulacro
  activo          boolean not null default true,
  creado_por      uuid references perfiles on delete set null,
  creado          timestamptz not null default now()
);

create table if not exists grupo_miembros (
  grupo_id  uuid not null references grupos on delete cascade,
  user_id   uuid not null references perfiles on delete cascade,
  desde     timestamptz not null default now(),
  primary key (grupo_id, user_id)
);
create index if not exists grupo_miembros_user_idx on grupo_miembros(user_id);

alter table grupos enable row level security;
alter table grupo_miembros enable row level security;

-- El tutor administra todo. Cada estudiante ve los grupos donde está y su
-- propia fila de membresía; a sus compañeros los ve a través de grupo_semana().
drop policy if exists p_grupos_sel on grupos;
create policy p_grupos_sel on grupos for select using (
  es_tutor() or exists (select 1 from grupo_miembros m where m.grupo_id = grupos.id and m.user_id = auth.uid()));
drop policy if exists p_grupos_all on grupos;
create policy p_grupos_all on grupos for all using (es_tutor()) with check (es_tutor());

drop policy if exists p_gm_sel on grupo_miembros;
create policy p_gm_sel on grupo_miembros for select using (user_id = auth.uid() or es_tutor());
drop policy if exists p_gm_all on grupo_miembros;
create policy p_gm_all on grupo_miembros for all using (es_tutor()) with check (es_tutor());

-- Más adelante, para tutores que acompañen solo a algunos grupos: un rol nuevo
-- en perfiles (por ejemplo 'tutor_grupo'), una tabla grupo_tutores y que
-- puede_ver() en 02_funciones.sql acepte a los estudiantes de esos grupos.
-- Todas las funciones preguntan por permisos a través de es_tutor() y
-- puede_ver(), así que el cambio queda concentrado ahí.

-- Avisa a la API de Supabase que relea las funciones y tablas (por si no lo hace sola).
notify pgrst, 'reload schema';
