import type { BlogContentBlock } from "@/lib/admin/types";

/**
 * Turns a plain-text draft into blog content blocks. Every non-empty line is
 * its own block, which matches how Google Docs and Word copy paragraphs
 * (one line each, often with no blank line after a heading):
 *
 * - `#`, `##`, `###` at the start of a line make a heading
 * - lines starting with `-`, `*` or `•` become a bullet list
 * - lines starting with `1.` or `1)` become a numbered list
 * - everything else is a paragraph, keeping **bold**, *italic* and
 *   [link](https://…) markers for the renderer
 */
export function parsePastedContent(text: string): BlogContentBlock[] {
  const blocks: BlogContentBlock[] = [];
  let list: Extract<BlogContentBlock, { type: "list" }> | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      list = null;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      list = null;
      const type = heading[1].length === 1 ? "h1" : heading[1].length === 2 ? "h2" : "h3";
      blocks.push({ id: crypto.randomUUID(), type, text: stripInlineMarkers(heading[2]) });
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      const ordered = !!numbered;
      const item = (bullet ?? numbered)![1].trim();
      if (list && list.ordered === ordered) {
        list.items.push(item);
      } else {
        list = { id: crypto.randomUUID(), type: "list", ordered, items: [item] };
        blocks.push(list);
      }
      continue;
    }

    list = null;
    blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: line });
  }

  return blocks;
}

function stripInlineMarkers(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^\*(.+)\*$/, "$1").trim();
}

/**
 * Converts the HTML that Google Docs (or Word) puts on the clipboard into the
 * plain-text draft format above, so headings, lists, bold, italics and links
 * survive a paste. Browser-only: it relies on DOMParser.
 */
export function htmlToDraft(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const lines: string[] = [];

  function walkBlocks(node: Element) {
    for (const el of Array.from(node.children)) {
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        const text = clean(el.textContent ?? "");
        if (text) lines.push(`${"#".repeat(Math.min(Number(tag[1]), 3))} ${text}`, "");
      } else if (tag === "ul" || tag === "ol") {
        Array.from(el.children)
          .filter((li) => li.tagName.toLowerCase() === "li")
          .forEach((li, i) => {
            const text = inline(li, {}).trim();
            if (text) lines.push(`${tag === "ol" ? `${i + 1}.` : "-"} ${text}`);
          });
        lines.push("");
      } else if (tag === "p" || (tag === "div" && !el.querySelector("p, h1, h2, h3, h4, h5, h6, ul, ol, div"))) {
        const text = inline(el, {}).trim();
        if (text) lines.push(text, "");
      } else if (tag === "style" || tag === "script" || tag === "meta" || tag === "title") {
        continue;
      } else if (el.children.length > 0) {
        // Wrappers: Docs nests everything in <b id="docs-internal-guid-…">,
        // and tables put paragraphs inside cells.
        walkBlocks(el);
      } else {
        const text = clean(el.textContent ?? "");
        if (text) lines.push(text, "");
      }
    }
  }

  walkBlocks(doc.body);
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type InlineState = { bold?: boolean; italic?: boolean };

function inline(node: Node, state: InlineState): string {
  let out = "";
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += (child.textContent ?? "").replace(/\s+/g, " ");
      continue;
    }
    if (!(child instanceof HTMLElement)) continue;
    const tag = child.tagName.toLowerCase();
    if (tag === "br") {
      out += " ";
      continue;
    }

    const style = child.getAttribute("style") ?? "";
    const weight = style.match(/font-weight:\s*(\d+|bold|normal)/)?.[1];
    // Docs wraps the whole clipboard in <b style="font-weight:normal">, so
    // a <b> only counts when its style doesn't switch the weight off.
    const bold =
      !state.bold &&
      (tag === "strong" || (tag === "b" && weight !== "normal") || weight === "bold" || Number(weight) >= 600);
    const italic = !state.italic && (tag === "em" || tag === "i" || /font-style:\s*italic/.test(style));

    let text = inline(child, { bold: state.bold || bold, italic: state.italic || italic });
    if (italic) text = wrap(text, "*");
    if (bold) text = wrap(text, "**");
    if (tag === "a") {
      const href = unwrapGoogleRedirect(child.getAttribute("href") ?? "");
      if (/^(https?:|mailto:|\/)/.test(href) && text.trim()) text = wrap(text, "[", `](${href})`);
    }
    out += text;
  }
  // Docs splits one bold phrase into several spans, e.g. **What** **is**.
  return out.replace(/\*\*(\s*)\*\*/g, "$1");
}

// Puts markers around the words, not the surrounding spaces: "**word** " not "**word **".
function wrap(text: string, open: string, close = open) {
  const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
  return match[2] ? `${match[1]}${open}${match[2]}${close}${match[3]}` : text;
}

function unwrapGoogleRedirect(href: string) {
  try {
    const url = new URL(href);
    if (url.hostname.endsWith("google.com") && url.pathname === "/url") return url.searchParams.get("q") ?? href;
  } catch {
    // relative or malformed: keep as is
  }
  return href;
}

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
