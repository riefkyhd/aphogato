import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in — Gallery of Muhammad Hadid",
};

export default function LoginPage() {
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
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
