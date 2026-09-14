/**
 * Seeds ONLY the admin account — no demo blog posts, flights, packages, or
 * webinars. Use this against production instead of `prisma db seed`, which
 * runs the full seed.ts and would push placeholder marketing content into
 * a live database.
 *
 * Usage:
 *   DATABASE_URL=... SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npx tsx prisma/seed-admin.ts
 *
 * (Or `npm run db:seed:admin` if those vars are already in your shell env —
 * dotenv/config below only fills in vars that aren't already set, so
 * exporting them beforehand always takes priority over any .env file.)
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedAdminUser } from "./lib/seed-admin-user";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

seedAdminUser(prisma)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
