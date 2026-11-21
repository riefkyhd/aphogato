-- Migration 0030: Add payment_terms column to quotations table
-- Supports: 'split' (50% DP booking + balance) vs 'full' (100% on invoice)

alter table public.quotations
  add column if not exists payment_terms text not null default 'split';

comment on column public.quotations.payment_terms is 'Payment structure: split (50% down payment) or full (full payment on invoice)';
