import type { ReactNode } from "react";
import type { BlogContentBlock } from "@/lib/admin/types";

// Renders a post's content blocks. Shared by the admin preview and any public
// blog page, so a post looks the same in both places.
export function BlogContent({ blocks }: { blocks: BlogContentBlock[] }) {
  return (
    <div className="space-y-5 text-base leading-relaxed text-text-primary">
      {blocks.map((block) => {
        switch (block.type) {
          case "h1":
            // The post title is the page's only <h1>, so body headings start at <h2>.
            return (
              <h2 key={block.id} className="pt-6 text-3xl font-bold tracking-tight">
                {block.text || "…"}
              </h2>
            );
          case "h2":
            return (
              <h2 key={block.id} className="pt-6 text-2xl font-bold tracking-tight">
                {block.text || "…"}
              </h2>
            );
          case "h3":
            return (
              <h3 key={block.id} className="pt-3 text-xl font-bold tracking-tight">
                {block.text || "…"}
              </h3>
            );
          case "paragraph":
            return <p key={block.id}>{block.text ? renderInline(block.text) : "…"}</p>;
          case "list": {
            const items = block.items.filter((item) => item.trim());
            const List = block.ordered ? "ol" : "ul";
            return (
              <List
                key={block.id}
                className={`space-y-2 pl-6 marker:text-green-700 ${block.ordered ? "list-decimal" : "list-disc"}`}
              >
                {items.length === 0 ? <li>…</li> : items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
              </List>
            );
          }
          case "image":
            return (
              <figure key={block.id}>
                {block.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={block.url} alt={block.caption ?? ""} className="w-full rounded-[2px] object-cover" />
                )}
                {block.caption && <figcaption className="mt-2 text-xs text-text-tertiary">{block.caption}</figcaption>}
              </figure>
            );
        }
      })}
    </div>
  );
}

const INLINE = /(\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?:|mailto:|\/)[^\s)]*)\)|\*([^*\s](?:[^*]*[^*\s])?)\*)/g;

/** Turns **bold**, *italic* and [text](url) into elements. Anything else stays plain text. */
export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const key = `${index}`;
    if (match[2] !== undefined) {
      nodes.push(<strong key={key} className="font-bold">{renderInline(match[2])}</strong>);
    } else if (match[3] !== undefined) {
      const href = match[4];
      const external = /^https?:/.test(href);
      nodes.push(
        <a
          key={key}
          href={href}
          className="text-green-700 underline underline-offset-2 hover:text-green-800"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {renderInline(match[3])}
        </a>
      );
    } else {
      nodes.push(<em key={key}>{renderInline(match[5])}</em>);
    }
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
