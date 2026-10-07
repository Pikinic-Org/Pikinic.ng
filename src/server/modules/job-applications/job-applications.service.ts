import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { destroyCv, getCvDownloadUrl, uploadCv } from "@/lib/cloudinary";
import { prisma } from "@/lib/db";
import { CV_EXTENSIONS, CV_MAX_BYTES, isJobOpen } from "@/lib/jobs";
import {
  applicationInputSchema,
  applicationUpdateSchema,
} from "@/server/modules/job-applications/job-applications.schema";
import { getPublishedJob } from "@/server/modules/jobs/jobs.service";
import { HttpError } from "@/server/modules/shared/errors";

// The first bytes of each allowed file type, so a renamed file is caught.
function matchesSignature(bytes: Buffer, extension: string) {
  if (extension === "pdf") return bytes.subarray(0, 5).toString("latin1") === "%PDF-";
  if (extension === "docx") return bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  if (extension === "doc") return bytes.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
  return false;
}

async function readCv(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) throw new HttpError("Attach your CV.", 400);
  if (file.size > CV_MAX_BYTES) throw new HttpError("Your CV must be 4 MB or smaller.", 400);

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!(CV_EXTENSIONS as readonly string[]).includes(extension) || !matchesSignature(buffer, extension)) {
    throw new HttpError("Upload your CV as a PDF or Word document.", 400);
  }

  return { buffer, extension, fileName: file.name.slice(0, 200) };
}

/**
 * Saves one application for an open job. The CV goes to Cloudinary first; if
 * the database write then fails, the file is removed again so nothing is left
 * behind that no row points to.
 */
export async function applyForJob(slug: string, form: FormData) {
  const job = await getPublishedJob(slug);
  if (!job) throw new HttpError("This role could not be found.", 404);
  if (!isJobOpen(job)) throw new HttpError("Applications for this role have closed.", 410);

  const input = applicationInputSchema.parse({
    firstName: form.get("firstName") ?? "",
    lastName: form.get("lastName") ?? "",
    email: form.get("email") ?? "",
    address: form.get("address") ?? "",
    phone: form.get("phone") ?? "",
    motivation: form.get("motivation") ?? undefined,
  });

  const alreadyApplied = await prisma.jobApplication.findUnique({
    where: { jobId_email: { jobId: job.id, email: input.email } },
    select: { id: true },
  });
  if (alreadyApplied) throw new HttpError("You have already applied for this role with this email address.", 409);

  const cv = await readCv(form.get("cv"));
  const uploaded = await uploadCv(cv.buffer, cv.extension);

  try {
    await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        ...input,
        cvUrl: uploaded.url,
        cvFileName: cv.fileName,
        cvPublicId: uploaded.publicId,
      },
    });
  } catch (error) {
    await destroyCv(uploaded.publicId).catch((cleanupError) => console.error("CV cleanup failed:", cleanupError));
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError("You have already applied for this role with this email address.", 409);
    }
    throw error;
  }

  return { firstName: input.firstName, jobTitle: job.title };
}

// ---- Admin -----------------------------------------------------------------

// Everything the dashboard shows. The Cloudinary URL and id stay on the server:
// the CV is only reachable through downloadCv below.
const adminSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  address: true,
  phone: true,
  motivation: true,
  cvFileName: true,
  status: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
  job: { select: { title: true, slug: true, category: true } },
} satisfies Prisma.JobApplicationSelect;

export function listApplications() {
  return prisma.jobApplication.findMany({ select: adminSelect, orderBy: { createdAt: "desc" } });
}

export function getApplication(id: string) {
  return prisma.jobApplication.findUnique({ where: { id }, select: adminSelect });
}

export function updateApplication(id: string, input: unknown) {
  const data = applicationUpdateSchema.parse(input);
  return prisma.jobApplication.update({ where: { id }, data, select: adminSelect });
}

// The row goes first; its CV file is removed from Cloudinary after the response.
export async function deleteApplication(id: string) {
  const { cvPublicId } = await prisma.jobApplication.delete({ where: { id }, select: { cvPublicId: true } });
  after(() => destroyCv(cvPublicId).catch((error) => console.error("CV cleanup failed:", error)));
}

const contentTypes: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * Fetches the private CV from Cloudinary and hands it back named after the
 * applicant (e.g. "Ada-Okafor-CV.pdf"). PDFs open in the browser; Word files
 * download.
 */
export async function downloadCv(id: string) {
  const application = await prisma.jobApplication.findUnique({
    where: { id },
    select: { firstName: true, lastName: true, cvPublicId: true },
  });
  if (!application) throw new HttpError("Application not found.", 404);

  const response = await fetch(getCvDownloadUrl(application.cvPublicId, 60));
  if (!response.ok) throw new HttpError("The CV could not be fetched. Please try again.", 502);

  const extension = application.cvPublicId.split(".").pop()?.toLowerCase() ?? "pdf";
  const safeName = `${application.firstName}-${application.lastName}`.replace(/[^A-Za-z0-9-]+/g, "-");
  return {
    body: response.body,
    contentType: contentTypes[extension] ?? "application/octet-stream",
    fileName: `${safeName}-CV.${extension}`,
    inline: extension === "pdf",
  };
}
