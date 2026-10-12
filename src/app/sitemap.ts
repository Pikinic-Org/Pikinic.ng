import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";

// Public marketing pages only. The services live on their own subdomains
// (Study Abroad, Travel & Tours, ...), each with its own sitemap.
const paths = [
  "/",
  "/about",
  "/contact",
  "/careers",
  "/travel-consultant",
  "/waec",
  "/ask-me-anything",
  "/study-abroad-review",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: `${siteConfig.url}${path === "/" ? "" : path}` }));
}
