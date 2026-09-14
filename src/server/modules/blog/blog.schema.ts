import { z } from "zod";
import { slugSchema } from "@/server/modules/shared/schema";

export const blogCategorySchema = z.enum([
  "Travel Tips",
  "Visa & Documentation",
  "Money & Fares",
  "Destination Guides",
]);

export const blogPostStatusSchema = z.enum(["draft", "published"]);

const textBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["h1", "h2", "h3", "paragraph"]),
  text: z.string(),
});

const imageBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("image"),
  url: z.url(),
  caption: z.string().optional(),
});

export const blogContentBlockSchema = z.union([textBlockSchema, imageBlockSchema]);

export const blogPostInputSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  excerpt: z.string().min(1),
  category: blogCategorySchema,
  author: z.string().min(1),
  publishedAt: z.string().min(1),
  readTime: z.string().min(1),
  content: z.array(blogContentBlockSchema),
  imageUrl: z.url(),
  status: blogPostStatusSchema,
});

export const blogPostUpdateSchema = blogPostInputSchema.partial().omit({ slug: true });
