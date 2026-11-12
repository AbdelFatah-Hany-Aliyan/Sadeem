-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('EMPLOYEE', 'PARTNER', 'COLLABORATOR', 'INTERN');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING_INVITATION', 'INVITED', 'ACCEPTED', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('LEAD', 'MEMBER', 'REVIEWER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'BLOCKED_CONFIGURATION');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('GUIDANCE', 'IMPROVEMENT', 'TRAINING', 'PROCESS', 'DIRECTION', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PROPOSED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecommendationVisibility" AS ENUM ('PRIVATE_MANAGEMENT', 'SHARED_WITH_MEMBER', 'TEAM_VISIBLE');

-- CreateEnum
CREATE TYPE "CompanyNotificationType" AS ENUM ('INVITATION_ACCEPTED', 'MEMBER_APPROVED', 'ACCOUNT_ACTIVATED', 'TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'TASK_REVIEW_REQUESTED', 'RECOMMENDATION_ISSUED', 'SYSTEM_ALERT');

-- AlterEnum
ALTER TYPE "AdminRole" ADD VALUE 'COMPANY_ADMIN';
ALTER TYPE "AdminRole" ADD VALUE 'TEAM_LEAD';
ALTER TYPE "AdminRole" ADD VALUE 'PROJECT_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE 'TEAM_MEMBER';
ALTER TYPE "AdminRole" ADD VALUE 'QA_REVIEWER';

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "companyMemberId" TEXT;

-- CreateTable
CREATE TABLE "CompanyTeam" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "responsibilitiesEn" JSONB NOT NULL,
    "responsibilitiesAr" JSONB NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "fullNameEn" TEXT NOT NULL,
    "fullNameAr" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "jobTitleEn" TEXT NOT NULL,
    "jobTitleAr" TEXT,
    "membershipType" "MembershipType" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING_INVITATION',
    "startDate" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "teamRole" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberProjectAssignment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectRole" TEXT,
    "responsibilities" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberProjectAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamProject" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberInvitation" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryStatus" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountActivationToken" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountActivationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "createdById" TEXT,
    "assignedMemberId" TEXT,
    "reviewerMemberId" TEXT,
    "teamId" TEXT,
    "projectId" TEXT,
    "isAiAssisted" BOOLEAN NOT NULL DEFAULT false,
    "aiMetadata" JSONB,
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskHistory" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "fromStatus" "TaskStatus",
    "toStatus" "TaskStatus",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdministrativeRecommendation" (
    "id" TEXT NOT NULL,
    "targetMemberId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" "RecommendationType" NOT NULL DEFAULT 'GUIDANCE',
    "text" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PROPOSED',
    "visibility" "RecommendationVisibility" NOT NULL DEFAULT 'SHARED_WITH_MEMBER',
    "relatedProjectId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdministrativeRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyNotification" (
    "id" TEXT NOT NULL,
    "recipientAdminId" TEXT,
    "recipientMemberId" TEXT,
    "type" "CompanyNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "providerId" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTeam_code_key" ON "CompanyTeam"("code");

-- CreateIndex
CREATE INDEX "CompanyTeam_code_idx" ON "CompanyTeam"("code");

-- CreateIndex
CREATE INDEX "CompanyTeam_isActive_idx" ON "CompanyTeam"("isActive");

-- CreateIndex
CREATE INDEX "CompanyTeam_displayOrder_idx" ON "CompanyTeam"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_employeeId_key" ON "CompanyMember"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_email_key" ON "CompanyMember"("email");

-- CreateIndex
CREATE INDEX "CompanyMember_email_idx" ON "CompanyMember"("email");

-- CreateIndex
CREATE INDEX "CompanyMember_status_idx" ON "CompanyMember"("status");

-- CreateIndex
CREATE INDEX "CompanyMember_membershipType_idx" ON "CompanyMember"("membershipType");

-- CreateIndex
CREATE INDEX "CompanyMember_employeeId_idx" ON "CompanyMember"("employeeId");

-- CreateIndex
CREATE INDEX "TeamMembership_teamId_teamRole_idx" ON "TeamMembership"("teamId", "teamRole");

-- CreateIndex
CREATE INDEX "TeamMembership_memberId_isPrimary_idx" ON "TeamMembership"("memberId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_memberId_teamId_key" ON "TeamMembership"("memberId", "teamId");

-- CreateIndex
CREATE INDEX "MemberProjectAssignment_projectId_idx" ON "MemberProjectAssignment"("projectId");

-- CreateIndex
CREATE INDEX "MemberProjectAssignment_memberId_idx" ON "MemberProjectAssignment"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProjectAssignment_memberId_projectId_key" ON "MemberProjectAssignment"("memberId", "projectId");

-- CreateIndex
CREATE INDEX "TeamProject_projectId_idx" ON "TeamProject"("projectId");

-- CreateIndex
CREATE INDEX "TeamProject_teamId_idx" ON "TeamProject"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamProject_teamId_projectId_key" ON "TeamProject"("teamId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberInvitation_tokenHash_key" ON "MemberInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "MemberInvitation_email_idx" ON "MemberInvitation"("email");

-- CreateIndex
CREATE INDEX "MemberInvitation_status_idx" ON "MemberInvitation"("status");

-- CreateIndex
CREATE INDEX "MemberInvitation_expiresAt_idx" ON "MemberInvitation"("expiresAt");

-- CreateIndex
CREATE INDEX "MemberInvitation_tokenHash_idx" ON "MemberInvitation"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "AccountActivationToken_tokenHash_key" ON "AccountActivationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountActivationToken_tokenHash_idx" ON "AccountActivationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountActivationToken_expiresAt_idx" ON "AccountActivationToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AccountActivationToken_memberId_idx" ON "AccountActivationToken"("memberId");

-- CreateIndex
CREATE INDEX "CompanyTask_status_idx" ON "CompanyTask"("status");

-- CreateIndex
CREATE INDEX "CompanyTask_assignedMemberId_idx" ON "CompanyTask"("assignedMemberId");

-- CreateIndex
CREATE INDEX "CompanyTask_teamId_idx" ON "CompanyTask"("teamId");

-- CreateIndex
CREATE INDEX "CompanyTask_projectId_idx" ON "CompanyTask"("projectId");

-- CreateIndex
CREATE INDEX "CompanyTask_dueDate_idx" ON "CompanyTask"("dueDate");

-- CreateIndex
CREATE INDEX "TaskHistory_taskId_createdAt_idx" ON "TaskHistory"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "AdministrativeRecommendation_targetMemberId_idx" ON "AdministrativeRecommendation"("targetMemberId");

-- CreateIndex
CREATE INDEX "AdministrativeRecommendation_status_idx" ON "AdministrativeRecommendation"("status");

-- CreateIndex
CREATE INDEX "AdministrativeRecommendation_visibility_idx" ON "AdministrativeRecommendation"("visibility");

-- CreateIndex
CREATE INDEX "CompanyNotification_recipientAdminId_read_idx" ON "CompanyNotification"("recipientAdminId", "read");

-- CreateIndex
CREATE INDEX "CompanyNotification_recipientMemberId_read_idx" ON "CompanyNotification"("recipientMemberId", "read");

-- CreateIndex
CREATE INDEX "CompanyNotification_createdAt_idx" ON "CompanyNotification"("createdAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_idx" ON "EmailOutbox"("status");

-- CreateIndex
CREATE INDEX "EmailOutbox_recipientEmail_idx" ON "EmailOutbox"("recipientEmail");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_companyMemberId_key" ON "AdminUser"("companyMemberId");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_companyMemberId_fkey" FOREIGN KEY ("companyMemberId") REFERENCES "CompanyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CompanyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "CompanyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProjectAssignment" ADD CONSTRAINT "MemberProjectAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CompanyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProjectAssignment" ADD CONSTRAINT "MemberProjectAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamProject" ADD CONSTRAINT "TeamProject_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "CompanyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamProject" ADD CONSTRAINT "TeamProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberInvitation" ADD CONSTRAINT "MemberInvitation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CompanyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberInvitation" ADD CONSTRAINT "MemberInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountActivationToken" ADD CONSTRAINT "AccountActivationToken_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CompanyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTask" ADD CONSTRAINT "CompanyTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTask" ADD CONSTRAINT "CompanyTask_assignedMemberId_fkey" FOREIGN KEY ("assignedMemberId") REFERENCES "CompanyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTask" ADD CONSTRAINT "CompanyTask_reviewerMemberId_fkey" FOREIGN KEY ("reviewerMemberId") REFERENCES "CompanyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTask" ADD CONSTRAINT "CompanyTask_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "CompanyTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTask" ADD CONSTRAINT "CompanyTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CompanyTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeRecommendation" ADD CONSTRAINT "AdministrativeRecommendation_targetMemberId_fkey" FOREIGN KEY ("targetMemberId") REFERENCES "CompanyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeRecommendation" ADD CONSTRAINT "AdministrativeRecommendation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeRecommendation" ADD CONSTRAINT "AdministrativeRecommendation_relatedProjectId_fkey" FOREIGN KEY ("relatedProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyNotification" ADD CONSTRAINT "CompanyNotification_recipientAdminId_fkey" FOREIGN KEY ("recipientAdminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyNotification" ADD CONSTRAINT "CompanyNotification_recipientMemberId_fkey" FOREIGN KEY ("recipientMemberId") REFERENCES "CompanyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
