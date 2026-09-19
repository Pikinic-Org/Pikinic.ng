import { createHmac, timingSafeEqual } from "crypto";
import { requireEnv } from "@/lib/env";
import { prismaBookings } from "@/lib/db-bookings";

const SESSION_ID = "singleton";
const EXPIRY_BUFFER_MS = 60_000;

type MonnifyLoginData = {
  accessToken: string;
  expiresIn: number;
};

const login = async (): Promise<MonnifyLoginData> => {
  const [apiKey, secretKey, baseUrl] = requireEnv("MONNIFY_API_KEY", "MONNIFY_SECRET_KEY", "MONNIFY_BASE_URL");
  const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  const body = await response.json();

  if (!response.ok || !body.requestSuccessful) {
    throw new Error(body.responseMessage ?? "Failed to log in to Monnify API");
  }

  return body.responseBody as MonnifyLoginData;
};

export const getMonnifyAccessToken = async (): Promise<string> => {
  const session = await prismaBookings.monnifySession.findUnique({
    where: { id: SESSION_ID },
  });

  const isStillValid = session && session.expiresAt.getTime() - EXPIRY_BUFFER_MS > Date.now();
  if (isStillValid) {
    return session.accessToken;
  }

  const fresh = await login();
  const expiresAt = new Date(Date.now() + fresh.expiresIn * 1000);

  const saved = await prismaBookings.monnifySession.upsert({
    where: { id: SESSION_ID },
    create: {
      id: SESSION_ID,
      accessToken: fresh.accessToken,
      expiresAt,
    },
    update: {
      accessToken: fresh.accessToken,
      expiresAt,
    },
  });

  return saved.accessToken;
};

export const verifyMonnifyWebhookSignature = (rawBody: string, signatureHeader: string | null): boolean => {
  if (!signatureHeader) return false;

  const [secretKey] = requireEnv("MONNIFY_SECRET_KEY");
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signatureHeader, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
};
