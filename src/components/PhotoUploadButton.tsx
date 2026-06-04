"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IMAGE_UPLOAD_ACCEPT } from "@/lib/imageUploadFiles";
import { cn } from "@/lib/utils";
import type { ProjectPhotoUpload } from "@/hooks/useProjectPhotoUpload";

export function PhotoUploadButton({
  upload,
  className,
}: {
  upload: ProjectPhotoUpload;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadFiles } = upload;

  return (
    <>
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
        loading={uploading}
        disabled={uploading}
        className={cn(className)}
        onClick={() => inputRef.current?.click()}
      >
        {!uploading && <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        {uploading ? "Uploading…" : "Upload photos"}
      </Button>
    </>
  );
}
