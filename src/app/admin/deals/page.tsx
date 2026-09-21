"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { SavedBanner } from "@/components/admin/saved-banner";
import { Button } from "@/components/ui/button";
import { listFlightDeals, deleteFlightDeal } from "@/lib/admin/api/deals";
import type { FlightDeal } from "@/lib/admin/types";

export default function DealsListPage() {
  const [deals, setDeals] = useState<FlightDeal[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listFlightDeals()
      .then(setDeals)
      .catch(() => setError("Could not load flight deals."));
  }, []);

  async function handleDelete(id: string) {
    await deleteFlightDeal(id);
    setDeals((prev) => (prev ?? []).filter((deal) => deal.id !== id));
  }

  const columns: AdminTableColumn<FlightDeal>[] = [
    {
      key: "route",
      header: "Route",
      cell: (deal) => `${deal.fromCode} → ${deal.toCode}`,
    },
    { key: "tripType", header: "Trip Type", cell: (deal) => (deal.tripType === "oneway" ? "One way" : "Round trip") },
    { key: "discount", header: "Discount", cell: (deal) => `${deal.discountPercent}%` },
    { key: "label", header: "Label", cell: (deal) => deal.label ?? "—" },
    {
      key: "status",
      header: "Status",
      cell: (deal) => (
        <span
          className={`inline-block rounded-[2px] px-2.5 py-1 text-xs font-semibold uppercase tracking-widest ${
            deal.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-700"
          }`}
        >
          {deal.active ? "Active" : "Disabled"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "px-4 py-3 text-right",
      cell: (deal) => (
        <div className="flex items-center justify-end">
          <ConfirmDeleteButton onConfirm={() => handleDelete(deal.id)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Flight Deals"
        description="Discount percentages applied on top of live fares for specific routes."
        action={
          <Button href="/admin/deals/new" size="md">
            New Deal
          </Button>
        }
      />

      <SavedBanner createdMessage="Flight deal added." updatedMessage="Flight deal updated." />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {deals === null ? (
        <div className="rounded-[2px] border border-border-primary p-12 text-center text-sm text-text-tertiary">
          Loading…
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={deals}
          rowKey={(deal) => deal.id}
          rowHref={(deal) => `/admin/deals/${deal.id}`}
          emptyMessage="No flight deals yet."
        />
      )}
    </div>
  );
}
