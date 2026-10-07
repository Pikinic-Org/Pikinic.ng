import { cn } from "@/lib/utils";
import type { JobApplicationStatus } from "@/lib/admin/types";

export const applicationStatusLabels: Record<JobApplicationStatus, string> = {
  new: "New",
  shortlisted: "Shortlisted",
  interviewed: "Interviewed",
  rejected: "Rejected",
  hired: "Hired",
};

const styles: Record<JobApplicationStatus, string> = {
  new: "bg-neutral-200 text-neutral-700",
  shortlisted: "bg-green-100 text-green-800",
  interviewed: "bg-green-200 text-green-900",
  rejected: "bg-red-100 text-red-700",
  hired: "bg-green-700 text-neutral-0",
};

export function ApplicationStatusPill({ status }: { status: JobApplicationStatus }) {
  return (
    <span
      className={cn(
        "inline-block rounded-[2px] px-2.5 py-1 text-xs font-semibold uppercase tracking-widest",
        styles[status]
      )}
    >
      {applicationStatusLabels[status]}
    </span>
  );
}
