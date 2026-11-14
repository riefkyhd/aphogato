import { describe, it, expect } from "vitest";
import { filterPhotosByFilename } from "@/lib/gallery/photoSearch";
import type { Photo } from "@/lib/types";

const makePhoto = (id: string, filename: string): Photo => ({
  id,
  project_id: "p1",
  cloudinary_url: `https://example.com/${id}.jpg`,
  filename,
  is_selected: false,
  created_at: new Date().toISOString(),
});

describe("filterPhotosByFilename", () => {
  const samplePhotos: Photo[] = [
    makePhoto("1", "DSC_0123.jpg"),
    makePhoto("2", "DSC_0124.jpg"),
    makePhoto("3", "IMG_9999.png"),
    makePhoto("4", "wedding_reception_01.JPG"),
    makePhoto("5", "wedding_prep_02.jpg"),
  ];

  it("returns all photos if query is empty or whitespace", () => {
    expect(filterPhotosByFilename(samplePhotos, "")).toHaveLength(5);
    expect(filterPhotosByFilename(samplePhotos, "   ")).toHaveLength(5);
  });

  it("filters case-insensitively by number", () => {
    const results = filterPhotosByFilename(samplePhotos, "012");
    expect(results.map((p) => p.filename)).toEqual([
      "DSC_0123.jpg",
      "DSC_0124.jpg",
    ]);
  });

  it("filters case-insensitively by letters and extensions", () => {
    const results = filterPhotosByFilename(samplePhotos, "png");
    expect(results.map((p) => p.filename)).toEqual(["IMG_9999.png"]);
  });

  it("filters by tokenized keywords across words", () => {
    const results = filterPhotosByFilename(samplePhotos, "wedding prep");
    expect(results.map((p) => p.filename)).toEqual(["wedding_prep_02.jpg"]);
  });

  it("returns empty array when nothing matches", () => {
    const results = filterPhotosByFilename(samplePhotos, "nonexistent_file");
    expect(results).toHaveLength(0);
  });
});
