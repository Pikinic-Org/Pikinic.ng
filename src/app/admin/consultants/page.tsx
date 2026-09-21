"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { PaymentPill, ReviewPill } from "@/components/admin/consultant-pills";
import { SavedBanner } from "@/components/admin/saved-banner";
import { StatTile, StatTileGrid } from "@/components/admin/stat-tile";
import { listConsultants } from "@/lib/admin/api/consultants";
import { formatAdminDate, formatNaira } from "@/lib/admin/utils/format";
import type { TravelConsultant } from "@/lib/admin/types";

type Filter = "all" | "paid" | "pending";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Awaiting Payment" },
];

export default function ConsultantsListPage() {
  const [consultants, setConsultants] = useState<TravelConsultant[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    listConsultants()
      .then(setConsultants)
      .catch(() => setError("Could not load travel consultants."));
  }, []);

  const metrics = useMemo(() => {
    const all = consultants ?? [];
    const paid = all.filter((c) => c.paymentStatus === "paid");
    return {
      total: all.length,
      paid: paid.length,
      pending: all.length - paid.length,
      revenue: paid.reduce((sum, c) => sum + c.amount, 0),
      // Stages only mean something once someone has paid.
      enrolled: paid.filter((c) => c.reviewStatus === "registered").length,
      attended: paid.filter((c) => c.reviewStatus === "attended").length,
      internship: paid.filter((c) => c.reviewStatus === "internship").length,
      paymentRate: all.length ? Math.round((paid.length / all.length) * 100) : 0,
    };
  }, [consultants]);

  const rows = useMemo(() => {
    const all = consultants ?? [];
    return filter === "all" ? all : all.filter((c) => c.paymentStatus === filter);
  }, [consultants, filter]);

  const columns: AdminTableColumn<TravelConsultant>[] = [
    {
      key: "name",
      header: "Consultant",
      cell: (c) => (
        <div>
          <div>{c.fullName}</div>
          <div className="text-xs font-normal text-text-tertiary">{c.email}</div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (c) => (
        <div>
          <div>{c.whatsapp}</div>
          <div className="text-xs text-text-tertiary">{c.city}</div>
        </div>
      ),
    },
    { key: "payment", header: "Payment", cell: (c) => <PaymentPill status={c.paymentStatus} /> },
    { key: "review", header: "Review", cell: (c) => <ReviewPill status={c.reviewStatus} /> },
    { key: "registered", header: "Registered", cell: (c) => formatAdminDate(c.createdAt) },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Travel Consultants"
        description="People who registered through /travel-consultancy, with payment and review status."
      />

      <SavedBanner createdMessage="Travel consultant added." updatedMessage="Travel consultant updated." />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <StatTileGrid>
        <StatTile label="Registrations" value={consultants ? String(metrics.total) : "…"} />
        <StatTile label="Paid" value={consultants ? String(metrics.paid) : "…"} />
        <StatTile label="Awaiting Payment" value={consultants ? String(metrics.pending) : "…"} />
        <StatTile label="Revenue" value={consultants ? formatNaira(metrics.revenue) : "…"} accent />
      </StatTileGrid>

      <div className="mt-6">
        <StatTileGrid>
          <StatTile label="Paid · Awaiting Training" value={consultants ? String(metrics.enrolled) : "…"} />
          <StatTile label="Attended Training" value={consultants ? String(metrics.attended) : "…"} />
          <StatTile label="On Paid Internship" value={consultants ? String(metrics.internship) : "…"} />
          <StatTile label="Payment Rate" value={consultants ? `${metrics.paymentRate}%` : "…"} />
        </StatTileGrid>
      </div>

      <div className="mb-4 mt-8 flex gap-2">
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
      </div>

      {consultants === null && !error ? (
        <div className="rounded-[2px] border border-border-primary p-12 text-center text-sm text-text-tertiary">
          Loading…
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          rowHref={(c) => `/admin/consultants/${c.id}`}
          emptyMessage="No travel consultants match this filter."
        />
      )}
    </div>
  );
}
