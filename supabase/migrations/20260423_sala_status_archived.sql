-- Lobby de RPG: mesas podem ser arquivadas sem apagar historico.
alter table public.salas
add column if not exists status text not null default 'ativa';

create index if not exists salas_status_idx on public.salas (status);
