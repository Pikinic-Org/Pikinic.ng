import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import * as packagesService from "@/server/modules/packages/packages.service";

export async function list() {
  try {
    const packages = await packagesService.listPackages();
    return ok(packages);
  } catch (error) {
    console.error("List packages error:", error);
    return fail("Could not load packages.", 500);
  }
}

export async function getBySlug(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const pkg = await packagesService.getPackageBySlug(slug);
    if (!pkg) return fail("Package not found.", 404);
    return ok(pkg);
  } catch (error) {
    console.error("Get package error:", error);
    return fail("Could not load package.", 500);
  }
}

export async function listAdmin() {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const packages = await packagesService.listPackages();
    return ok(packages);
  } catch (error) {
    console.error("List admin packages error:", error);
    return fail("Could not load packages.", 500);
  }
}

export async function create(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const body = await request.json();
    const pkg = await packagesService.createPackage(body);
    return ok(pkg, 201);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not create package.");
  }
}

export async function getOne(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  const { slug } = await params;
  const pkg = await packagesService.getPackageBySlug(slug);
  if (!pkg) return fail("Package not found.", 404);
  return ok(pkg);
}

export async function update(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { slug } = await params;
    const body = await request.json();
    const pkg = await packagesService.updatePackage(slug, body);
    return ok(pkg);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not update package.");
  }
}

export async function remove(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { slug } = await params;
    await packagesService.deletePackage(slug);
    return ok({ ok: true });
  } catch (error) {
    return failFromError(error, "Could not delete package.");
  }
}
