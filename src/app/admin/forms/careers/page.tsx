"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { ApplicationStatusPill, applicationStatusLabels } from "@/components/admin/application-status-pill";
import { CopyButton } from "@/components/admin/copy-button";
import { SavedBanner } from "@/components/admin/saved-banner";
import { StatTile, StatTileGrid } from "@/components/admin/stat-tile";
import { jobApplicationCvUrl, jobApplicationsCsvUrl, listJobApplications } from "@/lib/admin/api/job-applications";
import { formatAdminDate } from "@/lib/admin/utils/format";
import type { JobApplication, JobApplicationStatus } from "@/lib/admin/types";

type Filter = "all" | JobApplicationStatus;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  ...(Object.keys(applicationStatusLabels) as JobApplicationStatus[]).map((key) => ({
    key,
    label: applicationStatusLabels[key],
  })),
];

const buttonClass =
  "rounded-[2px] border border-border-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text-secondary transition-colors hover:bg-neutral-900/[0.04]";

const normalise = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

export default function CareersFormPage() {
  const [applications, setApplications] = useState<JobApplication[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [job, setJob] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    // The Careers jobs table links here with ?job=<slug> to show one role's applicants.
    const fromLink = new URLSearchParams(window.location.search).get("job");

    listJobApplications()
      .then((data) => {
        setApplications(data);
        if (fromLink) setJob(fromLink);
      })
      .catch(() => setError("Could not load applications."));
  }, []);

  const jobs = useMemo(() => {
    const bySlug = new Map((applications ?? []).map((a) => [a.job.slug, a.job.title]));
    return Array.from(bySlug, ([slug, title]) => ({ slug, title }));
  }, [applications]);

  // Stats follow the role filter, so each role can be read on its own.
  const forJob = useMemo(
    () => (job === "all" ? (applications ?? []) : (applications ?? []).filter((a) => a.job.slug === job)),
    [applications, job]
  );

  const count = (status: JobApplicationStatus) => forJob.filter((a) => a.status === status).length;

  const rows = useMemo(() => {
    const query = normalise(search);
    return forJob.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (!query) return true;
      return [`${a.firstName} ${a.lastName}`, a.email, a.phone].some((field) => normalise(field).includes(query));
    });
  }, [forJob, filter, search]);

  const columns: AdminTableColumn<JobApplication>[] = [
    {
      key: "name",
      header: "Name",
      cell: (a) => (
        <div>
          <div className="flex items-center gap-1.5">
            {a.firstName} {a.lastName}
            <CopyButton value={`${a.firstName} ${a.lastName}`} label="name" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-normal text-text-tertiary">
            {a.email}
            <CopyButton value={a.email} label="email" />
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (a) => (
        <div className="flex items-center gap-1.5">
          <a
            href={`https://wa.me/${a.phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-green-700 underline underline-offset-2"
          >
            {a.phone}
          </a>
          <CopyButton value={a.phone} label="phone number" />
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (a) => (
        <div>
          <div>{a.job.title}</div>
          <div className="text-xs text-text-tertiary">{a.job.category}</div>
        </div>
      ),
    },
    {
      key: "cv",
      header: "CV",
      cell: (a) => (
        <a
          href={jobApplicationCvUrl(a.id)}
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-green-700 underline underline-offset-2 hover:text-green-800"
        >
          Open CV
        </a>
      ),
    },
    { key: "status", header: "Status", cell: (a) => <ApplicationStatusPill status={a.status} /> },
    { key: "applied", header: "Applied", cell: (a) => formatAdminDate(a.createdAt) },
  ];

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-text-secondary">
        People who applied for a role on /careers. Open a row to read their answer, change their status or add notes.
        Jobs themselves are managed under Careers in the sidebar.
      </p>

      <SavedBanner createdMessage="Application added." updatedMessage="Application updated." />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <StatTileGrid>
        <StatTile label="Applications" value={applications ? String(forJob.length) : "…"} />
        <StatTile label="New" value={applications ? String(count("new")) : "…"} />
        <StatTile label="Shortlisted" value={applications ? String(count("shortlisted")) : "…"} />
        <StatTile label="Hired" value={applications ? String(count("hired")) : "…"} accent />
      </StatTileGrid>

      <div className="mb-4 mt-8 flex flex-wrap items-center gap-3">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-[2px] px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
              filter === f.key
                ? "bg-green-200 text-green-900"
                : "border border-border-primary text-text-secondary hover:bg-neutral-900/[0.04]"
            }`}
          >
            {f.label}
          </button>
        ))}

        <select
          aria-label="Role"
          value={job}
          onChange={(e) => setJob(e.target.value)}
          className="h-9 rounded-[2px] border border-border-primary bg-transparent px-3 text-sm"
        >
          <option value="all">All roles</option>
          {jobs.map((j) => (
            <option key={j.slug} value={j.slug}>
              {j.title}
            </option>
          ))}
          {/* Keeps a role from a ?job= link selectable before anyone has applied to it. */}
          {job !== "all" && !jobs.some((j) => j.slug === job) && <option value={job}>{job}</option>}
        </select>

        <input
          type="search"
          aria-label="Search"
          placeholder="Search name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-72 max-w-full rounded-[2px] border border-border-primary bg-transparent px-3 text-sm"
        />

        {/* Plain anchor: the CSV comes straight from the API with the session cookie. */}
        <a href={jobApplicationsCsvUrl()} className={`ml-auto ${buttonClass}`}>
          Export all as CSV
        </a>
      </div>

      {applications === null && !error ? (
        <div className="rounded-[2px] border border-border-primary p-12 text-center text-sm text-text-tertiary">
          Loading…
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(a) => a.id}
          rowHref={(a) => `/admin/forms/careers/${a.id}`}
          emptyMessage={applications?.length ? "No applications match." : "No applications yet."}
        />
      )}
    </div>
  );
}
