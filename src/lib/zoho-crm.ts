import { getZohoCampaignsAccessToken, getZohoCrmAccessToken } from "@/lib/zoho";

// Both helpers are best-effort by design: they log and return null/false
// rather than throw, so a Zoho outage never blocks a lead from getting the
// guide. The lead is already safe in our own database by then.

export async function createCrmLead(input: {
  name: string;
  email: string;
  phone: string;
  leadSource: string;
  description: string;
}): Promise<string | null> {
  try {
    const accessToken = await getZohoCrmAccessToken();
    const apiDomain = process.env.ZOHO_CRM_API_DOMAIN || "https://www.zohoapis.com";

    const [firstName, ...rest] = input.name.trim().split(/\s+/);
    const lastName = rest.length ? rest.join(" ") : firstName;

    const res = await fetch(`${apiDomain}/crm/v2/Leads`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [
          {
            First_Name: firstName,
            Last_Name: lastName,
            Email: input.email,
            Phone: input.phone,
            Lead_Source: input.leadSource,
            Description: input.description,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok || data?.data?.[0]?.status !== "success") {
      console.error("Zoho CRM lead creation failed:", data);
      return null;
    }
    return (data.data[0].details?.id as string | undefined) ?? null;
  } catch (error) {
    console.error("Zoho CRM lead creation error:", error);
    return null;
  }
}

export async function subscribeCampaignsContact(input: {
  listKey: string;
  name: string;
  email: string;
  source: string;
}): Promise<boolean> {
  try {
    const accessToken = await getZohoCampaignsAccessToken();
    const apiDomain = process.env.ZOHO_CAMPAIGNS_API_DOMAIN || "https://campaigns.zoho.com";

    const [firstName, ...rest] = input.name.trim().split(/\s+/);
    const lastName = rest.length ? rest.join(" ") : firstName;

    const url = new URL(`${apiDomain}/api/v1.1/json/listsubscribe`);
    url.searchParams.set("resfmt", "JSON");
    url.searchParams.set("listkey", input.listKey);
    url.searchParams.set(
      "contactinfo",
      JSON.stringify({ "First Name": firstName, "Last Name": lastName, "Contact Email": input.email })
    );
    url.searchParams.set("source", input.source);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });
    const data = await res.json();
    if (data?.status !== "success") {
      console.error("Zoho Campaigns subscribe failed:", data);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Zoho Campaigns subscribe error:", error);
    return false;
  }
}
