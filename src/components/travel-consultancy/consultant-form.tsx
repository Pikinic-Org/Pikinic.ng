"use client";

import { useRef, useState, type FocusEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

type FieldKey = "fullName" | "email" | "whatsapp" | "city";
type FieldErrors = Partial<Record<FieldKey, string>>;
type Status = "idle" | "submitting" | "error";

const REQUIRED_FIELDS: FieldKey[] = ["fullName", "email", "whatsapp", "city"];

function validate(data: Record<string, FormDataEntryValue>): FieldErrors {
  const value = (key: string) => String(data[key] ?? "").trim();
  const errors: FieldErrors = {};

  if (!value("fullName")) errors.fullName = "Full name is required.";

  if (!value("email")) errors.email = "Email address is required.";
  else if (!EMAIL_PATTERN.test(value("email"))) errors.email = "Enter a valid email address.";

  if (!value("whatsapp")) errors.whatsapp = "WhatsApp number is required.";
  else if (!PHONE_PATTERN.test(value("whatsapp")) || value("whatsapp").replace(/\D/g, "").length < 7) {
    errors.whatsapp = "Numbers only — enter a valid phone number.";
  }

  if (!value("city")) errors.city = "City is required.";


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
  "w-full rounded-lg border bg-surface-primary px-4 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700";

export function ConsultantForm({ fee }: { fee: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  const formattedFee = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(fee);

  function revalidate() {
    if (!formRef.current) return {};
    const errors = validate(Object.fromEntries(new FormData(formRef.current).entries()));
    setFieldErrors(errors);
    return errors;
  }

  function handleBlur(e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const field = e.currentTarget.name as FieldKey;
    setTouched((prev) => ({ ...prev, [field]: true }));
    revalidate();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setTouched(Object.fromEntries(REQUIRED_FIELDS.map((field) => [field, true])));

    if (Object.keys(revalidate()).length > 0) return;

    setStatus("submitting");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/travel-consultancy/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");

      // Hand off to Monnify's hosted checkout; it returns them to
      // /travel-consultancy/confirmation once they've paid (or abandoned).
      window.location.href = body.checkoutUrl;
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
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

  const textField = (
    field: FieldKey,
    label: string,
    props: { type?: string; autoComplete?: string; inputMode?: "tel" } = {}
  ) => (
    <div>
      <label htmlFor={field} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={field}
          name={field}
          type={props.type ?? "text"}
          autoComplete={props.autoComplete}
          inputMode={props.inputMode}
          onBlur={handleBlur}
          aria-invalid={fieldState(field) === "invalid"}
          className={cn(inputClass, "h-11 pr-10", borderClass(field))}
        />
        {fieldState(field) === "valid" && (
          <CheckIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
        )}
      </div>
      {fieldState(field) === "invalid" && <p className="mt-1.5 text-xs text-red-600">{fieldErrors[field]}</p>}
    </div>
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      {textField("fullName", "Full Name", { autoComplete: "name" })}
      <div className="grid gap-5 sm:grid-cols-2">
        {textField("email", "Email Address", { type: "email", autoComplete: "email" })}
        {textField("whatsapp", "WhatsApp Number", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
      </div>
      {textField("city", "City You're Based In")}

      <div>
        <label htmlFor="motivation" className="text-sm font-medium text-text-primary">
          Anything you&rsquo;d like us to know? (optional)
        </label>
        <textarea
          id="motivation"
          name="motivation"
          rows={3}
          className={cn(inputClass, "mt-2 border-border-primary py-3")}
        />
      </div>

      <div>
        <label htmlFor="referralSource" className="text-sm font-medium text-text-primary">
          How did you hear about us? (optional)
        </label>
        <input
          id="referralSource"
          name="referralSource"
          type="text"
          className={cn(inputClass, "mt-2 h-11 border-border-primary")}
        />
      </div>

      <div className="rounded-xl bg-neutral-900/[0.04] px-4 py-3 text-sm text-text-secondary">
        Training fee: <span className="font-semibold text-text-primary">{formattedFee}</span>. You&rsquo;ll be
        taken to a secure Monnify checkout to pay by card, bank transfer or USSD.
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === "submitting"}>
        {status === "submitting" ? "Redirecting to payment…" : `Register & Pay ${formattedFee}`}
      </Button>
    </form>
  );
}
