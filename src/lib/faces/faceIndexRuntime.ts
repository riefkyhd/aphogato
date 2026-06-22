"use client";

import {
  FACE_DETECT_INPUT_SIZE,
  FACE_DETECT_MIN_AREA_RATIO,
  FACE_DETECT_MIN_PX,
  FACE_DETECT_MIN_SCORE,
  FACE_DETECT_SCORE_THRESHOLD,
} from "@/lib/faces/detectionConfig";
import { l2NormalizeEmbedding } from "@/lib/faces/normalizeEmbedding";
import { MAX_FACES_PER_PHOTO, type PhotoFaceInput } from "@/lib/faces/types";

const MODEL_BASE_URL = "/models/face-api";

type FaceApiModule = typeof import("@vladmandic/face-api");

type RawDetection = {
  detection: {
    score: number;
    box: { x: number; y: number; width: number; height: number };
  };
  descriptor: Float32Array;
};

let modelsReady: Promise<FaceApiModule> | null = null;

async function loadFaceApi(): Promise<FaceApiModule> {
  if (!modelsReady) {
    modelsReady = (async () => {
      const [faceapi, tf] = await Promise.all([
        import("@vladmandic/face-api"),
        import("@tensorflow/tfjs-core"),
      ]);
      await import("@tensorflow/tfjs-backend-webgl");
      await import("@tensorflow/tfjs-backend-cpu");

      if (!tf.getBackend()) {
        try {
          await tf.setBackend("webgl");
        } catch {
          await tf.setBackend("cpu");
        }
      }
      await tf.ready();

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_BASE_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE_URL),
      ]);

      return faceapi;
    })();
  }
  return modelsReady;
}

function clampBbox(
  bbox_x: number,
  bbox_y: number,
  bbox_w: number,
  bbox_h: number
): Pick<PhotoFaceInput, "bbox_x" | "bbox_y" | "bbox_w" | "bbox_h"> {
  const x = Math.max(0, Math.min(bbox_x, 1));
  const y = Math.max(0, Math.min(bbox_y, 1));
  const w = Math.max(0.001, Math.min(bbox_w, 1 - x));
  const h = Math.max(0.001, Math.min(bbox_h, 1 - y));
  return { bbox_x: x, bbox_y: y, bbox_w: w, bbox_h: h };
}

function toNormalizedFaces(
  detections: RawDetection[],
  width: number,
  height: number,
  minScore = FACE_DETECT_MIN_SCORE
): PhotoFaceInput[] {
  const imageArea = width * height;

  return detections
    .filter((detection) => detection.detection.score >= minScore)
    .filter((detection) => {
      const box = detection.detection.box;
      return (
        box.width >= FACE_DETECT_MIN_PX &&
        box.height >= FACE_DETECT_MIN_PX &&
        box.width * box.height >= imageArea * FACE_DETECT_MIN_AREA_RATIO
      );
    })
    .map((detection) => {
      const box = detection.detection.box;
      const bbox = clampBbox(
        box.x / width,
        box.y / height,
        box.width / width,
        box.height / height
      );
      return {
        ...bbox,
        embedding: l2NormalizeEmbedding(detection.descriptor),
        area: box.width * box.height,
        score: detection.detection.score,
      };
    })
    .sort((a, b) => b.area - a.area)
    .slice(0, MAX_FACES_PER_PHOTO)
    .map(({ bbox_x, bbox_y, bbox_w, bbox_h, embedding }) => ({
      bbox_x,
      bbox_y,
      bbox_w,
      bbox_h,
      embedding,
    }));
}

export async function detectFacesFromBuffer(
  buffer: ArrayBuffer,
  mimeType = "image/jpeg"
): Promise<PhotoFaceInput[]> {
  const faceapi = await loadFaceApi();
  const bitmap = await createImageBitmap(
    new Blob([buffer], { type: mimeType || "image/jpeg" })
  );

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not create canvas for face indexing");
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const detections = await faceapi
    .detectAllFaces(
      canvas,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: FACE_DETECT_INPUT_SIZE,
        scoreThreshold: FACE_DETECT_SCORE_THRESHOLD,
      })
    )
    .withFaceLandmarks(true)
    .withFaceDescriptors();

  return toNormalizedFaces(
    detections as RawDetection[],
    canvas.width,
    canvas.height
  );
}

export function preloadFaceIndexModels(): void {
  if (typeof window === "undefined") return;
  void loadFaceApi().catch((err) => {
    console.warn("Face index model preload failed:", err);
  });
}
