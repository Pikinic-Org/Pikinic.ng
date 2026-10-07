import { apiFetch } from "@/lib/admin/api/client";
import type { Job } from "@/lib/admin/types";

export function listJobs() {
  return apiFetch<Job[]>("/api/admin/jobs");
}

export function getJob(slug: string) {
  return apiFetch<Job>(`/api/admin/jobs/${encodeURIComponent(slug)}`);
}

export function createJob(data: Job) {
  return apiFetch<Job>("/api/admin/jobs", { method: "POST", body: JSON.stringify(data) });
}

export function updateJob(slug: string, data: Partial<Job>) {
  return apiFetch<Job>(`/api/admin/jobs/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteJob(slug: string) {
  return apiFetch<{ ok: true }>(`/api/admin/jobs/${encodeURIComponent(slug)}`, { method: "DELETE" });
}
