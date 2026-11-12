-- Migration 0028: Quotation-to-Project Pipeline Linkage
-- Additive columns to support 1-click deal launch and bidirectional linkage

alter table public.projects
  add column if not exists quotation_id uuid references public.quotations(id) on delete set null;

create index if not exists projects_quotation_id_idx
  on public.projects (quotation_id);

alter table public.quotations
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists status text default 'draft';

create index if not exists quotations_project_id_idx
  on public.quotations (project_id);
