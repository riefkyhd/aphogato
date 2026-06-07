alter table public.quotations
  add column if not exists parent_id uuid references public.quotations(id) on delete set null;

alter table public.quotations
  add column if not exists revision integer not null default 0;

create index if not exists quotations_parent_id_idx
  on public.quotations (parent_id);
