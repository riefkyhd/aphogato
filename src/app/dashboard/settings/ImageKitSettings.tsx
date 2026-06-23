"use client";

import { useCallback, useEffect, useState } from "react";
import { Label } from "@/components/ui/Label";
import { FEATURES } from "@/lib/features";
import { isImageKitConfiguredPublic } from "@/lib/imagekit/publicConfig";
import { cn } from "@/lib/utils";

type ImageKitSettingsResponse = {
  configured: boolean;
  urlEndpoint: string | null;
  error?: string;
};

export function ImageKitSettings() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(isImageKitConfiguredPublic());
  const [urlEndpoint, setUrlEndpoint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/imagekit");
      const json = (await res.json()) as ImageKitSettingsResponse;
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load ImageKit settings");
      }
      setConfigured(json.configured);
      setUrlEndpoint(json.urlEndpoint);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load ImageKit settings"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!FEATURES.imagekitStorage) return null;

  return (
    <section className="border border-border bg-bg-secondary/30 p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[11px] uppercase tracking-label text-text-muted">
            ImageKit
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] text-text-secondary leading-relaxed">
            Optional second storage provider. Choose ImageKit when creating a new
            project — existing Cloudinary projects stay on Cloudinary.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {loading ? (
          <p className="text-[12px] text-text-muted">Checking configuration…</p>
        ) : error ? (
          <p className="text-[12px] text-status-cancelled">{error}</p>
        ) : (
          <>
            <div>
              <Label>Status</Label>
              <p
                className={cn(
                  "mt-2 text-[13px]",
                  configured ? "text-status-delivered" : "text-status-cancelled"
                )}
              >
                {configured ? "Configured" : "Not configured"}
              </p>
            </div>
            {urlEndpoint ? (
              <div>
                <Label>URL endpoint</Label>
                <p className="mt-2 text-[13px] text-text-secondary">
                  <code className="text-[11px]">{urlEndpoint}</code>
                </p>
              </div>
            ) : null}
            {!configured ? (
              <p className="text-[12px] text-text-muted leading-relaxed">
                Set{" "}
                <code className="text-[11px]">NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT</code>
                , <code className="text-[11px]">IMAGEKIT_PUBLIC_KEY</code>, and{" "}
                <code className="text-[11px]">IMAGEKIT_PRIVATE_KEY</code> in your
                environment (local and Vercel).
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
