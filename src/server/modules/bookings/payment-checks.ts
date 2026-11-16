// Pure checks on what a gateway says was paid, kept free of database code so they can be unit
// tested (tests/bookings/payment-checks.test.ts). confirmPaymentAndReserve uses them.

type BookingForCheck = { id: string; customerPrice: number };

// Monnify's paymentStatus. OVERPAID is a bank transfer that sent a little more than asked: still
// paid in full. PARTIALLY_PAID, PENDING, EXPIRED and the rest mean not paid (yet).
export const isMonnifyPaid = (paymentStatus: unknown) => paymentStatus === "PAID" || paymentStatus === "OVERPAID";

// Why a Monnify transaction that says it is paid does not pay for this booking, or null when it
// does: it must carry this booking's id as paymentReference, be in naira, and cover the fare.
export const monnifyPaymentMismatch = (
  payment: { paymentReference?: unknown; currency?: unknown; amountPaid?: unknown },
  booking: BookingForCheck
): string | null => {
  if (payment.paymentReference !== booking.id) return `paymentReference ${String(payment.paymentReference)}`;
  if (payment.currency !== "NGN") return `currency ${String(payment.currency)}`;
  const amountPaid = Number(payment.amountPaid);
  if (!Number.isFinite(amountPaid) || amountPaid < booking.customerPrice) {
    return `amountPaid ${String(payment.amountPaid)} below the fare ${booking.customerPrice}`;
  }
  return null;
};

// The same for a paid Bachs checkout. The checkout stays in NGN at our price even when a foreign
// card pays in USD, so the checkout's amount is compared (the charge's amount may be in dollars).
export const bachsCheckoutMismatch = (
  checkout: { reference?: string | null; currency: string; amount: string },
  booking: BookingForCheck
): string | null => {
  if (checkout.reference && checkout.reference !== booking.id) return `reference ${checkout.reference}`;
  if (checkout.currency !== "NGN") return `currency ${checkout.currency}`;
  const amount = Number(checkout.amount);
  if (!Number.isFinite(amount) || amount < booking.customerPrice) {
    return `amount ${checkout.amount} below the fare ${booking.customerPrice}`;
  }
  return null;
};
