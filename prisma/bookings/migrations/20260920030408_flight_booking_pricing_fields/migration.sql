/*
  Warnings:

  - You are about to drop the column `paymentReference` on the `FlightBooking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `FlightBooking` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `FlightBooking` table. All the data in the column will be lost.
  - Added the required column `bookingToken` to the `FlightBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPrice` to the `FlightBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verifiedPrice` to the `FlightBooking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FlightBooking" DROP COLUMN "paymentReference",
DROP COLUMN "paymentStatus",
DROP COLUMN "price",
ADD COLUMN     "bookingToken" TEXT NOT NULL,
ADD COLUMN     "customerPrice" INTEGER NOT NULL,
ADD COLUMN     "monnifyTransactionReference" TEXT,
ADD COLUMN     "verifiedPrice" INTEGER NOT NULL;
