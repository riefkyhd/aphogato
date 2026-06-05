create table if not exists public.price_list_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  amount      numeric not null check (amount >= 0),
  category    text,
  notes       text,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz default now()
);

create index if not exists price_list_items_sort_order_idx
  on public.price_list_items (sort_order, created_at);

alter table public.price_list_items enable row level security;

drop policy if exists "price_list_items: authenticated full access" on public.price_list_items;
create policy "price_list_items: authenticated full access" on public.price_list_items
  for all to authenticated using (true) with check (true);
