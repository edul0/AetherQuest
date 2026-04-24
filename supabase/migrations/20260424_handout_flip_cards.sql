-- Resident Evil style inspectable handouts.
-- Adds front/back image support for evidence and item inspection.

alter table public.handouts
  add column if not exists image_back_url text;

create index if not exists handouts_cena_created_idx
  on public.handouts(cena_id, created_at desc);
