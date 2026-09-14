import { z } from "zod";
import { slugSchema } from "@/server/modules/shared/schema";

const webinarAgendaItemSchema = z.object({
  time: z.string().min(1),
  title: z.string().min(1),
});

const webinarMetricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const webinarTestimonialSchema = z.object({
  name: z.string().min(1),
  quote: z.string().min(1),
});

export const webinarInputSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  tagline: z.string().min(1),
  coverImageUrl: z.url(),
  dateTime: z.string().min(1),
  host: z.string().min(1),
  description: z.string().min(1),
  agenda: z.array(webinarAgendaItemSchema).optional(),
  metrics: z.array(webinarMetricSchema).optional(),
  testimonials: z.array(webinarTestimonialSchema).optional(),
  registrationLabel: z.string().min(1),
  registrationUrl: z.url(),
});

export const webinarUpdateSchema = webinarInputSchema.partial().omit({ slug: true });
