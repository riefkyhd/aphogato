import {
  FACE_INDEX_READY_RATIO,
  type FaceIndexStatus,
  type FaceSearchStatus,
} from "@/lib/faces/types";

export function computeFaceIndexStatus(
  totalPhotos: number,
  indexedPhotos: number
): FaceIndexStatus {
  if (totalPhotos === 0 || indexedPhotos === 0) {
    return "none";
  }
  if (indexedPhotos / totalPhotos >= FACE_INDEX_READY_RATIO) {
    return "ready";
  }
  return "partial";
}

export function buildFaceSearchStatus({
  enabled,
  totalPhotos,
  indexedPhotos,
  faceCount,
}: {
  enabled: boolean;
  totalPhotos: number;
  indexedPhotos: number;
  faceCount: number;
}): FaceSearchStatus {
  return {
    enabled,
    totalPhotos,
    indexedPhotos,
    faceCount,
    status: enabled
      ? computeFaceIndexStatus(totalPhotos, indexedPhotos)
      : "none",
  };
}
