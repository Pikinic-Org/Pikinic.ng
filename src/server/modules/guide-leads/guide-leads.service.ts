import { after } from "next/server";
import { createGuideToken, verifyGuideToken } from "@/lib/guide-token";
import { getGuideDownloadUrl, isGuideAvailable, type GuideFile } from "@/lib/cloudinary";
import { createCrmLead, subscribeCampaignsContact } from "@/lib/zoho-crm";
import { guideLeadsRepository } from "@/server/modules/guide-leads/guide-leads.repository";
import { HttpError } from "@/server/modules/shared/errors";
import type { GuideProfileInput, RequestGuideInput } from "@/server/modules/guide-leads/guide-leads.schema";

const LEAD_SOURCE = "Study Abroad Review";

const BROCHURE_SOURCE = "waec-brochure";

function describe(input: RequestGuideInput) {
  return [
    input.source === BROCHURE_SOURCE
      ? "Asked for the PiKiNiC WAEC brochure (UK universities that accept WAEC)."
      : `Asked for a free study abroad review (source: ${input.source}).`,
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

  // Zoho runs after the response is sent. With a room of 1,500 people scanning
  // at once, making each phone wait on Zoho would slow every sign-up, and
  // Zoho's own rate limits would fail some of them. The lead is already saved.
  after(async () => {
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
  });

  const token = createGuideToken(lead.id);
  const link = (file: GuideFile) =>
    isGuideAvailable(file) ? `/api/waec-guide/download?t=${encodeURIComponent(token)}&file=${file}` : null;
  return {
    token,
    downloadPath: link("guide"),
    brochurePath: link("brochure"),
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
export async function resolveGuideDownload(token: string, file: GuideFile = "guide"): Promise<string | null> {
  const leadId = verifyGuideToken(token);
  if (!leadId) return null;

  const lead = await guideLeadsRepository.findById(leadId);
  if (!lead) return null;

  await guideLeadsRepository.recordDownload(lead.id);
  return getGuideDownloadUrl(file);
}

export const listGuideLeads = (before?: Date) => guideLeadsRepository.list(before);

export const deleteGuideLead = (id: string) => guideLeadsRepository.deleteById(id);

/** Permanently deletes every lead requested before `before`. Returns how many were removed. */
export const purgeGuideLeadsBefore = (before: Date) => guideLeadsRepository.deleteBefore(before);
