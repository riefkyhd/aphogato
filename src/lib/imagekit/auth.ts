import "server-only";

import { createHmac, randomUUID } from "crypto";
import { getImageKitPrivateKey, getImageKitPublicKey } from "@/lib/imagekit/config";

const UPLOAD_AUTH_TTL_SECONDS = 60 * 40;

export type ImageKitUploadAuth = {
  publicKey: string;
  token: string;
  expire: number;
  signature: string;
  uploadUrl: string;
};

export function buildImageKitUploadAuth(): ImageKitUploadAuth {
  const publicKey = getImageKitPublicKey();
  const privateKey = getImageKitPrivateKey();
  const token = randomUUID();
  const expire = Math.floor(Date.now() / 1000) + UPLOAD_AUTH_TTL_SECONDS;
  const signature = createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  return {
    publicKey,
    token,
    expire,
    signature,
    uploadUrl: "https://upload.imagekit.io/api/v1/files/upload",
  };
}
