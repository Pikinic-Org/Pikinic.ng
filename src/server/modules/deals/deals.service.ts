import { prisma } from "@/lib/db";
import { flightDealInputSchema, flightDealUpdateSchema } from "@/server/modules/deals/deals.schema";

export function listFlightDeals() {
  return prisma.flightDeal.findMany({ orderBy: { createdAt: "desc" } });
}

export function getFlightDealById(id: string) {
  return prisma.flightDeal.findUnique({ where: { id } });
}

export async function createFlightDeal(input: unknown) {
  const data = flightDealInputSchema.parse(input);
  return prisma.flightDeal.create({
    data: { ...data, validUntil: data.validUntil ? new Date(data.validUntil) : null },
  });
}

export async function updateFlightDeal(id: string, input: unknown) {
  const data = flightDealUpdateSchema.parse(input);
  return prisma.flightDeal.update({
    where: { id },
    data: { ...data, validUntil: data.validUntil ? new Date(data.validUntil) : undefined },
  });
}

export async function deleteFlightDeal(id: string) {
  await prisma.flightDeal.delete({ where: { id } });
}

// Used by skylink.service.ts at search time — only oneway/roundtrip routes
// are matched (multicity has no single from/to to key a deal on).
export function findActiveDealForRoute(fromCode: string, toCode: string, tripType: "oneway" | "roundtrip") {
  return prisma.flightDeal.findFirst({
    where: {
      fromCode,
      toCode,
      tripType,
      active: true,
      OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
    },
  });
}
