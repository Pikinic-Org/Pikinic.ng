import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireEnv } from "@/lib/env";
import { priceFlight, reserveFlight, searchFlights } from "@/server/modules/skylink/skylink.service";

export const search = async (request: Request) => {
  const [proxySecret] = requireEnv("FLIGHTS_PROXY_SECRET");
  if (request.headers.get("x-flights-proxy-secret") !== proxySecret) {
    return fail("Unauthorized.", 401);
  }

  try {
    const body = await request.json();
    const results = await searchFlights(body);
    return ok(results);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not search flights.");
  }
};

export const price = async (request: Request) => {
  const [proxySecret] = requireEnv("FLIGHTS_PROXY_SECRET");
  if (request.headers.get("x-flights-proxy-secret") !== proxySecret) {
    return fail("Unauthorized.", 401);
  }

  try {
    const body = await request.json();
    const result = await priceFlight(body);
    return ok(result);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not price flight.");
  }
};

export const reserve = async (request: Request) => {
  const [proxySecret] = requireEnv("FLIGHTS_PROXY_SECRET");
  if (request.headers.get("x-flights-proxy-secret") !== proxySecret) {
    return fail("Unauthorized.", 401);
  }

  try {
    const body = await request.json();
    const result = await reserveFlight(body);
    return ok(result);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not reserve flight.");
  }
};
