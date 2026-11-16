// Unit tests for verifyBachsWebhookSignature. Signatures are made here with a made-up secret, the
// same way Bachs makes them, so no real secret is needed. Run with: pnpm test (or npm test).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "crypto";
import { WEBHOOK_TOLERANCE_SECONDS, verifyBachsWebhookSignature } from "@/server/modules/bachs/bachs.client";

const SECRET = "whsec_test_secret";
const NOW = 1_794_000_000;
const BODY = JSON.stringify({
  id: "evt_1",
  type: "collection.succeeded",
  created_at: "2026-11-09T10:00:00.000Z",
  data: { reference: "booking_123", status: "SUCCEEDED" },
});

const sign = (body: string, timestamp: number, secret = SECRET) =>
  createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

const header = (timestamp: number, ...signatures: string[]) =>
  [`t=${timestamp}`, ...signatures.map((signature) => `v1=${signature}`)].join(",");

describe("verifyBachsWebhookSignature", () => {
  it("accepts a delivery signed with the secret", () => {
    assert.equal(verifyBachsWebhookSignature(BODY, header(NOW, sign(BODY, NOW)), SECRET, NOW), true);
  });

  it("accepts it when any of several v1 signatures matches (secret rotation)", () => {
    const value = header(NOW, sign(BODY, NOW, "whsec_old"), sign(BODY, NOW));
    assert.equal(verifyBachsWebhookSignature(BODY, value, SECRET, NOW), true);
  });

  it("tolerates spaces after the commas", () => {
    assert.equal(verifyBachsWebhookSignature(BODY, `t=${NOW}, v1=${sign(BODY, NOW)}`, SECRET, NOW), true);
  });

  it("rejects a body changed after signing", () => {
    const tampered = BODY.replace("booking_123", "booking_999");
    assert.equal(verifyBachsWebhookSignature(tampered, header(NOW, sign(BODY, NOW)), SECRET, NOW), false);
  });

  it("rejects a re-serialised body, even with the same content", () => {
    const reserialised = JSON.stringify(JSON.parse(BODY), null, 2);
    assert.equal(verifyBachsWebhookSignature(reserialised, header(NOW, sign(BODY, NOW)), SECRET, NOW), false);
  });

  it("rejects a signature made with another secret", () => {
    assert.equal(verifyBachsWebhookSignature(BODY, header(NOW, sign(BODY, NOW, "whsec_other")), SECRET, NOW), false);
  });

  it("rejects a valid signature moved to a different timestamp", () => {
    assert.equal(verifyBachsWebhookSignature(BODY, header(NOW + 1, sign(BODY, NOW)), SECRET, NOW), false);
  });

  it("accepts a delivery right at the tolerance, and rejects one just past it", () => {
    const edge = NOW - WEBHOOK_TOLERANCE_SECONDS;
    assert.equal(verifyBachsWebhookSignature(BODY, header(edge, sign(BODY, edge)), SECRET, NOW), true);
    const old = edge - 1;
    assert.equal(verifyBachsWebhookSignature(BODY, header(old, sign(BODY, old)), SECRET, NOW), false);
  });

  it("rejects a timestamp too far in the future", () => {
    const future = NOW + WEBHOOK_TOLERANCE_SECONDS + 1;
    assert.equal(verifyBachsWebhookSignature(BODY, header(future, sign(BODY, future)), SECRET, NOW), false);
  });

  it("rejects missing or malformed headers without throwing", () => {
    const good = sign(BODY, NOW);
    for (const value of [
      null,
      "",
      good, // the old X-Bachs-Signature format, with no t= or v1=
      `v1=${good}`, // no timestamp
      `t=${NOW}`, // no signature
      `t=abc,v1=${good}`, // timestamp not a number
      `t=${NOW},v1=${good.slice(0, 10)}`, // signature too short
      `t=${NOW},v1=${"z".repeat(64)}`, // not hex
    ]) {
      assert.equal(verifyBachsWebhookSignature(BODY, value, SECRET, NOW), false, `header: ${value}`);
    }
  });

  it("rejects everything when the secret is empty", () => {
    assert.equal(verifyBachsWebhookSignature(BODY, header(NOW, sign(BODY, NOW, "")), "", NOW), false);
  });
});
