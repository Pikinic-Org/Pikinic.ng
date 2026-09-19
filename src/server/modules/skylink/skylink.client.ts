import { requireEnv } from "@/lib/env";
import { prismaBookings } from "@/lib/db-bookings";

const SESSION_ID = "singleton";
const EXPIRY_BUFFER_MS = 60_000;

type SkylinkLoginData = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

const login = async (): Promise<SkylinkLoginData> => {
  const [email, password, baseUrl] = requireEnv("SKYLINK_EMAIL", "SKYLINK_PASSWORD", "SKYLINK_BASE_URL");

  const response = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, remember_me: false }),
  });

  const body = await response.json();

  if (!response.ok || body.status !== "success") {
    throw new Error(body.message ?? "Failed to log in to SkyLink API");
  }

  return body.data as SkylinkLoginData;
}

export const getAccessToken = async (): Promise<string> => {
  const session = await prismaBookings.skylinkSession.findUnique({
    where: { id: SESSION_ID },
  });

  const isStillValid = session && session.expiresAt.getTime() - EXPIRY_BUFFER_MS > Date.now();
  if (isStillValid) {
    return session.accessToken;
  }

  const fresh = await login();
  const expiresAt = new Date(Date.now() + fresh.expires_in * 1000);

  const saved = await prismaBookings.skylinkSession.upsert({
    where: { id: SESSION_ID },
    create: {
      id: SESSION_ID,
      accessToken: fresh.access_token,
      refreshToken: fresh.refresh_token,
      expiresAt,
    },
    update: {
      accessToken: fresh.access_token,
      refreshToken: fresh.refresh_token,
      expiresAt,
    },
  });

  return saved.accessToken;
}