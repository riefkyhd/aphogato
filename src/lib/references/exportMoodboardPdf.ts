import { format } from "date-fns";
import type { ProjectReference } from "@/lib/types";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const COLS = 2;
const GAP = 6;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function loadImageDataUrl(url: string): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load image");
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });

  const dims = await new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = dataUrl;
    }
  );

  return { dataUrl, ...dims };
}

function fitRect(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number
): { w: number; h: number } {
  const ratio = Math.min(boxW / imgW, boxH / imgH);
  return { w: imgW * ratio, h: imgH * ratio };
}

export async function exportMoodboardPdf({
  projectName,
  clientName,
  references,
}: {
  projectName: string;
  clientName: string | null;
  references: ProjectReference[];
}) {
  if (references.length === 0) {
    throw new Error("No reference images to export");
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const contentW = PAGE_W - MARGIN * 2;
  const cellW = (contentW - GAP * (COLS - 1)) / COLS;
  const cellH = cellW * 0.75;
  let y = MARGIN;

  doc.setFontSize(16);
  doc.text(projectName, MARGIN, y);
  y += 8;

  doc.setFontSize(10);
  const subtitle = [
    clientName ? `Client: ${clientName}` : null,
    `Generated ${format(new Date(), "MMM d, yyyy")}`,
  ]
    .filter(Boolean)
    .join(" · ");
  doc.setTextColor(100);
  doc.text(subtitle, MARGIN, y);
  doc.setTextColor(0);
  y += 10;

  let col = 0;
  for (const ref of references) {
    if (y + cellH > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
      col = 0;
    }

    const x = MARGIN + col * (cellW + GAP);
    try {
      const { dataUrl, width, height } = await loadImageDataUrl(
        ref.cloudinary_url
      );
      const { w, h } = fitRect(width, height, cellW, cellH);
      const offsetX = x + (cellW - w) / 2;
      const offsetY = y + (cellH - h) / 2;
      const format = dataUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(dataUrl, format, offsetX, offsetY, w, h);
    } catch {
      doc.setDrawColor(200);
      doc.rect(x, y, cellW, cellH);
      doc.setFontSize(8);
      doc.text("Image unavailable", x + 2, y + cellH / 2);
    }

    if (ref.caption?.trim()) {
      doc.setFontSize(8);
      doc.text(ref.caption.trim(), x, y + cellH + 4, { maxWidth: cellW });
    }

    col += 1;
    if (col >= COLS) {
      col = 0;
      y += cellH + (ref.caption?.trim() ? 10 : 6);
    }
  }

  const filename = `moodboard-${slugify(projectName) || "project"}.pdf`;
  doc.save(filename);
}
