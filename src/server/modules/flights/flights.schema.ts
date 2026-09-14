import { z } from "zod";

export const flightOfferInputSchema = z.object({
  from: z.string().min(1),
  fromCode: z.string().min(1),
  to: z.string().min(1),
  toCode: z.string().min(1),
  price: z.number().positive(),
  tripType: z.string().min(1),
  stops: z.number().int().min(0),
  imageUrl: z.url().optional(),
});

export const flightOfferUpdateSchema = flightOfferInputSchema.partial();
