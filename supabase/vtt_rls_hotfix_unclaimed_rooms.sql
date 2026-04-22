-- Hotfix AetherQuest VTT: corrige RLS de sessoes/cenas e salas antigas sem dono.
-- Pode rodar sozinho no SQL Editor do Supabase. Se ja rodou antes, rode de novo sem medo.

alter table public.salas
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.salas
  alter column user_id set default auth.uid();

alter table public.fichas
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.fichas
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

create index if not exists sala_membros_user_id_idx on public.sala_membros(user_id);
create index if not exists sala_membros_role_idx on public.sala_membros(sala_id, role);
create index if not exists fichas_sala_id_idx on public.fichas(sala_id);
create index if not exists fichas_user_id_idx on public.fichas(user_id);
create index if not exists tokens_ficha_id_idx on public.tokens(ficha_id);
create index if not exists tokens_sala_idx on public.tokens(sala);

alter table public.salas enable row level security;
alter table public.sala_membros enable row level security;
alter table public.cenas enable row level security;
alter table public.tokens enable row level security;
alter table public.fichas enable row level security;

drop policy if exists salas_select_authenticated on public.salas;
drop policy if exists salas_insert_owner on public.salas;
drop policy if exists salas_update_owner on public.salas;
drop policy if exists salas_update_owner_or_unclaimed on public.salas;
drop policy if exists salas_delete_owner on public.salas;

drop policy if exists sala_membros_select_self_or_room_master on public.sala_membros;
drop policy if exists sala_membros_insert_self_safe_role on public.sala_membros;
drop policy if exists sala_membros_update_room_master on public.sala_membros;
drop policy if exists sala_membros_delete_self_or_room_master on public.sala_membros;

drop policy if exists cenas_select_room_participant on public.cenas;
drop policy if exists cenas_insert_room_master on public.cenas;
drop policy if exists cenas_update_room_master on public.cenas;
drop policy if exists cenas_delete_room_master on public.cenas;

drop policy if exists tokens_select_room_participant on public.tokens;
drop policy if exists tokens_insert_room_master on public.tokens;
drop policy if exists tokens_update_room_master_or_ficha_owner on public.tokens;
drop policy if exists tokens_delete_room_master on public.tokens;

drop policy if exists fichas_select_owner_or_room_master on public.fichas;
drop policy if exists fichas_insert_owner on public.fichas;
drop policy if exists fichas_update_owner_or_room_master on public.fichas;
drop policy if exists fichas_delete_owner_or_room_master on public.fichas;

create policy salas_select_authenticated
on public.salas
for select
to authenticated
using (true);

create policy salas_insert_owner
on public.salas
for insert
to authenticated
with check (coalesce(user_id, (select auth.uid())) = (select auth.uid()));

-- Permite que salas antigas sem user_id sejam assumidas pelo primeiro mestre logado que as abrir.
create policy salas_update_owner_or_unclaimed
on public.salas
for update
to authenticated
using (user_id = (select auth.uid()) or user_id is null)
with check (user_id = (select auth.uid()));

create policy salas_delete_owner
on public.salas
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy sala_membros_select_self_or_room_master
on public.sala_membros
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id = sala_membros.sala_id
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
);

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

create policy sala_membros_update_room_master
on public.sala_membros
for update
to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id = sala_membros.sala_id
      and s.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.salas s
    where s.id = sala_membros.sala_id
      and s.user_id = (select auth.uid())
  )
);

create policy sala_membros_delete_self_or_room_master
on public.sala_membros
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id = sala_membros.sala_id
      and s.user_id = (select auth.uid())
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

create policy tokens_select_room_participant
on public.tokens
for select
to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id::text = tokens.sala::text
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

create policy tokens_insert_room_master
on public.tokens
for insert
to authenticated
with check (
  exists (
    select 1
    from public.salas s
    where s.id::text = tokens.sala::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
);

create policy tokens_update_room_master_or_ficha_owner
on public.tokens
for update
to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id::text = tokens.sala::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
  or exists (
    select 1
    from public.fichas f
    where f.id::text = tokens.ficha_id::text
      and f.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.salas s
    where s.id::text = tokens.sala::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
  or exists (
    select 1
    from public.fichas f
    where f.id::text = tokens.ficha_id::text
      and f.user_id = (select auth.uid())
  )
);

create policy tokens_delete_room_master
on public.tokens
for delete
to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id::text = tokens.sala::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
);

create policy fichas_select_owner_or_room_master
on public.fichas
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id::text = fichas.sala_id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
  or exists (
    select 1
    from public.tokens t
    join public.salas s on s.id::text = t.sala::text
    where t.ficha_id::text = fichas.id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
);

create policy fichas_insert_owner
on public.fichas
for insert
to authenticated
with check (coalesce(user_id, (select auth.uid())) = (select auth.uid()));

create policy fichas_update_owner_or_room_master
on public.fichas
for update
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id::text = fichas.sala_id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
  or exists (
    select 1
    from public.tokens t
    join public.salas s on s.id::text = t.sala::text
    where t.ficha_id::text = fichas.id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
)
with check (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id::text = fichas.sala_id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
  or exists (
    select 1
    from public.tokens t
    join public.salas s on s.id::text = t.sala::text
    where t.ficha_id::text = fichas.id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
);

create policy fichas_delete_owner_or_room_master
on public.fichas
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id::text = fichas.sala_id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
  or exists (
    select 1
    from public.tokens t
    join public.salas s on s.id::text = t.sala::text
    where t.ficha_id::text = fichas.id::text
      and (s.user_id = (select auth.uid()) or s.user_id is null)
  )
);
