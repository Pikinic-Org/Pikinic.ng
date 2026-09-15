"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FocusEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AdminIcon } from "@/components/admin/admin-icon";
import { AdminSelect, AdminTextInput, ImagePickerField, type FieldState } from "@/components/admin/fields";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import { createBlogPost, updateBlogPost } from "@/lib/admin/api/blog";
import { slugify } from "@/lib/admin/utils/slugify";
import { parsePastedContent } from "@/lib/admin/utils/parse-pasted-content";
import { formatAdminDate } from "@/lib/admin/utils/format";
import type { BlogCategory, BlogContentBlock, BlogPost, BlogPostStatus } from "@/lib/admin/types";

const categories: BlogCategory[] = ["Travel Tips", "Visa & Documentation", "Money & Fares", "Destination Guides"];

type FieldKey = "title" | "excerpt" | "category" | "author" | "publishedAt" | "readTime";
type FieldErrors = Partial<Record<FieldKey, string>>;

function validate(data: Record<string, FormDataEntryValue>): FieldErrors {
  const errors: FieldErrors = {};
  if (!String(data.title ?? "").trim()) errors.title = "Title is required.";
  if (!String(data.excerpt ?? "").trim()) errors.excerpt = "Excerpt is required.";
  if (!String(data.author ?? "").trim()) errors.author = "Author is required.";
  if (!String(data.publishedAt ?? "").trim()) errors.publishedAt = "Publish date is required.";
  if (!String(data.readTime ?? "").trim()) errors.readTime = "Read time is required.";
  return errors;
}

const headingStyles: Record<string, string> = {
  h1: "text-3xl",
  h2: "text-2xl",
  h3: "text-xl",
};

export function BlogPostForm({ initialPost }: { initialPost?: BlogPost }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = !!initialPost;

  const [imageUrl, setImageUrl] = useState(initialPost?.imageUrl ?? "");
  const [blocks, setBlocks] = useState<BlogContentBlock[]>(initialPost?.content ?? []);
  const [contentError, setContentError] = useState("");
  const [imagePickerForBlock, setImagePickerForBlock] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [pasteBoxOpen, setPasteBoxOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitting, setSubmitting] = useState<BlogPostStatus | null>(null);
  const [formError, setFormError] = useState("");

  // Sidebar fields stay uncontrolled (FormData-driven, matching ContactForm's
  // pattern) except for the values read here for the live preview header.
  const [titlePreview, setTitlePreview] = useState(initialPost?.title ?? "");
  const [excerptPreview, setExcerptPreview] = useState(initialPost?.excerpt ?? "");
  const [categoryPreview, setCategoryPreview] = useState<BlogCategory>(initialPost?.category ?? categories[0]);

  function fieldState(field: FieldKey): FieldState {
    if (!touched[field]) return "default";
    return fieldErrors[field] ? "invalid" : "valid";
  }

  function revalidate() {
    if (!formRef.current) return {};
    const data = Object.fromEntries(new FormData(formRef.current).entries());
    const errors = validate(data);
    setFieldErrors(errors);
    return errors;
  }

  function handleBlur(e: FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.currentTarget;
    if (!target) return;
    setTouched((prev) => ({ ...prev, [target.name]: true }));
    revalidate();
  }

  function addBlock(type: BlogContentBlock["type"]) {
    const id = crypto.randomUUID();
    const block: BlogContentBlock =
      type === "image" ? { id, type: "image", url: "", caption: "" } : { id, type, text: "" };
    setBlocks((prev) => [...prev, block]);
    setContentError("");
  }

  function updateBlock(id: string, changes: Partial<BlogContentBlock>) {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? ({ ...block, ...changes } as BlogContentBlock) : block))
    );
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  }

  function addPastedBlocks() {
    const parsed = parsePastedContent(pasteText);
    if (parsed.length === 0) return;
    setBlocks((prev) => [...prev, ...parsed]);
    setPasteText("");
    setPasteBoxOpen(false);
    setContentError("");
  }

  function moveBlock(id: string, direction: "up" | "down") {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === id);
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  }

  async function handleSave(status: BlogPostStatus) {
    setFormError("");
    setTouched({ title: true, excerpt: true, category: true, author: true, publishedAt: true, readTime: true });
    const errors = revalidate();
    const hasNoContent = status === "published" && blocks.length === 0;
    if (hasNoContent) setContentError("Add at least one block of content before publishing.");
    if (Object.keys(errors).length > 0 || hasNoContent || !formRef.current) return;

    const data = Object.fromEntries(new FormData(formRef.current).entries()) as Record<string, string>;

    const post: BlogPost = {
      slug: initialPost?.slug ?? slugify(data.title),
      title: data.title,
      excerpt: data.excerpt,
      category: data.category as BlogCategory,
      author: data.author,
      publishedAt: data.publishedAt,
      readTime: data.readTime,
      content: blocks,
      imageUrl,
      status,
    };

    setSubmitting(status);
    try {
      if (isEdit) {
        await updateBlogPost(post.slug, post);
        router.push(`/admin/blogs?updated=${post.slug}`);
      } else {
        const created = await createBlogPost(post);
        router.push(`/admin/blogs?created=${created.slug}`);
      }
    } catch {
      setFormError("Could not save this post. Please try again.");
      setSubmitting(null);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e: FormEvent<HTMLFormElement>) => e.preventDefault()}
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_320px]"
    >
      {/* Main column — block editor / preview */}
      <div>
        <div className="mb-4 flex items-center justify-between rounded-[2px] border border-border-primary p-1.5">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`rounded-[2px] px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                mode === "edit" ? "bg-green-200 text-green-900" : "text-text-secondary hover:bg-neutral-900/[0.04]"
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`rounded-[2px] px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                mode === "preview" ? "bg-green-200 text-green-900" : "text-text-secondary hover:bg-neutral-900/[0.04]"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {mode === "edit" ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {(["h1", "h2", "h3", "paragraph", "image"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className="flex items-center gap-1.5 rounded-[2px] border border-border-primary px-3 py-2 text-xs font-semibold uppercase tracking-widest text-text-primary transition-colors hover:bg-neutral-900/[0.04]"
                >
                  <AdminIcon icon="plus" className="h-3.5 w-3.5" />
                  {type === "paragraph" ? "Paragraph" : type.toUpperCase()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPasteBoxOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-[2px] border border-border-primary px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                  pasteBoxOpen ? "bg-green-200 text-green-900" : "text-text-primary hover:bg-neutral-900/[0.04]"
                }`}
              >
                <AdminIcon icon="blog" className="h-3.5 w-3.5" />
                Paste Text
              </button>
            </div>

            {pasteBoxOpen && (
              <div className="mb-4 rounded-[2px] border border-border-primary p-4">
                <textarea
                  autoFocus
                  placeholder={
                    "Paste a full draft here — blank lines split it into separate paragraphs.\n\nStart a line with #, ##, or ### to make it a heading instead of a paragraph."
                  }
                  rows={8}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="w-full rounded-[2px] border border-border-primary bg-surface-primary px-3 py-2 text-sm leading-relaxed text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                />
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="md" onClick={addPastedBlocks} disabled={!pasteText.trim()}>
                    Add as Blocks
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setPasteBoxOpen(false);
                      setPasteText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {blocks.length === 0 ? (
              <div className="rounded-[2px] border border-dashed border-border-primary p-12 text-center text-sm text-text-tertiary">
                No content yet — add a heading, paragraph, or image above.
              </div>
            ) : (
              <div className="space-y-3">
                {blocks.map((block, index) => (
                  <div key={block.id} className="group relative rounded-[2px] border border-border-primary p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                        {block.type === "paragraph" ? "Paragraph" : block.type.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => moveBlock(block.id, "up")}
                          disabled={index === 0}
                          className="text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-30"
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlock(block.id, "down")}
                          disabled={index === blocks.length - 1}
                          className="text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-30"
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBlock(block.id)}
                          className="text-text-tertiary transition-colors hover:text-red-600"
                          aria-label="Remove block"
                        >
                          <AdminIcon icon="trash" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {block.type === "image" ? (
                      <div className="flex items-start gap-4">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-border-primary bg-neutral-900/[0.03]">
                          {block.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={block.url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] uppercase tracking-widest text-text-tertiary">No image</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <button
                            type="button"
                            onClick={() => setImagePickerForBlock(block.id)}
                            className="rounded-[2px] border border-border-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text-primary transition-colors hover:bg-neutral-900/[0.04]"
                          >
                            {block.url ? "Change Image" : "Choose Image"}
                          </button>
                          <input
                            type="text"
                            placeholder="Caption (optional)"
                            value={block.caption ?? ""}
                            onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                            className="h-9 w-full rounded-[2px] border border-border-primary bg-surface-primary px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                          />
                        </div>
                      </div>
                    ) : block.type === "paragraph" ? (
                      <textarea
                        placeholder="Write a paragraph…"
                        rows={4}
                        value={block.text}
                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                        className="w-full rounded-[2px] border border-border-primary bg-surface-primary px-3 py-2 text-sm leading-relaxed text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={`${block.type.toUpperCase()} heading`}
                        value={block.text}
                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                        className={`w-full rounded-[2px] border border-border-primary bg-surface-primary px-3 py-2 font-bold tracking-tight text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${headingStyles[block.type]}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            {contentError && <p className="mt-3 text-xs text-red-600">{contentError}</p>}

            {imagePickerForBlock && (
              <MediaPickerModal
                onSelect={(url) => {
                  updateBlock(imagePickerForBlock, { url });
                  setImagePickerForBlock(null);
                }}
                onClose={() => setImagePickerForBlock(null)}
              />
            )}
          </>
        ) : (
          <article className="rounded-[2px] border border-border-primary p-8">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="mb-6 aspect-video w-full rounded-[2px] object-cover" />
            )}
            <p className="text-xs font-semibold uppercase tracking-widest text-green-700">{categoryPreview}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary">
              {titlePreview || "Untitled post"}
            </h1>
            {excerptPreview && <p className="mt-3 text-lg text-text-secondary">{excerptPreview}</p>}
            <div className="mt-8 space-y-5">
              {blocks.length === 0 && <p className="text-sm text-text-tertiary">No content yet.</p>}
              {blocks.map((block) => {
                if (block.type === "image") {
                  return (
                    <figure key={block.id}>
                      {block.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={block.url} alt={block.caption ?? ""} className="w-full rounded-[2px] object-cover" />
                      )}
                      {block.caption && (
                        <figcaption className="mt-2 text-xs text-text-tertiary">{block.caption}</figcaption>
                      )}
                    </figure>
                  );
                }
                if (block.type === "paragraph") {
                  return (
                    <p key={block.id} className="text-base leading-relaxed text-text-primary">
                      {block.text || "…"}
                    </p>
                  );
                }
                return (
                  <p key={block.id} className={`font-bold tracking-tight text-text-primary ${headingStyles[block.type]}`}>
                    {block.text || "…"}
                  </p>
                );
              })}
            </div>
          </article>
        )}
      </div>

      {/* Right sidebar — post metadata */}
      <div className="space-y-5">
        {initialPost && (
          <span
            className={`inline-block rounded-[2px] px-2.5 py-1 text-xs font-semibold uppercase tracking-widest ${
              initialPost.status === "published" ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-700"
            }`}
          >
            {initialPost.status}
          </span>
        )}
        <AdminTextInput
          label="Title"
          name="title"
          defaultValue={initialPost?.title}
          onChange={(e) => setTitlePreview(e.target.value)}
          onBlur={handleBlur}
          state={fieldState("title")}
          error={fieldErrors.title}
        />
        <AdminTextInput
          label="Excerpt"
          name="excerpt"
          defaultValue={initialPost?.excerpt}
          onChange={(e) => setExcerptPreview(e.target.value)}
          onBlur={handleBlur}
          state={fieldState("excerpt")}
          error={fieldErrors.excerpt}
        />
        <AdminSelect
          label="Category"
          name="category"
          defaultValue={initialPost?.category ?? categories[0]}
          onChange={(e) => setCategoryPreview(e.target.value as BlogCategory)}
          onBlur={handleBlur}
          state={fieldState("category")}
          error={fieldErrors.category}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </AdminSelect>
        <AdminTextInput
          label="Author"
          name="author"
          defaultValue={initialPost?.author ?? "Pikinic Team"}
          onBlur={handleBlur}
          state={fieldState("author")}
          error={fieldErrors.author}
        />
        <AdminTextInput
          label="Publish Date"
          name="publishedAt"
          type="date"
          defaultValue={initialPost?.publishedAt.slice(0, 10)}
          onBlur={handleBlur}
          state={fieldState("publishedAt")}
          error={fieldErrors.publishedAt}
        />
        <AdminTextInput
          label="Read Time"
          name="readTime"
          placeholder="4 min read"
          defaultValue={initialPost?.readTime}
          onBlur={handleBlur}
          state={fieldState("readTime")}
          error={fieldErrors.readTime}
        />
        <ImagePickerField label="Cover Image" name="imageUrl" value={imageUrl} onChange={setImageUrl} />

        {initialPost?.status === "published" && (
          <p className="text-xs text-text-tertiary">
            Last published {formatAdminDate(initialPost.publishedAt)}.
          </p>
        )}

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="space-y-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!!submitting}
            onClick={() => handleSave("published")}
          >
            {submitting === "published" ? "Saving…" : initialPost?.status === "published" ? "Save Changes" : "Publish"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={!!submitting}
            onClick={() => handleSave("draft")}
          >
            {submitting === "draft" ? "Saving…" : "Save as Draft"}
          </Button>
        </div>
      </div>
    </form>
  );
}
