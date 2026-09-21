-- AlterTable
ALTER TABLE "TravelConsultant" DROP COLUMN "experience",
DROP COLUMN "institution",
DROP COLUMN "courseOfStudy",
DROP COLUMN "levelOfStudy",
ALTER COLUMN "motivation" DROP NOT NULL;

-- Everyone who pays is enrolled and is entitled to a paid internship, so the
-- review states become programme stages instead of approve/reject.
ALTER TYPE "ConsultantReviewStatus" RENAME VALUE 'submitted' TO 'registered';
ALTER TYPE "ConsultantReviewStatus" RENAME VALUE 'approved' TO 'attended';
ALTER TYPE "ConsultantReviewStatus" RENAME VALUE 'rejected' TO 'internship';
