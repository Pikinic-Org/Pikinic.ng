import { requireEnv } from "@/lib/env";
import { bachsRequest } from "@/server/modules/bachs/bachs.client";
import {
  checkoutSessionCreatedSchema,
  checkoutSessionSchema,
  createCheckoutInputSchema,
  createRefundInputSchema,
  refundSchema,
} from "@/server/modules/bachs/bachs.schema";

// Local and international (user, 2026-11-06): naira card, naira bank transfer, and foreign cards.
// The price is always sent in naira; a foreign customer switches the checkout to USD and Bachs
// converts it (sandbox: ₦250,000 showed as $185.22, "cards in 135+ currencies"). The charge is then
// in USD while the checkout stays in NGN, which is why payment is judged by charge status, not amount.
// Bachs has no USSD for NGN.
const PAYMENT_METHODS = ["NGN_CARD", "NGN_BANK_TRANSFER", "USD_CARD"];

// Bachs checkouts expire after 60 minutes by default. Matches roughly how long a SkyLink fare
// quote is worth holding; confirmPaymentAndReserve re-prices before ticketing anyway.
const CHECKOUT_EXPIRES_IN_MINUTES = 60;

// Bachs only charges against a catalogue product, so there is one "Flight booking" product priced
// in NGN (BACHS_FLIGHT_PRODUCT_ID), and each checkout overrides its price with this booking's fare.
// Docs: https://docs.bachs.io/guides/checkout/adhoc-pricing
export const createCheckout = async (input: unknown) => {
  const data = createCheckoutInputSchema.parse(input);
  const [productId] = requireEnv("BACHS_FLIGHT_PRODUCT_ID");

  const body = await bachsRequest("/v1/checkout-sessions", {
    method: "POST",
    // One checkout per booking, even if startCheckout is retried.
    idempotencyKey: `checkout-${data.reference}`,
    body: {
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
          // Amounts are decimal strings at the currency's precision, not kobo.
          pricing: { price_type: "fixed", amount: data.amount.toFixed(2) },
        },
      ],
      billing_currency: "NGN",
      payment_method_types: PAYMENT_METHODS,
      customer: { email: data.customerEmail, name: data.customerName },
      reference: data.reference,
      metadata: { booking_id: data.reference },
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      expires_in_minutes: CHECKOUT_EXPIRES_IN_MINUTES,
    },
  });

  return checkoutSessionCreatedSchema.parse(body);
};

// Used to confirm a payment server-side. The webhook only tells us to look; this is what we trust.
export const getCheckout = async (checkoutId: string) => {
  const body = await bachsRequest(`/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`);
  return checkoutSessionSchema.parse(body);
};

// A checkout counts as paid once its charge has succeeded. "accepted" is Bachs' state for a payment
// it has taken but not finished settling, which is still money received.
export const isCheckoutPaid = (checkout: { charge?: { status: string } | null }) =>
  checkout.charge?.status === "succeeded" || checkout.charge?.status === "accepted";

// Full refund (no amount), for a booking that failed after payment.
export const createRefund = async (input: unknown) => {
  const data = createRefundInputSchema.parse(input);

  const body = await bachsRequest("/v1/refunds", {
    method: "POST",
    idempotencyKey: `refund-${data.reference}`,
    body: {
      charge_id: data.chargeId,
      reference: data.reference,
      reason: data.reason,
    },
  });

  return refundSchema.parse(body);
};
