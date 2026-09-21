"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FlightDealForm } from "@/components/admin/forms/flight-deal-form";
import { getFlightDeal } from "@/lib/admin/api/deals";
import { ApiError } from "@/lib/admin/api/client";
import type { FlightDeal } from "@/lib/admin/types";

export default function EditFlightDealPage() {
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<FlightDeal | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getFlightDeal(id)
      .then(setDeal)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) setNotFound(true);
      });
  }, [id]);

  if (notFound) {
    return (
      <div>
        <AdminPageHeader title="Flight Deal Not Found" />
        <p className="text-sm text-text-secondary">No flight deal matches that id.</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div>
        <AdminPageHeader title="Loading…" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title={`Edit: ${deal.fromCode} → ${deal.toCode}`} />
      <FlightDealForm initialDeal={deal} />
    </div>
  );
}
