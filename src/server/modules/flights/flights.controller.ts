import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import * as flightsService from "@/server/modules/flights/flights.service";

export async function list() {
  try {
    const offers = await flightsService.listFlightOffers();
    return ok(offers);
  } catch (error) {
    console.error("List flight offers error:", error);
    return fail("Could not load flight offers.", 500);
  }
}

export async function listAdmin() {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const offers = await flightsService.listFlightOffers();
    return ok(offers);
  } catch (error) {
    console.error("List admin flight offers error:", error);
    return fail("Could not load flight offers.", 500);
  }
}

export async function create(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const body = await request.json();
    const offer = await flightsService.createFlightOffer(body);
    return ok(offer, 201);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not create flight offer.");
  }
}

export async function getOne(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  const { id } = await params;
  const offer = await flightsService.getFlightOfferById(id);
  if (!offer) return fail("Flight offer not found.", 404);
  return ok(offer);
}

export async function update(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    const body = await request.json();
    const offer = await flightsService.updateFlightOffer(id, body);
    return ok(offer);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not update flight offer.");
  }
}

export async function remove(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    await flightsService.deleteFlightOffer(id);
    return ok({ ok: true });
  } catch (error) {
    return failFromError(error, "Could not delete flight offer.");
  }
}
