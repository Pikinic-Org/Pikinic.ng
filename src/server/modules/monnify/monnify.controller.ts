import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireEnv } from "@/lib/env";
import { verifyMonnifyWebhookSignature } from "@/server/modules/monnify/monnify.client";
import { getTransactionStatus, initiatePayment } from "@/server/modules/monnify/monnify.service";
import {
  monnifyWebhookEventSchema,
  refundEventDataSchema,
  successfulTransactionEventDataSchema,
} from "@/server/modules/monnify/monnify.schema";
import { confirmPaymentAndReserve, getBooking, recordRefundOutcome } from "@/server/modules/bookings/bookings.service";
import {
  CONSULTANT_PAYMENT_PREFIX,
  confirmPaymentByReference as confirmConsultantPaymentByReference,
} from "@/server/modules/consultants/consultants.service";

export const initiate = async (request: Request) => {
  const [proxySecret] = requireEnv("FLIGHTS_PROXY_SECRET");
  if (request.headers.get("x-flights-proxy-secret") !== proxySecret) {
    return fail("Unauthorized.", 401);
  }

  try {
    const body = await request.json();
    const result = await initiatePayment(body);
    return ok(result);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not initiate payment.");
  }
};

export const status = async (request: Request) => {
  const [proxySecret] = requireEnv("FLIGHTS_PROXY_SECRET");
  if (request.headers.get("x-flights-proxy-secret") !== proxySecret) {
    return fail("Unauthorized.", 401);
  }

  const transactionReference = new URL(request.url).searchParams.get("transactionReference");
  if (!transactionReference) return fail("transactionReference query param is required.", 400);

  try {
    const result = await getTransactionStatus(transactionReference);
    return ok(result);
  } catch (error) {
    return failFromError(error, "Could not fetch transaction status.");
  }
};

export const webhook = async (request: Request) => {
  const rawBody = await request.text();
  const signature = request.headers.get("monnify-signature");

  if (!verifyMonnifyWebhookSignature(rawBody, signature)) {
    return fail("Invalid signature.", 401);
  }

  try {
    const event = monnifyWebhookEventSchema.parse(JSON.parse(rawBody));
    console.log(`[bookings] webhook received — eventType=${event.eventType}`);

    if (event.eventType === "SUCCESSFUL_TRANSACTION") {
      const data = successfulTransactionEventDataSchema.parse(event.eventData);
      if (data.paymentReference.startsWith(CONSULTANT_PAYMENT_PREFIX)) {
        try {
          await confirmConsultantPaymentByReference(data.paymentReference, data.transactionReference);
        } catch (error) {
          console.error("Consultant payment confirmation failed after payment webhook:", error);
        }
      } else {
        await handleFlightPayment(data.paymentReference);
      }
    } else if (event.eventType === "SUCCESSFUL_REFUND" || event.eventType === "FAILED_REFUND") {
      const data = refundEventDataSchema.parse(event.eventData);
      if (!(await recordRefundOutcome(data.refundReference, data.refundStatus))) {
        console.log(`[monnify] refund ${data.refundReference} is not a flight booking. Ignored.`);
      }
    }

    return ok({ received: true });
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid payload.", 400);
    // A 500 makes Monnify send the notification again, which is what we want for a database or
    // network hiccup.
    return failFromError(error, "Could not process webhook.");
  }
};

// Same rules as the Bachs webhook. The notification only says "go and look":
// confirmPaymentAndReserve asks Monnify for the transaction itself and trusts that.
const handleFlightPayment = async (bookingId: string) => {
  const booking = await getBooking(bookingId);
  if (!booking) {
    console.log(`[monnify] payment for unknown booking ${bookingId}. Ignored.`);
    return;
  }

  try {
    await confirmPaymentAndReserve(bookingId);
  } catch (error) {
    // If SkyLink refused the booking, confirmPaymentAndReserve has already marked it failed and
    // started the refund, so the notification is acknowledged. If the booking is still
    // pending_payment, the failure came before that (the database, or Monnify's own API), so the
    // error goes up and the 500 brings a retry.
    const after = await getBooking(bookingId);
    if (after?.status === "failed" || after?.status === "reserved") {
      console.error(`[monnify] ${bookingId} could not be reserved after payment (refund handled):`, error);
      return;
    }
    throw error;
  }
};
