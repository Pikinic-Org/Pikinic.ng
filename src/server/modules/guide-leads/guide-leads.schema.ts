import { z } from "zod";
import { GUIDE_DEFAULT_SOURCE, GUIDE_SOURCE_PATTERN, guideStages } from "@/lib/guide-options";

const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

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
