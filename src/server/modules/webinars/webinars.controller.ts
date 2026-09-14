import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import * as webinarsService from "@/server/modules/webinars/webinars.service";

export async function list() {
  try {
    const webinars = await webinarsService.listWebinars();
    return ok(webinars);
  } catch (error) {
    console.error("List webinars error:", error);
    return fail("Could not load webinars.", 500);
  }
}

export async function getBySlug(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const webinar = await webinarsService.getWebinarBySlug(slug);
    if (!webinar) return fail("Webinar not found.", 404);
    return ok(webinar);
  } catch (error) {
    console.error("Get webinar error:", error);
    return fail("Could not load webinar.", 500);
  }
}

export async function listAdmin() {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const webinars = await webinarsService.listWebinars();
    return ok(webinars);
  } catch (error) {
    console.error("List admin webinars error:", error);
    return fail("Could not load webinars.", 500);
  }
}

export async function create(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const body = await request.json();
    const webinar = await webinarsService.createWebinar(body);
    return ok(webinar, 201);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not create webinar.");
  }
}

export async function getOne(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  const { slug } = await params;
  const webinar = await webinarsService.getWebinarBySlug(slug);
  if (!webinar) return fail("Webinar not found.", 404);
  return ok(webinar);
}

export async function update(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { slug } = await params;
    const body = await request.json();
    const webinar = await webinarsService.updateWebinar(slug, body);
    return ok(webinar);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not update webinar.");
  }
}

export async function remove(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { slug } = await params;
    await webinarsService.deleteWebinar(slug);
    return ok({ ok: true });
  } catch (error) {
    return failFromError(error, "Could not delete webinar.");
  }
}
