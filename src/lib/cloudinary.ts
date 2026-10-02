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

// Where the optional WAEC guide bonus lives. It is uploaded once with
// `pnpm guide:upload` as an *authenticated* asset, so it has no public URL:
// the only way to fetch it is a signed link generated here. The bonus is only
// offered when WAEC_GUIDE_PUBLIC_ID is set on the host, so a deploy without the
// PDF never shows a download button that leads nowhere.
export const WAEC_GUIDE_PUBLIC_ID = process.env.WAEC_GUIDE_PUBLIC_ID;

// The PiKiNiC WAEC brochure (UK universities that accept WAEC) is stored the
// same way, uploaded with `pnpm guide:upload --brochure`. It is offered on /waec
// only when WAEC_BROCHURE_PUBLIC_ID is set on the host.
export const WAEC_BROCHURE_PUBLIC_ID = process.env.WAEC_BROCHURE_PUBLIC_ID;

export type GuideFile = "guide" | "brochure";

const publicIdFor = (file: GuideFile) => (file === "brochure" ? WAEC_BROCHURE_PUBLIC_ID : WAEC_GUIDE_PUBLIC_ID);

export const isGuideAvailable = (file: GuideFile = "guide") => Boolean(publicIdFor(file));

/** A signed Cloudinary download link for a guide file that stops working after `ttlSeconds`. */
export function getGuideDownloadUrl(file: GuideFile = "guide", ttlSeconds = 300): string {
  ensureConfigured();
  const publicId = publicIdFor(file);
  if (!publicId) throw new Error(`The ${file} public id is not set.`);
  return cloudinary.utils.private_download_url(publicId, "pdf", {
    resource_type: "image",
    type: "authenticated",
    attachment: true,
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
}
