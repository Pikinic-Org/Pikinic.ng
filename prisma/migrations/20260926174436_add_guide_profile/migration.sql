-- AlterTable
ALTER TABLE "GuideLead" ADD COLUMN     "country" TEXT,
ADD COLUMN     "fieldOfStudy" TEXT,
ADD COLUMN     "funding" TEXT,
ADD COLUMN     "intake" TEXT,
ADD COLUMN     "profileCompletedAt" TIMESTAMP(3),
ADD COLUMN     "qualification" TEXT;
