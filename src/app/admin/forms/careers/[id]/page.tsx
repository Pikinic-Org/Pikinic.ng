"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminSelect, AdminTextArea } from "@/components/admin/fields";
import { ApplicationStatusPill, applicationStatusLabels } from "@/components/admin/application-status-pill";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { CopyButton } from "@/components/admin/copy-button";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/admin/api/client";
import {
  deleteJobApplication,
  getJobApplication,
  jobApplicationCvUrl,
  updateJobApplication,
} from "@/lib/admin/api/job-applications";
import { formatAdminDateTime } from "@/lib/admin/utils/format";
import type { JobApplication, JobApplicationStatus } from "@/lib/admin/types";

// This page sits under the Forms header and tabs, so it uses a smaller title.
function DetailHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link
          href="/admin/forms/careers"
          className="text-xs font-semibold uppercase tracking-widest text-text-tertiary hover:text-text-secondary"
        >
          ← All applications
        </Link>
        <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight text-text-primary">{title}</h2>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm text-text-primary">{children || "—"}</dd>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    getJobApplication(id)
      .then(setApplication)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) setNotFound(true);
      });
  }, [id]);

  if (notFound) {
    return (
      <div>
        <DetailHeader title="Application not found" />
        <p className="text-sm text-text-secondary">No application matches that id.</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div>
        <DetailHeader title="Loading…" />
      </div>
    );
  }

  const fullName = `${application.firstName} ${application.lastName}`;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const data = new FormData(e.currentTarget);

    setSubmitting(true);
    try {
      await updateJobApplication(id, {
        status: data.get("status") as JobApplicationStatus,
        adminNotes: String(data.get("adminNotes") ?? ""),
      });
      router.push(`/admin/forms/careers?updated=${id}`);
    } catch {
      setFormError("Could not save changes. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    await deleteJobApplication(id);
    router.push("/admin/forms/careers");
  }

  return (
    <div>
      <DetailHeader
        title={fullName}
        description={`Applied ${formatAdminDateTime(application.createdAt)}`}
        action={<ConfirmDeleteButton onConfirm={handleDelete} />}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <dl className="space-y-5">
          <ApplicationStatusPill status={application.status} />
          <Detail label="Role">
            <Link
              href={`/careers/${application.job.slug}`}
              target="_blank"
              className="text-green-700 underline underline-offset-2"
            >
              {application.job.title}
            </Link>{" "}
            <span className="text-text-tertiary">({application.job.category})</span>
          </Detail>
          <Detail label="Email">
            <span className="inline-flex items-center gap-1.5">
              <a href={`mailto:${application.email}`} className="text-green-700 underline underline-offset-2">
                {application.email}
              </a>
              <CopyButton value={application.email} label="email" />
            </span>
          </Detail>
          <Detail label="Phone or WhatsApp">
            <span className="inline-flex items-center gap-1.5">
              <a
                href={`https://wa.me/${application.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-green-700 underline underline-offset-2"
              >
                {application.phone}
              </a>
              <CopyButton value={application.phone} label="phone number" />
            </span>
          </Detail>
          <Detail label="Address">{application.address}</Detail>
          <Detail label="CV">
            <a
              href={jobApplicationCvUrl(application.id)}
              target="_blank"
              rel="noreferrer"
              className="text-green-700 underline underline-offset-2"
            >
              Open CV
            </a>{" "}
            <span className="text-text-tertiary">({application.cvFileName})</span>
          </Detail>
          <Detail label="Why they are a good fit">{application.motivation}</Detail>
        </dl>

        <form onSubmit={handleSubmit} className="space-y-5 self-start rounded-[2px] border border-border-primary p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Review</h2>
          <AdminSelect label="Status" name="status" defaultValue={application.status}>
            {(Object.keys(applicationStatusLabels) as JobApplicationStatus[]).map((status) => (
              <option key={status} value={status}>
                {applicationStatusLabels[status]}
              </option>
            ))}
          </AdminSelect>
          <AdminTextArea label="Internal Notes" name="adminNotes" rows={6} defaultValue={application.adminNotes ?? ""} />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
