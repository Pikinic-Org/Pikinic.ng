import { after } from "next/server";
import { destroyCv } from "@/lib/cloudinary";
import { prisma } from "@/lib/db";
import { jobInputSchema, jobUpdateSchema } from "@/server/modules/jobs/jobs.schema";

export async function listJobs() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
  return jobs.map(({ _count, ...job }) => ({ ...job, applicationCount: _count.applications }));
}

export function getJobBySlug(slug: string) {
  return prisma.job.findUnique({ where: { slug } });
}

export function createJob(input: unknown) {
  const data = jobInputSchema.parse(input);
  return prisma.job.create({ data: { ...data, closesAt: new Date(data.closesAt) } });
}

export function updateJob(slug: string, input: unknown) {
  const data = jobUpdateSchema.parse(input);
  return prisma.job.update({
    where: { slug },
    data: { ...data, closesAt: data.closesAt ? new Date(data.closesAt) : undefined },
  });
}

// Deleting a job also deletes its applications (cascade), so remove their CV
// files from Cloudinary too, after the response is sent.
export async function deleteJob(slug: string) {
  const applications = await prisma.jobApplication.findMany({
    where: { job: { slug } },
    select: { cvPublicId: true },
  });
  await prisma.job.delete({ where: { slug } });
  after(async () => {
    const results = await Promise.allSettled(applications.map((application) => destroyCv(application.cvPublicId)));
    for (const result of results) {
      if (result.status === "rejected") console.error("CV cleanup failed:", result.reason);
    }
  });
}

// What visitors see on /careers: published jobs whose closing time has not passed.
export function listOpenJobs() {
  return prisma.job.findMany({
    where: { status: "published", closesAt: { gt: new Date() } },
    orderBy: { closesAt: "asc" },
  });
}

// A published job stays viewable after it closes (its page says so); drafts never are.
export function getPublishedJob(slug: string) {
  return prisma.job.findFirst({ where: { slug, status: "published" } });
}
