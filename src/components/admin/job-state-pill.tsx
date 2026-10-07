import { cn } from "@/lib/utils";
import type { Job } from "@/lib/admin/types";

export type JobState = "draft" | "open" | "closed";

// A published job is only open until its closing time passes.
export function getJobState(job: Pick<Job, "status" | "closesAt">): JobState {
  if (job.status === "draft") return "draft";
  return new Date(job.closesAt).getTime() > Date.now() ? "open" : "closed";
}

const styles: Record<JobState, string> = {
  open: "bg-green-100 text-green-800",
  draft: "bg-neutral-200 text-neutral-700",
  closed: "bg-red-100 text-red-700",
};

export function JobStatePill({ job }: { job: Pick<Job, "status" | "closesAt"> }) {
  const state = getJobState(job);
  return (
    <span
      className={cn(
        "inline-block rounded-[2px] px-2.5 py-1 text-xs font-semibold uppercase tracking-widest",
        styles[state]
      )}
    >
      {state}
    </span>
  );
}
