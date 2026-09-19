import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireEnv } from "@/lib/env";
import { verifyMonnifyWebhookSignature } from "@/server/modules/monnify/monnify.client";
import { getTransactionStatus, initiatePayment } from "@/server/modules/monnify/monnify.service";
import { monnifyWebhookEventSchema } from "@/server/modules/monnify/monnify.schema";

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
    console.log("Verified Monnify webhook event:", event.eventType, event.eventData.paymentReference);
    return ok({ received: true });
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid payload.", 400);
    return failFromError(error, "Could not process webhook.");
  }
};
