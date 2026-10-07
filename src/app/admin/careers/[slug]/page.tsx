"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { JobForm } from "@/components/admin/forms/job-form";
import { getJob } from "@/lib/admin/api/jobs";
import { ApiError } from "@/lib/admin/api/client";
import type { Job } from "@/lib/admin/types";

export default function EditJobPage() {
  const { slug } = useParams<{ slug: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getJob(slug)
      .then(setJob)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) setNotFound(true);
      });
  }, [slug]);

  if (notFound) {
    return (
      <div>
        <AdminPageHeader title="Job Not Found" />
        <p className="text-sm text-text-secondary">No job matches that slug.</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div>
        <AdminPageHeader title="Loading…" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title={`Edit: ${job.title}`} />
      <JobForm initialJob={job} />
    </div>
  );
}
