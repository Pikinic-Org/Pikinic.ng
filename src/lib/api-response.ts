import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Maps known Prisma errors (unique constraint / record not found) to proper
 * HTTP statuses, falling back to a logged 500 for anything else.
 */
export function failFromError(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return fail("A record with that identifier already exists.", 409);
    if (error.code === "P2025") return fail("Record not found.", 404);
  }
  console.error(fallbackMessage, error);
  return fail(fallbackMessage, 500);
}
