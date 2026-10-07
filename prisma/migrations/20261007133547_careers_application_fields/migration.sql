/*
  Warnings:

  - You are about to drop the column `coverNote` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `JobApplication` table. All the data in the column will be lost.
  - Added the required column `address` to the `JobApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `JobApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `JobApplication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JobApplication" DROP COLUMN "coverNote",
DROP COLUMN "fullName",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "motivation" TEXT;
