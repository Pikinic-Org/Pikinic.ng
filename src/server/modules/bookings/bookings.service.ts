import { prismaBookings } from "@/lib/db-bookings";
import { BachsError } from "@/server/modules/bachs/bachs.client";
import { createCheckout, createRefund, getCheckout, isCheckoutPaid } from "@/server/modules/bachs/bachs.service";
import { priceFlight, reserveFlight } from "@/server/modules/skylink/skylink.service";
import { startCheckoutInputSchema } from "@/server/modules/bookings/bookings.schema";

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
    },
  });
  console.log(`[bookings] created ${booking.id} — status=${booking.status}, customerPrice=${booking.customerPrice}`);

  const primaryGuest = data.travellers.primary_guest;

  // The caller can't know booking.id before this point, so it can't build a
  // redirectUrl containing it — append it here instead, that's how the
  // page the customer lands back on knows which booking to check.
  const separator = data.redirectUrl.includes("?") ? "&" : "?";
  const redirectUrlWithBookingId = `${data.redirectUrl}${separator}bookingId=${booking.id}`;

  // The fare is always charged in naira (the product is NGN). A foreign card switches the
  // checkout to USD and Bachs converts it, so other currencies are refused here rather than
  // silently charged as if they were naira.
  if (data.currency !== "NGN") {
    throw new Error(`Bookings are charged in NGN; got ${data.currency}.`);
  }

  // Both addresses go back to the same page: it asks us to confirm, and an unpaid or abandoned
  // checkout simply stays pending_payment.
  const checkout = await createCheckout({
    amount: booking.customerPrice,
    customerName: `${primaryGuest.first_name} ${primaryGuest.last_name}`,
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

  if (booking.status === "pending_payment") {
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
    await prismaBookings.flightBooking.update({
      where: { id },
      data: { status: "failed" },
    });

    // Payment already succeeded (we only ever reach this point after
    // confirming that) — the customer paid for a booking that didn't
    // complete, so refund automatically rather than leaving it to a manual
    // process.
    // Full refund of the charge, in whatever currency the customer paid (naira, or USD for a
    // foreign card). Bachs allows one refund per charge; the idempotency key is the booking id.
    if (booking.bachsChargeId) {
      try {
        const refund = await createRefund({
          chargeId: booking.bachsChargeId,
          reference: id,
          reason: "SkyLink reservation failed after payment",
        });
        console.log(`[bookings] ${id} — refund created, refundId=${refund.refund_id}, status=${refund.status}`);
        await prismaBookings.flightBooking.update({
          where: { id },
          data: { refundStatus: refund.status },
        });
      } catch (refundError) {
        // Seen in the sandbox: straight after a payment the money is still pending, and Bachs
        // refuses with INSUFFICIENT_BALANCE. Mark the booking so the admin list shows the customer
        // is owed a refund, instead of leaving refundStatus empty and the refund forgotten.
        const code = refundError instanceof BachsError ? refundError.code : null;
        console.log(
          `[bookings] ${id} — refund could not be started${code ? ` (${code})` : ""}:`,
          refundError instanceof Error ? refundError.message : refundError
        );
        await prismaBookings.flightBooking.update({
          where: { id },
          data: { refundStatus: "refund_not_started" },
        });
      }
    }

    throw error;
  }
};

// Called from the Bachs webhook when a refund finishes. refundReference is this
// booking's own id (the reference sent with createRefund).
export const recordRefundOutcome = async (refundReference: string, refundStatus: string) => {
  console.log(`[bookings] ${refundReference} — refund outcome: ${refundStatus}`);
  await prismaBookings.flightBooking.update({
    where: { id: refundReference },
    data: { refundStatus },
  });
};
