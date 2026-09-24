"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

export function NewsletterForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong.");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className={cn("text-sm text-neutral-300", className)}>
        <span className="font-semibold text-neutral-0">You&rsquo;re on the list.</span>{" "}
        We&rsquo;ll be in touch at {email}.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full max-w-sm", className)}>
      <div className="flex w-full gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="h-11 w-full min-w-0 rounded-lg border border-neutral-700 bg-transparent px-4 text-sm text-neutral-0 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="h-11 shrink-0 rounded-lg bg-green-500 px-5 text-sm font-medium text-neutral-900 transition-colors hover:bg-green-600 disabled:opacity-50"
        >
          {status === "submitting" ? "…" : "Subscribe"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-400">{errorMessage}</p>
      )}
    </form>
  );
}
