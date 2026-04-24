-- VTT Director Tools repair migration.
-- Run this when older projects missed the original map_items / handouts migration.

create extension if not exists pgcrypto;

create table if not exists public.map_items (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid references public.salas(id) on delete cascade,
  cena_id uuid references public.cenas(id) on delete cascade,
  nome text not null,
  tipo text not null default 'prop',
  x double precision not null default 0,
  y double precision not null default 0,
  width double precision not null default 80,
  height double precision not null default 80,
  rotation double precision not null default 0,
  z_index integer not null default 0,
  image_url text,
  visible_to_players boolean not null default true,
  interactive boolean not null default false,
  revealed boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  notas_mestre text,
  created_at timestamptz not null default now()
);

create table if not exists public.handouts (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid references public.salas(id) on delete cascade,
  cena_id uuid references public.cenas(id) on delete set null,
  titulo text not null,
  tipo text not null default 'documento',
  content text,
  image_url text,
  image_back_url text,
  visible_to_players boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.handouts
  add column if not exists image_back_url text;

create index if not exists map_items_cena_layer_idx on public.map_items(cena_id, z_index);
create index if not exists handouts_sala_visible_idx on public.handouts(sala_id, visible_to_players);
create index if not exists handouts_cena_created_idx on public.handouts(cena_id, created_at desc);

alter table public.map_items enable row level security;
alter table public.handouts enable row level security;

drop policy if exists map_items_session_read on public.map_items;
drop policy if exists map_items_master_write on public.map_items;
drop policy if exists handouts_session_read on public.handouts;
drop policy if exists handouts_master_write on public.handouts;

create policy map_items_session_read
on public.map_items
for select
to authenticated
using (
  visible_to_players is true
  or exists (
    select 1
    from public.salas s
    where s.id = map_items.sala_id
      and s.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.sala_membros sm
    where sm.sala_id = map_items.sala_id
      and sm.user_id = (select auth.uid())
  )
);

create policy map_items_master_write
on public.map_items
for all
to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id = map_items.sala_id
      and s.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.salas s
    where s.id = map_items.sala_id
      and s.user_id = (select auth.uid())
  )
);

create policy handouts_session_read
on public.handouts
for select
to authenticated
using (
  visible_to_players is true
  or exists (
    select 1
    from public.salas s
    where s.id = handouts.sala_id
      and s.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.sala_membros sm
    where sm.sala_id = handouts.sala_id
      and sm.user_id = (select auth.uid())
  )
);

create policy handouts_master_write
on public.handouts
for all
to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id = handouts.sala_id
      and s.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.salas s
    where s.id = handouts.sala_id
      and s.user_id = (select auth.uid())
  )
);
