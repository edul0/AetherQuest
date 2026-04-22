-- Hotfix AetherQuest VTT: corrige salas antigas sem dono e evita erro de RLS em cenas.
-- Rode depois de supabase/vtt_online_engine.sql.

alter table public.salas
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.salas
  alter column user_id set default auth.uid();

alter table public.cenas
  add column if not exists grid_size integer not null default 50,
  add column if not exists grid_opacity double precision not null default 0.12,
  add column if not exists show_grid boolean not null default true,
  add column if not exists map_scale double precision not null default 1,
  add column if not exists map_offset_x double precision not null default 0,
  add column if not exists map_offset_y double precision not null default 0,
  add column if not exists snap_to_grid boolean not null default true;

create table if not exists public.sala_membros (
  sala_id uuid not null references public.salas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  role text not null check (role in ('mestre', 'jogador')),
  created_at timestamptz not null default now(),
  primary key (sala_id, user_id)
);

alter table public.salas enable row level security;
alter table public.sala_membros enable row level security;
alter table public.cenas enable row level security;

drop policy if exists salas_update_owner on public.salas;
drop policy if exists salas_update_owner_or_unclaimed on public.salas;
drop policy if exists sala_membros_insert_self_safe_role on public.sala_membros;
drop policy if exists cenas_select_room_participant on public.cenas;
drop policy if exists cenas_insert_room_master on public.cenas;
drop policy if exists cenas_update_room_master on public.cenas;
drop policy if exists cenas_delete_room_master on public.cenas;

-- Permite que uma sala antiga sem user_id seja assumida pelo primeiro mestre logado que a abrir.
create policy salas_update_owner_or_unclaimed
on public.salas
for update
 to authenticated
using (user_id = (select auth.uid()) or user_id is null)
with check (user_id = (select auth.uid()));

-- Jogador sempre pode se registrar como jogador. Mestre so se registra como mestre se for dono
-- ou se a sala ainda estiver sem dono durante a migracao/assuncao.
create policy sala_membros_insert_self_safe_role
on public.sala_membros
for insert
 to authenticated
with check (
  user_id = (select auth.uid())
  and (
    role = 'jogador'
    or exists (
      select 1
      from public.salas s
      where s.id = sala_membros.sala_id
        and (s.user_id = (select auth.uid()) or s.user_id is null)
    )
  )
);

create policy cenas_select_room_participant
on public.cenas
for select
 to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id::text = cenas.sala_id::text
      and (
        s.user_id = (select auth.uid())
        or s.user_id is null
        or exists (
          select 1
          from public.sala_membros sm
          where sm.sala_id = s.id
            and sm.user_id = (select auth.uid())
        )
      )
  )
);

create policy cenas_insert_room_master
on public.cenas
for insert
 to authenticated
with check (
  exists (
    select 1
    from public.salas s
    where s.id::text = cenas.sala_id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
);

create policy cenas_update_room_master
on public.cenas
for update
 to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id::text = cenas.sala_id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
)
with check (
  exists (
    select 1
    from public.salas s
    where s.id::text = cenas.sala_id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
);

create policy cenas_delete_room_master
on public.cenas
for delete
 to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id::text = cenas.sala_id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
);
