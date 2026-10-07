import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import * as jobsService from "@/server/modules/jobs/jobs.service";

type SlugParams = { params: Promise<{ slug: string }> };

export async function listAdmin() {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    return ok(await jobsService.listJobs());
  } catch (error) {
    return failFromError(error, "Could not load jobs.");
  }
}

export async function create(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const job = await jobsService.createJob(await request.json());
    return ok(job, 201);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not create job.");
  }
}

export async function getOne(_request: Request, { params }: SlugParams) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  const { slug } = await params;
  const job = await jobsService.getJobBySlug(slug);
  if (!job) return fail("Job not found.", 404);
  return ok(job);
}

export async function update(request: Request, { params }: SlugParams) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { slug } = await params;
    const job = await jobsService.updateJob(slug, await request.json());
    return ok(job);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not update job.");
  }
}

export async function remove(_request: Request, { params }: SlugParams) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { slug } = await params;
    await jobsService.deleteJob(slug);
    return ok({ ok: true });
  } catch (error) {
    return failFromError(error, "Could not delete job.");
  }
}
