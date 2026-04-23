-- AetherQuest VTT professional schema extension.
-- Safe/additive migration: run in Supabase SQL Editor.

alter table public.salas
  add column if not exists invite_code text,
  add column if not exists description text,
  add column if not exists sistema text default 'ordem_paranormal';

update public.salas
set invite_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where invite_code is null;

create unique index if not exists salas_invite_code_key
  on public.salas (invite_code)
  where invite_code is not null;

alter table public.cenas
  add column if not exists fog_data jsonb not null default '{}'::jsonb,
  add column if not exists notes text,
  add column if not exists ambient_light double precision not null default 1,
  add column if not exists background_color text not null default '#050a10';

alter table public.tokens
  add column if not exists hp integer,
  add column if not exists max_hp integer,
  add column if not exists size double precision not null default 1,
  add column if not exists rotation double precision not null default 0,
  add column if not exists conditions text[] not null default '{}'::text[],
  add column if not exists z_index integer not null default 0,
  add column if not exists layer text not null default 'token',
  add column if not exists visible_to_players boolean not null default true,
  add column if not exists avatar_url text,
  add column if not exists initiative integer;

alter table public.messages
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists author_name text,
  add column if not exists type text not null default 'chat',
  add column if not exists dice_formula text,
  add column if not exists dice_result jsonb;

create table if not exists public.iniciativa (
  id uuid primary key default gen_random_uuid(),
  cena_id uuid not null references public.cenas(id) on delete cascade,
  token_id uuid references public.tokens(id) on delete cascade,
  ficha_id uuid references public.fichas(id) on delete set null,
  nome text not null,
  initiative integer not null default 0,
  ordem integer not null default 0,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.iniciativa
  add column if not exists cena_id uuid references public.cenas(id) on delete cascade,
  add column if not exists token_id uuid references public.tokens(id) on delete cascade,
  add column if not exists ficha_id uuid references public.fichas(id) on delete set null,
  add column if not exists nome text not null default 'Combatente',
  add column if not exists initiative integer not null default 0,
  add column if not exists ordem integer not null default 0,
  add column if not exists active boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

create index if not exists iniciativa_cena_order_idx on public.iniciativa(cena_id, initiative desc, ordem asc);
create index if not exists tokens_cena_layer_idx on public.tokens(cena_id, layer, z_index);
create index if not exists tokens_visible_idx on public.tokens(cena_id, visible_to_players);
create index if not exists messages_sala_created_idx on public.messages(sala_id, created_at desc);

alter table public.iniciativa enable row level security;

drop policy if exists iniciativa_select_room_participant on public.iniciativa;
drop policy if exists iniciativa_insert_room_master on public.iniciativa;
drop policy if exists iniciativa_update_room_master on public.iniciativa;
drop policy if exists iniciativa_delete_room_master on public.iniciativa;

create policy iniciativa_select_room_participant
on public.iniciativa
for select
to authenticated
using (
  exists (
    select 1
    from public.cenas c
    join public.salas s on s.id::text = c.sala_id::text
    where c.id = iniciativa.cena_id
      and (
        s.user_id = (select auth.uid())
        or exists (
          select 1
          from public.sala_membros sm
          where sm.sala_id = s.id
            and sm.user_id = (select auth.uid())
        )
      )
  )
);

create policy iniciativa_insert_room_master
on public.iniciativa
for insert
to authenticated
with check (
  exists (
    select 1
    from public.cenas c
    join public.salas s on s.id::text = c.sala_id::text
    where c.id = iniciativa.cena_id
      and s.user_id = (select auth.uid())
  )
);

create policy iniciativa_update_room_master
on public.iniciativa
for update
to authenticated
using (
  exists (
    select 1
    from public.cenas c
    join public.salas s on s.id::text = c.sala_id::text
    where c.id = iniciativa.cena_id
      and s.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.cenas c
    join public.salas s on s.id::text = c.sala_id::text
    where c.id = iniciativa.cena_id
      and s.user_id = (select auth.uid())
  )
);

create policy iniciativa_delete_room_master
on public.iniciativa
for delete
to authenticated
using (
  exists (
    select 1
    from public.cenas c
    join public.salas s on s.id::text = c.sala_id::text
    where c.id = iniciativa.cena_id
      and s.user_id = (select auth.uid())
  )
);
