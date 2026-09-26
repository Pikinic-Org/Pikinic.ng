// Uploads the free WAEC guide PDF to Cloudinary as an *authenticated* asset:
// it has no public URL, and can only be fetched through the signed link that
// the /api/waec-guide/download route generates for a lead.
//
// Usage:  pnpm guide:upload "C:\path\to\WAEC FREE GUIDE.pdf"
//
// Run it again with a new file to replace the guide; the public id stays the
// same, so nothing else needs to change.

import { config } from "dotenv";
import { existsSync, statSync } from "node:fs";
import { v2 as cloudinary } from "cloudinary";

config({ path: ".env.local" });

const PUBLIC_ID = process.env.WAEC_GUIDE_PUBLIC_ID || "pikinic-guides/waec-free-guide";
const MAX_BYTES = 10 * 1024 * 1024; // Cloudinary's free-plan upload limit

async function main() {
  const file = process.argv[2];
  if (!file || !existsSync(file)) {
    console.error('Give the path to the PDF:  pnpm guide:upload "path/to/WAEC FREE GUIDE.pdf"');
    process.exit(1);
  }
  if (!file.toLowerCase().endsWith(".pdf")) {
    console.error("The guide must be a .pdf file.");
    process.exit(1);
  }

  const { size } = statSync(file);
  if (size > MAX_BYTES) {
    console.error(
      `That file is ${(size / 1024 / 1024).toFixed(1)} MB. Export a web-optimised PDF under 10 MB (ideally under 5 MB, since most people download on mobile data).`
    );
    process.exit(1);
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error("Missing CLOUDINARY_* variables in .env.local.");
    process.exit(1);
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  const result = await cloudinary.uploader.upload(file, {
    public_id: PUBLIC_ID,
    resource_type: "image",
    type: "authenticated",
    overwrite: true,
    invalidate: true,
  });

  console.log(`Uploaded ${(result.bytes / 1024 / 1024).toFixed(2)} MB as ${result.public_id} (${result.pages ?? "?"} pages).`);
  console.log("It is private: only signed links from /api/waec-guide/download can fetch it.");
}

main().catch((error) => {
  console.error("Upload failed:", error);
  process.exit(1);
});
