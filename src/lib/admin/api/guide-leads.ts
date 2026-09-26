import { apiFetch } from "@/lib/admin/api/client";

export type GuideLeadRow = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  stage: string;
  source: string;
  downloadCount: number;
  lastDownloadAt: string | null;
  createdAt: string;
};

export const listGuideLeads = () => apiFetch<GuideLeadRow[]>("/api/admin/guide-leads");

export const guideLeadsCsvUrl = (before?: string) =>
  `/api/admin/guide-leads?format=csv${before ? `&before=${encodeURIComponent(before)}` : ""}`;

export const deleteGuideLead = (id: string) =>
  apiFetch<{ ok: true }>(`/api/admin/guide-leads/${encodeURIComponent(id)}`, { method: "DELETE" });

export const purgeGuideLeads = (before: string) =>
  apiFetch<{ deleted: number }>(`/api/admin/guide-leads?before=${encodeURIComponent(before)}`, { method: "DELETE" });
