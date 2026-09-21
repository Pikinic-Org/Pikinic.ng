import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireEnv } from "@/lib/env";
import { confirmPaymentAndReserve, getBooking, startCheckout } from "@/server/modules/bookings/bookings.service";

const hasValidProxySecret = (request: Request) => {
  const [proxySecret] = requireEnv("FLIGHTS_PROXY_SECRET");
  return request.headers.get("x-flights-proxy-secret") === proxySecret;
};

export const checkout = async (request: Request) => {
  if (!hasValidProxySecret(request)) return fail("Unauthorized.", 401);

  try {
    const body = await request.json();
    const result = await startCheckout(body);
    return ok(result, 201);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not start checkout.");
  }
};

export const show = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  if (!hasValidProxySecret(request)) return fail("Unauthorized.", 401);

  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) return fail("Booking not found.", 404);
  return ok(booking);
};

export const confirm = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  if (!hasValidProxySecret(request)) return fail("Unauthorized.", 401);

  const { id } = await params;
  try {
    const booking = await confirmPaymentAndReserve(id);
    return ok(booking);
  } catch (error) {
    return failFromError(error, "Could not confirm booking.");
  }
};
