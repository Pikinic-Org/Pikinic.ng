import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// Thin data-access layer: the only file in this module that knows about
// Prisma, so the service can stay focused on business rules.
export const consultantsRepository = {
  list: () => prisma.travelConsultant.findMany({ orderBy: { createdAt: "desc" } }),

  findById: (id: string) => prisma.travelConsultant.findUnique({ where: { id } }),

  findByEmail: (email: string) => prisma.travelConsultant.findUnique({ where: { email } }),

  findByPaymentReference: (paymentReference: string) =>
    prisma.travelConsultant.findUnique({ where: { paymentReference } }),

  create: (data: Prisma.TravelConsultantCreateInput) => prisma.travelConsultant.create({ data }),

  update: (id: string, data: Prisma.TravelConsultantUpdateInput) =>
    prisma.travelConsultant.update({ where: { id }, data }),

  delete: async (id: string) => {
    await prisma.travelConsultant.delete({ where: { id } });
  },
};
