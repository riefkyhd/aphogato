"use client";

import { l2NormalizeEmbedding } from "@/lib/faces/normalizeEmbedding";
import { MAX_FACES_PER_PHOTO, type PhotoFaceInput } from "@/lib/faces/types";

const MODEL_BASE_URL = "/models/face-api";
const MIN_FACE_PX = 28;

type FaceApiModule = typeof import("@vladmandic/face-api");

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

function toNormalizedFaces(
  detections: Array<{
    detection: { box: { x: number; y: number; width: number; height: number } };
    descriptor: Float32Array;
  }>,
  width: number,
  height: number
): PhotoFaceInput[] {
  return detections
    .filter(
      (detection) =>
        detection.detection.box.width >= MIN_FACE_PX &&
        detection.detection.box.height >= MIN_FACE_PX
    )
    .map((detection) => {
      const box = detection.detection.box;
      return {
        bbox_x: box.x / width,
        bbox_y: box.y / height,
        bbox_w: box.width / width,
        bbox_h: box.height / height,
        embedding: l2NormalizeEmbedding(detection.descriptor),
        area: box.width * box.height,
      };
    })
    .sort((a, b) => b.area - a.area)
    .slice(0, MAX_FACES_PER_PHOTO)
    .map(({ bbox_x, bbox_y, bbox_w, bbox_h, embedding }) => {
      const x = Math.max(0, Math.min(bbox_x, 1));
      const y = Math.max(0, Math.min(bbox_y, 1));
      const w = Math.max(0.001, Math.min(bbox_w, 1 - x));
      const h = Math.max(0.001, Math.min(bbox_h, 1 - y));
      return { bbox_x: x, bbox_y: y, bbox_w: w, bbox_h: h, embedding };
    });
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
        inputSize: 512,
        scoreThreshold: 0.35,
      })
    )
    .withFaceLandmarks(true)
    .withFaceDescriptors();

  return toNormalizedFaces(detections, canvas.width, canvas.height);
}

export function preloadFaceIndexModels(): void {
  if (typeof window === "undefined") return;
  void loadFaceApi().catch((err) => {
    console.warn("Face index model preload failed:", err);
  });
}
