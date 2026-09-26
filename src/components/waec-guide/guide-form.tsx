"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  guideCountries,
  guideFunding,
  guideIntakes,
  guideQualifications,
  guideStages,
} from "@/lib/guide-options";
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

function ChoiceField({
  name,
  label,
  options,
  placeholder = "Choose one",
}: {
  name: string;
  label: string;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={`profile-${name}`} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <select
        id={`profile-${name}`}
        name={name}
        defaultValue=""
        className={cn(inputClass, "mt-2 border-border-primary")}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

// Step two: every answer is optional, and the lead is already saved, so this
// can never cost us the sign-up. It only makes the follow-up call better.
function ProfileStep({ token, downloadPath }: { token: string; downloadPath: string | null }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [skipped, setSkipped] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/waec-guide/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <div className="rounded-2xl bg-surface-primary p-8 md:p-10">
      <div className="flex size-12 items-center justify-center rounded-full bg-green-500/15 text-green-700">
        <CheckIcon className="size-6" />
      </div>
      <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-text-primary">
        You&rsquo;re <span className="text-green-700">in.</span>
      </h2>
      <p className="mt-3 text-base leading-relaxed text-text-secondary">
        We&rsquo;ll message you on WhatsApp within 24 hours to arrange your free study abroad review.
      </p>

      {status === "saved" || skipped ? (
        <p className="mt-8 border-t border-border-primary pt-6 text-sm leading-relaxed text-text-secondary">
          {status === "saved"
            ? "Thank you. We have what we need to make your review useful."
            : "No problem. We’ll ask you on WhatsApp instead."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5 border-t border-border-primary pt-8">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Help us prepare for your review</h3>
            <p className="mt-1 text-sm text-text-secondary">Optional, and it takes about a minute.</p>
          </div>

          <ChoiceField name="qualification" label="Highest qualification" options={guideQualifications} />

          <div>
            <label htmlFor="profile-fieldOfStudy" className="text-sm font-medium text-text-primary">
              Field of study
            </label>
            <input
              id="profile-fieldOfStudy"
              name="fieldOfStudy"
              type="text"
              maxLength={120}
              placeholder="For example, accounting or computer science"
              className={cn(inputClass, "mt-2 border-border-primary placeholder:text-text-tertiary")}
            />
          </div>

          <ChoiceField name="country" label="Country you are most interested in" options={guideCountries} />
          <ChoiceField name="intake" label="When would you like to start?" options={guideIntakes} />
          <ChoiceField name="funding" label="How do you plan to pay?" options={guideFunding} />

          {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" disabled={status === "saving"}>
              {status === "saving" ? "Saving…" : "Save my answers"}
            </Button>
            <button
              type="button"
              onClick={() => setSkipped(true)}
              className="text-sm font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary"
            >
              Skip for now
            </button>
          </div>
        </form>
      )}

      {downloadPath && (
        <p className="mt-8 border-t border-border-primary pt-6 text-sm leading-relaxed text-text-secondary">
          Know someone finishing secondary school? Share the free WAEC guide with them.{" "}
          {/* A plain anchor, not next/link: prefetching would hit the download route and count as a download. */}
          <a
            href={downloadPath}
            className="font-medium text-green-700 underline underline-offset-4 hover:text-green-800"
          >
            Download the WAEC guide
          </a>
        </p>
      )}
    </div>
  );
}

export function GuideForm({ source }: { source: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [token, setToken] = useState("");
  const [downloadPath, setDownloadPath] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  function revalidate() {
    if (!formRef.current) return {};
    const data = Object.fromEntries(new FormData(formRef.current).entries());
    const errors = validate(data);
    setFieldErrors(errors);
    return errors;
  }

  // Also called from onChange (the select), so it only needs the field name.
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

      setToken(body.token);
      setDownloadPath(body.downloadPath ?? null);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (status === "success") return <ProfileStep token={token} downloadPath={downloadPath} />;

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

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      {textField("name", "Full name", { type: "text", autoComplete: "name" })}
      {textField("email", "Email address", { type: "email", autoComplete: "email" })}
      {textField("whatsapp", "WhatsApp number", { type: "tel", inputMode: "tel", autoComplete: "tel" })}

      <div>
        <label htmlFor="stage" className="text-sm font-medium text-text-primary">
          Where are you right now?
        </label>
        <select
          id="stage"
          name="stage"
          defaultValue=""
          onBlur={handleBlur}
          onChange={handleBlur}
          aria-invalid={fieldState("stage") === "invalid"}
          className={cn(inputClass, "mt-2", borderClass("stage"))}
        >
          <option value="" disabled>
            Choose one
          </option>
          {guideStages.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {fieldState("stage") === "invalid" && <p className="mt-1.5 text-xs text-red-600">{fieldErrors.stage}</p>}
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Get my free review"}
      </Button>

      <p className="text-xs leading-relaxed text-text-tertiary">
        By continuing, you agree that Pikinic can contact you on WhatsApp and email about studying abroad. You can opt
        out at any time.
      </p>
    </form>
  );
}
