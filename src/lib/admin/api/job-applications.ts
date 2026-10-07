import { apiFetch } from "@/lib/admin/api/client";
import type { JobApplication, JobApplicationStatus } from "@/lib/admin/types";

export function listJobApplications() {
  return apiFetch<JobApplication[]>("/api/admin/job-applications");
}

export const jobApplicationsCsvUrl = () => "/api/admin/job-applications?format=csv";

// Opened as a plain link: the session cookie goes with it, and the file never has a public URL.
export const jobApplicationCvUrl = (id: string) => `/api/admin/job-applications/${encodeURIComponent(id)}/cv`;

export function getJobApplication(id: string) {
  return apiFetch<JobApplication>(`/api/admin/job-applications/${encodeURIComponent(id)}`);
}

export function updateJobApplication(id: string, data: { status?: JobApplicationStatus; adminNotes?: string }) {
  return apiFetch<JobApplication>(`/api/admin/job-applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteJobApplication(id: string) {
  return apiFetch<{ ok: true }>(`/api/admin/job-applications/${encodeURIComponent(id)}`, { method: "DELETE" });
}
