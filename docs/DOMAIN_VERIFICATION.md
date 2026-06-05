# Vercel custom domain verification

This guide explains how Vercel domain verification works, what happens if someone tries to use your hostname without permission, and how to configure DNS safely.

## How verification works

When you add a custom domain in the Vercel project dashboard, Vercel asks you to prove ownership via DNS:

1. **Apex / root domains** (e.g. `muhammad-hadid.com`) — usually an **A** record to Vercel’s anycast IPs and/or a **TXT** record for verification.
2. **Subdomains** (e.g. `app.muhammad-hadid.com`) — typically a **CNAME** pointing to `cname.vercel-dns.com` (or the value Vercel shows), plus sometimes a **TXT** verification record.

Until Vercel detects the correct record(s), the domain remains **Unverified**. Unverified domains do not serve your production deployment to the public internet under that hostname.

Propagation can take minutes to 48 hours depending on your DNS provider and TTL.

## Can another user hijack `xyz.muhammad-hadid.com`?

**Not if you control DNS and have already verified the domain on your Vercel team.**

Scenario: User B adds `xyz.muhammad-hadid.com` to their own Vercel project.

- Vercel will show them DNS instructions (CNAME/TXT).
- **User B cannot complete verification** unless they can create those DNS records at the authoritative DNS for `muhammad-hadid.com`.
- If **you** own the zone at Cloudflare, Namecheap, etc., only you can publish the records Vercel requires.
- If the domain is **already verified on your team**, Vercel associates it with your project; another account cannot claim the same verified hostname without removing it from your team or compromising your accounts.

So typing a subdomain name alone does **not** redirect your visitors to someone else’s app.

## When things can go wrong

| Situation | Risk |
|-----------|------|
| You add a subdomain in Vercel but never add DNS | Domain stays unverified; no traffic to your app on that host. |
| Stale CNAME points `old.app.example.com` to Vercel after you removed the domain | Unexpected routing or SSL errors until DNS is cleaned up. |
| Shared/registrar DNS access with untrusted parties | Anyone with DNS edit rights could verify a hostname on *their* Vercel account. |
| Wildcard DNS (`*.example.com` → Vercel) without planning | Any subdomain could be added and verified by whoever controls the Vercel project first. |

## Recommended practices

1. **Only add domains you control** — manage DNS at a provider you trust; use 2FA on DNS and Vercel.
2. **Verify apex + www** if both should work; redirect one to the other for consistency.
3. **Remove unused domains** from Vercel when retiring a hostname.
4. **Avoid wildcards** unless you intentionally want every subdomain on Vercel.
5. **Document your live hostnames** (portfolio, app, gallery links) so you notice drift quickly.

## What Aphogato does *not* do

Aphogato does not configure Vercel domains for you. Domain setup remains in the Vercel dashboard and your DNS provider. This document is informational for operators hosting the app on a custom domain.

## Further reading

- [Vercel: Working with domains](https://vercel.com/docs/projects/domains/working-with-domains)
- [Vercel: Domain verification troubleshooting](https://vercel.com/docs/projects/domains/troubleshooting)
