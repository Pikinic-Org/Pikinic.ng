import { prisma } from "@/lib/db";
import type { GuideProfileInput, RequestGuideInput } from "@/server/modules/guide-leads/guide-leads.schema";

// Thin data-access layer: the only file in this module that knows about Prisma.
// Uses the admin database (the study-abroad site has no database of its own).
export const guideLeadsRepository = {
  // `before` limits to leads requested before that moment (the export/purge window).
  list: (before?: Date) =>
    prisma.guideLead.findMany({
      where: before ? { createdAt: { lt: before } } : undefined,
      orderBy: { createdAt: "desc" },
    }),

  deleteById: async (id: string) => {
    await prisma.guideLead.delete({ where: { id } });
  },

  deleteBefore: async (before: Date) => {
    const { count } = await prisma.guideLead.deleteMany({ where: { createdAt: { lt: before } } });
    return count;
  },

  findById: (id: string) => prisma.guideLead.findUnique({ where: { id } }),

  // A repeat request refreshes the answers but keeps the original source, so
  // the event that first reached this person stays credited.
  upsertByEmail: (input: RequestGuideInput) =>
    prisma.guideLead.upsert({
      where: { email: input.email },
      create: {
        name: input.name,
        email: input.email,
        whatsapp: input.whatsapp,
        stage: input.stage,
        source: input.source,
      },
      update: {
        name: input.name,
        whatsapp: input.whatsapp,
        stage: input.stage,
      },
    }),

  // Only the answers actually given are written, so a partial second step never
  // blanks something the lead filled in earlier.
  updateProfile: (id: string, profile: Omit<GuideProfileInput, "token">) =>
    prisma.guideLead.update({
      where: { id },
      data: {
        ...(profile.qualification && { qualification: profile.qualification }),
        ...(profile.fieldOfStudy && { fieldOfStudy: profile.fieldOfStudy }),
        ...(profile.country && { country: profile.country }),
        ...(profile.intake && { intake: profile.intake }),
        ...(profile.funding && { funding: profile.funding }),
        profileCompletedAt: new Date(),
      },
    }),

  setZohoLeadId: (id: string, zohoLeadId: string) =>
    prisma.guideLead.update({ where: { id }, data: { zohoLeadId } }),

  recordDownload: (id: string) =>
    prisma.guideLead.update({
      where: { id },
      data: { downloadCount: { increment: 1 }, lastDownloadAt: new Date() },
    }),
};
