import { NextResponse } from "next/server";
import { getZohoCampaignsAccessToken } from "@/lib/zoho";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  if (isRateLimited(`newsletter:${getClientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let body: { email?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email } = body;
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const listKey = process.env.ZOHO_CAMPAIGNS_LIST_KEY_NEWSLETTER;
  if (!listKey) {
    console.error("ZOHO_CAMPAIGNS_LIST_KEY_NEWSLETTER is not configured.");
    return NextResponse.json(
      { error: "Newsletter signup isn't configured yet." },
      { status: 500 }
    );
  }

  try {
    const accessToken = await getZohoCampaignsAccessToken();
    const apiDomain = process.env.ZOHO_CAMPAIGNS_API_DOMAIN || "https://campaigns.zoho.com";

    const url = new URL(`${apiDomain}/api/v1.1/json/listsubscribe`);
    url.searchParams.set("resfmt", "JSON");
    url.searchParams.set("listkey", listKey);
    url.searchParams.set("contactinfo", JSON.stringify({ "Contact Email": email }));

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });

    const data = await res.json();
    if (!res.ok || data?.status !== "success") {
      console.error("Zoho Campaigns subscribe failed:", data);
      return NextResponse.json(
        { error: "Could not subscribe. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "Could not subscribe. Please try again." },
      { status: 500 }
    );
  }
}
