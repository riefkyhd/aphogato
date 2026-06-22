export const FACE_EMBEDDING_DIM = 128;
export const MAX_FACES_PER_PHOTO = 20;
export const DEFAULT_FACE_MATCH_THRESHOLD = 0.55;
export const FACE_INDEX_READY_RATIO = 0.95;

export type FaceIndexStatus = "none" | "partial" | "ready";

export interface PhotoFaceInput {
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  embedding: number[];
}

export interface FaceSearchStatus {
  enabled: boolean;
  totalPhotos: number;
  indexedPhotos: number;
  faceCount: number;
  status: FaceIndexStatus;
}
