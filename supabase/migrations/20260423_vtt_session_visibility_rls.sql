-- AetherQuest VTT session visibility repair.
-- Run after the schema migration if players see linked tokens as "Entidade".

alter table public.fichas enable row level security;
alter table public.tokens enable row level security;

drop policy if exists fichas_select_own_or_session on public.fichas;
drop policy if exists fichas_update_own_or_session_master on public.fichas;
drop policy if exists tokens_select_session_participant on public.tokens;

create policy fichas_select_own_or_session
on public.fichas
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id::text = fichas.sala_id::text
      and s.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.sala_membros sm
    where sm.sala_id::text = fichas.sala_id::text
      and sm.user_id = (select auth.uid())
  )
);

create policy fichas_update_own_or_session_master
on public.fichas
for update
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id::text = fichas.sala_id::text
      and s.user_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.salas s
    where s.id::text = fichas.sala_id::text
      and s.user_id = (select auth.uid())
  )
);

create policy tokens_select_session_participant
on public.tokens
for select
to authenticated
using (
  visible_to_players is true
  or exists (
    select 1
    from public.salas s
    where s.id::text = tokens.sala::text
      and s.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.sala_membros sm
    where sm.sala_id::text = tokens.sala::text
      and sm.user_id = (select auth.uid())
  )
);
