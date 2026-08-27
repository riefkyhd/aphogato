import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary px-6">
      <div className="w-full max-w-[380px] text-center">
        <SearchX
          className="h-8 w-8 mx-auto text-text-muted mb-4"
          aria-hidden
        />
        <h1 className="text-lg font-light tracking-[0.05em] uppercase">
          Page not found
        </h1>
        <p className="mt-3 text-[13px] text-text-secondary leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="btn-primary inline-flex items-center justify-center w-full"
          >
            Back to Home
          </Link>
          <div className="flex justify-center gap-4 text-[12px] uppercase tracking-label text-text-secondary">
            <Link
              href="/dashboard/galleries"
              className="hover:text-text-primary transition-colors"
            >
              Galleries
            </Link>
            <Link
              href="/login"
              className="hover:text-text-primary transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
