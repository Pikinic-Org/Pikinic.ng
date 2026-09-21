import { cn } from "@/lib/utils";
import type { ConsultantPaymentStatus, ConsultantReviewStatus } from "@/lib/admin/types";

const pillBase = "inline-block rounded-[2px] px-2.5 py-1 text-xs font-semibold uppercase tracking-widest";

const paymentStyles: Record<ConsultantPaymentStatus, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-neutral-200 text-neutral-700",
};

const reviewStyles: Record<ConsultantReviewStatus, string> = {
  approved: "bg-green-100 text-green-800",
  submitted: "bg-neutral-200 text-neutral-700",
  rejected: "bg-red-100 text-red-700",
};

export function PaymentPill({ status }: { status: ConsultantPaymentStatus }) {
  return <span className={cn(pillBase, paymentStyles[status])}>{status}</span>;
}

export function ReviewPill({ status }: { status: ConsultantReviewStatus }) {
  return <span className={cn(pillBase, reviewStyles[status])}>{status}</span>;
}
