import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { programmeLabel } from "@/lib/constants";
import { csvResponse } from "@/server/modules/shared/csv";
import { HttpError } from "@/server/modules/shared/errors";
import * as consultantsService from "@/server/modules/consultants/consultants.service";

// Sign-ups come from a flyer QR code, and people sharing a Wi-Fi network or a
// mobile carrier share one IP, so this allows a room's worth. The hidden
// "website" field catches bots.
const RATE_LIMIT = 100;
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
    // Honeypot: answer as if it worked so the bot moves on, but save nothing.
    if (body && typeof body === "object" && "website" in body && body.website) {
      return ok({ firstName: "", fullName: "", paymentCode: "", amount: 0 }, 201);
    }
    return ok(await consultantsService.registerForBankTransfer(body), 201);
  } catch (error) {
    if (error instanceof SyntaxError) return fail("Invalid request body.", 400);
    return handleError(error, "Could not complete your registration.");
  }
}

// ---- Admin -----------------------------------------------------------------

export async function listAdmin(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const consultants = await consultantsService.listConsultants();

    if (new URL(request.url).searchParams.get("format") === "csv") {
      return csvResponse(
        "travel-consultants",
        [
          "Name",
          "Email",
          "WhatsApp",
          "City",
          "Programme",
          "Payment code",
          "Payment",
          "Amount (NGN)",
          "Paid at",
          "Stage",
          "Notes from applicant",
          "Heard about us via",
          "Internal notes",
          "Registered",
        ],
        consultants.map((c) => [
          c.fullName,
          c.email,
          c.whatsapp,
          c.city,
          programmeLabel(c.programme),
          c.paymentCode,
          c.paymentStatus,
          c.amount,
          c.paidAt,
          c.reviewStatus,
          c.motivation,
          c.referralSource,
          c.adminNotes,
          c.createdAt,
        ])
      );
    }

    return ok(consultants);
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
