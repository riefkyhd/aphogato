"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { galleryPreviewImageUrl } from "@/lib/cloudinaryUrls";
import { indexFacesFromImageUrl } from "@/lib/faces/faceIndexClient";
import type { PhotoFaceInput } from "@/lib/faces/types";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FacePickModal({
  open,
  photo,
  token,
  onClose,
  onMatched,
}: {
  open: boolean;
  photo: Photo | null;
  token: string;
  onClose: () => void;
  onMatched: (photoIds: string[], matchCount: number) => void;
}) {
  const [faces, setFaces] = useState<PhotoFaceInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const matchFace = useCallback(
    async (face: PhotoFaceInput, signal?: AbortSignal) => {
      setMatching(true);
      setError(null);
      try {
        const res = await fetch(`/api/gallery/${token}/faces/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embedding: face.embedding }),
          signal,
        });
        const json = (await res.json()) as {
          photoIds?: string[];
          matchCount?: number;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(json.error ?? "Face match failed");
        }
        onMatched(json.photoIds ?? [], json.matchCount ?? 0);
        onClose();
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : "Gagal mencari foto");
      } finally {
        setMatching(false);
      }
    },
    [token, onMatched, onClose]
  );

  useEffect(() => {
    if (!open || !photo) {
      setFaces([]);
      setLoading(false);
      setMatching(false);
      setError(null);
      setImageLoaded(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setFaces([]);

    void indexFacesFromImageUrl(
      galleryPreviewImageUrl(photo.cloudinary_url),
      controller.signal
    )
      .then((detected) => {
        if (controller.signal.aborted) return;
        if (detected.length === 0) {
          setError("Tidak ada wajah terdeteksi di foto ini. Coba foto lain.");
          return;
        }
        setFaces(detected);
        if (detected.length === 1) {
          void matchFace(detected[0], controller.signal);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Gagal mendeteksi wajah"
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, photo, matchFace]);

  if (!open || !photo) return null;

  const titleId = "face-pick-title";
  const previewSrc = galleryPreviewImageUrl(photo.cloudinary_url);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      titleId={titleId}
      maxWidthClassName="max-w-2xl"
    >
      <h2
        id={titleId}
        className="text-lg font-light tracking-[0.05em] uppercase mb-2"
      >
        Cari foto saya
      </h2>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
        {faces.length > 1
          ? "Ketuk wajah kamu di foto ini."
          : "Mendeteksi wajah di foto ini…"}
      </p>

      <div className="relative overflow-hidden border border-border bg-bg-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewSrc}
          alt=""
          className={cn(
            "block w-full h-auto max-h-[min(60vh,520px)] object-contain mx-auto",
            !imageLoaded && "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />
        {imageLoaded &&
          faces.map((face, index) => (
            <button
              key={index}
              type="button"
              disabled={matching || loading}
              aria-label={`Pilih wajah ${index + 1}`}
              className="absolute border-2 border-text-primary bg-text-primary/10 hover:bg-text-primary/20 transition-colors disabled:opacity-50"
              style={{
                left: `${face.bbox_x * 100}%`,
                top: `${face.bbox_y * 100}%`,
                width: `${face.bbox_w * 100}%`,
                height: `${face.bbox_h * 100}%`,
              }}
              onClick={() => void matchFace(face)}
            />
          ))}
        {(loading || matching) && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60">
            <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-[13px] text-status-editing" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Batal
        </Button>
      </div>
    </ModalShell>
  );
}
