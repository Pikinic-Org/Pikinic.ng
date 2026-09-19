import { PrismaClient } from "@/generated/prisma-bookings/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prismaBookings?: PrismaClient };

function createPrismaClient() {
  const [connectionString] = requireEnv("FLIGHTBOOKING_DB_URL");
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prismaBookings = globalForPrisma.prismaBookings ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBookings = prismaBookings;
}
