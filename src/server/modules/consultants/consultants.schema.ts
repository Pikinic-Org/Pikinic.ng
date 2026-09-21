import { z } from "zod";

const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const registerConsultantInputSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  whatsapp: z
    .string()
    .trim()
    .refine((value) => PHONE_PATTERN.test(value) && value.replace(/\D/g, "").length >= 7, {
      message: "Enter a valid WhatsApp number.",
    }),
  city: z.string().trim().min(2, "City is required.").max(120),
  motivation: optionalText(1500),
  referralSource: optionalText(160),
});

export type RegisterConsultantInput = z.infer<typeof registerConsultantInputSchema>;

export const consultantReviewUpdateSchema = z.object({
  reviewStatus: z.enum(["registered", "attended", "internship"]).optional(),
  adminNotes: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => value || null)
    .optional(),
});
