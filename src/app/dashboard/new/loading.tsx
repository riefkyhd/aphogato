import { Loader2 } from "lucide-react";

export default function NewProjectLoading() {
  return (
    <main
      className="px-6 md:px-10 py-10 min-h-[40vh] flex flex-col items-center justify-center gap-4"
      aria-busy="true"
    >
      <Loader2 className="h-8 w-8 animate-spin text-text-muted" aria-hidden />
      <p className="text-[11px] uppercase tracking-label text-text-secondary">
        Loading…
      </p>
    </main>
  );
}
