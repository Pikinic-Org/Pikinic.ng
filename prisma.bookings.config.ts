import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/bookings/schema.prisma",
  migrations: {
    path: "prisma/bookings/migrations",
  },
  datasource: {
    url: env("FLIGHTBOOKING_DB_URL"),
  },
});
