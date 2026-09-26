"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { guideStages } from "@/lib/guide-options";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

type FieldKey = "name" | "email" | "whatsapp" | "stage";
type FieldErrors = Partial<Record<FieldKey, string>>;
type Status = "idle" | "submitting" | "success" | "error";

function validate(data: Record<string, FormDataEntryValue>): FieldErrors {
  const errors: FieldErrors = {};

  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const whatsapp = String(data.whatsapp ?? "").trim();

  if (name.length < 2) errors.name = "Full name is required.";

  if (!email) errors.email = "Email address is required.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";

  if (!whatsapp) errors.whatsapp = "WhatsApp number is required.";
  else if (!PHONE_PATTERN.test(whatsapp) || whatsapp.replace(/\D/g, "").length < 7) {
    errors.whatsapp = "Numbers only. Enter a valid phone number.";
  }

  if (!data.stage) errors.stage = "Choose where you are right now.";

  return errors;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border bg-surface-primary px-4 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700";

export function GuideForm({ source }: { source: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadPath, setDownloadPath] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  function revalidate() {
    if (!formRef.current) return {};
    const data = Object.fromEntries(new FormData(formRef.current).entries());
    const errors = validate(data);
    setFieldErrors(errors);
    return errors;
  }

  // Also called from onChange (selects, checkbox), so it only needs the field name.
  function handleBlur(e: { currentTarget: { name: string } | null }) {
    if (!e.currentTarget) return;
    const field = e.currentTarget.name as FieldKey;
    setTouched((prev) => ({ ...prev, [field]: true }));
    revalidate();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setTouched({ name: true, email: true, whatsapp: true, stage: true });

    const errors = revalidate();
    if (Object.keys(errors).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");
    const raw = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/waec-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...raw, source }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");

      setDownloadPath(body.downloadPath);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-surface-primary p-8 md:p-10">
        <div className="flex size-12 items-center justify-center rounded-full bg-green-500/15 text-green-700">
          <CheckIcon className="size-6" />
        </div>
        <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-text-primary">
          Your guide is <span className="text-green-700">ready.</span>
        </h2>
        <p className="mt-3 text-base leading-relaxed text-text-secondary">
          Download it now. This link works for the next seven days, and you can come back to this page any time to
          request it again.
        </p>
        {/* A plain anchor, not next/link: prefetching would hit the download route and count as a download. */}
        <a
          href={downloadPath}
          className="group mt-8 inline-flex h-12 w-fit items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-green-500 px-6 text-base font-medium text-neutral-900 transition-colors hover:bg-green-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
        >
          Download the guide
        </a>
        <p className="mt-8 border-t border-border-primary pt-6 text-sm leading-relaxed text-text-secondary">
          Want to know exactly which universities you can apply to? Book a free consultation. No fees, no
          obligation.{" "}
          <a
            href="https://studyabroad.pikinic.ng"
            className="font-medium text-green-700 underline underline-offset-4 hover:text-green-800"
          >
            Talk to our study abroad team
          </a>
        </p>
      </div>
    );
  }

  const fieldState = (field: FieldKey) => {
    if (!touched[field]) return "default" as const;
    return fieldErrors[field] ? ("invalid" as const) : ("valid" as const);
  };

  const borderClass = (field: FieldKey) => {
    const state = fieldState(field);
    if (state === "invalid") return "border-red-500";
    if (state === "valid") return "border-green-600";
    return "border-border-primary";
  };

  const textField = (field: "name" | "email" | "whatsapp", label: string, props: React.ComponentProps<"input">) => (
    <div>
      <label htmlFor={field} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={field}
          name={field}
          onBlur={handleBlur}
          aria-invalid={fieldState(field) === "invalid"}
          className={cn(inputClass, "pr-10", borderClass(field))}
          {...props}
        />
        {fieldState(field) === "valid" && (
          <CheckIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
        )}
      </div>
      {fieldState(field) === "invalid" && <p className="mt-1.5 text-xs text-red-600">{fieldErrors[field]}</p>}
    </div>
  );

  const selectField = (field: "stage", label: string, options: readonly string[]) => (
    <div>
      <label htmlFor={field} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <select
        id={field}
        name={field}
        defaultValue=""
        onBlur={handleBlur}
        onChange={handleBlur}
        aria-invalid={fieldState(field) === "invalid"}
        className={cn(inputClass, "mt-2", borderClass(field))}
      >
        <option value="" disabled>
          Choose one
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {fieldState(field) === "invalid" && <p className="mt-1.5 text-xs text-red-600">{fieldErrors[field]}</p>}
    </div>
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      {textField("name", "Full name", { type: "text", autoComplete: "name" })}
      {textField("email", "Email address", { type: "email", autoComplete: "email" })}
      {textField("whatsapp", "WhatsApp number", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
      {selectField("stage", "Where are you right now?", guideStages)}

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === "submitting"}>
        {status === "submitting" ? "Preparing your guide…" : "Get the free guide"}
      </Button>

      <p className="text-xs leading-relaxed text-text-tertiary">
        By continuing, you agree that Pikinic can contact you on WhatsApp and email about studying abroad. You can opt
        out at any time.
      </p>
    </form>
  );
}
