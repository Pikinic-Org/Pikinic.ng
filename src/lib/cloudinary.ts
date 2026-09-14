import { v2 as cloudinary } from "cloudinary";
import { requireEnv } from "@/lib/env";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const [cloudName, apiKey, apiSecret] = requireEnv(
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  );
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  configured = true;
}

export type UploadedImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
};

export async function uploadImage(buffer: Buffer, folder = "pikinic-admin"): Promise<UploadedImage> {
  ensureConfigured();
  const base64 = buffer.toString("base64");
  const result = await cloudinary.uploader.upload(`data:application/octet-stream;base64,${base64}`, {
    folder,
    resource_type: "image",
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

export async function destroyImage(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId);
}
