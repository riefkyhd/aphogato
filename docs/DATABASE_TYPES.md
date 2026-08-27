# Generated Supabase types

We rely on hand-written types under `src/lib/types.ts` today. To reduce type
drift, generate a canonical `Database` type from the live schema and consume it
in `createServerClient<Database>(...)` calls.

## Generating types

```
# Sign in first
supabase login

# Generate for the linked project
supabase gen types typescript \
  --project-id <YOUR_PROJECT_ID> \
  --schema public > src/lib/db.types.ts
```

Then update the three Supabase client factories:

- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/browser.ts`

Replace `createServerClient(...)` with `createServerClient<Database>(...)` and
import `Database` from `@/lib/db.types`.

## When to regenerate

- After any migration under `supabase/migrations/`.
- Before flipping on `noUncheckedIndexedAccess` in `tsconfig.json`.
- Ahead of large refactors that rename columns.

Regeneration is intentionally manual so schema changes stay explicit in
review — hooking it into `postinstall` risks silent drift on branch switches.
