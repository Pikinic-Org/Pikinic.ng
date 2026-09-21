import { requireEnv } from "@/lib/env";
import { prismaBookings } from "@/lib/db-bookings";
import { getAccessToken, readSkylinkJson } from "@/server/modules/skylink/skylink.client";
import { findActiveDealForRoute } from "@/server/modules/deals/deals.service";
import {
  flightPricingInputSchema,
  flightReserveInputSchema,
  flightSearchInputSchema,
} from "@/server/modules/skylink/skylink.schema";

const PIKINIC_MARKUP_RATE = 0.12;

// A deal token row lives just long enough to cover a realistic price-hold
// window; priceFlight() looks it up by the exact booking_token our own
// searchFlights() call issued, never a client-supplied discount.
const DEAL_TOKEN_TTL_MS = 60 * 60 * 1000;

export const searchFlights = async (input: unknown) => {
  const data = flightSearchInputSchema.parse(input);

  const [baseUrl] = requireEnv("SKYLINK_BASE_URL");
  const token = await getAccessToken();

  const response = await fetch(`${baseUrl}/api/flights/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const body = await readSkylinkJson(response);

  if (!response.ok || !body.success) {
    throw new Error(body.message ?? "SkyLink flight search failed");
  }

  // Deals only key on a single from/to — multicity has no one route to
  // match against, so it's deliberately excluded here.
  if (data.flight_type === "oneway" || data.flight_type === "roundtrip") {
    const deal = await findActiveDealForRoute(data.from, data.to, data.flight_type);
    if (deal) {
      const flights = (body.data.flights ?? []) as { booking_token: string }[];
      if (flights.length > 0) {
        await prismaBookings.skylinkDealToken.createMany({
          data: flights.map((flight) => ({
            bookingToken: flight.booking_token,
            dealId: deal.id,
            discountPercent: deal.discountPercent,
            label: deal.label,
            expiresAt: new Date(Date.now() + DEAL_TOKEN_TTL_MS),
          })),
          skipDuplicates: true,
        });
      }

      return {
        ...body.data,
        flights: flights.map((flight) => ({
          ...flight,
          deal: { discountPercent: deal.discountPercent, label: deal.label },
        })),
      };
    }
  }

  return body.data;
};

export const priceFlight = async (input: unknown) => {
  const data = flightPricingInputSchema.parse(input);

  const [baseUrl] = requireEnv("SKYLINK_BASE_URL");
  const token = await getAccessToken();

  const response = await fetch(`${baseUrl}/api/flights/pricing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const body = await readSkylinkJson(response);

  if (!response.ok || !body.success) {
    throw new Error(body.message ?? "SkyLink flight pricing failed");
  }

  // Only ever trust a discount looked up by the exact booking_token our own
  // searchFlights() issued — never one supplied by the client — since
  // booking_token is opaque and we can't otherwise verify a claimed deal's
  // route matches the flight actually being priced. The discount eats into
  // Pikinic's markup, never below the raw SkyLink fare.
  const dealToken = await prismaBookings.skylinkDealToken.findUnique({
    where: { bookingToken: data.booking_token },
  });
  const validDeal = dealToken && dealToken.expiresAt > new Date() ? dealToken : null;
  const effectiveRate = Math.max(0, PIKINIC_MARKUP_RATE - (validDeal?.discountPercent ?? 0) / 100);

  const customerPrice = Math.round(body.data.verified_price * (1 + effectiveRate));

  return {
    ...body.data,
    customer_price: customerPrice,
    deal: validDeal ? { discountPercent: validDeal.discountPercent, label: validDeal.label } : null,
  };
};

export const reserveFlight = async (input: unknown) => {
  const data = flightReserveInputSchema.parse(input);

  const [baseUrl] = requireEnv("SKYLINK_BASE_URL");
  const token = await getAccessToken();

  const response = await fetch(`${baseUrl}/api/flights/reserve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const body = await readSkylinkJson(response);

  if (!response.ok || !body.success) {
    throw new Error(body.message ?? "SkyLink flight reservation failed");
  }

  return body.data;
};
