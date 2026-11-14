-- CreateEnum
CREATE TYPE "DeliverableType" AS ENUM ('FIGMA_LINK', 'GITHUB_LINK', 'DOCUMENT_LINK', 'FILE_UPLOAD', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'SUPERSEDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CompanyNotificationType" ADD VALUE 'TASK_COMMENT_MENTION';
ALTER TYPE "CompanyNotificationType" ADD VALUE 'TASK_REVIEW_APPROVED';
ALTER TYPE "CompanyNotificationType" ADD VALUE 'TASK_CHANGES_REQUESTED';
ALTER TYPE "CompanyNotificationType" ADD VALUE 'TEAM_ANNOUNCEMENT';

-- CreateTable
CREATE TABLE "TaskCollaborator" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorAdminId" TEXT,
    "authorMemberId" TEXT,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDeliverable" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorMemberId" TEXT,
    "authorAdminId" TEXT,
    "title" TEXT NOT NULL,
    "type" "DeliverableType" NOT NULL DEFAULT 'OTHER',
    "url" TEXT,
    "storageKey" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskCollaborator_memberId_idx" ON "TaskCollaborator"("memberId");

-- CreateIndex
CREATE INDEX "TaskCollaborator_taskId_idx" ON "TaskCollaborator"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCollaborator_taskId_memberId_key" ON "TaskCollaborator"("taskId", "memberId");

-- CreateIndex
CREATE INDEX "TaskChecklistItem_taskId_order_idx" ON "TaskChecklistItem"("taskId", "order");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskComment_authorMemberId_idx" ON "TaskComment"("authorMemberId");

-- CreateIndex
CREATE INDEX "TaskComment_authorAdminId_idx" ON "TaskComment"("authorAdminId");

-- CreateIndex
CREATE INDEX "TaskDeliverable_taskId_idx" ON "TaskDeliverable"("taskId");

-- CreateIndex
CREATE INDEX "TaskDeliverable_authorMemberId_idx" ON "TaskDeliverable"("authorMemberId");

-- CreateIndex
CREATE INDEX "TaskDeliverable_status_idx" ON "TaskDeliverable"("status");

-- AddForeignKey
ALTER TABLE "TaskCollaborator" ADD CONSTRAINT "TaskCollaborator_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CompanyTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCollaborator" ADD CONSTRAINT "TaskCollaborator_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CompanyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CompanyTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CompanyTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorAdminId_fkey" FOREIGN KEY ("authorAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "CompanyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDeliverable" ADD CONSTRAINT "TaskDeliverable_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CompanyTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDeliverable" ADD CONSTRAINT "TaskDeliverable_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "CompanyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDeliverable" ADD CONSTRAINT "TaskDeliverable_authorAdminId_fkey" FOREIGN KEY ("authorAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
