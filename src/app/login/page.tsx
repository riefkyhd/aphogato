import { Logo } from "@/components/Logo";
import { sanitizeNextPath } from "@/lib/security/safeRedirect";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in — Gallery of Muhammad Hadid",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = sanitizeNextPath(searchParams?.next);

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary px-6">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-12">
          <div className="flex justify-center">
            <Logo size="lg" priority />
          </div>
          <p className="mt-6 text-[13px] text-text-secondary">
            Gallery of Muhammad Hadid
          </p>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
