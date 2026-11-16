import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireEnv } from "@/lib/env";
import { verifyBachsWebhookSignature } from "@/server/modules/bachs/bachs.client";
import {
  collectionSucceededDataSchema,
  refundEventDataSchema,
  webhookEventSchema,
} from "@/server/modules/bachs/bachs.schema";
import { confirmPaymentAndReserve, getBooking, recordRefundOutcome } from "@/server/modules/bookings/bookings.service";

// POST /api/bachs/webhook. No proxy secret here: Bachs calls this directly, and the signature is
// what proves the request came from Bachs.
//
// What Bachs does with our answer (docs: guides/webhooks/overview):
// - 2xx within 10 seconds: delivered.
// - 400 and other 4xx: rejected, not retried. Used for a bad signature or a body we can't read.
// - 5xx or a timeout: retried at about 1, 5, 15 and 60 minutes, 5 attempts in all.
// Deliveries are at-least-once, so the same event can arrive twice. That is safe here:
// confirmPaymentAndReserve does nothing for a booking that is already reserved or failed, and its
// atomic claim stops two deliveries (or a delivery and the customer's return page) reserving twice.
export const webhook = async (request: Request) => {
  // The raw text, not request.json(): the signature is over the exact bytes Bachs sent.
  const rawBody = await request.text();
  const [secret] = requireEnv("BACHS_WEBHOOK_SECRET");

  if (!verifyBachsWebhookSignature(rawBody, request.headers.get("x-bachs-signature-v2"), secret)) {
    console.log("[bachs] webhook rejected: bad or missing signature");
    return fail("Invalid signature.", 400);
  }

  let event;
  try {
    event = webhookEventSchema.parse(JSON.parse(rawBody));
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid payload.", 400);
    return fail("Invalid JSON.", 400);
  }
  console.log(`[bachs] webhook received: ${event.type} (${event.id})`);

  try {
    if (event.type === "collection.succeeded") {
      const data = collectionSucceededDataSchema.parse(event.data);
      if (!data.reference) {
        console.log(`[bachs] ${event.id} has no reference, so it isn't a flight booking checkout. Ignored.`);
        return ok({ received: true });
      }
      await handlePayment(data.reference);
    } else if (event.type === "refund.paid" || event.type === "refund.failed") {
      const data = refundEventDataSchema.parse(event.data);
      if (!(await recordRefundOutcome(data.reference, data.status))) {
        console.log(`[bachs] refund ${data.refund_id} references unknown booking ${data.reference}. Ignored.`);
      }
    }
    // Anything else we're subscribed to (collection.failed, checkout.expired) needs no action:
    // the booking just stays pending_payment.

    return ok({ received: true });
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid payload.", 400);
    // A 500 makes Bachs try again later, which is what we want for a database or network hiccup.
    return failFromError(error, "Could not process Bachs webhook.");
  }
};

// The webhook only says "go and look". confirmPaymentAndReserve asks Bachs for the checkout and
// trusts that, never this event's own status or amount, which is why nothing from the event body
// other than the booking id is passed on.
const handlePayment = async (bookingId: string) => {
  const booking = await getBooking(bookingId);
  if (!booking) {
    console.log(`[bachs] payment for unknown booking ${bookingId}. Ignored.`);
    return;
  }

  try {
    await confirmPaymentAndReserve(bookingId);
  } catch (error) {
    // If SkyLink refused the booking, confirmPaymentAndReserve has already marked it failed and
    // started the refund. Retrying would change nothing, so the delivery is acknowledged.
    // If the booking is still pending_payment, the failure came before that (the database, or
    // Bachs' own API), so the error goes up and the 500 brings a retry.
    const after = await getBooking(bookingId);
    if (after?.status === "failed" || after?.status === "reserved") {
      console.error(`[bachs] ${bookingId} could not be reserved after payment (refund handled):`, error);
      return;
    }
    throw error;
  }
};
