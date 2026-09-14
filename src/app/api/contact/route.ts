import { NextResponse } from "next/server";
import { getZohoCampaignsAccessToken, getZohoCrmAccessToken } from "@/lib/zoho";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";

const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  if (isRateLimited(`contact:${getClientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let body: {
    name?: string;
    email?: string;
    whatsapp?: string;
    service?: string;
    message?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, whatsapp, service, message } = body;
  if (!name || !email || !whatsapp || !service || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!PHONE_PATTERN.test(whatsapp) || whatsapp.replace(/\D/g, "").length < 7) {
    return NextResponse.json(
      { error: "Enter a valid WhatsApp number." },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getZohoCrmAccessToken();
    const apiDomain = process.env.ZOHO_CRM_API_DOMAIN || "https://www.zohoapis.com";

    const [firstName, ...rest] = name.trim().split(/\s+/);
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
            Email: email,
            Phone: whatsapp,
            Lead_Source: "Website Contact Form",
            Description: `Service interest: ${service}\n\n${message}`,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok || data?.data?.[0]?.status !== "success") {
      console.error("Zoho CRM lead creation failed:", data);
      return NextResponse.json(
        { error: "Could not submit your message. Please try again." },
        { status: 502 }
      );
    }

    // Best-effort: also add them to the Campaigns "contact form" list so
    // they're reachable for email marketing later. The Lead already exists
    // in CRM at this point, so a failure here shouldn't fail the user's
    // submission — just log it.
    const listKey = process.env.ZOHO_CAMPAIGNS_LIST_KEY_CONTACT;
    if (listKey) {
      try {
        const campaignsToken = await getZohoCampaignsAccessToken();
        const campaignsDomain =
          process.env.ZOHO_CAMPAIGNS_API_DOMAIN || "https://campaigns.zoho.com";
        const contactInfo = JSON.stringify({
          "First Name": firstName,
          "Last Name": lastName,
          "Contact Email": email,
        });

        const subscribeUrl = new URL(`${campaignsDomain}/api/v1.1/json/listsubscribe`);
        subscribeUrl.searchParams.set("resfmt", "JSON");
        subscribeUrl.searchParams.set("listkey", listKey);
        subscribeUrl.searchParams.set("contactinfo", contactInfo);
        subscribeUrl.searchParams.set("source", "Website Contact Form");

        const campaignsRes = await fetch(subscribeUrl.toString(), {
          method: "POST",
          headers: { Authorization: `Zoho-oauthtoken ${campaignsToken}` },
        });
        const campaignsData = await campaignsRes.json();
        if (campaignsData?.status !== "success") {
          console.error("Zoho Campaigns contact-list add failed:", campaignsData);
        }
      } catch (campaignsError) {
        console.error("Zoho Campaigns contact-list add error:", campaignsError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      { error: "Could not submit your message. Please try again." },
      { status: 500 }
    );
  }
}
