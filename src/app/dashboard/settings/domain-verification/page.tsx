import Link from "next/link";
import { ContentColumn } from "@/components/layout/ContentColumn";
import { DashboardMain } from "@/components/layout/DashboardShell";

export default function DomainVerificationPage() {
  return (
    <DashboardMain>
      <ContentColumn size="lg">
      <Link
        href="/dashboard/settings"
        className="text-[11px] uppercase tracking-label text-text-muted hover:text-text-primary mb-6 inline-block"
      >
        ← Settings
      </Link>
      <h1 className="text-2xl font-light tracking-[0.05em] uppercase mb-6">
        Domain verification
      </h1>
      <article className="prose prose-invert max-w-none space-y-6 text-[14px] text-text-secondary leading-relaxed">
        <section>
          <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-2">
            How verification works
          </h2>
          <p>
            When you add a custom domain in Vercel, you prove ownership via DNS:
            TXT and/or CNAME records at your DNS provider. Until Vercel detects
            those records, the domain stays unverified and does not serve your
            deployment on that hostname.
          </p>
        </section>
        <section>
          <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-2">
            Can someone hijack your subdomain?
          </h2>
          <p>
            A random user cannot take over{" "}
            <code className="text-text-primary">xyz.muhammad-hadid.com</code> by
            typing it into their Vercel project. They would need to add DNS
            records at the authoritative zone for{" "}
            <code className="text-text-primary">muhammad-hadid.com</code>. If you
            control that zone and the domain is verified on your Vercel team,
            another account cannot claim it without compromising DNS or Vercel
            access.
          </p>
        </section>
        <section>
          <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-2">
            Misconfiguration risks
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Stale CNAMEs after removing a domain from Vercel</li>
            <li>Wildcard DNS pointing all subdomains to Vercel unintentionally</li>
            <li>Shared DNS access with untrusted parties</li>
          </ul>
        </section>
        <section>
          <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-2">
            Recommendations
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Only add hostnames whose DNS you control</li>
            <li>Configure apex + www consistently; redirect duplicates</li>
            <li>Remove unused domains from Vercel when retiring hostnames</li>
            <li>Use 2FA on DNS and Vercel accounts</li>
          </ul>
        </section>
        <p className="text-[12px] text-text-muted">
          Full reference:{" "}
          <code className="text-text-secondary">docs/DOMAIN_VERIFICATION.md</code>{" "}
          in the repository.
        </p>
      </article>
      </ContentColumn>
    </DashboardMain>
  );
}
