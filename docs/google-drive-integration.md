# Google Drive integration — plan analysis and revised approach

> Saved for later implementation. See conversation plan dated 2026.

## Verdict

**Good plan overall (7.5/10)** — Drive stays source of truth; Aphogato stores metadata + Cloudinary Fetch URLs; first view triggers CDN cache.

**Do not implement the original spec literally** — Calendar OAuth, multi-account Cloudinary, and sync/delete behavior already exist and conflict with a naive Drive import.

## Unified OAuth (chosen approach)

Extend existing `/api/auth/google` to request **both** scopes:

- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/drive.readonly`

Users reconnect once to grant Drive. Do **not** create parallel OAuth routes.

## Critical blockers before build

1. **Spike Cloudinary Fetch + public Drive URLs** — go/no-go gate
2. **Sync gallery** must skip `import_source = drive` rows or they get deleted
3. **Delete photos** must skip Cloudinary delete for Drive rows
4. **`buildCloudinaryFetchUrl`** must use per-project Cloudinary cloud name
5. **URL helpers** need fetch-aware transform swapping (`/image/fetch/`)

## Build order

| Phase | Work |
| ----- | ---- |
| 0 | Spike: 3–5 public Drive JPEGs → Cloudinary fetch → gallery |
| 1 | Unify OAuth scopes; extract `lib/google/auth.ts` |
| 2 | Migration: `photos` + `projects` Drive columns, `import_source` |
| 3 | `lib/google/drive.ts` |
| 4 | `POST /api/projects/[id]/import-drive` |
| 5 | Sync/delete compatibility guards |
| 6 | Fetch-aware `cloudinaryUrls.ts` / `mediaUrls.ts` |
| 7 | `ImportFromDriveModal` + `FEATURES.driveImport` |
| 8 | README |

## Cost note

- Drive API: free within quota at typical volume
- Drive storage: your Google plan
- Cloudinary Fetch: delivery bandwidth + transforms still apply
