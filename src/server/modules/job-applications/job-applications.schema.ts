import { z } from "zod";

const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

// The text fields of the careers application form. The CV file is checked
// separately (see readCv in the service).
export const applicationInputSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(60, "First name is too long."),
  lastName: z.string().trim().min(1, "Last name is required.").max(60, "Last name is too long."),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  address: z.string().trim().min(5, "Enter your address.").max(300, "Address is too long."),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Enter a valid phone number.")
    .refine((value) => value.replace(/\D/g, "").length >= 7, "Enter a valid phone number."),
  motivation: z
    .string()
    .trim()
    .max(2000, "Keep your answer under 2,000 characters.")
    .optional()
    .transform((value) => value || undefined),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;

export const applicationStatuses = ["new", "shortlisted", "interviewed", "rejected", "hired"] as const;

// What the dashboard can change on an application.
export const applicationUpdateSchema = z.object({
  status: z.enum(applicationStatuses).optional(),
  adminNotes: z.string().max(5000, "Keep notes under 5,000 characters.").optional(),
});
