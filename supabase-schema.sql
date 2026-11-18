-- Mega Brain v2-3 - Schema PostgreSQL / Supabase
-- Inclui suporte a pastas recursivas, UPSERT idempotente de temas, TNE, histórico e espaço privado.

create extension if not exists "uuid-ossp";

create table if not exists public.themes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  name text not null,
  normalized_name text not null,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, normalized_name, is_private)
);

create table if not exists public.folders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null,
  color text default '#6750A4',
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  folder_id uuid references public.folders(id) on delete set null,
  theme_id uuid references public.themes(id) on delete set null,
  url text not null,
  title text not null,
  thumbnail_url text,
  media_type text not null default 'article',
  what_is text default '',
  why_saved text default '',
  tags text[] not null default '{}',
  is_study boolean not null default false,
  is_private boolean not null default false,
  status text not null default 'active', -- 'active' | 'history' | 'deleted_counted'
  seen_count integer not null default 0,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  title text not null,
  category text not null default 'study', -- 'study' | 'tne'
  is_tne boolean not null default false,
  completed boolean not null default false,
  postponed_count integer not null default 0,
  due_date date,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.consumption_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  item_id uuid,
  title text not null,
  theme_name text,
  is_study boolean not null default false,
  is_private boolean not null default false,
  kept_in_history boolean not null default true,
  consumed_at timestamptz not null default now()
);

-- RPC Idempotente para resolver o bug do segundo link com o mesmo tema
create or replace function public.upsert_theme_and_insert_item(
  p_user_id uuid,
  p_folder_id uuid,
  p_theme_name text,
  p_url text,
  p_title text,
  p_thumbnail_url text,
  p_media_type text,
  p_what_is text,
  p_why_saved text,
  p_tags text[],
  p_is_study boolean,
  p_is_private boolean
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_theme_id uuid;
  v_norm_name text;
  v_item_id uuid;
begin
  v_norm_name := lower(trim(coalesce(p_theme_name, '')));

  if v_norm_name <> '' then
    insert into public.themes (user_id, name, normalized_name, is_private)
    values (p_user_id, trim(p_theme_name), v_norm_name, p_is_private)
    on conflict (user_id, normalized_name, is_private)
    do update set name = excluded.name
    returning id into v_theme_id;
  end if;

  insert into public.items (
    user_id, folder_id, theme_id, url, title, thumbnail_url,
    media_type, what_is, why_saved, tags, is_study, is_private
  )
  values (
    p_user_id, p_folder_id, v_theme_id, p_url, p_title, p_thumbnail_url,
    coalesce(p_media_type, 'article'), coalesce(p_what_is, ''), coalesce(p_why_saved, ''),
    coalesce(p_tags, '{}'), coalesce(p_is_study, false), coalesce(p_is_private, false)
  )
  returning id into v_item_id;

  return v_item_id;
end;
$$;
