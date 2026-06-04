# Aphogato

Client photo selection for photographers. Manage projects from a dark dashboard; clients pick favorites on tokenized gallery links. Photos live in Cloudinary; selections and project metadata live in Supabase.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** — auth, Postgres, RLS
- **Cloudinary** — image storage and delivery
- **Tailwind CSS** — dark UI

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (gallery API, bypasses RLS) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Server-side Cloudinary API |
| `CLOUDINARY_API_SECRET` | Server-side Cloudinary API |

On Vercel, set the same variables for Production (and Preview if needed), then redeploy.

## Database

Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor (or `supabase db push`).

Create a single photographer user in Supabase Auth (email/password). Middleware protects `/dashboard/*`.

**Security:** In Supabase Dashboard, disable public sign-ups and enable leaked-password protection. See [docs/SECURITY.md](docs/SECURITY.md).

## Cloudinary folder structure

Aphogato manages folders automatically. **Do not enter a folder path in the UI.**

When you create a project, the app assigns a `cloudinary_folder` stored in Supabase:

```
[year]/[project-name-slug]
```

Examples:

| Project name | `cloudinary_folder` |
|--------------|---------------------|
| Wedding — Derio & Salma | `2026/wedding-derio-salma` |
| Same name again (duplicate) | `2026/wedding-derio-salma-2` |

Rules:

- **Year** — current calendar year at creation time
- **Slug** — project name lowercased; non-alphanumeric characters removed; spaces become hyphens
- **Duplicates** — if that folder path already exists on another project, a numeric suffix is appended (`-2`, `-3`, …)

Cloudinary does not require a pre-created folder. The folder appears when the **first photo is uploaded**.

### Upload paths

From `/dashboard/[id]`, use **Upload photos**. Each file is uploaded with:

- **asset_folder:** `{cloudinary_folder}` — places the file in the correct Media Library folder (required in **dynamic folder mode**, where `public_id` slashes alone do not organize the library UI)
- **public_id:** `{cloudinary_folder}/{filename-without-extension}`  
  e.g. `2026/wedding-derio-salma/DSC_0042`
- **URL stored in DB:**  
  `https://res.cloudinary.com/{CLOUD_NAME}/image/upload/2026/wedding-derio-salma/DSC_0042.jpg`

Uploads run **one file at a time** with a progress bar (file name, per-file %, and overall %).

### Sync gallery

**Sync gallery** lists images under the project’s `cloudinary_folder` (prefix search), adds new files to Supabase, and removes DB rows whose files no longer exist in Cloudinary.

## Project workflow

1. **New project** (`/dashboard/new`) — project name + optional client name only.
2. **Project detail** (`/dashboard/[id]`) — upload photos, copy gallery link, sync from Cloudinary, advance status.
3. **Gallery** (`/gallery/[token]`) — client selects photos; confirmations update `photos.is_selected`.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in at `/login`.

```bash
npm run build
npm run lint
```

## Deploy

Deploy to Vercel with the Next.js preset. Ensure all env vars above are set in the project settings, then redeploy after changes.
