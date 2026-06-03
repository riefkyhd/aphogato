import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in — Aphogato",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary px-6">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-12">
          <div className="text-4xl font-light tracking-logoXl text-text-primary">
            MH
          </div>
          <p className="mt-4 text-[13px] text-text-secondary">
            a photography journey
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
