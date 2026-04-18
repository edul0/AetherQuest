alter table public.fichas add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.salas add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public.fichas alter column owner_id set default auth.uid();
alter table public.salas alter column owner_id set default auth.uid();

alter table public.fichas enable row level security;
alter table public.salas enable row level security;

drop policy if exists "fichas_owner_select" on public.fichas;
create policy "fichas_owner_select"
on public.fichas
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "fichas_owner_insert" on public.fichas;
create policy "fichas_owner_insert"
on public.fichas
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "fichas_owner_update" on public.fichas;
create policy "fichas_owner_update"
on public.fichas
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "fichas_owner_delete" on public.fichas;
create policy "fichas_owner_delete"
on public.fichas
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "salas_owner_select" on public.salas;
create policy "salas_owner_select"
on public.salas
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "salas_owner_insert" on public.salas;
create policy "salas_owner_insert"
on public.salas
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "salas_owner_update" on public.salas;
create policy "salas_owner_update"
on public.salas
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "salas_owner_delete" on public.salas;
create policy "salas_owner_delete"
on public.salas
for delete
to authenticated
using (owner_id = auth.uid());
