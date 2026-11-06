-- Flight payments move from Monnify to Bachs (2026-11-06). Not live yet, so the
-- Monnify reference is dropped rather than kept alongside.
ALTER TABLE "FlightBooking" DROP COLUMN "monnifyTransactionReference";

ALTER TABLE "FlightBooking" ADD COLUMN "bachsCheckoutId" TEXT,
ADD COLUMN "bachsChargeId" TEXT;

CREATE UNIQUE INDEX "FlightBooking_bachsCheckoutId_key" ON "FlightBooking"("bachsCheckoutId");
