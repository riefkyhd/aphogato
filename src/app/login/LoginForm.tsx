"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type LoginPhase = "idle" | "signing-in" | "opening-dashboard";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<LoginPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = phase !== "idle";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase("signing-in");
    try {
      const supabase = createBrowserSupabase();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setPhase("idle");
        return;
      }
      setPhase("opening-dashboard");
      router.replace(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("idle");
    }
  }

  return (
    <>
      {phase === "opening-dashboard" && (
        <PageLoadingOverlay message="Opening your projects…" />
      )}
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={busy}>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          disabled={busy}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={busy}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-[12px] text-status-editing uppercase tracking-label">
          {error}
        </p>
      )}
      <Button
        type="submit"
        loading={busy}
        disabled={busy}
        className="w-full"
      >
        {phase === "signing-in"
          ? "Signing in…"
          : phase === "opening-dashboard"
            ? "Opening projects…"
            : "Sign in"}
      </Button>
    </form>
    </>
  );
}
