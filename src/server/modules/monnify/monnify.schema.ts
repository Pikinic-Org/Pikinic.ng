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

export const monnifyWebhookEventSchema = z.object({
  eventType: z.string(),
  eventData: z.object({
    transactionReference: z.string(),
    paymentReference: z.string(),
    amountPaid: z.number(),
    totalPayable: z.number(),
    paymentStatus: z.string(),
    currency: z.string(),
  }),
});

export type MonnifyWebhookEvent = z.infer<typeof monnifyWebhookEventSchema>;
