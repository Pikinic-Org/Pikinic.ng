import { apiFetch } from "@/lib/admin/api/client";
import type { FlightDeal } from "@/lib/admin/types";

export function listFlightDeals() {
  return apiFetch<FlightDeal[]>("/api/admin/deals");
}

export function getFlightDeal(id: string) {
  return apiFetch<FlightDeal>(`/api/admin/deals/${encodeURIComponent(id)}`);
}

export function createFlightDeal(data: Omit<FlightDeal, "id">) {
  return apiFetch<FlightDeal>("/api/admin/deals", { method: "POST", body: JSON.stringify(data) });
}

export function updateFlightDeal(id: string, data: Partial<Omit<FlightDeal, "id">>) {
  return apiFetch<FlightDeal>(`/api/admin/deals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteFlightDeal(id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/deals/${encodeURIComponent(id)}`, { method: "DELETE" });
}
