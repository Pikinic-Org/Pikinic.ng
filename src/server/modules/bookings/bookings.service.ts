import { prismaBookings } from "@/lib/db-bookings";
import { BachsError } from "@/server/modules/bachs/bachs.client";
import { createCheckout, createRefund, getCheckout, isCheckoutPaid } from "@/server/modules/bachs/bachs.service";
import { getTransactionStatus, initiatePayment, initiateRefund } from "@/server/modules/monnify/monnify.service";
import { priceFlight, reserveFlight } from "@/server/modules/skylink/skylink.service";
import { startCheckoutInputSchema } from "@/server/modules/bookings/bookings.schema";
import { bachsCheckoutMismatch, isMonnifyPaid, monnifyPaymentMismatch } from "@/server/modules/bookings/payment-checks";

type StoredPrimaryGuest = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country_code?: string;
};

// Admin list view — deliberately returns only contact + payment fields.
// Passport details live in `travellers` but never leave the server here.
export const listFlightBookings = async () => {
  const bookings = await prismaBookings.flightBooking.findMany({ orderBy: { createdAt: "desc" } });

  return bookings.map((booking) => {
    const guest = (booking.travellers as { primary_guest?: StoredPrimaryGuest } | null)?.primary_guest;
    const phone = [guest?.country_code, guest?.phone].filter(Boolean).join(" ");

    return {
      id: booking.id,
      status: booking.status,
      customerName: [guest?.first_name, guest?.last_name].filter(Boolean).join(" ") || "—",
      customerEmail: guest?.email ?? "—",
      customerPhone: phone || "—",
      tripType: booking.tripType,
      fromCode: booking.fromCode,
      toCode: booking.toCode,
      departureDate: booking.departureDate.toISOString(),
      returnDate: booking.returnDate?.toISOString() ?? null,
      amount: booking.customerPrice,
      currency: booking.currency,
      pnr: booking.pnr,
      refundStatus: booking.refundStatus,
      paymentProvider: booking.paymentProvider,
      createdAt: booking.createdAt.toISOString(),
    };
  });
};

// Removes only this row from the flight-booking database. It does not cancel
// a SkyLink reservation or refund a Bachs payment — it's for clearing
// test/junk records from the admin dashboard.
export const deleteFlightBooking = async (id: string) => {
  await prismaBookings.flightBooking.delete({ where: { id } });
};

export const startCheckout = async (input: unknown) => {
  const data = startCheckoutInputSchema.parse(input);

  // The fare is always charged in naira, with either gateway. With Bachs a foreign card switches
  // the checkout to USD and Bachs converts it, so other currencies are refused here (before any
  // booking row is written) rather than silently charged as if they were naira.
  if (data.currency !== "NGN") {
    throw new Error(`Bookings are charged in NGN; got ${data.currency}.`);
  }

  // data.verifiedPrice/customerPrice arrive from the client and are never
  // trusted for what actually gets charged or ticketed — a tampered request
  // body could otherwise get Bachs to charge far less than the real fare,
  // and SkyLink would still issue the real ticket at reserve time. Re-derive
  // both from a fresh SkyLink quote against the booking_token instead, the
  // same opaque/unforgeable value confirmPaymentAndReserve re-prices with
  // right before ticketing.
  const freshPricing = await priceFlight({
    booking_token: data.bookingToken,
    passengers: data.passengers,
    class: "economy",
    currency: data.currency,
  });

  const booking = await prismaBookings.flightBooking.create({
    data: {
      tripType: data.tripType,
      fromCode: data.fromCode,
      toCode: data.toCode,
      departureDate: new Date(data.departureDate),
      returnDate: data.returnDate ? new Date(data.returnDate) : null,
      bookingToken: freshPricing.booking_token,
      verifiedPrice: freshPricing.verified_price,
      customerPrice: freshPricing.customer_price,
      currency: data.currency,
      passengers: data.passengers,
      travellers: data.travellers,
      paymentProvider: data.paymentProvider,
    },
  });
  console.log(`[bookings] created ${booking.id} — status=${booking.status}, customerPrice=${booking.customerPrice}`);

  const primaryGuest = data.travellers.primary_guest;

  // The caller can't know booking.id before this point, so it can't build a
  // redirectUrl containing it — append it here instead, that's how the
  // page the customer lands back on knows which booking to check.
  const separator = data.redirectUrl.includes("?") ? "&" : "?";
  const redirectUrlWithBookingId = `${data.redirectUrl}${separator}bookingId=${booking.id}`;

  const customerName = `${primaryGuest.first_name} ${primaryGuest.last_name}`;

  if (data.paymentProvider === "monnify") {
    // Monnify sends the customer back to redirectUrl (adding its own paymentReference, which is
    // this booking's id too), and the webhook settles it with paymentReference = booking.id.
    const payment = await initiatePayment({
      amount: booking.customerPrice,
      customerName,
      customerEmail: primaryGuest.email,
      paymentReference: booking.id,
      redirectUrl: redirectUrlWithBookingId,
      currencyCode: "NGN",
    });
    console.log(`[bookings] ${booking.id} — Monnify payment initiated, transactionReference=${payment.transactionReference}`);

    await prismaBookings.flightBooking.update({
      where: { id: booking.id },
      data: { monnifyTransactionReference: payment.transactionReference },
    });

    return { bookingId: booking.id, checkoutUrl: payment.checkoutUrl as string };
  }

  // Both addresses go back to the same page: it asks us to confirm, and an unpaid or abandoned
  // checkout simply stays pending_payment.
  const checkout = await createCheckout({
    amount: booking.customerPrice,
    customerName,
    customerEmail: primaryGuest.email,
    reference: booking.id,
    successUrl: redirectUrlWithBookingId,
    cancelUrl: redirectUrlWithBookingId,
  });
  console.log(`[bookings] ${booking.id} — Bachs checkout created, checkoutId=${checkout.checkout_id}`);

  await prismaBookings.flightBooking.update({
    where: { id: booking.id },
    data: { bachsCheckoutId: checkout.checkout_id },
  });

  return { bookingId: booking.id, checkoutUrl: checkout.checkout_url };
};

export const getBooking = async (id: string) => {
  return prismaBookings.flightBooking.findUnique({ where: { id } });
};

// A booking already marked "paid" counts as "someone is reserving it right
// now" for this long. After that the claim can be taken again, so a request
// that died mid-reserve doesn't leave a paid booking stuck forever.
const RESERVE_CLAIM_WINDOW_MS = 60_000;

// The Bachs webhook and the customer's return page can both ask us to
// reserve within the same second. SkyLink lets a booking token be used once, so
// a second reserve would fail and — worse — send a successfully booked
// customer down the "failed, refund" path. This claim is one atomic UPDATE:
// exactly one caller gets count === 1 and goes on to call SkyLink; the rest
// leave the booking to that caller.
const claimReservation = async (id: string, from: "pending_payment" | "paid"): Promise<boolean> => {
  const claimed = await prismaBookings.flightBooking.updateMany({
    where:
      from === "pending_payment"
        ? { id, status: "pending_payment" }
        : { id, status: "paid", updatedAt: { lt: new Date(Date.now() - RESERVE_CLAIM_WINDOW_MS) } },
    // Writing the same status still refreshes updatedAt, which is what marks
    // the claim as taken.
    data: { status: "paid" },
  });
  return claimed.count === 1;
};

// Called either by the Bachs webhook (production) or a manual poll (local
// dev, or a belt-and-braces check right after the customer's browser returns
// from Bachs' checkout) — either way, payment is re-verified against
// Bachs' own API here, never trusted from the caller.
export const confirmPaymentAndReserve = async (id: string) => {
  const booking = await prismaBookings.flightBooking.findUnique({ where: { id } });
  if (!booking) throw new Error("Booking not found");

  console.log(`[bookings] ${id} — confirmPaymentAndReserve called, current status=${booking.status}`);

  if (booking.status === "reserved" || booking.status === "failed") {
    console.log(`[bookings] ${id} — already ${booking.status}, nothing to do`);
    return booking;
  }

  if (booking.status === "pending_payment" && booking.paymentProvider === "monnify") {
    if (!booking.monnifyTransactionReference) {
      throw new Error("No payment has been initiated for this booking");
    }

    const payment = await getTransactionStatus(booking.monnifyTransactionReference);
    console.log(
      `[bookings] ${id} — Monnify paymentStatus=${payment.paymentStatus}, amountPaid=${payment.amountPaid} ${payment.currency}`
    );
    if (!isMonnifyPaid(payment.paymentStatus)) {
      return booking;
    }

    // Money was taken, but not for this booking's fare (a reference mix-up, or less than the fare).
    // Never ticket on it: fail the booking and refund what was paid.
    const mismatch = monnifyPaymentMismatch(payment, booking);
    if (mismatch) {
      return failAndRefund(booking, `Monnify payment does not match the booking (${mismatch})`);
    }
  } else if (booking.status === "pending_payment") {
    if (!booking.bachsCheckoutId) {
      throw new Error("No payment has been initiated for this booking");
    }

    const checkout = await getCheckout(booking.bachsCheckoutId);
    console.log(`[bookings] ${id} — Bachs checkout status=${checkout.status}, charge status=${checkout.charge?.status ?? "none"}`);
    if (!isCheckoutPaid(checkout) || !checkout.charge) {
      return booking;
    }

    // Kept for the refund below: Bachs refunds are made against the charge, not the checkout.
    if (booking.bachsChargeId !== checkout.charge.payment_id) {
      await prismaBookings.flightBooking.update({
        where: { id },
        data: { bachsChargeId: checkout.charge.payment_id },
      });
      booking.bachsChargeId = checkout.charge.payment_id;
    }

    const mismatch = bachsCheckoutMismatch(checkout, booking);
    if (mismatch) {
      return failAndRefund(booking, `Bachs checkout does not match the booking (${mismatch})`);
    }
  }

  if (!(await claimReservation(id, booking.status))) {
    console.log(`[bookings] ${id} — another request is already reserving this booking, leaving it to that one`);
    return (await prismaBookings.flightBooking.findUnique({ where: { id } })) ?? booking;
  }
  console.log(`[bookings] ${id} — marked paid, calling SkyLink reserve...`);

  try {
    // SkyLink's own guidance: price immediately before reserve, and never
    // reuse a booking_token across reserve calls. The token we've been
    // holding was fetched when checkout started — payment can take minutes,
    // so it may be stale or expired by now. Re-price with it and reserve
    // against the fresh token instead of the original one.
    const freshPricing = await priceFlight({
      booking_token: booking.bookingToken,
      passengers: booking.passengers,
      class: "economy",
      currency: booking.currency,
    });
    if (freshPricing.verified_price !== booking.verifiedPrice) {
      console.log(
        `[bookings] ${id} — re-priced before reserve: was ${booking.verifiedPrice}, now ${freshPricing.verified_price} (customer already charged ${booking.customerPrice})`
      );
    }

    // The fare's real cost now exceeds what was actually collected — a fare
    // increase between checkout and payment, or (with the client-supplied
    // price no longer trusted at checkout) a genuinely stale token. Either
    // way, ticketing here would hand out a flight for less than it costs.
    // Refuse and fall into the catch block below, which already marks the
    // booking failed and auto-refunds the payment.
    if (freshPricing.customer_price > booking.customerPrice) {
      throw new Error(
        `Re-priced fare (${freshPricing.customer_price}) exceeds what the customer paid (${booking.customerPrice}) — refusing to reserve.`
      );
    }

    const reservation = await reserveFlight({
      booking_token: freshPricing.booking_token,
      passengers: booking.passengers,
      travellers: booking.travellers,
    });
    console.log(`[bookings] ${id} — reserved! pnr=${reservation.pnr}, carrier=${reservation.carrier}`);

    return await prismaBookings.flightBooking.update({
      where: { id },
      data: {
        status: "reserved",
        bookingToken: freshPricing.booking_token,
        verifiedPrice: freshPricing.verified_price,
        pnr: reservation.pnr,
        bookingReference: reservation.booking_reference,
        carrier: reservation.carrier,
        ticketDeadline: reservation.ticket_deadline ? new Date(reservation.ticket_deadline) : null,
      },
    });
  } catch (error) {
    console.log(`[bookings] ${id} — reserve failed:`, error instanceof Error ? error.message : error);
    // Payment already succeeded (we only ever reach this point after confirming that): the
    // customer paid for a booking that didn't complete, so refund automatically.
    await failAndRefund(booking, "SkyLink reservation failed after payment");
    throw error;
  }
};

type BookingRow = NonNullable<Awaited<ReturnType<typeof getBooking>>>;

// Refund statuses that mean the customer is still owed their money and nothing is under way:
// the gateway refused to start the refund, or the refund itself failed.
export const REFUND_RETRYABLE_STATUSES = ["refund_not_started", "failed", "FAILED"];

// Marks a paid booking failed and refunds the payment. The status change is one atomic UPDATE from
// pending_payment/paid, so when the webhook and the return page race, only one of them refunds.
const failAndRefund = async (booking: BookingRow, reason: string): Promise<BookingRow> => {
  const claimed = await prismaBookings.flightBooking.updateMany({
    where: { id: booking.id, status: { in: ["pending_payment", "paid"] } },
    data: { status: "failed" },
  });
  if (claimed.count === 1) {
    console.log(`[bookings] ${booking.id} — marked failed: ${reason}`);
    await refundBooking(booking);
  }
  return (await prismaBookings.flightBooking.findUnique({ where: { id: booking.id } })) ?? booking;
};

// Starts a full refund and records its first status. When the gateway refuses (seen in the Bachs
// sandbox: straight after a payment the money is still pending, INSUFFICIENT_BALANCE), the booking is
// marked refund_not_started so the admin list shows the customer is owed a refund and an admin can
// retry it (retryRefund below). isRetry gives Bachs a fresh idempotency key, since Bachs would
// otherwise replay the first, refused attempt.
const refundBooking = async (booking: BookingRow, isRetry = false): Promise<string> => {
  const { id } = booking;
  const paymentId = booking.paymentProvider === "monnify" ? booking.monnifyTransactionReference : booking.bachsChargeId;
  if (!paymentId) {
    console.log(`[bookings] ${id} — no ${booking.paymentProvider} payment id stored, so no refund can be started`);
    await prismaBookings.flightBooking.update({ where: { id }, data: { refundStatus: "refund_not_started" } });
    return "refund_not_started";
  }

  try {
    const refundStatus = await startRefund(booking.paymentProvider, paymentId, id, booking.customerPrice, isRetry);
    // On the first attempt, only if nothing is recorded yet: the refund-finished webhook can arrive
    // before this line runs, and the first "in progress" status must not overwrite that outcome.
    // A retry replaces the earlier refund_not_started / failed.
    await prismaBookings.flightBooking.updateMany({
      where: isRetry ? { id, refundStatus: { in: REFUND_RETRYABLE_STATUSES } } : { id, refundStatus: null },
      data: { refundStatus },
    });
    return refundStatus;
  } catch (refundError) {
    const code = refundError instanceof BachsError ? refundError.code : null;
    console.log(
      `[bookings] ${id} — refund could not be started${code ? ` (${code})` : ""}:`,
      refundError instanceof Error ? refundError.message : refundError
    );
    await prismaBookings.flightBooking.update({ where: { id }, data: { refundStatus: "refund_not_started" } });
    if (isRetry) throw refundError;
    return "refund_not_started";
  }
};

// Admin action: try again to refund a failed booking whose refund never started or failed.
export const retryRefund = async (id: string) => {
  const booking = await prismaBookings.flightBooking.findUnique({ where: { id } });
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "failed" || !booking.refundStatus || !REFUND_RETRYABLE_STATUSES.includes(booking.refundStatus)) {
    throw new Error("Only a failed booking whose refund did not start, or failed, can be refunded again.");
  }

  console.log(`[bookings] ${id} — admin retrying refund (was ${booking.refundStatus})`);
  await refundBooking(booking, true);
  return prismaBookings.flightBooking.findUniqueOrThrow({ where: { id } });
};

// Scheduled job (GET /api/cron/retry-refunds): tries once more every refund that never started, so a
// gateway outage at refund time doesn't leave a customer waiting on an admin. Only refund_not_started:
// a refund the gateway took and then reported failed needs a person to look at it (the admin button).
// Bookings older than REFUND_AUTO_RETRY_DAYS are left to the admin so a hopeless one isn't retried forever.
const REFUND_AUTO_RETRY_DAYS = 14;
const REFUND_AUTO_RETRY_BATCH = 20;

export const retryOwedRefunds = async () => {
  const since = new Date(Date.now() - REFUND_AUTO_RETRY_DAYS * 24 * 60 * 60 * 1000);
  const owed = await prismaBookings.flightBooking.findMany({
    where: { status: "failed", refundStatus: "refund_not_started", createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    take: REFUND_AUTO_RETRY_BATCH,
  });

  const results: { id: string; refundStatus: string }[] = [];
  for (const booking of owed) {
    try {
      results.push({ id: booking.id, refundStatus: await refundBooking(booking, true) });
    } catch {
      // refundBooking already logged it and left refund_not_started; the next run tries again.
      results.push({ id: booking.id, refundStatus: "refund_not_started" });
    }
  }
  console.log(`[bookings] refund retry run — ${owed.length} owed, ${results.filter((r) => r.refundStatus !== "refund_not_started").length} started`);
  return results;
};

// Full refund through whichever gateway took the payment, with the booking id as the refund's
// reference. Returns the refund's first status.
//  - Bachs: against the charge id, in whatever currency the customer paid (naira, or USD for a
//    foreign card). One refund per charge, so a retry with a new idempotency key can't refund twice.
//  - Monnify: against the transactionReference, for the naira amount charged. The refundReference
//    must be unique, so a retry after a refund Monnify really created is refused rather than doubled.
const startRefund = async (
  provider: string,
  paymentId: string,
  bookingId: string,
  amount: number,
  isRetry: boolean
): Promise<string> => {
  if (provider === "monnify") {
    const refund = await initiateRefund({
      transactionReference: paymentId,
      refundReference: bookingId,
      refundAmount: amount,
      refundReason: "Flight booking could not be completed",
      customerNote: "Booking failed",
    });
    console.log(`[bookings] ${bookingId} — Monnify refund initiated, refundStatus=${refund.refundStatus}`);
    return refund.refundStatus;
  }

  const refund = await createRefund({
    chargeId: paymentId,
    reference: bookingId,
    reason: "Flight booking could not be completed",
    ...(isRetry ? { idempotencyKey: `refund-${bookingId}-retry-${Date.now()}` } : {}),
  });
  console.log(`[bookings] ${bookingId} — Bachs refund created, refundId=${refund.refund_id}, status=${refund.status}`);
  return refund.status;
};

// Called from the Bachs or Monnify webhook when a refund finishes. refundReference
// is this booking's own id (the reference sent when the refund was started).
// Returns false when no booking has that id (a refund that isn't a flight booking's), so the
// webhook can acknowledge it instead of failing and being retried forever.
export const recordRefundOutcome = async (refundReference: string, refundStatus: string): Promise<boolean> => {
  console.log(`[bookings] ${refundReference} — refund outcome: ${refundStatus}`);
  const updated = await prismaBookings.flightBooking.updateMany({
    where: { id: refundReference },
    data: { refundStatus },
  });
  return updated.count === 1;
};
