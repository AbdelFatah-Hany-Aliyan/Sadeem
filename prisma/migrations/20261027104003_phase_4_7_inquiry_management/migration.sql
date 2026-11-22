-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "VentureStage" AS ENUM ('IDEA', 'RESEARCH', 'PROTOTYPE', 'MVP', 'EXISTING_PRODUCT');

-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('ENTERPRISE_SYSTEM', 'WEB_PLATFORM', 'MOBILE_APPLICATION', 'ECOSYSTEM_INTEGRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpectedTimeline" AS ENUM ('IMMEDIATE', 'ONE_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "BudgetRange" AS ENUM ('LESS_THAN_10K', 'TEN_TO_25K', 'TWENTY_FIVE_TO_50K', 'FIFTY_K_PLUS', 'UNDISCLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InquiryStatus" ADD VALUE 'QUALIFIED';
ALTER TYPE "InquiryStatus" ADD VALUE 'DISCOVERY';
ALTER TYPE "InquiryStatus" ADD VALUE 'PROPOSAL';
ALTER TYPE "InquiryStatus" ADD VALUE 'ACCEPTED';
ALTER TYPE "InquiryStatus" ADD VALUE 'REJECTED';
ALTER TYPE "InquiryStatus" ADD VALUE 'CLOSED';

-- AlterEnum
ALTER TYPE "InquiryType" ADD VALUE 'BUSINESS_PROJECT';

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "budgetRange" "BudgetRange" DEFAULT 'UNDISCLOSED',
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "consentGiven" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "consentGivenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "consentVersion" TEXT NOT NULL DEFAULT 'v1.0-2026',
ADD COLUMN     "contactChannel" "ContactChannel" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "desiredOutcome" TEXT,
ADD COLUMN     "existingResources" TEXT,
ADD COLUMN     "expectedInvolvement" TEXT,
ADD COLUMN     "expectedTimeline" "ExpectedTimeline",
ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "founderExpertise" TEXT,
ADD COLUMN     "ideaName" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "phoneOrHandle" TEXT,
ADD COLUMN     "problemStatement" TEXT,
ADD COLUMN     "projectCategory" "ProjectCategory",
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "sourceRoute" TEXT,
ADD COLUMN     "targetAudience" TEXT,
ADD COLUMN     "ventureStage" "VentureStage",
ALTER COLUMN "message" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Inquiry_inquiryType_idx" ON "Inquiry"("inquiryType");

-- CreateIndex
CREATE INDEX "Inquiry_email_idx" ON "Inquiry"("email");

-- CreateIndex
CREATE INDEX "Inquiry_assignedToId_idx" ON "Inquiry"("assignedToId");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
