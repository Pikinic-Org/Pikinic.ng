-- Customers choose Bachs or Monnify at checkout (2026-11-16). Existing bookings
-- were all made through Bachs, hence the default.
ALTER TABLE "FlightBooking" ADD COLUMN "paymentProvider" TEXT NOT NULL DEFAULT 'bachs',
ADD COLUMN "monnifyTransactionReference" TEXT;

CREATE UNIQUE INDEX "FlightBooking_monnifyTransactionReference_key" ON "FlightBooking"("monnifyTransactionReference");
