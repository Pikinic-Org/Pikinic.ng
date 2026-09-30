"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { consultantProgramme } from "@/lib/constants";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

type FieldKey = "fullName" | "email" | "whatsapp" | "city";
type FieldErrors = Partial<Record<FieldKey, string>>;
type Status = "idle" | "submitting" | "error";

type BankDetails = { bankName: string; accountNumber: string; accountName: string };
type Registration = { firstName: string; fullName: string; paymentCode: string; amount: number };

const REQUIRED_FIELDS: FieldKey[] = ["fullName", "email", "whatsapp", "city"];

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

function validate(data: Record<string, FormDataEntryValue>): FieldErrors {
  const value = (key: string) => String(data[key] ?? "").trim();
  const errors: FieldErrors = {};

  if (value("fullName").length < 2) errors.fullName = "Full name is required.";

  if (!value("email")) errors.email = "Email address is required.";
  else if (!EMAIL_PATTERN.test(value("email"))) errors.email = "Enter a valid email address.";

  if (!value("whatsapp")) errors.whatsapp = "WhatsApp number is required.";
  else if (!PHONE_PATTERN.test(value("whatsapp")) || value("whatsapp").replace(/\D/g, "").length < 7) {
    errors.whatsapp = "Numbers only. Enter a valid phone number.";
  }

  if (value("city").length < 2) errors.city = "City is required.";

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
      aria-hidden
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-lg border bg-surface-primary px-4 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (old browsers, some in-app browsers); the value is on screen to copy by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 text-sm font-medium text-green-700 underline underline-offset-4 hover:text-green-800"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function PaymentRow({ label, value, copy, children }: { label: string; value?: string; copy?: boolean; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <dt className="text-sm text-text-secondary">{label}</dt>
        <dd className="mt-0.5 break-words text-base font-medium text-text-primary">{children ?? value}</dd>
      </div>
      {copy && value && <CopyButton value={value} />}
    </div>
  );
}

// Shown once the sign-up is saved. Until a payment gateway is live, people pay
// by bank transfer with their code in the narration, send the receipt on
// WhatsApp, and the team marks them paid in the dashboard.
function PaymentStep({ registration, bankDetails }: { registration: Registration; bankDetails: BankDetails | null }) {
  const amount = naira.format(registration.amount);
  const message = [
    `Hi Pikinic, I've registered for the Travel Consultant training.`,
    `Name: ${registration.fullName}`,
    `Payment code: ${registration.paymentCode}`,
    bankDetails ? `I've paid ${amount}. Here is my receipt.` : `Please send me the payment details.`,
  ].join("\n");
  const whatsappHref = `https://wa.me/${consultantProgramme.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  // On phones the form sits below the intro, so bring the payment details into view.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const { top } = panel.getBoundingClientRect();
    if (top < 80 || top > window.innerHeight / 2) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div ref={panelRef} className="scroll-mt-28 rounded-2xl bg-surface-primary p-8 md:p-10">
      <div className="flex size-12 items-center justify-center rounded-full bg-green-500/15 text-green-700">
        <CheckIcon className="size-6" />
      </div>
      <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-text-primary">
        You&rsquo;re registered, <span className="text-green-700">{registration.firstName}.</span>
      </h2>
      <p className="mt-3 text-base leading-relaxed text-text-secondary">
        {bankDetails
          ? `Your place is confirmed once we receive your ${amount} payment.`
          : `We'll message you on WhatsApp with the payment details. Your place is confirmed once we receive your ${amount} payment.`}
      </p>

      <dl className="mt-8 divide-y divide-border-primary border-y border-border-primary">
        <PaymentRow label="Your payment code" value={registration.paymentCode} copy>
          <span className="font-mono text-lg tracking-wider">{registration.paymentCode}</span>
        </PaymentRow>
        {bankDetails && (
          <>
            <PaymentRow label="Amount" value={amount} />
            <PaymentRow label="Bank" value={bankDetails.bankName} />
            <PaymentRow label="Account number" value={bankDetails.accountNumber} copy />
            <PaymentRow label="Account name" value={bankDetails.accountName} />
          </>
        )}
      </dl>

      <p className="mt-6 text-sm leading-relaxed text-text-secondary">
        {bankDetails
          ? "Put your payment code in the transfer description (narration) so we can match it to you. Then send us your receipt."
          : "Keep your payment code. Put it in the transfer description (narration) when you pay, so we can match it to you."}
      </p>

      {/* Plain anchor, not Button: wa.me is external and must open in a new tab. */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-green-500 px-6 text-base font-medium text-neutral-900 transition-colors hover:bg-green-400"
      >
        {bankDetails ? "Send my receipt on WhatsApp" : "Message us on WhatsApp"}
      </a>
    </div>
  );
}

export function RegistrationForm({ fee, bankDetails }: { fee: number; bankDetails: BankDetails | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  function revalidate() {
    if (!formRef.current) return {};
    const errors = validate(Object.fromEntries(new FormData(formRef.current).entries()));
    setFieldErrors(errors);
    return errors;
  }

  function handleBlur(e: { currentTarget: { name: string } }) {
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
      const res = await fetch("/api/travel-consultant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");

      setRegistration(body);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (registration) return <PaymentStep registration={registration} bankDetails={bankDetails} />;

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

  const textField = (field: FieldKey, label: string, props: React.ComponentProps<"input"> = {}) => (
    <div>
      <label htmlFor={field} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={field}
          name={field}
          type="text"
          onBlur={handleBlur}
          aria-invalid={fieldState(field) === "invalid"}
          className={cn(inputClass, "h-11 pr-10", borderClass(field))}
          {...props}
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
      {/* Honeypot: hidden from people and screen readers, bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {textField("fullName", "Full name", { autoComplete: "name" })}
      <div className="grid gap-5 sm:grid-cols-2">
        {textField("email", "Email address", { type: "email", autoComplete: "email" })}
        {textField("whatsapp", "WhatsApp number", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
      </div>
      {textField("city", "City you're based in", { autoComplete: "address-level2" })}

      <div>
        <label htmlFor="motivation" className="text-sm font-medium text-text-primary">
          Anything you&rsquo;d like us to know? (optional)
        </label>
        <textarea
          id="motivation"
          name="motivation"
          rows={3}
          maxLength={1500}
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
          maxLength={160}
          className={cn(inputClass, "mt-2 h-11 border-border-primary")}
        />
      </div>

      <div className="rounded-xl bg-neutral-900/[0.04] px-4 py-3 text-sm leading-relaxed text-text-secondary">
        Training fee: <span className="font-semibold text-text-primary">{naira.format(fee)}</span>, paid by bank
        transfer.{" "}
        {bankDetails
          ? "You’ll get a payment code and the account details after you register."
          : "You’ll get a payment code after you register, and we’ll send the account details on WhatsApp."}
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === "submitting"}>
        {status === "submitting" ? "Registering…" : "Register"}
      </Button>

      <p className="text-xs leading-relaxed text-text-tertiary">
        By registering, you agree that Pikinic can contact you on WhatsApp and email about this training.
      </p>
    </form>
  );
}
