-- Migration 0031: Modular Service Tags & 1-Click Payment Status Tracking
-- Adds modular services text[] and payment_status to events, projects, and quotations

-- 1. Events Table
alter table public.events
  add column if not exists services text[] not null default array['photography'],
  add column if not exists payment_status text not null default 'unpaid';

-- 2. Projects Table
alter table public.projects
  add column if not exists services text[] not null default array['photography'],
  add column if not exists payment_status text not null default 'unpaid';

-- 3. Quotations Table
alter table public.quotations
  add column if not exists services text[] not null default array['photography'];

-- 4. Smart Backfill for existing events:
-- Infer payment_status based on linked income_entries if available
update public.events e
set payment_status = case
  when exists (
    select 1 from public.income_entries i
    where i.event_id = e.id and i.amount > 0 and (
      lower(coalesce(i.description, '')) like '%lunas%' or
      lower(coalesce(i.description, '')) like '%full%' or
      lower(coalesce(i.description, '')) like '%pelunasan%'
    )
  ) then 'paid_in_full'
  when exists (
    select 1 from public.income_entries i
    where i.event_id = e.id and i.amount > 0
  ) then 'deposit_paid'
  else 'unpaid'
end
where payment_status = 'unpaid';

-- 5. Smart Backfill for existing projects:
-- Infer payment_status from linked events or income
update public.projects p
set payment_status = coalesce(
  (select e.payment_status from public.events e where e.project_id = p.id limit 1),
  'unpaid'
)
where payment_status = 'unpaid';
