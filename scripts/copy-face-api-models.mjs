import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "node_modules", "@vladmandic", "face-api", "model");
const targetDir = join(root, "public", "models", "face-api");

const files = [
  "ssd_mobilenetv1_model-weights_manifest.json",
  "ssd_mobilenetv1_model.bin",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model.bin",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model.bin",
];

if (!existsSync(sourceDir)) {
  console.warn("copy-face-api-models: @vladmandic/face-api not installed, skipping");
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  copyFileSync(join(sourceDir, file), join(targetDir, file));
}

console.log(`copy-face-api-models: copied ${files.length} files to public/models/face-api`);
