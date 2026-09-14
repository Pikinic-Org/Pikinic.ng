import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../src/generated/prisma/client";

export async function seedAdminUser(prisma: PrismaClient) {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin user seed.");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Pikinic Admin" },
  });
  console.log(`Seeded admin user: ${email}`);
}
