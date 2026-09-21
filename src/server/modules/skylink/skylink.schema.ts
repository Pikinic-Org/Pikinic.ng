import { z } from "zod";

const passengerFields = {
  adults: z.number().int().min(1).max(9),
  children: z.number().int().min(0).default(0),
  infants: z.number().int().min(0).default(0),
  class: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  currency: z.string().min(1).default("USD"),
};

const onewaySearchSchema = z.object({
  search_mode: z.enum(["local", "external"]),
  flight_type: z.literal("oneway"),
  from: z.string().min(1),
  to: z.string().min(1),
  flights_departure_date: z.iso.date(),
  ...passengerFields,
});

const roundtripSearchSchema = z.object({
  search_mode: z.enum(["local", "external"]),
  flight_type: z.literal("roundtrip"),
  from: z.string().min(1),
  to: z.string().min(1),
  flights_departure_date: z.iso.date(),
  flights_return_date: z.iso.date(),
  ...passengerFields,
});

const routeLegSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  date: z.iso.date(),
});

const multicitySearchSchema = z.object({
  search_mode: z.enum(["local", "external"]),
  flight_type: z.literal("multicity"),
  routes: z.array(routeLegSchema).min(2),
  ...passengerFields,
});

export const flightSearchInputSchema = z
  .discriminatedUnion("flight_type", [onewaySearchSchema, roundtripSearchSchema, multicitySearchSchema])
  .superRefine((data, ctx) => {
    if (data.infants > data.adults) {
      ctx.addIssue({
        code: "custom",
        path: ["infants"],
        message: "infants cannot exceed adults",
      });
    }
  });

export type FlightSearchInput = z.infer<typeof flightSearchInputSchema>;

export const flightPricingInputSchema = z.object({
  booking_token: z.string().min(1),
  passengers: z.object({
    adults: z.number().int().min(1).max(9),
    children: z.number().int().min(0).default(0),
    infants: z.number().int().min(0).default(0),
  }),
  class: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  currency: z.string().min(1).default("USD"),
});

export type FlightPricingInput = z.infer<typeof flightPricingInputSchema>;

const travellerFields = {
  title: z.enum(["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof"]),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  other_name: z.string().optional(),
  country_code: z.string().min(1),
  dob: z.iso.date(),
  gender: z.enum(["male", "female"]),
  passport_number: z.string().min(1),
  passport_expiry: z.iso.date(),
  passport_issue_date: z.iso.date(),
  nationality: z.string().length(2),
};

const primaryGuestSchema = z.object({
  ...travellerFields,
  email: z.email(),
  phone: z.string().min(1),
});

const travellerSchema = z.object({
  ...travellerFields,
  email: z.email().optional(),
  phone: z.string().min(1).optional(),
});

export const passengerCountsSchema = z.object({
  adults: z.number().int().min(1).max(9),
  children: z.number().int().min(0).default(0),
  infants: z.number().int().min(0).default(0),
});

export const travellersInputSchema = z.object({
  primary_guest: primaryGuestSchema,
  travelers: z.record(z.string(), travellerSchema),
});

export const flightReserveInputSchema = z.object({
  booking_token: z.string().min(1),
  passengers: passengerCountsSchema,
  travellers: travellersInputSchema,
  ticket_time_limit_hours: z.number().int().positive().default(48),
});

export type FlightReserveInput = z.infer<typeof flightReserveInputSchema>;
