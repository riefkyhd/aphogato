import Link from "next/link";

export function DomainSecurityInfo() {
  return (
    <section className="border border-border bg-bg-secondary p-6 max-w-2xl mt-6">
      <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
        Custom domain security
      </h2>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
        Vercel requires you to prove you control a domain before it serves
        traffic for that hostname. Someone else cannot simply type{" "}
        <code className="text-[12px] text-text-primary">xyz.muhammad-hadid.com</code>{" "}
        into their project and take over your site without passing DNS
        verification.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[13px] text-text-secondary mb-4">
        <li>
          <strong className="font-normal text-text-primary">Verification:</strong>{" "}
          Vercel gives you a TXT record (or CNAME for subdomains) to add at your
          DNS provider. Until that record exists and propagates, the domain stays
          unverified and will not route to your deployment.
        </li>
        <li>
          <strong className="font-normal text-text-primary">Hijack risk:</strong>{" "}
          A random user cannot hijack a domain you already verified on your Vercel
          team. They would need access to your DNS or your Vercel account.
        </li>
        <li>
          <strong className="font-normal text-text-primary">Misconfigured DNS:</strong>{" "}
          If you point a subdomain to Vercel without completing verification, or
          leave stale CNAMEs, traffic may not reach the app you expect. Only add
          hostnames whose DNS you control.
        </li>
        <li>
          <strong className="font-normal text-text-primary">Best practice:</strong>{" "}
          Use apex + www consistently, verify both if needed, and remove unused
          domain entries from Vercel when you retire a hostname.
        </li>
      </ul>
      <Link
        href="/dashboard/settings/domain-verification"
        className="text-[11px] uppercase tracking-label text-text-muted hover:text-text-primary transition-colors"
      >
        Read full domain verification guide →
      </Link>
    </section>
  );
}
