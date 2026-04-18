-- Substitua o UUID abaixo pelo seu user id do Supabase Auth.
-- Voce encontra em Authentication > Users.

-- Exemplo:
-- update public.fichas set owner_id = '00000000-0000-0000-0000-000000000000' where owner_id is null;
-- update public.salas set owner_id = '00000000-0000-0000-0000-000000000000' where owner_id is null;

update public.fichas
set owner_id = 'COLE_SEU_USER_ID_AQUI'
where owner_id is null;

update public.salas
set owner_id = 'COLE_SEU_USER_ID_AQUI'
where owner_id is null;
