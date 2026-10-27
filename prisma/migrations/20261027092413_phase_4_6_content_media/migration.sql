/*
  Warnings:

  - You are about to drop the column `content` on the `ContentTranslation` table. All the data in the column will be lost.
  - Added the required column `draftContent` to the `ContentTranslation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProjectMedia" DROP CONSTRAINT "ProjectMedia_projectId_fkey";

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ContentSection" ADD COLUMN     "name" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "ContentTranslation" DROP COLUMN "content",
ADD COLUMN     "draftContent" JSONB NOT NULL,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedBy" TEXT,
ADD COLUMN     "publishedContent" JSONB,
ADD COLUMN     "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "ProjectMedia" ADD COLUMN     "isCover" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalFilename" TEXT,
ADD COLUMN     "publicUrl" TEXT,
ADD COLUMN     "uploadedBy" TEXT,
ALTER COLUMN "projectId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "RevokedToken" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_jti_key" ON "RevokedToken"("jti");

-- CreateIndex
CREATE INDEX "RevokedToken_jti_idx" ON "RevokedToken"("jti");

-- CreateIndex
CREATE INDEX "RevokedToken_expiresAt_idx" ON "RevokedToken"("expiresAt");

-- CreateIndex
CREATE INDEX "ContentSection_status_idx" ON "ContentSection"("status");

-- CreateIndex
CREATE INDEX "ContentTranslation_status_idx" ON "ContentTranslation"("status");

-- CreateIndex
CREATE INDEX "ProjectMedia_mediaType_idx" ON "ProjectMedia"("mediaType");

-- CreateIndex
CREATE INDEX "ProjectMedia_storageKey_idx" ON "ProjectMedia"("storageKey");

-- AddForeignKey
ALTER TABLE "ProjectMedia" ADD CONSTRAINT "ProjectMedia_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevokedToken" ADD CONSTRAINT "RevokedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
