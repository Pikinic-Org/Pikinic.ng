import { z } from "zod";

// Matches what src/lib/admin/utils/slugify.ts produces: lowercase
// alphanumeric segments joined by single hyphens, no leading/trailing hyphen.
export const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only.");
