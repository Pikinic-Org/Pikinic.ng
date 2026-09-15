import type { BlogContentBlock } from "@/lib/admin/types";

/**
 * Splits pasted plain text into blog content blocks: blank-line-separated
 * chunks become paragraphs, and a chunk starting with 1-3 "#" characters
 * (markdown-style) becomes a heading of the matching level. Doesn't attempt
 * to preserve inline formatting (bold/italic/links) — those come through as
 * plain text.
 */
export function parsePastedContent(text: string): BlogContentBlock[] {
  const chunks = text
    .split(/\r?\n\s*\r?\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.map((chunk) => {
    const firstLine = chunk.split(/\r?\n/)[0];
    const headingMatch = firstLine.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const type = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      return { id: crypto.randomUUID(), type, text: headingMatch[2].trim() };
    }
    return { id: crypto.randomUUID(), type: "paragraph", text: chunk };
  });
}
