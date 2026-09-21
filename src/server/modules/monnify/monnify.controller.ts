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
import { confirmPaymentAndReserve, recordRefundOutcome } from "@/server/modules/bookings/bookings.service";
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
      try {
        if (data.paymentReference.startsWith(CONSULTANT_PAYMENT_PREFIX)) {
          await confirmConsultantPaymentByReference(data.paymentReference, data.transactionReference);
        } else {
          await confirmPaymentAndReserve(data.paymentReference);
        }
      } catch (error) {
        // Already recorded as a failed booking (and refunded) inside
        // confirmPaymentAndReserve — acknowledge the webhook regardless so
        // Monnify doesn't retry a payment that was, in fact, received.
        console.error("Booking confirmation failed after payment webhook:", error);
      }
    } else if (event.eventType === "SUCCESSFUL_REFUND" || event.eventType === "FAILED_REFUND") {
      const data = refundEventDataSchema.parse(event.eventData);
      await recordRefundOutcome(data.refundReference, data.refundStatus);
    }

    return ok({ received: true });
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid payload.", 400);
    return failFromError(error, "Could not process webhook.");
  }
};
