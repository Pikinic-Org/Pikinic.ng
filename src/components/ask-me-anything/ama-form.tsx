"use client";

import { useRef, useState, type FocusEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

type FieldKey = "name" | "email" | "whatsapp" | "question";
type FieldErrors = Partial<Record<FieldKey, string>>;
type Status = "idle" | "submitting" | "success" | "error";

function validate(data: Record<string, FormDataEntryValue>): FieldErrors {
  const errors: FieldErrors = {};

  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const whatsapp = String(data.whatsapp ?? "").trim();
  const question = String(data.question ?? "").trim();

  if (!name) errors.name = "Full name is required.";

  if (!email) errors.email = "Email address is required.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";

  if (!whatsapp) errors.whatsapp = "WhatsApp number is required.";
  else if (!PHONE_PATTERN.test(whatsapp) || whatsapp.replace(/\D/g, "").length < 7) {
    errors.whatsapp = "Numbers only — enter a valid phone number.";
  }

  if (!question) errors.question = "Enter the question you'd like answered.";

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

export function AmaForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  function revalidate() {
    if (!formRef.current) return {};
    const data = Object.fromEntries(new FormData(formRef.current).entries());
    const errors = validate(data);
    setFieldErrors(errors);
    return errors;
  }

  function handleBlur(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (!e.currentTarget) return;
    const field = e.currentTarget.name as FieldKey;
    setTouched((prev) => ({ ...prev, [field]: true }));
    revalidate();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setTouched({ name: true, email: true, whatsapp: true, question: true });

    const errors = revalidate();
    if (Object.keys(errors).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/ask-me-anything", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong.");
      }

      setStatus("success");
      form.reset();
      setTouched({});
      setFieldErrors({});
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-surface-primary p-8 text-center">
        <p className="text-lg font-semibold text-text-primary">
          Question submitted.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Check your email for session details — we&rsquo;ll confirm your
          spot and let you know if your question gets picked for the live
          session.
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

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-text-primary">
          Full Name
        </label>
        <div className="relative mt-2">
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            onBlur={handleBlur}
            aria-invalid={fieldState("name") === "invalid"}
            className={cn(
              "h-11 w-full rounded-lg border bg-surface-primary px-4 pr-10 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
              borderClass("name")
            )}
          />
          {fieldState("name") === "valid" && (
            <CheckIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
          )}
        </div>
        {fieldState("name") === "invalid" && (
          <p className="mt-1.5 text-xs text-red-600">{fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium text-text-primary">
          Email Address
        </label>
        <div className="relative mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            onBlur={handleBlur}
            aria-invalid={fieldState("email") === "invalid"}
            className={cn(
              "h-11 w-full rounded-lg border bg-surface-primary px-4 pr-10 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
              borderClass("email")
            )}
          />
          {fieldState("email") === "valid" && (
            <CheckIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
          )}
        </div>
        {fieldState("email") === "invalid" && (
          <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="whatsapp" className="text-sm font-medium text-text-primary">
          WhatsApp Number
        </label>
        <div className="relative mt-2">
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            onBlur={handleBlur}
            aria-invalid={fieldState("whatsapp") === "invalid"}
            className={cn(
              "h-11 w-full rounded-lg border bg-surface-primary px-4 pr-10 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
              borderClass("whatsapp")
            )}
          />
          {fieldState("whatsapp") === "valid" && (
            <CheckIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
          )}
        </div>
        {fieldState("whatsapp") === "invalid" && (
          <p className="mt-1.5 text-xs text-red-600">{fieldErrors.whatsapp}</p>
        )}
      </div>

      <div>
        <label htmlFor="question" className="text-sm font-medium text-text-primary">
          Your Question
        </label>
        <div className="relative mt-2">
          <textarea
            id="question"
            name="question"
            rows={5}
            placeholder="What do you want Mr Adeniyi to answer live?"
            onBlur={handleBlur}
            aria-invalid={fieldState("question") === "invalid"}
            className={cn(
              "w-full rounded-lg border bg-surface-primary px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
              borderClass("question")
            )}
          />
          {fieldState("question") === "valid" && (
            <CheckIcon className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-green-600" />
          )}
        </div>
        {fieldState("question") === "invalid" && (
          <p className="mt-1.5 text-xs text-red-600">{fieldErrors.question}</p>
        )}
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Submitting…" : "Submit Your Question"}
      </Button>
    </form>
  );
}
