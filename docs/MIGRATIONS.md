# Migrations

All SQL migrations live under `supabase/migrations/` and are applied in
filename-sort order. To keep ordering unambiguous:

- Prefix every new file with the next 4-digit sequence (zero-padded).
- Do **not** re-use an existing prefix, even for a migration on a totally
  different table — Supabase applies by prefix and duplicates make ordering
  ambiguous.
- One concern per file. Split into two migrations if you're touching
  unrelated tables.

## Ordered index (current)

| # | File | Summary |
|---|---|---|
| 0001 | `0001_init.sql` | Initial schema |
| 0002 | `0002_calendar.sql` | Calendar events |
| 0003 | `0003_calendar_end_time.sql` | Add end time to events |
| 0004 | `0004_synced_at_timestamptz.sql` | Change synced_at to timestamptz |
| 0005 | `0005_settings_rls_lockdown.sql` | Settings RLS hardening |
| 0006 | `0006_finance.sql` | Income / expense entries |
| 0007 | `0007_max_photo_selection.sql` | Photo selection cap |
| 0008 | `0008_expense_project_link.sql` | Link expenses to projects |
| 0009 | `0009_deliverables.sql` | Deliverable checklists |
| 0010 | `0010_clients.sql` | Client book |
| 0011 | `0011_project_references.sql` | Moodboard references |
| 0012 | `0012_price_list_items.sql` | Price list |
| 0013 | `0013_client_social_accounts.sql` | Social account rows |
| 0014 | `0014_privacy_pin.sql` | Privacy PIN |
| 0015 | `0015_user_preferences.sql` | Per-user preferences |
| 0016 | `0016_project_photo_stats.sql` | Photo stat aggregates |
| 0017 | `0017_cloudinary_account.sql` | Cloudinary account info |
| 0018 | `0018_quotations.sql` | Quotations |
| 0019 | `0019_quotation_revisions.sql` | Quotation revisions |
| 0020 | `0020_photo_shot_at.sql` | Photo timestamps |
| 0021 | `0021_photo_faces.sql` | Face rows |
| 0022 | `0022_match_photo_faces_rpc.sql` | Face-match RPC |
| 0023 | `0023_photo_face_indexed_at.sql` | Track indexed_at |
| 0024 | `0024_project_cover_photo.sql` | Project cover photo |
| 0025 | `0025_imagekit_storage.sql` | ImageKit storage |
| 0026 | `0026_photo_perceptual_hash.sql` | Perceptual hash for dedupe (was `0017_*` — renamed to unblock ordering) |

## Note on the `0026_photo_perceptual_hash.sql` rename

This migration originally shared prefix `0017_` with
`0017_cloudinary_account.sql`. Because both were already applied against the
existing database, renaming the file locally does not re-run the migration.
If you are cloning to a fresh environment, apply the file under its new name;
if you are on the deployed database, run:

```sql
update supabase_migrations.schema_migrations
set version = '20260101000026'  -- or the next unused version stamp
where name = 'photo_perceptual_hash';
```

or use the Supabase CLI's `supabase migration repair`.
