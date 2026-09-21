import { z } from "zod";
import { passengerCountsSchema, travellersInputSchema } from "@/server/modules/skylink/skylink.schema";

export const startCheckoutInputSchema = z.object({
  tripType: z.enum(["oneway", "roundtrip", "multicity"]),
  fromCode: z.string().min(1),
  toCode: z.string().min(1),
  departureDate: z.iso.date(),
  returnDate: z.iso.date().optional(),
  bookingToken: z.string().min(1),
  verifiedPrice: z.number().positive(),
  customerPrice: z.number().positive(),
  currency: z.string().min(1),
  passengers: passengerCountsSchema,
  travellers: travellersInputSchema,
  redirectUrl: z.url(),
});

export type StartCheckoutInput = z.infer<typeof startCheckoutInputSchema>;
