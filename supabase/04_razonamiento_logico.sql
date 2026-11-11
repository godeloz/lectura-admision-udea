-- =====================================================================
--  ENTRELÍNEAS · 04 · RAZONAMIENTO LÓGICO (migración, versión 1.1.0)
--  Añade el segundo componente del examen sin tocar nada de lo que ya
--  existe: solo agrega columnas, una tabla y amplía dos listas de
--  valores permitidos. Se puede ejecutar más de una vez.
--
--  En una base que ya está en uso:   04  y después  02_funciones.sql
--  En una instalación desde cero:    01, 04, 02, 03
-- =====================================================================

-- ---------- Preguntas ------------------------------------------------
alter table preguntas add column if not exists componente text not null default 'lectura';
alter table preguntas add column if not exists tema    text;    -- código de la técnica (tabla tecnicas)
alter table preguntas add column if not exists pista   text;    -- primer movimiento, sin dar la respuesta
alter table preguntas add column if not exists pasos   jsonb;   -- ["paso 1", "paso 2", ...]
alter table preguntas add column if not exists errores jsonb;   -- 4 posiciones, alineadas con las opciones: {"tipo","nota"} o null
alter table preguntas add column if not exists figura  text;    -- SVG; el navegador lo limpia antes de pintarlo

-- Una pregunta de lógica puede ir suelta, sin situación compartida.
alter table preguntas alter column texto_id drop not null;

-- Amplía las categorías permitidas (las cuatro de lectura y las cuatro de lógica).
do $$
declare r record;
begin
  for r in select conname from pg_constraint
           where conrelid = 'public.preguntas'::regclass and contype = 'c'
             and (pg_get_constraintdef(oid) ilike '%categoria%' or pg_get_constraintdef(oid) ilike '%componente%') loop
    execute format('alter table preguntas drop constraint %I', r.conname);
  end loop;
  for r in select conname from pg_constraint
           where conrelid = 'public.textos'::regclass and contype = 'c'
             and (pg_get_constraintdef(oid) ilike '%tipologia%' or pg_get_constraintdef(oid) ilike '%componente%') loop
    execute format('alter table textos drop constraint %I', r.conname);
  end loop;
  for r in select conname from pg_constraint
           where conrelid = 'public.sesiones'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) ilike '%componente%' loop
    execute format('alter table sesiones drop constraint %I', r.conname);
  end loop;
end $$;

alter table preguntas add constraint preguntas_categoria_check
  check (categoria in ('literal','inferencial','critico','cohesion',
                       'deductivo','proporcional','abstracto','geometrico'));
alter table preguntas add constraint preguntas_componente_check
  check (componente in ('lectura','logica'));
create index if not exists preguntas_comp_idx on preguntas(componente, categoria, dificultad) where activo;
create index if not exists preguntas_tema_idx on preguntas(tema) where activo;

-- ---------- Textos: las «situaciones» de lógica viven en la misma tabla
alter table textos add column if not exists componente text not null default 'lectura';
alter table textos add column if not exists figura text;
alter table textos add constraint textos_tipologia_check
  check (tipologia in ('ensayo','divulgacion','literario','discontinuo','intertextual',
                       'argumentativo','periodistico','otro','situacion'));
alter table textos add constraint textos_componente_check
  check (componente in ('lectura','logica'));

-- ---------- Sesiones y respuestas -----------------------------------
alter table sesiones add column if not exists componente text not null default 'lectura';
alter table sesiones add constraint sesiones_componente_check
  check (componente in ('lectura','logica'));
alter table respuestas add column if not exists pista boolean not null default false;

-- ---------- Técnicas: la «caja de herramientas» ----------------------
create table if not exists tecnicas (
  codigo      text primary key,
  componente  text not null default 'logica',
  categoria   text not null,
  nombre      text not null,
  cuando      text not null default '',     -- cuándo se usa
  pasos       jsonb not null default '[]',  -- el procedimiento, paso a paso
  ejemplo     text not null default '',     -- un ejemplo resuelto
  trampa      text not null default '',     -- el error típico
  orden       integer not null default 100,
  activo      boolean not null default true
);

alter table tecnicas enable row level security;
drop policy if exists p_tecnicas_sel on tecnicas;
create policy p_tecnicas_sel on tecnicas for select using (auth.role() = 'authenticated');
drop policy if exists p_tecnicas_all on tecnicas;
create policy p_tecnicas_all on tecnicas for all using (es_tutor()) with check (es_tutor());

-- Avisa a la API de Supabase que relea las funciones y tablas (por si no lo hace sola).
notify pgrst, 'reload schema';
