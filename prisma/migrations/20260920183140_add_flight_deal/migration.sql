-- CreateTable
CREATE TABLE "FlightDeal" (
    "id" TEXT NOT NULL,
    "fromCode" TEXT NOT NULL,
    "toCode" TEXT NOT NULL,
    "tripType" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "label" TEXT,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightDeal_pkey" PRIMARY KEY ("id")
);
