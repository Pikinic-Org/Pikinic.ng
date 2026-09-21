-- CreateEnum
CREATE TYPE "ConsultantPaymentStatus" AS ENUM ('pending', 'paid');

-- CreateEnum
CREATE TYPE "ConsultantReviewStatus" AS ENUM ('submitted', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "TravelConsultant" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "courseOfStudy" TEXT NOT NULL,
    "levelOfStudy" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "experience" TEXT,
    "referralSource" TEXT,
    "paymentStatus" "ConsultantPaymentStatus" NOT NULL DEFAULT 'pending',
    "reviewStatus" "ConsultantReviewStatus" NOT NULL DEFAULT 'submitted',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paymentReference" TEXT,
    "monnifyTransactionReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelConsultant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TravelConsultant_email_key" ON "TravelConsultant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TravelConsultant_paymentReference_key" ON "TravelConsultant"("paymentReference");
