import { jobCategories } from "@/lib/constants";
import { slugify } from "@/lib/admin/utils/slugify";

// Used in the ?category= filter on /careers, e.g. "Travel & Tours" -> "travel-tours".
export const categorySlug = (category: string) => slugify(category);

export function categoryFromSlug(slug?: string) {
  return jobCategories.find((category) => categorySlug(category) === slug);
}

const closingDate = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

export const formatClosingDate = (date: Date) => closingDate.format(date);

// A job takes applications until its closing time passes.
export const isJobOpen = (job: { closesAt: Date }) => job.closesAt.getTime() > Date.now();

// CV upload rules, shared by the form and the API. 4 MB keeps a request under
// the 4.5 MB body limit most hosts put on serverless functions.
export const CV_MAX_BYTES = 4 * 1024 * 1024;
export const CV_EXTENSIONS = ["pdf", "doc", "docx"] as const;
export const CV_ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
