/// <reference lib="webworker" />

import * as faceapi from "@vladmandic/face-api";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import { l2NormalizeEmbedding } from "@/lib/faces/normalizeEmbedding";
import { MAX_FACES_PER_PHOTO } from "@/lib/faces/types";

const MIN_FACE_PX = 28;

type FaceIndexWorkerRequest = {
  type: "index";
  id: number;
  buffer: ArrayBuffer;
  mimeType?: string;
  modelBaseUrl: string;
};

type FaceIndexWorkerResponse = {
  type: "index-result";
  id: number;
  faces: Array<{
    bbox_x: number;
    bbox_y: number;
    bbox_w: number;
    bbox_h: number;
    embedding: number[];
  }>;
  error?: string;
};

let modelsReady: Promise<void> | null = null;

async function ensureBackend(): Promise<void> {
  if (tf.getBackend()) return;
  // CPU is more reliable inside dedicated workers than WebGL/OffscreenCanvas.
  await tf.setBackend("cpu");
  await tf.ready();
}

async function ensureModels(modelBaseUrl: string): Promise<void> {
  if (!modelsReady) {
    modelsReady = (async () => {
      await ensureBackend();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelBaseUrl),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelBaseUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelBaseUrl),
      ]);
    })();
  }
  await modelsReady;
}

function toNormalizedFaces(
  detections: faceapi.WithFaceDescriptor<
    faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>
  >[],
  width: number,
  height: number
) {
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
    .map(({ bbox_x, bbox_y, bbox_w, bbox_h, embedding }) => ({
      bbox_x,
      bbox_y,
      bbox_w,
      bbox_h,
      embedding,
    }));
}

self.onmessage = async (event: MessageEvent<FaceIndexWorkerRequest>) => {
  const message = event.data;
  if (message.type !== "index") return;

  try {
    await ensureModels(message.modelBaseUrl);
    const mimeType = message.mimeType?.trim() || "image/jpeg";
    const bitmap = await createImageBitmap(
      new Blob([message.buffer], { type: mimeType })
    );
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create canvas for face indexing");
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const tensor = tf.browser.fromPixels(imageData);
    let detections;
    try {
      detections = await faceapi
        .detectAllFaces(
          tensor as unknown as faceapi.TNetInput,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.35,
          })
        )
        .withFaceLandmarks(true)
        .withFaceDescriptors();
    } finally {
      tensor.dispose();
    }

    const faces = toNormalizedFaces(
      detections,
      canvas.width,
      canvas.height
    );

    const response: FaceIndexWorkerResponse = {
      type: "index-result",
      id: message.id,
      faces,
    };
    self.postMessage(response);
  } catch (err) {
    const response: FaceIndexWorkerResponse = {
      type: "index-result",
      id: message.id,
      faces: [],
      error: err instanceof Error ? err.message : "Face indexing failed",
    };
    self.postMessage(response);
  }
};

export {};
