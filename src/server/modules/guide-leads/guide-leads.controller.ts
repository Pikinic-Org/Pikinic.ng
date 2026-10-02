import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import { isGuideAvailable } from "@/lib/cloudinary";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { csvResponse } from "@/server/modules/shared/csv";
import { HttpError } from "@/server/modules/shared/errors";
import { guideProfileInputSchema, requestGuideInputSchema } from "@/server/modules/guide-leads/guide-leads.schema";
import * as guideLeadsService from "@/server/modules/guide-leads/guide-leads.service";

// A conference hall shares one Wi-Fi network, and mobile carriers put many
// phones behind one address, so a per-IP limit has to allow a whole room. Bots
// are caught by the hidden "website" field instead (see request()).
const RATE_LIMIT = 2000;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const handleError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
  if (error instanceof HttpError) return fail(error.message, error.status);
  return failFromError(error, fallbackMessage);
};

// ---- Public ----------------------------------------------------------------

export async function request(request: Request) {
  // A venue full of attendees shares one Wi-Fi network (one IP), so this limit
  // is deliberately more generous than the contact form's.
  if (isRateLimited(`waec-guide:${getClientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return fail("Too many requests from this network. Please try again in a few minutes.", 429);
  }

  try {
    const raw = await request.json();
    // Honeypot: real people never see this field, bots fill every input. Answer
    // as if it worked so the bot moves on, but save nothing.
    if (raw && typeof raw === "object" && "website" in raw && raw.website) {
      return ok({ token: "", downloadPath: null }, 201);
    }
    const input = requestGuideInputSchema.parse(raw);
    return ok(await guideLeadsService.requestGuide(input), 201);
  } catch (error) {
    if (error instanceof SyntaxError) return fail("Invalid request body.", 400);
    return handleError(error, "Could not send your guide. Please try again.");
  }
}

// Optional second step. The token from step one proves which lead this is.
export async function profile(request: Request) {
  if (isRateLimited(`waec-guide-profile:${getClientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return fail("Too many requests from this network. Please try again in a few minutes.", 429);
  }

  try {
    const input = guideProfileInputSchema.parse(await request.json());
    await guideLeadsService.saveGuideProfile(input);
    return ok({ ok: true });
  } catch (error) {
    if (error instanceof SyntaxError) return fail("Invalid request body.", 400);
    return handleError(error, "Could not save your answers. Please try again.");
  }
}

export async function download(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const file = searchParams.get("file") === "brochure" ? "brochure" : "guide";
  const expired = NextResponse.redirect(
    new URL(file === "brochure" ? "/waec?link=expired" : "/study-abroad-review?link=expired", origin)
  );

  const token = searchParams.get("t");
  if (!token) return expired;

  try {
    if (!isGuideAvailable(file)) return expired;
    const url = await guideLeadsService.resolveGuideDownload(token, file);
    return url ? NextResponse.redirect(url) : expired;
  } catch (error) {
    console.error("Guide download error:", error);
    return fail("The guide is not available right now. Please try again shortly.", 503);
  }
}

// ---- Admin -----------------------------------------------------------------

// The export/purge window is "requested before this UTC date" (YYYY-MM-DD). The
// admin page uses the same boundary to show how many leads a purge would remove.
function parseBefore(value: string | null): Date | null | "invalid" {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "invalid";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

export async function listAdmin(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  const params = new URL(request.url).searchParams;
  const before = parseBefore(params.get("before"));
  if (before === "invalid") return fail("before must be a date like 2026-12-31.", 400);

  try {
    const leads = await guideLeadsService.listGuideLeads(before ?? undefined);

    if (params.get("format") === "csv") {
      const header = [
        "Name",
        "Email",
        "WhatsApp",
        "Stage",
        "Qualification",
        "Field of study",
        "Country",
        "Intake",
        "Funding",
        "Profile completed",
        "Source",
        "Downloads",
        "Last download",
        "Requested",
      ];
      return csvResponse(
        "waec-guide-leads",
        header,
        leads.map((lead) => [
          lead.name,
          lead.email,
          lead.whatsapp,
          lead.stage,
          lead.qualification,
          lead.fieldOfStudy,
          lead.country,
          lead.intake,
          lead.funding,
          lead.profileCompletedAt,
          lead.source,
          lead.downloadCount,
          lead.lastDownloadAt,
          lead.createdAt,
        ])
      );
    }

    return ok(leads);
  } catch (error) {
    return handleError(error, "Could not load guide leads.");
  }
}

// Bulk purge. `before` is required, so a bare DELETE can never wipe the table.
export async function purgeAdmin(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  const before = parseBefore(new URL(request.url).searchParams.get("before"));
  if (!before || before === "invalid") return fail("before is required, as a date like 2026-12-31.", 400);

  try {
    return ok({ deleted: await guideLeadsService.purgeGuideLeadsBefore(before) });
  } catch (error) {
    return handleError(error, "Could not purge guide leads.");
  }
}

export async function removeAdmin(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    await guideLeadsService.deleteGuideLead(id);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error, "Could not delete that lead.");
  }
}
