import { z } from "zod";

export const initiatePaymentInputSchema = z.object({
  amount: z.number().positive(),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  paymentReference: z.string().min(1),
  redirectUrl: z.url(),
  currencyCode: z.string().min(1).default("NGN"),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentInputSchema>;

export const initiateRefundInputSchema = z.object({
  transactionReference: z.string().min(1),
  refundReference: z.string().min(1),
  refundAmount: z.number().min(100),
  refundReason: z.string().min(1).max(64),
  customerNote: z.string().min(1).max(16),
});

export type InitiateRefundInput = z.infer<typeof initiateRefundInputSchema>;

// Deliberately loose — Monnify sends other event types we don't act on
// (settlement, disbursement, etc.), and a strict schema would reject those
// with a 400, causing Monnify to retry a webhook we have no reason to fail.
// Each event type we DO act on gets its own specific schema, parsed only
// once we already know eventType matches.
export const monnifyWebhookEventSchema = z.object({
  eventType: z.string(),
  eventData: z.record(z.string(), z.unknown()),
});

export type MonnifyWebhookEvent = z.infer<typeof monnifyWebhookEventSchema>;

export const successfulTransactionEventDataSchema = z.object({
  transactionReference: z.string(),
  paymentReference: z.string(),
  amountPaid: z.number(),
  totalPayable: z.number(),
  paymentStatus: z.string(),
  currency: z.string(),
});

export const refundEventDataSchema = z.object({
  transactionReference: z.string(),
  refundReference: z.string(),
  refundAmount: z.number(),
  refundStatus: z.string(),
});
