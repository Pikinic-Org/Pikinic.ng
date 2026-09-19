import { requireEnv } from "@/lib/env";
import { getMonnifyAccessToken } from "@/server/modules/monnify/monnify.client";
import { initiatePaymentInputSchema } from "@/server/modules/monnify/monnify.schema";

const PAYMENT_METHODS = ["CARD", "ACCOUNT_TRANSFER", "USSD"];

export const initiatePayment = async (input: unknown) => {
  const data = initiatePaymentInputSchema.parse(input);

  const [baseUrl, contractCode] = requireEnv("MONNIFY_BASE_URL", "MONNIFY_CONTRACT_CODE");
  const token = await getMonnifyAccessToken();

  const response = await fetch(`${baseUrl}/api/v1/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...data,
      contractCode,
      paymentMethods: PAYMENT_METHODS,
    }),
  });

  const body = await response.json();

  if (!response.ok || !body.requestSuccessful) {
    throw new Error(body.responseMessage ?? "Monnify payment initiation failed");
  }

  return body.responseBody;
};

export const getTransactionStatus = async (transactionReference: string) => {
  const [baseUrl] = requireEnv("MONNIFY_BASE_URL");
  const token = await getMonnifyAccessToken();

  const response = await fetch(`${baseUrl}/api/v2/transactions/${encodeURIComponent(transactionReference)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await response.json();

  if (!response.ok || !body.requestSuccessful) {
    throw new Error(body.responseMessage ?? "Could not fetch Monnify transaction status");
  }

  return body.responseBody;
};
