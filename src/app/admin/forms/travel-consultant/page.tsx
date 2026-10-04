"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { PaymentPill, ReviewPill } from "@/components/admin/consultant-pills";
import { CopyButton } from "@/components/admin/copy-button";
import { SavedBanner } from "@/components/admin/saved-banner";
import { StatTile, StatTileGrid } from "@/components/admin/stat-tile";
import { consultantsCsvUrl, listConsultants, updateConsultant } from "@/lib/admin/api/consultants";
import { formatAdminDate, formatNaira } from "@/lib/admin/utils/format";
import { programmeLabel } from "@/lib/constants";
import type { ConsultantPaymentStatus, TravelConsultant } from "@/lib/admin/types";

type Filter = "all" | ConsultantPaymentStatus;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Awaiting Payment" },
  { key: "paid", label: "Paid" },
];

const buttonClass =
  "rounded-[2px] border border-border-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text-secondary transition-colors hover:bg-neutral-900/[0.04]";

// Banks often drop or change the hyphen in a narration, so codes are compared
// on letters and digits only.
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

// Two-step, like the delete button, so a stray click can't mark someone paid.
function MarkPaidButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [state, setState] = useState<"idle" | "confirming" | "saving">("idle");

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={() => setState("confirming")}
        className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-green-700 underline underline-offset-2 hover:text-green-800"
      >
        Mark paid
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-widest">
      <span className="text-text-primary">Paid?</span>
      <button
        type="button"
        disabled={state === "saving"}
        onClick={async () => {
          setState("saving");
          try {
            await onConfirm();
          } finally {
            setState("idle");
          }
        }}
        className="text-green-700 underline underline-offset-2 hover:text-green-800 disabled:opacity-50"
      >
        {state === "saving" ? "Saving…" : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => setState("idle")}
        className="text-text-tertiary underline underline-offset-2 hover:text-text-secondary"
      >
        Cancel
      </button>
    </span>
  );
}

export default function TravelConsultantFormPage() {
  const [consultants, setConsultants] = useState<TravelConsultant[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [programme, setProgramme] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    listConsultants()
      .then(setConsultants)
      .catch(() => setError("Could not load travel consultants."));
  }, []);

  const programmes = useMemo(
    () => Array.from(new Set((consultants ?? []).map((c) => programmeLabel(c.programme)))),
    [consultants]
  );

  // Stats follow the programme filter, so each cohort can be read on its own.
  const inProgramme = useMemo(
    () =>
      programme === "all"
        ? (consultants ?? [])
        : (consultants ?? []).filter((c) => programmeLabel(c.programme) === programme),
    [consultants, programme]
  );

  const metrics = useMemo(() => {
    const paid = inProgramme.filter((c) => c.paymentStatus === "paid");
    return {
      total: inProgramme.length,
      paid: paid.length,
      pending: inProgramme.length - paid.length,
      revenue: paid.reduce((sum, c) => sum + c.amount, 0),
    };
  }, [inProgramme]);

  const rows = useMemo(() => {
    const query = normalise(search);
    return inProgramme.filter((c) => {
      if (filter !== "all" && c.paymentStatus !== filter) return false;
      if (!query) return true;
      return [c.fullName, c.email, c.whatsapp, c.paymentCode ?? ""].some((field) => normalise(field).includes(query));
    });
  }, [inProgramme, filter, search]);

  const markPaid = async (id: string) => {
    setError("");
    try {
      const updated = await updateConsultant(id, { paymentStatus: "paid" });
      setConsultants((current) => current?.map((c) => (c.id === id ? updated : c)) ?? current);
    } catch {
      setError("Could not mark that registration as paid.");
    }
  };

  const columns: AdminTableColumn<TravelConsultant>[] = [
    {
      key: "name",
      header: "Name",
      cell: (c) => (
        <div>
          <div className="flex items-center gap-1.5">
            {c.fullName}
            <CopyButton value={c.fullName} label="name" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-normal text-text-tertiary">
            {c.email}
            <CopyButton value={c.email} label="email" />
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "WhatsApp",
      cell: (c) => (
        <div>
          <div className="flex items-center gap-1.5">
            <a
              href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-green-700 underline underline-offset-2"
            >
              {c.whatsapp}
            </a>
            <CopyButton value={c.whatsapp} label="phone number" />
          </div>
          <div className="text-xs text-text-tertiary">{c.city}</div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Payment code",
      cell: (c) => <span className="font-mono text-sm">{c.paymentCode ?? "—"}</span>,
    },
    {
      key: "payment",
      header: "Payment",
      cell: (c) => (
        <div className="flex flex-col items-start gap-1.5">
          <PaymentPill status={c.paymentStatus} />
          {c.paymentStatus === "pending" && <MarkPaidButton onConfirm={() => markPaid(c.id)} />}
        </div>
      ),
    },
    { key: "review", header: "Stage", cell: (c) => <ReviewPill status={c.reviewStatus} /> },
    {
      key: "registered",
      header: "Registered",
      cell: (c) => (
        <div>
          <div>{formatAdminDate(c.createdAt)}</div>
          <div className="text-xs text-text-tertiary">{programmeLabel(c.programme)}</div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-text-secondary">
        People who registered on /travel-consultant. They pay by bank transfer with their payment code in the
        narration. When a transfer arrives, search for the code and mark them paid.
      </p>

      <SavedBanner createdMessage="Registration added." updatedMessage="Registration updated." />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <StatTileGrid>
        <StatTile label="Registrations" value={consultants ? String(metrics.total) : "…"} />
        <StatTile label="Awaiting Payment" value={consultants ? String(metrics.pending) : "…"} />
        <StatTile label="Paid" value={consultants ? String(metrics.paid) : "…"} />
        <StatTile label="Revenue" value={consultants ? formatNaira(metrics.revenue) : "…"} accent />
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

        {programmes.length > 1 && (
          <select
            aria-label="Programme"
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            className="h-9 rounded-[2px] border border-border-primary bg-transparent px-3 text-sm"
          >
            <option value="all">All programmes</option>
            {programmes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}

        <input
          type="search"
          aria-label="Search"
          placeholder="Search name, email, phone or code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-72 max-w-full rounded-[2px] border border-border-primary bg-transparent px-3 text-sm"
        />

        {/* Plain anchor: the CSV comes straight from the API with the session cookie. */}
        <a href={consultantsCsvUrl()} className={`ml-auto ${buttonClass}`}>
          Export all as CSV
        </a>
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
          rowHref={(c) => `/admin/forms/travel-consultant/${c.id}`}
          emptyMessage="No registrations match."
        />
      )}
    </div>
  );
}
