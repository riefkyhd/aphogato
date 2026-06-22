"use client";

export function FaceSearchPrivacyBanner() {
  return (
    <p className="rounded-sm border border-border bg-bg-secondary px-4 py-3 text-[12px] text-text-secondary leading-relaxed">
      &ldquo;Find my photos&rdquo; compares faces in this gallery so you can
      find yourself faster. Face data is stored as numeric codes in this gallery
      and removed when the project is deleted.
    </p>
  );
}
