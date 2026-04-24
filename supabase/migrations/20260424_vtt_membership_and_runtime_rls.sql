-- AetherQuest session membership + runtime RLS.
-- Run after the 20260423 migrations.

create table if not exists public.sala_membros (
  sala_id uuid not null references public.salas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'jogador',
  ficha_id uuid references public.fichas(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (sala_id, user_id)
);

create index if not exists sala_membros_user_idx on public.sala_membros(user_id, sala_id);
create index if not exists sala_membros_role_idx on public.sala_membros(sala_id, role);

alter table public.salas enable row level security;
alter table public.cenas enable row level security;
alter table public.tokens enable row level security;
alter table public.messages enable row level security;
alter table public.sala_membros enable row level security;

drop policy if exists salas_select_active_or_member on public.salas;
drop policy if exists salas_insert_owner on public.salas;
drop policy if exists salas_update_owner on public.salas;
drop policy if exists salas_delete_owner on public.salas;

drop policy if exists sala_membros_select_own_or_master on public.sala_membros;
drop policy if exists sala_membros_insert_owner_or_self on public.sala_membros;
drop policy if exists sala_membros_update_owner_or_self on public.sala_membros;
drop policy if exists sala_membros_delete_owner on public.sala_membros;

drop policy if exists cenas_select_room_participant on public.cenas;
drop policy if exists cenas_insert_room_master on public.cenas;
drop policy if exists cenas_update_room_master on public.cenas;
drop policy if exists cenas_delete_room_master on public.cenas;

drop policy if exists tokens_select_room_participant on public.tokens;
drop policy if exists tokens_insert_room_participant on public.tokens;
drop policy if exists tokens_update_room_participant on public.tokens;
drop policy if exists tokens_delete_room_master on public.tokens;

drop policy if exists messages_select_room_participant on public.messages;
drop policy if exists messages_insert_room_participant on public.messages;

create policy salas_select_active_or_member
on public.salas
for select
to authenticated
using (
  coalesce(status, 'ativa') <> 'arquivada'
  or user_id = (select auth.uid())
  or exists (
    select 1
    from public.sala_membros sm
    where sm.sala_id = salas.id
      and sm.user_id = (select auth.uid())
  )
);

create policy salas_insert_owner
on public.salas
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  or user_id is null
);

create policy salas_update_owner
on public.salas
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy salas_delete_owner
on public.salas
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy sala_membros_select_own_or_master
on public.sala_membros
for select
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

create policy sala_membros_insert_owner_or_self
on public.sala_membros
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id = sala_membros.sala_id
      and s.user_id = (select auth.uid())
  )
);

create policy sala_membros_update_owner_or_self
on public.sala_membros
for update
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id = sala_membros.sala_id
      and s.user_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id = sala_membros.sala_id
      and s.user_id = (select auth.uid())
  )
);

create policy sala_membros_delete_owner
on public.sala_membros
for delete
to authenticated
using (
  exists (
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
      and s.user_id = (select auth.uid())
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
      and s.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.salas s
    where s.id::text = cenas.sala_id::text
      and s.user_id = (select auth.uid())
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
      and s.user_id = (select auth.uid())
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
        or exists (
          select 1
          from public.sala_membros sm
          where sm.sala_id = s.id
            and sm.user_id = (select auth.uid())
        )
      )
  )
);

create policy tokens_insert_room_participant
on public.tokens
for insert
to authenticated
with check (
  exists (
    select 1
    from public.salas s
    where s.id::text = tokens.sala::text
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

create policy tokens_update_room_participant
on public.tokens
for update
to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id::text = tokens.sala::text
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
)
with check (
  exists (
    select 1
    from public.salas s
    where s.id::text = tokens.sala::text
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

create policy tokens_delete_room_master
on public.tokens
for delete
to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id::text = tokens.sala::text
      and s.user_id = (select auth.uid())
  )
);

create policy messages_select_room_participant
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.salas s
    where s.id = messages.sala_id
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

create policy messages_insert_room_participant
on public.messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.salas s
    where s.id = messages.sala_id
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
