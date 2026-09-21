import { prismaBookings } from "@/lib/db-bookings";
import { getTransactionStatus, initiatePayment, initiateRefund } from "@/server/modules/monnify/monnify.service";
import { reserveFlight } from "@/server/modules/skylink/skylink.service";
import { startCheckoutInputSchema } from "@/server/modules/bookings/bookings.schema";

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

// Called either by the Monnify webhook (production) or a manual poll (local
// dev, or a belt-and-braces check right after the customer's browser returns
// from Monnify's checkout) — either way, payment is re-verified against
// Monnify's own API here, never trusted from the caller.
export const confirmPaymentAndReserve = async (id: string) => {
  let booking = await prismaBookings.flightBooking.findUnique({ where: { id } });
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

    booking = await prismaBookings.flightBooking.update({
      where: { id },
      data: { status: "paid" },
    });
    console.log(`[bookings] ${id} — marked paid, calling SkyLink reserve...`);
  }

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
