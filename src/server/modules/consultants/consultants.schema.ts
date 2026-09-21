import { z } from "zod";

export const LEVELS_OF_STUDY = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
  "500 Level",
  "Postgraduate",
  "Recent Graduate",
] as const;

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
  institution: z.string().trim().min(2, "Institution is required.").max(160),
  courseOfStudy: z.string().trim().min(2, "Course of study is required.").max(160),
  levelOfStudy: z.enum(LEVELS_OF_STUDY, { message: "Select your level of study." }),
  city: z.string().trim().min(2, "City is required.").max(120),
  motivation: z
    .string()
    .trim()
    .min(20, "Tell us a little more (at least 20 characters).")
    .max(1500),
  experience: optionalText(1500),
  referralSource: optionalText(160),
});

export type RegisterConsultantInput = z.infer<typeof registerConsultantInputSchema>;

export const consultantReviewUpdateSchema = z.object({
  reviewStatus: z.enum(["submitted", "approved", "rejected"]).optional(),
  adminNotes: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => value || null)
    .optional(),
});
