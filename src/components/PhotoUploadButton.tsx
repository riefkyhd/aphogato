"use client";

import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IMAGE_UPLOAD_ACCEPT } from "@/lib/imageUploadFiles";
import type { ProjectPhotoUpload } from "@/hooks/useProjectPhotoUpload";

export function PhotoUploadButton({ upload }: { upload: ProjectPhotoUpload }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadFiles } = upload;

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          void uploadFiles(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={uploading}
        className="inline-flex items-center gap-2"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Upload className="h-3.5 w-3.5" aria-hidden />
        )}
        {uploading ? "Uploading…" : "Upload photos"}
      </Button>
    </div>
  );
}
