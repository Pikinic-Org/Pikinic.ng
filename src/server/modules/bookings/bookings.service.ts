import { prismaBookings } from "@/lib/db-bookings";
import { getTransactionStatus, initiatePayment, initiateRefund } from "@/server/modules/monnify/monnify.service";
import { reserveFlight } from "@/server/modules/skylink/skylink.service";
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
// a SkyLink reservation or refund a Monnify payment — it's for clearing
// test/junk records from the admin dashboard.
export const deleteFlightBooking = async (id: string) => {
  await prismaBookings.flightBooking.delete({ where: { id } });
};

export const startCheckout = async (input: unknown) => {
  const data = startCheckoutInputSchema.parse(input);

  const booking = await prismaBookings.flightBooking.create({
    data: {
      tripType: data.tripType,
      fromCode: data.fromCode,
      toCode: data.toCode,
      departureDate: new Date(data.departureDate),
      returnDate: data.returnDate ? new Date(data.returnDate) : null,
      bookingToken: data.bookingToken,
      verifiedPrice: data.verifiedPrice,
      customerPrice: data.customerPrice,
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

  const payment = await initiatePayment({
    amount: data.customerPrice,
    customerName: `${primaryGuest.first_name} ${primaryGuest.last_name}`,
    customerEmail: primaryGuest.email,
    paymentReference: booking.id,
    redirectUrl: redirectUrlWithBookingId,
    currencyCode: data.currency,
  });
  console.log(`[bookings] ${booking.id} — Monnify payment initiated, transactionReference=${payment.transactionReference}`);

  await prismaBookings.flightBooking.update({
    where: { id: booking.id },
    data: { monnifyTransactionReference: payment.transactionReference },
  });

  return { bookingId: booking.id, checkoutUrl: payment.checkoutUrl };
};

export const getBooking = async (id: string) => {
  return prismaBookings.flightBooking.findUnique({ where: { id } });
};

// A booking already marked "paid" counts as "someone is reserving it right
// now" for this long. After that the claim can be taken again, so a request
// that died mid-reserve doesn't leave a paid booking stuck forever.
const RESERVE_CLAIM_WINDOW_MS = 60_000;

// The Monnify webhook and the customer's return page can both ask us to
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

// Called either by the Monnify webhook (production) or a manual poll (local
// dev, or a belt-and-braces check right after the customer's browser returns
// from Monnify's checkout) — either way, payment is re-verified against
// Monnify's own API here, never trusted from the caller.
export const confirmPaymentAndReserve = async (id: string) => {
  const booking = await prismaBookings.flightBooking.findUnique({ where: { id } });
  if (!booking) throw new Error("Booking not found");

  console.log(`[bookings] ${id} — confirmPaymentAndReserve called, current status=${booking.status}`);

  if (booking.status === "reserved" || booking.status === "failed") {
    console.log(`[bookings] ${id} — already ${booking.status}, nothing to do`);
    return booking;
  }

  if (booking.status === "pending_payment") {
    if (!booking.monnifyTransactionReference) {
      throw new Error("No payment has been initiated for this booking");
    }

    const payment = await getTransactionStatus(booking.monnifyTransactionReference);
    console.log(`[bookings] ${id} — Monnify paymentStatus=${payment.paymentStatus}`);
    if (payment.paymentStatus !== "PAID") {
      return booking;
    }
  }

  if (!(await claimReservation(id, booking.status))) {
    console.log(`[bookings] ${id} — another request is already reserving this booking, leaving it to that one`);
    return (await prismaBookings.flightBooking.findUnique({ where: { id } })) ?? booking;
  }
  console.log(`[bookings] ${id} — marked paid, calling SkyLink reserve...`);

  try {
    const reservation = await reserveFlight({
      booking_token: booking.bookingToken,
      passengers: booking.passengers,
      travellers: booking.travellers,
    });
    console.log(`[bookings] ${id} — reserved! pnr=${reservation.pnr}, carrier=${reservation.carrier}`);

    return await prismaBookings.flightBooking.update({
      where: { id },
      data: {
        status: "reserved",
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
    if (booking.monnifyTransactionReference) {
      try {
        const refund = await initiateRefund({
          transactionReference: booking.monnifyTransactionReference,
          refundReference: id,
          refundAmount: booking.customerPrice,
          refundReason: "SkyLink reservation failed after payment",
          customerNote: "Booking failed",
        });
        console.log(`[bookings] ${id} — refund initiated, refundStatus=${refund.refundStatus}`);
        await prismaBookings.flightBooking.update({
          where: { id },
          data: { refundStatus: refund.refundStatus },
        });
      } catch (refundError) {
        console.log(`[bookings] ${id} — refund initiation FAILED:`, refundError instanceof Error ? refundError.message : refundError);
      }
    }

    throw error;
  }
};

// Called from the Monnify webhook when a SUCCESSFUL_REFUND or FAILED_REFUND
// event arrives — refundReference is this booking's own id (see startCheckout).
export const recordRefundOutcome = async (refundReference: string, refundStatus: string) => {
  console.log(`[bookings] ${refundReference} — refund outcome: ${refundStatus}`);
  await prismaBookings.flightBooking.update({
    where: { id: refundReference },
    data: { refundStatus },
  });
};
