import { z } from "zod";

// Only the fields we use. Bachs adds fields without notice, so these schemas are not strict.

export const createCheckoutInputSchema = z.object({
  // Whole naira, as stored on FlightBooking.customerPrice.
  amount: z.number().int().positive(),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  // Our own reference, echoed back on the checkout and on collection.succeeded as data.reference.
  // We use the booking id, the same way Monnify's paymentReference was.
  reference: z.string().min(1).max(128),
  successUrl: z.url(),
  cancelUrl: z.url(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutInputSchema>;

// POST /v1/checkout-sessions
export const checkoutSessionCreatedSchema = z.object({
  checkout_id: z.string(),
  checkout_url: z.url(),
  status: z.string(),
  expires_at: z.string(),
  reference: z.string().nullable().optional(),
});

// GET /v1/checkout-sessions/{checkout_id}
// status: open | completed | expired | cancelled. In the sandbox the charge exists from the moment
// the checkout is created, with status "open" and an id starting ch_ (the docs say pay_), so
// "has a charge" never means "paid". charge.status includes open, succeeded, accepted, failed,
// refunded and more (lowercase here, while the webhook's data.status is uppercase, so never compare
// the two directly).
export const checkoutSessionSchema = z.object({
  checkout_id: z.string(),
  status: z.string(),
  payment_status: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  amount: z.string(),
  currency: z.string(),
  charge: z
    .object({
      payment_id: z.string(),
      status: z.string(),
      amount: z.string(),
      currency: z.string(),
    })
    .nullable()
    .optional(),
});

export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const createRefundInputSchema = z.object({
  chargeId: z.string().min(1),
  // Our reference for the refund (the booking id). Bachs allows one refund per charge.
  reference: z.string().min(1).max(128),
  reason: z.string().min(1).max(500),
});

export type CreateRefundInput = z.infer<typeof createRefundInputSchema>;

// POST /v1/refunds. status: processing | success | failed.
export const refundSchema = z.object({
  refund_id: z.string(),
  charge_id: z.string(),
  reference: z.string().nullable().optional(),
  status: z.string(),
});
