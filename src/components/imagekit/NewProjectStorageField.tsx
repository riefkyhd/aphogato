"use client";

import { Label } from "@/components/ui/Label";
import { FEATURES } from "@/lib/features";
import { isImageKitConfiguredPublic } from "@/lib/imagekit/publicConfig";
import type { StorageProvider } from "@/lib/storage/provider";
import { cn } from "@/lib/utils";

const optionClass =
  "flex cursor-pointer items-start gap-3 border border-border bg-bg-secondary/40 p-4 transition-colors hover:bg-bg-primary/40";

export function NewProjectStorageField({
  value,
  onChange,
}: {
  value: StorageProvider;
  onChange: (provider: StorageProvider) => void;
}) {
  if (!FEATURES.imagekitStorage) {
    return null;
  }

  const imageKitAvailable = isImageKitConfiguredPublic();

  return (
    <div className="space-y-3">
      <Label>Photo storage</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label
          className={cn(
            optionClass,
            value === "cloudinary" && "border-text-secondary bg-bg-primary/50"
          )}
        >
          <input
            type="radio"
            name="storage-provider"
            className="mt-0.5"
            checked={value === "cloudinary"}
            onChange={() => onChange("cloudinary")}
          />
          <span>
            <span className="block text-[13px] text-text-primary">Cloudinary</span>
            <span className="mt-1 block text-[12px] text-text-muted leading-relaxed">
              Default. Multi-account support and usage tracking in Settings.
            </span>
          </span>
        </label>

        <label
          className={cn(
            optionClass,
            value === "imagekit" && "border-text-secondary bg-bg-primary/50",
            !imageKitAvailable && "cursor-not-allowed opacity-60"
          )}
        >
          <input
            type="radio"
            name="storage-provider"
            className="mt-0.5"
            checked={value === "imagekit"}
            disabled={!imageKitAvailable}
            onChange={() => onChange("imagekit")}
          />
          <span>
            <span className="block text-[13px] text-text-primary">ImageKit</span>
            <span className="mt-1 block text-[12px] text-text-muted leading-relaxed">
              {imageKitAvailable
                ? "Upload and deliver via your ImageKit media library."
                : "Set ImageKit env vars to enable (see Settings)."}
            </span>
          </span>
        </label>
      </div>
      <p className="text-[12px] text-text-muted leading-relaxed">
        Locked once photos are uploaded. Existing Cloudinary projects are unchanged.
      </p>
    </div>
  );
}
