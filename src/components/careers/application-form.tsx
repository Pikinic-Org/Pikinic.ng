"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { CV_ACCEPT, CV_EXTENSIONS, CV_MAX_BYTES } from "@/lib/jobs";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

type FieldKey = "firstName" | "lastName" | "email" | "address" | "phone" | "cv";
type FieldErrors = Partial<Record<FieldKey, string>>;
type Sent = { firstName: string; jobTitle: string };

function validate(form: HTMLFormElement): FieldErrors {
  const data = new FormData(form);
  const value = (key: string) => String(data.get(key) ?? "").trim();
  const errors: FieldErrors = {};

  if (!value("firstName")) errors.firstName = "First name is required.";
  if (!value("lastName")) errors.lastName = "Last name is required.";

  if (!value("email")) errors.email = "Email address is required.";
  else if (!EMAIL_PATTERN.test(value("email"))) errors.email = "Enter a valid email address.";

  if (value("address").length < 5) errors.address = "Enter your address.";

  if (!value("phone")) errors.phone = "Phone number is required.";
  else if (!PHONE_PATTERN.test(value("phone")) || value("phone").replace(/\D/g, "").length < 7) {
    errors.phone = "Enter a valid phone number.";
  }

  const cv = data.get("cv");
  const extension = cv instanceof File ? cv.name.split(".").pop()?.toLowerCase() ?? "" : "";
  if (!(cv instanceof File) || cv.size === 0) errors.cv = "Attach your CV.";
  else if (!(CV_EXTENSIONS as readonly string[]).includes(extension)) errors.cv = "Upload a PDF or Word document.";
  else if (cv.size > CV_MAX_BYTES) errors.cv = "Your CV must be 4 MB or smaller.";

  return errors;
}

const inputClass =
  "w-full rounded-lg border bg-background-primary px-4 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700";

// Label on the left and field on the right from the small breakpoint up, stacked on phones.
function Row({
  label,
  htmlFor,
  optional,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:gap-6">
      <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary sm:pt-3">
        {label}
        {optional && <span className="font-normal text-text-tertiary"> (optional)</span>}
      </label>
      <div>
        {children}
        {error && (
          <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export function ApplicationForm({ slug }: { slug: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [fileName, setFileName] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);

  // Errors show once someone has tried to submit, then update as they fix them.
  function recheck() {
    if (submitted && formRef.current) setErrors(validate(formRef.current));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setSubmitted(true);
    const form = e.currentTarget;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      const res = await fetch(`/api/careers/${encodeURIComponent(slug)}/apply`, {
        method: "POST",
        body: new FormData(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not send your application. Please try again.");
      setSent(body);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not send your application. Please try again.");
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col gap-6">
        <span className="flex size-12 items-center justify-center rounded-full bg-green-500/15 text-green-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
            aria-hidden
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        </span>
        <div>
          <h3 className="text-3xl font-semibold tracking-tight text-text-primary">
            Thank you, <span className="text-green-700">{sent.firstName}.</span>
          </h3>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-text-secondary">
            We&rsquo;ve received your application for {sent.jobTitle}. If you&rsquo;re shortlisted, we&rsquo;ll
            contact you by email or phone.
          </p>
        </div>
      </div>
    );
  }

  const border = (field: FieldKey) => (errors[field] ? "border-red-500" : "border-border-primary");
  const describedBy = (field: FieldKey) => (errors[field] ? `${field}-error` : undefined);
  const textInput = (field: FieldKey, props: React.ComponentProps<"input"> = {}) => (
    <input
      id={field}
      name={field}
      aria-invalid={!!errors[field]}
      aria-describedby={describedBy(field)}
      className={cn(inputClass, "h-12", border(field))}
      {...props}
    />
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={recheck} noValidate className="space-y-6">
      <Row label="First name" htmlFor="firstName" error={errors.firstName}>
        {textInput("firstName", { autoComplete: "given-name" })}
      </Row>
      <Row label="Last name" htmlFor="lastName" error={errors.lastName}>
        {textInput("lastName", { autoComplete: "family-name" })}
      </Row>
      <Row label="Email address" htmlFor="email" error={errors.email}>
        {textInput("email", { type: "email", autoComplete: "email" })}
      </Row>
      <Row label="Address" htmlFor="address" error={errors.address}>
        {textInput("address", { autoComplete: "street-address", placeholder: "Street, city, state" })}
      </Row>
      <Row label="Phone or WhatsApp" htmlFor="phone" error={errors.phone}>
        {textInput("phone", { type: "tel", autoComplete: "tel" })}
      </Row>

      <Row label="CV" htmlFor="cv" error={errors.cv}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="cv"
            name="cv"
            type="file"
            accept={CV_ACCEPT}
            aria-invalid={!!errors.cv}
            aria-describedby={describedBy("cv")}
            onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? "")}
            className="peer sr-only"
          />
          <label
            htmlFor="cv"
            className={cn(
              "inline-flex h-12 cursor-pointer items-center gap-2 rounded-lg border bg-background-primary px-4 text-sm font-medium text-text-primary transition-colors hover:bg-neutral-900/5 peer-focus-visible:ring-2 peer-focus-visible:ring-green-700",
              border("cv")
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden
            >
              <path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L16 7" />
            </svg>
            {fileName ? "Change file" : "Attach CV"}
          </label>
          <span className="min-w-0 truncate text-sm text-text-secondary">
            {fileName || "PDF or Word, up to 4 MB"}
          </span>
        </div>
      </Row>

      <Row label="Why are you a good fit for this role?" htmlFor="motivation" optional>
        <textarea
          id="motivation"
          name="motivation"
          rows={5}
          maxLength={2000}
          className={cn(inputClass, "border-border-primary py-3")}
        />
      </Row>

      {/* Honeypot: hidden from people, filled in by bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 border-t border-border-primary pt-6 sm:grid-cols-[10rem_1fr] sm:gap-6">
        <div className="hidden sm:block" />
        <div>
          {formError && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" disabled={sending}>
            {sending ? "Sending…" : "Send application"}
          </Button>
          <p className="mt-4 text-sm leading-relaxed text-text-tertiary">
            We use your details and CV only to consider you for this role.
          </p>
        </div>
      </div>
    </form>
  );
}
