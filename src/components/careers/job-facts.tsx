import type { ReactNode } from "react";
import { formatClosingDate } from "@/lib/jobs";
import { cn } from "@/lib/utils";

// 24px line icons in the site's style (stroke 1.5, round caps).
const categoryIcons: Record<string, ReactNode> = {
  "Study Abroad": (
    <>
      <path d="M2 9l10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6" />
    </>
  ),
  "Travel & Tours": (
    <>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </>
  ),
  "Stay & Ride": (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10M10 20v-6h4v6" />
    </>
  ),
  Finance: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M16 15h2" />
    </>
  ),
};

const briefcase = (
  <>
    <rect x="3" y="7" width="18" height="13" rx="1.5" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" />
  </>
);

const icons = {
  location: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  jobType: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  closes: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
};

// The service colour from the design system, on the category icon only.
const categoryColor: Record<string, string> = {
  "Study Abroad": "text-blue-500",
  "Travel & Tours": "text-orange-500",
  "Stay & Ride": "text-yellow-500",
  Finance: "text-red-500",
};

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-[1.15em] shrink-0", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

type JobFactsJob = { category: string; location: string; jobType: string; closesAt: Date };

/** Category, location, job type and closing date as a row of icon + text items. */
export function JobFacts({
  job,
  closed = false,
  className,
}: {
  job: JobFactsJob;
  closed?: boolean;
  className?: string;
}) {
  const items = [
    {
      label: "Category",
      value: job.category,
      icon: (
        <Icon className={categoryColor[job.category] ?? "text-green-700"}>
          {categoryIcons[job.category] ?? briefcase}
        </Icon>
      ),
    },
    { label: "Location", value: job.location, icon: <Icon className="text-text-tertiary">{icons.location}</Icon> },
    { label: "Job type", value: job.jobType, icon: <Icon className="text-text-tertiary">{icons.jobType}</Icon> },
    {
      label: closed ? "Closed" : "Closes",
      value: `${closed ? "Closed" : "Closes"} ${formatClosingDate(job.closesAt)}`,
      icon: <Icon className="text-text-tertiary">{icons.closes}</Icon>,
    },
  ];

  return (
    <dl className={cn("flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <dt className="sr-only">{item.label}</dt>
          {item.icon}
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
