-- AetherQuest Director Tools: cinematic master deck foundation.
-- Adds free/open VTT primitives: bestiary, monster instances, map items and handouts.

create table if not exists public.monster_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  nome text not null,
  sistema text not null default 'ordem_paranormal',
  categoria text not null default 'entidade',
  avatar_url text,
  token_top_url text,
  token_side_url text,
  hp integer not null default 10,
  max_hp integer not null default 10,
  defesa integer not null default 10,
  iniciativa integer not null default 0,
  ataques jsonb not null default '[]'::jsonb,
  habilidades jsonb not null default '[]'::jsonb,
  notas text,
  publico boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.monster_instances (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid references public.salas(id) on delete cascade,
  cena_id uuid references public.cenas(id) on delete cascade,
  template_id uuid references public.monster_templates(id) on delete set null,
  nome text not null,
  avatar_url text,
  hp integer not null default 10,
  max_hp integer not null default 10,
  defesa integer not null default 10,
  iniciativa integer not null default 0,
  dados jsonb not null default '{}'::jsonb,
  notas_mestre text,
  created_at timestamptz not null default now()
);

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
  visible_to_players boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists monster_templates_owner_idx on public.monster_templates(owner_id, sistema);
create index if not exists monster_instances_sala_idx on public.monster_instances(sala_id, cena_id);
create index if not exists map_items_cena_layer_idx on public.map_items(cena_id, z_index);
create index if not exists handouts_sala_visible_idx on public.handouts(sala_id, visible_to_players);

alter table public.monster_templates enable row level security;
alter table public.monster_instances enable row level security;
alter table public.map_items enable row level security;
alter table public.handouts enable row level security;

drop policy if exists monster_templates_select_public_or_owner on public.monster_templates;
drop policy if exists monster_templates_write_owner on public.monster_templates;
drop policy if exists monster_instances_session_participants on public.monster_instances;
drop policy if exists monster_instances_master_write on public.monster_instances;
drop policy if exists map_items_session_read on public.map_items;
drop policy if exists map_items_master_write on public.map_items;
drop policy if exists handouts_session_read on public.handouts;
drop policy if exists handouts_master_write on public.handouts;

create policy monster_templates_select_public_or_owner
on public.monster_templates
for select
to authenticated
using (publico is true or owner_id = (select auth.uid()));

create policy monster_templates_write_owner
on public.monster_templates
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy monster_instances_session_participants
on public.monster_instances
for select
to authenticated
using (
  exists (
    select 1 from public.salas s
    where s.id = monster_instances.sala_id
      and (
        s.user_id = (select auth.uid())
        or exists (select 1 from public.sala_membros sm where sm.sala_id = s.id and sm.user_id = (select auth.uid()))
      )
  )
);

create policy monster_instances_master_write
on public.monster_instances
for all
to authenticated
using (exists (select 1 from public.salas s where s.id = monster_instances.sala_id and s.user_id = (select auth.uid())))
with check (exists (select 1 from public.salas s where s.id = monster_instances.sala_id and s.user_id = (select auth.uid())));

create policy map_items_session_read
on public.map_items
for select
to authenticated
using (
  visible_to_players is true
  or exists (select 1 from public.salas s where s.id = map_items.sala_id and s.user_id = (select auth.uid()))
  or exists (select 1 from public.sala_membros sm where sm.sala_id = map_items.sala_id and sm.user_id = (select auth.uid()))
);

create policy map_items_master_write
on public.map_items
for all
to authenticated
using (exists (select 1 from public.salas s where s.id = map_items.sala_id and s.user_id = (select auth.uid())))
with check (exists (select 1 from public.salas s where s.id = map_items.sala_id and s.user_id = (select auth.uid())));

create policy handouts_session_read
on public.handouts
for select
to authenticated
using (
  visible_to_players is true
  or exists (select 1 from public.salas s where s.id = handouts.sala_id and s.user_id = (select auth.uid()))
  or exists (select 1 from public.sala_membros sm where sm.sala_id = handouts.sala_id and sm.user_id = (select auth.uid()))
);

create policy handouts_master_write
on public.handouts
for all
to authenticated
using (exists (select 1 from public.salas s where s.id = handouts.sala_id and s.user_id = (select auth.uid())))
with check (exists (select 1 from public.salas s where s.id = handouts.sala_id and s.user_id = (select auth.uid())));
