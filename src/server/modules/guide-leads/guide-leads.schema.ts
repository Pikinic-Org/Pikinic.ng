import { z } from "zod";
import {
  GUIDE_DEFAULT_SOURCE,
  GUIDE_SOURCE_PATTERN,
  guideCountries,
  guideFunding,
  guideIntakes,
  guideQualifications,
  guideStages,
} from "@/lib/guide-options";

const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

// Step one: the short form. Saved the moment it is submitted.
export const requestGuideInputSchema = z.object({
  name: z.string().trim().min(2, "Full name is required.").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  whatsapp: z
    .string()
    .trim()
    .refine((value) => PHONE_PATTERN.test(value) && value.replace(/\D/g, "").length >= 7, {
      message: "Enter a valid WhatsApp number.",
    }),
  stage: z.enum(guideStages, { error: "Choose where you are right now." }),
  source: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && GUIDE_SOURCE_PATTERN.test(value) ? value.toLowerCase() : GUIDE_DEFAULT_SOURCE)),
});

export type RequestGuideInput = z.infer<typeof requestGuideInputSchema>;

// Step two: an optional profile added afterwards. Every answer is optional, so
// someone can fill in one field or all five; empty answers are ignored.
const optionalChoice = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal("")])
    .optional()
    .transform((value) => value || undefined);

export const guideProfileInputSchema = z.object({
  token: z.string().min(10, "This link has expired. Please fill in the form again."),
  qualification: optionalChoice(guideQualifications),
  fieldOfStudy: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  country: optionalChoice(guideCountries),
  intake: optionalChoice(guideIntakes),
  funding: optionalChoice(guideFunding),
});

export type GuideProfileInput = z.infer<typeof guideProfileInputSchema>;
