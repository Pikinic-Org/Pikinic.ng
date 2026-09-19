import { requireEnv } from "@/lib/env";
import { getAccessToken } from "@/server/modules/skylink/skylink.client";
import {
  flightPricingInputSchema,
  flightReserveInputSchema,
  flightSearchInputSchema,
} from "@/server/modules/skylink/skylink.schema";

const PIKINIC_MARKUP_RATE = 0.12;

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

  const body = await response.json();

  if (!response.ok || !body.success) {
    throw new Error(body.message ?? "SkyLink flight search failed");
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

  const body = await response.json();

  if (!response.ok || !body.success) {
    throw new Error(body.message ?? "SkyLink flight pricing failed");
  }

  const customerPrice = Math.round(body.data.verified_price * (1 + PIKINIC_MARKUP_RATE));

  return { ...body.data, customer_price: customerPrice };
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

  const body = await response.json();

  if (!response.ok || !body.success) {
    throw new Error(body.message ?? "SkyLink flight reservation failed");
  }

  return body.data;
};
