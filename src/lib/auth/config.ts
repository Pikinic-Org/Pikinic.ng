import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

// A bcrypt hash of an arbitrary string, cost 10 (matches prisma/seed.ts).
// Used to burn roughly the same time as a real password check when the
// email doesn't exist, so response timing can't be used to enumerate
// which emails have an admin account.
const DUMMY_HASH = "$2b$10$YCVEHUblc4c5/qJNHxzrPO/qtihclgZW4765yt3NKMTQs2SjS69UC";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : undefined;
        const password = typeof credentials?.password === "string" ? credentials.password : undefined;
        if (!email || !password) return null;

        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
          // Atomic DB-level increment — a plain read-modify-write here would
          // let concurrent guesses race the same stale count and never trip
          // the lockout, no matter how many requests are fired in parallel.
          const updated = await prisma.adminUser.update({
            where: { id: user.id },
            data: { failedLoginAttempts: { increment: 1 } },
          });
          if (updated.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            await prisma.adminUser.update({
              where: { id: user.id },
              data: { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MS) },
            });
          }
          return null;
        }

        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.adminUser.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
};
