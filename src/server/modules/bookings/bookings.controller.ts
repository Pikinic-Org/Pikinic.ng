import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import { requireEnv } from "@/lib/env";
import {
  confirmPaymentAndReserve,
  deleteFlightBooking,
  getBooking,
  listFlightBookings,
  retryOwedRefunds,
  retryRefund,
  startCheckout,
} from "@/server/modules/bookings/bookings.service";

const hasValidProxySecret = (request: Request) => {
  const [proxySecret] = requireEnv("FLIGHTS_PROXY_SECRET");
  return request.headers.get("x-flights-proxy-secret") === proxySecret;
};

export const listAdmin = async () => {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    return ok(await listFlightBookings());
  } catch (error) {
    return failFromError(error, "Could not load flight bookings.");
  }
};

export const removeAdmin = async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    await deleteFlightBooking(id);
    return ok({ ok: true });
  } catch (error) {
    return failFromError(error, "Could not delete flight booking.");
  }
};

// POST /api/admin/bookings/[id]/refund — starts the refund again for a failed booking whose
// refund the gateway refused (refund_not_started) or that failed.
export const retryRefundAdmin = async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { id } = await params;
    const booking = await retryRefund(id);
    return ok({ refundStatus: booking.refundStatus });
  } catch (error) {
    return failFromError(error, "Could not start the refund.");
  }
};

// GET /api/cron/retry-refunds — run daily by Vercel Cron (vercel.json), which sends
// "Authorization: Bearer $CRON_SECRET". Retries refunds the gateway refused to start.
export const retryOwedRefundsCron = async (request: Request) => {
  const [cronSecret] = requireEnv("CRON_SECRET");
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) return fail("Unauthorized.", 401);

  try {
    return ok({ retried: await retryOwedRefunds() });
  } catch (error) {
    return failFromError(error, "Could not retry refunds.");
  }
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
