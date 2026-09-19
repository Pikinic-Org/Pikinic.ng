-- CreateEnum
CREATE TYPE "FlightBookingStatus" AS ENUM ('pending_payment', 'paid', 'reserved', 'failed');

-- CreateTable
CREATE TABLE "SkylinkSession" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkylinkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightBooking" (
    "id" TEXT NOT NULL,
    "status" "FlightBookingStatus" NOT NULL DEFAULT 'pending_payment',
    "tripType" TEXT NOT NULL,
    "fromCode" TEXT NOT NULL,
    "toCode" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "pnr" TEXT,
    "bookingReference" TEXT,
    "carrier" TEXT,
    "ticketDeadline" TIMESTAMP(3),
    "passengers" JSONB NOT NULL,
    "travellers" JSONB NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentReference" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightBooking_pkey" PRIMARY KEY ("id")
);
