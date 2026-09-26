import { createGuideToken, verifyGuideToken } from "@/lib/guide-token";
import { getGuideDownloadUrl, isGuideAvailable } from "@/lib/cloudinary";
import { createCrmLead, subscribeCampaignsContact } from "@/lib/zoho-crm";
import { guideLeadsRepository } from "@/server/modules/guide-leads/guide-leads.repository";
import { HttpError } from "@/server/modules/shared/errors";
import type { GuideProfileInput, RequestGuideInput } from "@/server/modules/guide-leads/guide-leads.schema";

const LEAD_SOURCE = "Study Abroad Review";

function describe(input: RequestGuideInput) {
  return [
    `Asked for a free study abroad review (source: ${input.source}).`,
    `Stage: ${input.stage}`,
    "Optional profile (qualification, field, country, intake, funding) is on the admin dashboard if they filled it in.",
  ].join("\n");
}

/**
 * Saves the lead and pushes it to Zoho. Returns a token the page uses to save
 * the optional second step, and a signed guide link only when the WAEC guide
 * bonus is set up. The database write is the one step that must succeed; Zoho
 * is best-effort so an outage there never loses a sign-up.
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
      source: `Study Abroad Review (${lead.source})`,
    });
  }

  const token = createGuideToken(lead.id);
  return {
    token,
    downloadPath: isGuideAvailable() ? `/api/waec-guide/download?t=${encodeURIComponent(token)}` : null,
  };
}

/** Saves the optional second step against the lead the token was issued for. */
export async function saveGuideProfile(input: GuideProfileInput) {
  const leadId = verifyGuideToken(input.token);
  if (!leadId) throw new HttpError("This link has expired. Please fill in the form again.", 410);

  const { token, ...profile } = input;
  void token;
  await guideLeadsRepository.updateProfile(leadId, profile);
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
