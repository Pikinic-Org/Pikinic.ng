// Unit tests for the Bachs module. fetch is replaced with a fake, so these never call Bachs and
// need no real keys. Run with: pnpm test (or npm test).
import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { BachsError } from "@/server/modules/bachs/bachs.client";
import { createCheckout, createRefund, getCheckout, isCheckoutPaid } from "@/server/modules/bachs/bachs.service";

type Call = { url: string; init: RequestInit };

const realFetch = globalThis.fetch;
let calls: Call[] = [];

// Every fetch returns this status and body until a test sets another.
const respondWith = (status: number, body: unknown) => {
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
};

const sentBody = (call: Call) => JSON.parse(String(call.init.body));
const sentHeaders = (call: Call) => call.init.headers as Record<string, string>;

const checkoutInput = {
  amount: 250000,
  customerName: "Ada Obi",
  customerEmail: "ada@example.com",
  reference: "booking_123",
  successUrl: "https://travelsandtours.pikinic.ng/flights/checkout/callback?bookingId=booking_123",
  cancelUrl: "https://travelsandtours.pikinic.ng/flights/checkout",
};

beforeEach(() => {
  calls = [];
  process.env.BACHS_BASE_URL = "https://sandbox-api.bachs.io";
  process.env.BACHS_SECRET_KEY = "sk_sandbox_test";
  process.env.BACHS_FLIGHT_PRODUCT_ID = "prod_flight";
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("createCheckout", () => {
  it("creates one checkout for the booking's fare in naira", async () => {
    respondWith(201, {
      checkout_id: "chk_1",
      checkout_url: "https://sandbox-checkout.bachs.io/chk_1",
      status: "open",
      expires_at: "2026-11-06T14:00:00Z",
      reference: "booking_123",
      some_new_field: "ignored",
    });

    const result = await createCheckout(checkoutInput);

    assert.equal(calls.length, 1);
    const [call] = calls;
    assert.equal(call.url, "https://sandbox-api.bachs.io/v1/checkout-sessions");
    assert.equal(call.init.method, "POST");
    assert.equal(sentHeaders(call).Authorization, "Bearer sk_sandbox_test");
    assert.equal(sentHeaders(call)["Idempotency-Key"], "checkout-booking_123");

    assert.deepEqual(sentBody(call), {
      product_cart: [{ product_id: "prod_flight", quantity: 1, pricing: { price_type: "fixed", amount: "250000.00" } }],
      billing_currency: "NGN",
      payment_method_types: ["NGN_CARD", "NGN_BANK_TRANSFER", "USD_CARD"],
      customer: { email: "ada@example.com", name: "Ada Obi" },
      reference: "booking_123",
      metadata: { booking_id: "booking_123" },
      success_url: checkoutInput.successUrl,
      cancel_url: checkoutInput.cancelUrl,
      expires_in_minutes: 60,
    });

    assert.equal(result.checkout_id, "chk_1");
    assert.equal(result.checkout_url, "https://sandbox-checkout.bachs.io/chk_1");
  });

  it("refuses bad input before calling Bachs", async () => {
    respondWith(201, {});

    await assert.rejects(createCheckout({ ...checkoutInput, amount: 2500.5 }));
    await assert.rejects(createCheckout({ ...checkoutInput, amount: 0 }));
    await assert.rejects(createCheckout({ ...checkoutInput, customerEmail: "not-an-email" }));
    await assert.rejects(createCheckout({ ...checkoutInput, successUrl: "not a url" }));

    assert.equal(calls.length, 0);
  });

  it("fails clearly when a Bachs setting is missing", async () => {
    delete process.env.BACHS_FLIGHT_PRODUCT_ID;
    respondWith(201, {});

    await assert.rejects(createCheckout(checkoutInput), /Missing environment variables: BACHS_FLIGHT_PRODUCT_ID/);
    assert.equal(calls.length, 0);
  });

  it("turns a Bachs error into a BachsError with the status, message and code", async () => {
    // The shape the sandbox actually returned for a refund with no available balance.
    respondWith(400, { detail: "Insufficient balance to refund", error_code: "INSUFFICIENT_BALANCE" });

    await assert.rejects(createCheckout(checkoutInput), (error: unknown) => {
      assert.ok(error instanceof BachsError);
      assert.equal(error.status, 400);
      assert.equal(error.message, "Insufficient balance to refund");
      assert.equal(error.code, "INSUFFICIENT_BALANCE");
      return true;
    });
  });

  it("still reports an error whose body isn't JSON", async () => {
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response("<html>Bad gateway</html>", { status: 502 });
    }) as typeof fetch;

    await assert.rejects(createCheckout(checkoutInput), (error: unknown) => {
      assert.ok(error instanceof BachsError);
      assert.equal(error.status, 502);
      assert.equal(error.message, "Bachs request failed with status 502");
      assert.equal(error.code, null);
      return true;
    });
  });

  it("rejects a success response missing the checkout URL", async () => {
    respondWith(201, { checkout_id: "chk_1", status: "open", expires_at: "2026-11-06T14:00:00Z" });

    await assert.rejects(createCheckout(checkoutInput));
  });
});

describe("getCheckout", () => {
  it("fetches the checkout by id and reads the charge", async () => {
    respondWith(200, {
      checkout_id: "chk/1",
      status: "completed",
      payment_status: "succeeded",
      reference: "booking_123",
      amount: "250000.00",
      currency: "NGN",
      charge: { payment_id: "pay_1", status: "succeeded", amount: "250000.00", currency: "NGN" },
    });

    const checkout = await getCheckout("chk/1");

    assert.equal(calls[0].url, "https://sandbox-api.bachs.io/v1/checkout-sessions/chk%2F1");
    assert.equal(calls[0].init.method, "GET");
    assert.equal(calls[0].init.body, undefined);
    assert.equal(checkout.charge?.payment_id, "pay_1");
    assert.equal(isCheckoutPaid(checkout), true);
  });

  it("accepts a checkout nobody has paid yet (no charge)", async () => {
    respondWith(200, { checkout_id: "chk_1", status: "open", amount: "250000.00", currency: "NGN", charge: null });

    const checkout = await getCheckout("chk_1");
    assert.equal(isCheckoutPaid(checkout), false);
  });
});

describe("isCheckoutPaid", () => {
  it("counts succeeded and accepted charges as paid, and nothing else", () => {
    assert.equal(isCheckoutPaid({ charge: { status: "succeeded" } }), true);
    assert.equal(isCheckoutPaid({ charge: { status: "accepted" } }), true);

    for (const status of ["open", "created", "processing", "failed", "expired", "cancelled", "underpaid", "SUCCEEDED"]) {
      assert.equal(isCheckoutPaid({ charge: { status } }), false, status);
    }
    assert.equal(isCheckoutPaid({ charge: null }), false);
    assert.equal(isCheckoutPaid({}), false);
  });
});

describe("createRefund", () => {
  it("refunds the whole charge once, keyed by the booking", async () => {
    respondWith(201, { refund_id: "ref_1", charge_id: "pay_1", reference: "booking_123", status: "processing" });

    const refund = await createRefund({
      chargeId: "pay_1",
      reference: "booking_123",
      reason: "SkyLink reservation failed after payment",
    });

    const [call] = calls;
    assert.equal(call.url, "https://sandbox-api.bachs.io/v1/refunds");
    assert.equal(sentHeaders(call)["Idempotency-Key"], "refund-booking_123");
    assert.deepEqual(sentBody(call), {
      charge_id: "pay_1",
      reference: "booking_123",
      reason: "SkyLink reservation failed after payment",
    });
    assert.equal(refund.status, "processing");
  });

  it("refuses a refund with no charge id", async () => {
    respondWith(201, {});
    await assert.rejects(createRefund({ chargeId: "", reference: "booking_123", reason: "x" }));
    assert.equal(calls.length, 0);
  });
});
