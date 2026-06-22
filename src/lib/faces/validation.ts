import {
  DEFAULT_FACE_MATCH_THRESHOLD,
  FACE_EMBEDDING_DIM,
  MAX_FACES_PER_PHOTO,
  type PhotoFaceInput,
} from "@/lib/faces/types";

function isUnitInterval(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isPositiveUnitInterval(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 1;
}

function parseEmbedding(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length !== FACE_EMBEDDING_DIM) {
    return null;
  }
  const embedding: number[] = [];
  for (const item of value) {
    if (typeof item !== "number" || !Number.isFinite(item)) {
      return null;
    }
    embedding.push(item);
  }
  return embedding;
}

export function parsePhotoFacesInput(
  faces: unknown
): { ok: true; faces: PhotoFaceInput[] } | { ok: false; error: string } {
  if (faces === undefined || faces === null) {
    return { ok: true, faces: [] };
  }
  if (!Array.isArray(faces)) {
    return { ok: false, error: "faces must be an array" };
  }
  if (faces.length > MAX_FACES_PER_PHOTO) {
    return {
      ok: false,
      error: `At most ${MAX_FACES_PER_PHOTO} faces per photo`,
    };
  }

  const parsed: PhotoFaceInput[] = [];
  for (const face of faces) {
    if (!face || typeof face !== "object") {
      return { ok: false, error: "Invalid face entry" };
    }
    const row = face as Record<string, unknown>;
    const embedding = parseEmbedding(row.embedding);
    if (!embedding) {
      return {
        ok: false,
        error: `Each face needs embedding[${FACE_EMBEDDING_DIM}]`,
      };
    }
    if (
      !isUnitInterval(row.bbox_x) ||
      !isUnitInterval(row.bbox_y) ||
      !isPositiveUnitInterval(row.bbox_w) ||
      !isPositiveUnitInterval(row.bbox_h)
    ) {
      return { ok: false, error: "Invalid face bounding box" };
    }
    if (row.bbox_x + row.bbox_w > 1.001 || row.bbox_y + row.bbox_h > 1.001) {
      return { ok: false, error: "Face bounding box exceeds image bounds" };
    }

    parsed.push({
      bbox_x: row.bbox_x,
      bbox_y: row.bbox_y,
      bbox_w: row.bbox_w,
      bbox_h: row.bbox_h,
      embedding,
    });
  }

  return { ok: true, faces: parsed };
}

export function parseFaceSearchEnabledInput(
  value: unknown
): { ok: true; value: boolean } | { ok: false; error: string } {
  if (value === undefined) {
    return { ok: true, value: false };
  }
  if (typeof value !== "boolean") {
    return { ok: false, error: "face_search_enabled must be a boolean" };
  }
  return { ok: true, value };
}

export function parseFaceMatchBody(body: Record<string, unknown>): {
  data?: { embedding: number[]; threshold: number };
  error?: string;
} {
  const embedding = parseEmbedding(body.embedding);
  if (!embedding) {
    return {
      error: `embedding must be a number[${FACE_EMBEDDING_DIM}] array`,
    };
  }

  let threshold = DEFAULT_FACE_MATCH_THRESHOLD;
  if (body.threshold !== undefined) {
    if (typeof body.threshold !== "number" || !Number.isFinite(body.threshold)) {
      return { error: "threshold must be a number" };
    }
    if (body.threshold < 0.3 || body.threshold > 0.95) {
      return { error: "threshold must be between 0.3 and 0.95" };
    }
    threshold = body.threshold;
  }

  return { data: { embedding, threshold } };
}
