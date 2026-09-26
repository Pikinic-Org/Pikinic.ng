"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { StatTile, StatTileGrid } from "@/components/admin/stat-tile";
import {
  deleteGuideLead,
  guideLeadsCsvUrl,
  listGuideLeads,
  purgeGuideLeads,
  type GuideLeadRow,
} from "@/lib/admin/api/guide-leads";
import { formatAdminDateTime } from "@/lib/admin/utils/format";

const buttonClass =
  "rounded-[2px] border border-border-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text-secondary transition-colors hover:bg-neutral-900/[0.04]";

export default function GuideLeadsPage() {
  const [leads, setLeads] = useState<GuideLeadRow[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [source, setSource] = useState("all");

  // Clear-out panel: leads requested before this date (UTC), same boundary the API uses.
  const [before, setBefore] = useState("");
  const [exportedBefore, setExportedBefore] = useState("");

  useEffect(() => {
    listGuideLeads()
      .then(setLeads)
      .catch(() => setError("Could not load guide leads."));
  }, []);

  const sources = useMemo(() => Array.from(new Set((leads ?? []).map((l) => l.source))).sort(), [leads]);

  const rows = useMemo(
    () => (source === "all" ? (leads ?? []) : (leads ?? []).filter((l) => l.source === source)),
    [leads, source]
  );

  const metrics = useMemo(() => {
    const downloaded = rows.filter((l) => l.downloadCount > 0).length;
    return {
      total: rows.length,
      downloaded,
      rate: rows.length ? Math.round((downloaded / rows.length) * 100) : 0,
      profiled: rows.filter((l) => l.profileCompletedAt).length,
    };
  }, [rows]);

  const purgeCount = useMemo(() => {
    if (!before || !leads) return 0;
    const cutoff = new Date(`${before}T00:00:00Z`).getTime();
    return leads.filter((l) => new Date(l.createdAt).getTime() < cutoff).length;
  }, [before, leads]);

  // Deleting is only offered after the same window has been exported.
  const canPurge = Boolean(before) && purgeCount > 0 && exportedBefore === before;

  const handleDelete = async (id: string) => {
    setError("");
    setNotice("");
    try {
      await deleteGuideLead(id);
      setLeads((current) => (current ? current.filter((l) => l.id !== id) : current));
    } catch {
      setError("Could not delete that lead.");
    }
  };

  const handlePurge = async () => {
    setError("");
    setNotice("");
    try {
      const { deleted } = await purgeGuideLeads(before);
      const cutoff = new Date(`${before}T00:00:00Z`).getTime();
      setLeads((current) => (current ? current.filter((l) => new Date(l.createdAt).getTime() >= cutoff) : current));
      setNotice(`Deleted ${deleted} lead${deleted === 1 ? "" : "s"} requested before ${before}.`);
      setBefore("");
      setExportedBefore("");
    } catch {
      setError("Could not delete those leads.");
    }
  };

  const columns: AdminTableColumn<GuideLeadRow>[] = [
    {
      key: "lead",
      header: "Lead",
      cell: (lead) => (
        <div>
          <div className="font-semibold text-text-primary">{lead.name}</div>
          <div className="text-xs text-text-tertiary">{lead.email}</div>
        </div>
      ),
    },
    {
      key: "whatsapp",
      header: "WhatsApp",
      cell: (lead) => (
        <a
          href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noreferrer noopener"
          className="text-green-700 underline underline-offset-2"
        >
          {lead.whatsapp}
        </a>
      ),
    },
    { key: "stage", header: "Stage", cell: (lead) => lead.stage },
    {
      key: "profile",
      header: "Profile",
      cell: (lead) =>
        lead.profileCompletedAt ? (
          <div className="text-xs leading-relaxed text-text-secondary">
            <div className="text-sm text-text-primary">
              {[lead.qualification, lead.fieldOfStudy].filter(Boolean).join(" · ") || "—"}
            </div>
            <div>{[lead.country, lead.intake].filter(Boolean).join(" · ")}</div>
            {lead.funding && <div>Funding: {lead.funding}</div>}
          </div>
        ) : (
          <span className="text-text-tertiary">Not added</span>
        ),
    },
    { key: "source", header: "Source", cell: (lead) => lead.source },
    {
      key: "downloads",
      header: "Downloads",
      cell: (lead) =>
        lead.downloadCount > 0 ? (
          <div>
            <div className="font-semibold text-text-primary">{lead.downloadCount}</div>
            {lead.lastDownloadAt && (
              <div className="text-xs text-text-tertiary">{formatAdminDateTime(lead.lastDownloadAt)}</div>
            )}
          </div>
        ) : (
          "—"
        ),
    },
    { key: "requested", header: "Requested", cell: (lead) => formatAdminDateTime(lead.createdAt) },
    {
      key: "actions",
      header: "",
      cell: (lead) => <ConfirmDeleteButton confirmLabel="Delete lead?" onConfirm={() => handleDelete(lead.id)} />,
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Guide Leads"
        description="People who asked for a free study abroad review, from talks, events and the website."
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mb-4 text-sm text-green-700">{notice}</p>}

      <StatTileGrid>
        <StatTile label="Leads" value={leads ? String(metrics.total) : "…"} accent />
        <StatTile label="Downloaded" value={leads ? String(metrics.downloaded) : "…"} />
        <StatTile label="Download rate" value={leads ? `${metrics.rate}%` : "…"} />
        <StatTile label="Added their profile" value={leads ? String(metrics.profiled) : "…"} />
      </StatTileGrid>

      <div className="mb-4 mt-8 flex flex-wrap items-center gap-3">
        <label htmlFor="source" className="text-sm text-text-secondary">
          Source
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="h-9 rounded-[2px] border border-border-primary bg-transparent px-3 text-sm"
        >
          <option value="all">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Plain anchor: the CSV comes straight from the API with the session cookie. */}
        <a href={guideLeadsCsvUrl()} className={`ml-auto ${buttonClass}`}>
          Export all as CSV
        </a>
      </div>

      {leads === null && !error ? (
        <div className="rounded-[2px] border border-border-primary p-12 text-center text-sm text-text-tertiary">
          Loading…
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(lead) => lead.id}
          emptyMessage="No guide requests yet."
        />
      )}

      <section className="mt-10 rounded-[2px] border border-border-primary p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-primary">Clear out old leads</h2>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          To free up space, export the leads you no longer need, then delete them. Deleting is only offered after you
          have exported the same date. It removes them from this dashboard for good. Zoho CRM is not touched.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label htmlFor="before" className="text-sm text-text-secondary">
            Requested before
          </label>
          <input
            id="before"
            type="date"
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            className="h-9 rounded-[2px] border border-border-primary bg-transparent px-3 text-sm"
          />
          {before && (
            <span className="text-sm text-text-secondary">
              {purgeCount} lead{purgeCount === 1 ? "" : "s"} match
            </span>
          )}

          {before && purgeCount > 0 && (
            <a href={guideLeadsCsvUrl(before)} onClick={() => setExportedBefore(before)} className={buttonClass}>
              1. Export these as CSV
            </a>
          )}

          {canPurge && (
            <ConfirmDeleteButton
              label={`2. Delete ${purgeCount}`}
              confirmLabel={`Delete ${purgeCount} for good?`}
              onConfirm={handlePurge}
            />
          )}
        </div>
      </section>
    </div>
  );
}
