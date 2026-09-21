import { cn } from "@/lib/utils";
import type { FlightBookingStatus } from "@/lib/admin/types";

const styles: Record<FlightBookingStatus, { label: string; className: string }> = {
  reserved: { label: "Successful", className: "bg-green-100 text-green-800" },
  paid: { label: "Paid · Not Reserved", className: "bg-amber-100 text-amber-800" },
  pending_payment: { label: "Awaiting Payment", className: "bg-neutral-200 text-neutral-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
};

export function FlightBookingPill({ status }: { status: FlightBookingStatus }) {
  const { label, className } = styles[status];

  return (
    <span
      className={cn(
        "inline-block rounded-[2px] px-2.5 py-1 text-xs font-semibold uppercase tracking-widest",
        className
      )}
    >
      {label}
    </span>
  );
}
