import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import * as mediaService from "@/server/modules/media/media.service";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

export async function list() {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const items = await mediaService.listMediaItems();
    return ok(items);
  } catch (error) {
    console.error("List media items error:", error);
    return fail("Could not load media items.", 500);
  }
}

export async function upload(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return fail("A file is required.", 400);
    if (file.size === 0) return fail("The file is empty.", 400);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return fail(`Image must be ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB or smaller.`, 400);
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return fail("Unsupported file type. Upload a JPEG, PNG, WebP, GIF, or AVIF image.", 400);
    }

    const item = await mediaService.createMediaItem(file);
    return ok(item, 201);
  } catch (error) {
    console.error("Upload media item error:", error);
    return fail("Could not upload image.", 500);
  }
}

export async function remove(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    await mediaService.deleteMediaItem(id);
    return ok({ ok: true });
  } catch (error) {
    return failFromError(error, "Could not delete media item.");
  }
}
