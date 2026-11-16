// Unit tests for the rules that decide whether a gateway's "paid" really pays for a booking.
// Run with: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bachsCheckoutMismatch,
  isMonnifyPaid,
  monnifyPaymentMismatch,
} from "@/server/modules/bookings/payment-checks";

const booking = { id: "booking_123", customerPrice: 147586 };

describe("isMonnifyPaid", () => {
  it("counts PAID and OVERPAID as paid", () => {
    assert.equal(isMonnifyPaid("PAID"), true);
    assert.equal(isMonnifyPaid("OVERPAID"), true);
  });

  it("does not count partial, pending or expired payments", () => {
    for (const status of ["PARTIALLY_PAID", "PENDING", "EXPIRED", "FAILED", "ABANDONED", undefined]) {
      assert.equal(isMonnifyPaid(status), false, String(status));
    }
  });
});

describe("monnifyPaymentMismatch", () => {
  const paid = { paymentReference: "booking_123", currency: "NGN", amountPaid: 147586 };

  it("accepts the fare, or more, in naira for this booking", () => {
    assert.equal(monnifyPaymentMismatch(paid, booking), null);
    assert.equal(monnifyPaymentMismatch({ ...paid, amountPaid: 150000 }, booking), null);
  });

  it("refuses less than the fare", () => {
    assert.match(monnifyPaymentMismatch({ ...paid, amountPaid: 1000 }, booking) ?? "", /below the fare/);
  });

  it("refuses another booking's payment", () => {
    assert.match(monnifyPaymentMismatch({ ...paid, paymentReference: "other" }, booking) ?? "", /paymentReference/);
  });

  it("refuses another currency or a missing amount", () => {
    assert.match(monnifyPaymentMismatch({ ...paid, currency: "USD" }, booking) ?? "", /currency/);
    assert.match(monnifyPaymentMismatch({ ...paid, amountPaid: undefined }, booking) ?? "", /below the fare/);
  });
});

describe("bachsCheckoutMismatch", () => {
  const checkout = { reference: "booking_123", currency: "NGN", amount: "147586.00" };

  it("accepts the booking's own NGN checkout at the fare", () => {
    assert.equal(bachsCheckoutMismatch(checkout, booking), null);
    assert.equal(bachsCheckoutMismatch({ ...checkout, reference: null }, booking), null);
  });

  it("refuses a checkout below the fare", () => {
    assert.match(bachsCheckoutMismatch({ ...checkout, amount: "1000.00" }, booking) ?? "", /below the fare/);
  });

  it("refuses another booking's checkout or another currency", () => {
    assert.match(bachsCheckoutMismatch({ ...checkout, reference: "other" }, booking) ?? "", /reference/);
    assert.match(bachsCheckoutMismatch({ ...checkout, currency: "USD" }, booking) ?? "", /currency/);
  });
});
