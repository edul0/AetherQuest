-- Garanta que os buckets existem:
-- avatares
-- mapas

-- Politicas para leitura publica opcional dos buckets usados pela UI.
drop policy if exists "avatares_public_read" on storage.objects;
create policy "avatares_public_read"
on storage.objects
for select
to public
using (bucket_id = 'avatares');

drop policy if exists "mapas_public_read" on storage.objects;
create policy "mapas_public_read"
on storage.objects
for select
to public
using (bucket_id = 'mapas');

-- Upload e edicao apenas para usuarios autenticados.
drop policy if exists "avatares_auth_insert" on storage.objects;
create policy "avatares_auth_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatares');

drop policy if exists "avatares_auth_update" on storage.objects;
create policy "avatares_auth_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatares')
with check (bucket_id = 'avatares');

drop policy if exists "avatares_auth_delete" on storage.objects;
create policy "avatares_auth_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatares');

drop policy if exists "mapas_auth_insert" on storage.objects;
create policy "mapas_auth_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'mapas');

drop policy if exists "mapas_auth_update" on storage.objects;
create policy "mapas_auth_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'mapas')
with check (bucket_id = 'mapas');

drop policy if exists "mapas_auth_delete" on storage.objects;
create policy "mapas_auth_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'mapas');
