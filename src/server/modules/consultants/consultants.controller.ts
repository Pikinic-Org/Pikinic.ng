import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { HttpError } from "@/server/modules/shared/errors";
import * as consultantsService from "@/server/modules/consultants/consultants.service";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const handleError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
  if (error instanceof HttpError) return fail(error.message, error.status);
  return failFromError(error, fallbackMessage);
};

// ---- Public ----------------------------------------------------------------

export async function register(request: Request) {
  if (isRateLimited(`consultant-register:${getClientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return fail("Too many attempts. Please try again later.", 429);
  }

  try {
    const body = await request.json();
    const result = await consultantsService.registerConsultant(body, new URL(request.url).origin);
    return ok(result, 201);
  } catch (error) {
    return handleError(error, "Could not complete your registration.");
  }
}

export async function status(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("id query param is required.", 400);

  try {
    return ok(await consultantsService.getRegistrationStatus(id));
  } catch (error) {
    return handleError(error, "Could not check your payment status.");
  }
}

// ---- Admin -----------------------------------------------------------------

export async function listAdmin() {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    return ok(await consultantsService.listConsultants());
  } catch (error) {
    return handleError(error, "Could not load travel consultants.");
  }
}

export async function getOne(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  const { id } = await params;
  const consultant = await consultantsService.getConsultantById(id);
  if (!consultant) return fail("Travel consultant not found.", 404);
  return ok(consultant);
}

export async function update(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    const body = await request.json();
    return ok(await consultantsService.updateConsultantReview(id, body));
  } catch (error) {
    return handleError(error, "Could not update travel consultant.");
  }
}

export async function remove(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    await consultantsService.deleteConsultant(id);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error, "Could not delete travel consultant.");
  }
}
