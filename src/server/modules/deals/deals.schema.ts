import { z } from "zod";

export const flightDealInputSchema = z.object({
  fromCode: z.string().min(1),
  toCode: z.string().min(1),
  tripType: z.enum(["oneway", "roundtrip"]),
  discountPercent: z.number().int().min(1).max(100),
  label: z.string().optional(),
  imageUrl: z.url().optional(),
  active: z.boolean().default(true),
  validUntil: z.iso.datetime().optional(),
});

export const flightDealUpdateSchema = flightDealInputSchema.partial();
