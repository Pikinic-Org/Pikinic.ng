"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type State =
  | { kind: "checking" }
  | { kind: "paid"; firstName: string }
  | { kind: "pending" }
  | { kind: "error" };

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 5;

// Monnify sends the browser back here the moment checkout closes, which can be
// a beat before its own records say PAID — so poll a few times before giving
// up and telling the student their payment is still being confirmed.
export function PaymentConfirmation({ registrationId }: { registrationId: string | undefined }) {
  const [state, setState] = useState<State>(registrationId ? { kind: "checking" } : { kind: "error" });

  useEffect(() => {
    if (!registrationId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function check(attempt: number) {
      try {
        const res = await fetch(`/api/travel-consultancy/status?id=${encodeURIComponent(registrationId!)}`);
        if (!res.ok) throw new Error();
        const body: { paymentStatus: "pending" | "paid"; firstName: string } = await res.json();
        if (cancelled) return;

        if (body.paymentStatus === "paid") {
          setState({ kind: "paid", firstName: body.firstName });
        } else if (attempt >= MAX_ATTEMPTS) {
          setState({ kind: "pending" });
        } else {
          timer = setTimeout(() => check(attempt + 1), POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    }

    check(1);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [registrationId]);

  return (
    <div className="rounded-[2px] border border-border-primary bg-surface-primary p-8 text-center md:p-12">
      {state.kind === "checking" && (
        <>
          <p className="text-lg font-semibold text-text-primary">Confirming your payment…</p>
          <p className="mt-2 text-sm text-text-secondary">This only takes a few seconds. Please don&rsquo;t close this page.</p>
        </>
      )}

      {state.kind === "paid" && (
        <>
          <p className="text-lg font-semibold text-text-primary">You&rsquo;re in, {state.firstName}.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Payment received and your registration is with our team. We&rsquo;ll reach out on WhatsApp and email
            with your next steps.
          </p>
          <Button href="/" size="lg" className="mx-auto mt-8 w-fit">
            Back to Home
          </Button>
        </>
      )}

      {state.kind === "pending" && (
        <>
          <p className="text-lg font-semibold text-text-primary">We haven&rsquo;t received your payment yet.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            If you completed the payment, it can take a few minutes to reflect — we&rsquo;ll update your
            registration automatically. If you closed checkout early, you can register again with the same email to
            retry.
          </p>
          <Button href="/travel-consultancy" size="lg" className="mx-auto mt-8 w-fit">
            Try Again
          </Button>
        </>
      )}

      {state.kind === "error" && (
        <>
          <p className="text-lg font-semibold text-text-primary">We couldn&rsquo;t check your payment.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Please refresh this page, or contact us if you were charged.
          </p>
          <Button href="/contact" size="lg" className="mx-auto mt-8 w-fit">
            Contact Us
          </Button>
        </>
      )}
    </div>
  );
}
