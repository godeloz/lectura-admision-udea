-- Imitación mínima de Supabase para pruebas locales
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema if not exists auth;
-- Como en Supabase, pgcrypto vive en el esquema «extensions».
create schema if not exists extensions;
create extension if not exists pgcrypto schema extensions;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
-- Columnas de auth.users e identities que usan crear_usuario y compañía (las mismas de Supabase)
alter table auth.users add column if not exists instance_id uuid;
alter table auth.users add column if not exists aud varchar(255);
alter table auth.users add column if not exists role varchar(255);
alter table auth.users add column if not exists encrypted_password varchar(255);
alter table auth.users add column if not exists email_confirmed_at timestamptz;
alter table auth.users add column if not exists raw_app_meta_data jsonb;
alter table auth.users add column if not exists created_at timestamptz;
alter table auth.users add column if not exists updated_at timestamptz;
alter table auth.users add column if not exists confirmation_token varchar(255);
alter table auth.users add column if not exists recovery_token varchar(255);
alter table auth.users add column if not exists email_change_token_new varchar(255);
alter table auth.users add column if not exists email_change varchar(255);
alter table auth.users add column if not exists email_change_token_current varchar(255) default '';
alter table auth.users add column if not exists phone_change text default '';
alter table auth.users add column if not exists phone_change_token varchar(255) default '';
alter table auth.users add column if not exists reauthentication_token varchar(255) default '';
alter table auth.users add column if not exists banned_until timestamptz;
create table if not exists auth.identities (
  provider_id text not null, user_id uuid not null references auth.users on delete cascade,
  identity_data jsonb not null, provider text not null, last_sign_in_at timestamptz,
  created_at timestamptz, updated_at timestamptz,
  email text generated always as (lower(identity_data->>'email')) stored,
  id uuid primary key default gen_random_uuid(), unique (provider_id, provider));
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
