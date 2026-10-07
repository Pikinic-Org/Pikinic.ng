"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { JobStatePill } from "@/components/admin/job-state-pill";
import { SavedBanner } from "@/components/admin/saved-banner";
import { Button } from "@/components/ui/button";
import { listJobs, deleteJob } from "@/lib/admin/api/jobs";
import { formatAdminDateTime } from "@/lib/admin/utils/format";
import { jobCategories } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/admin/types";

export default function JobsListPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listJobs()
      .then(setJobs)
      .catch(() => setError("Could not load jobs."));
  }, []);

  async function handleDelete(slug: string) {
    await deleteJob(slug);
    setJobs((prev) => (prev ?? []).filter((job) => job.slug !== slug));
  }

  const visible = (jobs ?? []).filter((job) => !category || job.category === category);

  const columns: AdminTableColumn<Job>[] = [
    { key: "title", header: "Job", cell: (job) => job.title },
    { key: "category", header: "Category", cell: (job) => job.category },
    { key: "closesAt", header: "Closes", cell: (job) => formatAdminDateTime(job.closesAt) },
    { key: "status", header: "Status", cell: (job) => <JobStatePill job={job} /> },
    {
      key: "applicants",
      header: "Applicants",
      cell: (job) =>
        job.applicationCount ? (
          <Link
            href={`/admin/forms/careers?job=${encodeURIComponent(job.slug)}`}
            className="text-green-700 underline underline-offset-2"
          >
            {job.applicationCount}
          </Link>
        ) : (
          0
        ),
    },
    {
      key: "actions",
      header: "",
      className: "px-4 py-3 text-right",
      cell: (job) => (
        <div className="flex items-center justify-end">
          <ConfirmDeleteButton onConfirm={() => handleDelete(job.slug)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Careers"
        description="Jobs listed on the careers page. People apply with their CV; their applications appear under Forms."
        action={
          <Button href="/admin/careers/new" size="md">
            New Job
          </Button>
        }
      />

      <SavedBanner createdMessage="Job created." updatedMessage="Job updated." />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...jobCategories].map((name) => (
          <button
            key={name || "all"}
            type="button"
            onClick={() => setCategory(name)}
            className={cn(
              "rounded-[2px] border px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors",
              category === name
                ? "border-green-700 bg-green-700 text-white"
                : "border-border-primary text-text-secondary hover:bg-neutral-900/[0.04]"
            )}
          >
            {name || "All"}
          </button>
        ))}
      </div>

      {jobs === null ? (
        <div className="rounded-[2px] border border-border-primary p-12 text-center text-sm text-text-tertiary">
          Loading…
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={visible}
          rowKey={(job) => job.slug}
          rowHref={(job) => `/admin/careers/${job.slug}`}
          emptyMessage={category ? `No ${category} jobs yet.` : "No jobs yet."}
        />
      )}
    </div>
  );
}
