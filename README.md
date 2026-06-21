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
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Primary Cloudinary cloud name (`default` account) |
| `CLOUDINARY_API_KEY` | Server-side Cloudinary API |
| `CLOUDINARY_API_SECRET` | Server-side Cloudinary API |
| `CLOUDINARY_DEFAULT_ACCOUNT` | Optional — account id for new projects (overridden by Settings) |
| `CLOUDINARY_ACCOUNT_*` | Optional — additional accounts (see below) |

On Vercel, set the same variables for Production (and Preview if needed), then redeploy.

### Multiple Cloudinary accounts

The app supports more than one Cloudinary account. Each **project** is bound to one account at creation time; existing projects keep their account when you add a new one.

1. Keep your current env vars as the **`default`** account.
2. Add a second account with prefixed env vars (example id: `studio`):

```env
CLOUDINARY_ACCOUNT_STUDIO_CLOUD_NAME=your-new-cloud
CLOUDINARY_ACCOUNT_STUDIO_API_KEY=...
CLOUDINARY_ACCOUNT_STUDIO_API_SECRET=...
CLOUDINARY_ACCOUNT_STUDIO_LABEL=Studio account
```

3. In **Settings → Cloudinary**, choose which account new projects should use (or set `CLOUDINARY_DEFAULT_ACCOUNT=studio` in env).

Run migration `0017_cloudinary_account.sql` so projects store `cloudinary_account`.

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
