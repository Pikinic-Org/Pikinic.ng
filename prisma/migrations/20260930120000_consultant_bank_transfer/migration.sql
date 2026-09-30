-- AlterTable
ALTER TABLE "TravelConsultant" ADD COLUMN     "paymentCode" TEXT,
ADD COLUMN     "programme" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TravelConsultant_paymentCode_key" ON "TravelConsultant"("paymentCode");
