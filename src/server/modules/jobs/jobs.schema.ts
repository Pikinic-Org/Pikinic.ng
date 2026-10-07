import { z } from "zod";
import { jobCategories, jobTypes } from "@/lib/constants";
import { slugSchema } from "@/server/modules/shared/schema";

const listSchema = z.array(z.string().trim().min(1)).min(1, "Add at least one item.");

export const jobInputSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, "Title is required."),
  category: z.enum(jobCategories, "Pick a category."),
  jobType: z.enum(jobTypes, "Pick a job type."),
  location: z.string().trim().min(1, "Location is required."),
  summary: z.string().trim().min(1, "Summary is required.").max(300, "Keep the summary under 300 characters."),
  description: z.string().trim().min(1, "Description is required."),
  responsibilities: listSchema,
  qualifications: listSchema,
  closesAt: z.iso.datetime({ message: "Closing date and time are required." }),
  status: z.enum(["draft", "published"]),
});

export const jobUpdateSchema = jobInputSchema.partial().omit({ slug: true });
