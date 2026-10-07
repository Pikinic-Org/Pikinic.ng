import Link from "next/link";
import { JobFacts } from "@/components/careers/job-facts";

type JobRowJob = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  location: string;
  jobType: string;
  closesAt: Date;
};

// One open role as a full-width white card. The whole card is the link.
export function JobRow({ job }: { job: JobRowJob }) {
  return (
    <li className="group relative flex items-center gap-6 rounded-2xl bg-surface-primary p-6 md:gap-10 md:p-10">
      <div className="min-w-0 flex-1">
        <h3 className="text-2xl font-semibold leading-tight tracking-tight text-text-primary md:text-3xl">
          <Link
            href={`/careers/${job.slug}`}
            className="transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-green-700"
          >
            {job.title}
          </Link>
        </h3>
        <JobFacts job={job} className="mt-4" />
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary">{job.summary}</p>
      </div>

      <span
        aria-hidden
        className="hidden size-12 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-800 transition-colors group-hover:bg-green-500 group-hover:text-neutral-900 sm:flex"
      >
        <svg viewBox="0 0 16 16" fill="none" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </li>
  );
}
