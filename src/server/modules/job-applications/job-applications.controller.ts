import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import * as applicationsService from "@/server/modules/job-applications/job-applications.service";
import { csvResponse } from "@/server/modules/shared/csv";
import { HttpError } from "@/server/modules/shared/errors";

// An office or a phone carrier can put many people behind one address, so
// this is generous; the hidden "website" field catches most bots.
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const handleError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
  if (error instanceof HttpError) return fail(error.message, error.status);
  return failFromError(error, fallbackMessage);
};

// ---- Public ----------------------------------------------------------------

export async function apply(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (isRateLimited(`job-apply:${getClientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return fail("Too many applications from this network. Please try again in a few minutes.", 429);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Invalid request body.", 400);
  }

  // Honeypot: real people never see this field. Answer as if it worked, save nothing.
  if (form.get("website")) return ok({ firstName: "", jobTitle: "" }, 201);

  try {
    const { slug } = await params;
    return ok(await applicationsService.applyForJob(slug, form), 201);
  } catch (error) {
    return handleError(error, "Could not send your application. Please try again.");
  }
}

// ---- Admin -----------------------------------------------------------------

type IdParams = { params: Promise<{ id: string }> };

export async function listAdmin(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const applications = await applicationsService.listApplications();

    if (new URL(request.url).searchParams.get("format") === "csv") {
      return csvResponse(
        "job-applications",
        [
          "First name",
          "Last name",
          "Email",
          "Phone",
          "Address",
          "Role",
          "Category",
          "Status",
          "Why they are a good fit",
          "CV file",
          "Internal notes",
          "Applied",
        ],
        applications.map((a) => [
          a.firstName,
          a.lastName,
          a.email,
          a.phone,
          a.address,
          a.job.title,
          a.job.category,
          a.status,
          a.motivation,
          a.cvFileName,
          a.adminNotes,
          a.createdAt,
        ])
      );
    }

    return ok(applications);
  } catch (error) {
    return handleError(error, "Could not load applications.");
  }
}

export async function getOne(_request: Request, { params }: IdParams) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  const { id } = await params;
  const application = await applicationsService.getApplication(id);
  if (!application) return fail("Application not found.", 404);
  return ok(application);
}

export async function update(request: Request, { params }: IdParams) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    return ok(await applicationsService.updateApplication(id, await request.json()));
  } catch (error) {
    if (error instanceof SyntaxError) return fail("Invalid request body.", 400);
    return handleError(error, "Could not update the application.");
  }
}

export async function remove(_request: Request, { params }: IdParams) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    await applicationsService.deleteApplication(id);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error, "Could not delete the application.");
  }
}

export async function downloadCv(_request: Request, { params }: IdParams) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    const cv = await applicationsService.downloadCv(id);
    return new Response(cv.body, {
      headers: {
        "Content-Type": cv.contentType,
        "Content-Disposition": `${cv.inline ? "inline" : "attachment"}; filename="${cv.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleError(error, "Could not open the CV.");
  }
}
