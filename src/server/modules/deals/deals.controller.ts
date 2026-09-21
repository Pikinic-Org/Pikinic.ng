import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import * as dealsService from "@/server/modules/deals/deals.service";

export async function listAdmin() {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const deals = await dealsService.listFlightDeals();
    return ok(deals);
  } catch (error) {
    console.error("List admin flight deals error:", error);
    return fail("Could not load flight deals.", 500);
  }
}

export async function create(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const body = await request.json();
    const deal = await dealsService.createFlightDeal(body);
    return ok(deal, 201);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not create flight deal.");
  }
}

export async function getOne(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  const { id } = await params;
  const deal = await dealsService.getFlightDealById(id);
  if (!deal) return fail("Flight deal not found.", 404);
  return ok(deal);
}

export async function update(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    const body = await request.json();
    const deal = await dealsService.updateFlightDeal(id, body);
    return ok(deal);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not update flight deal.");
  }
}

export async function remove(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    await dealsService.deleteFlightDeal(id);
    return ok({ ok: true });
  } catch (error) {
    return failFromError(error, "Could not delete flight deal.");
  }
}
