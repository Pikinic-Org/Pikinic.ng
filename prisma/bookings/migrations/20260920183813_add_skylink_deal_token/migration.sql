-- CreateTable
CREATE TABLE "SkylinkDealToken" (
    "bookingToken" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkylinkDealToken_pkey" PRIMARY KEY ("bookingToken")
);
