import { apiFetch } from "@/lib/admin/api/client";
import type { ConsultantReviewStatus, TravelConsultant } from "@/lib/admin/types";

export function listConsultants() {
  return apiFetch<TravelConsultant[]>("/api/admin/consultants");
}

export function getConsultant(id: string) {
  return apiFetch<TravelConsultant>(`/api/admin/consultants/${encodeURIComponent(id)}`);
}

export function updateConsultant(
  id: string,
  data: { reviewStatus?: ConsultantReviewStatus; adminNotes?: string }
) {
  return apiFetch<TravelConsultant>(`/api/admin/consultants/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteConsultant(id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/consultants/${encodeURIComponent(id)}`, { method: "DELETE" });
}
