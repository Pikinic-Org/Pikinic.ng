import { createGuideToken, verifyGuideToken } from "@/lib/guide-token";
import { getGuideDownloadUrl } from "@/lib/cloudinary";
import { createCrmLead, subscribeCampaignsContact } from "@/lib/zoho-crm";
import { guideLeadsRepository } from "@/server/modules/guide-leads/guide-leads.repository";
import type { RequestGuideInput } from "@/server/modules/guide-leads/guide-leads.schema";

const LEAD_SOURCE = "WAEC Guide";

function describe(input: RequestGuideInput) {
  return [
    `Requested the free WAEC guide (source: ${input.source}).`,
    `Stage: ${input.stage}`,
    "Country, course and intake not asked yet: collect on the WhatsApp follow-up.",
  ].join("\n");
}

/**
 * Saves the lead, pushes it to Zoho, and returns a signed link to the guide.
 * The database write is the one step that must succeed; Zoho is best-effort so
 * an outage there never leaves someone at the venue without their guide.
 */
export async function requestGuide(input: RequestGuideInput) {
  const lead = await guideLeadsRepository.upsertByEmail(input);

  // Only create the CRM lead the first time we see this email.
  if (!lead.zohoLeadId) {
    const zohoLeadId = await createCrmLead({
      name: input.name,
      email: input.email,
      phone: input.whatsapp,
      leadSource: LEAD_SOURCE,
      description: describe(input),
    });
    if (zohoLeadId) await guideLeadsRepository.setZohoLeadId(lead.id, zohoLeadId);
  }

  const listKey = process.env.ZOHO_CAMPAIGNS_LIST_KEY_WAEC_GUIDE;
  if (listKey) {
    await subscribeCampaignsContact({
      listKey,
      name: input.name,
      email: input.email,
      source: `WAEC Guide (${lead.source})`,
    });
  }

  return { downloadPath: `/api/waec-guide/download?t=${encodeURIComponent(createGuideToken(lead.id))}` };
}

/**
 * Verifies a download token, counts the download, and returns a short-lived
 * Cloudinary link. Returns null for a bad, expired, or orphaned token.
 */
export async function resolveGuideDownload(token: string): Promise<string | null> {
  const leadId = verifyGuideToken(token);
  if (!leadId) return null;

  const lead = await guideLeadsRepository.findById(leadId);
  if (!lead) return null;

  await guideLeadsRepository.recordDownload(lead.id);
  return getGuideDownloadUrl();
}

export const listGuideLeads = (before?: Date) => guideLeadsRepository.list(before);

export const deleteGuideLead = (id: string) => guideLeadsRepository.deleteById(id);

/** Permanently deletes every lead requested before `before`. Returns how many were removed. */
export const purgeGuideLeadsBefore = (before: Date) => guideLeadsRepository.deleteBefore(before);
