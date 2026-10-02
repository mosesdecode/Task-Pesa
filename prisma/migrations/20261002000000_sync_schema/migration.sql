-- Idempotent migration: safely adds missing columns and tables.
-- Uses IF NOT EXISTS / DO blocks so it is safe to re-run even if
-- some changes were already applied manually via Supabase SQL editor.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Advertisement' AND column_name='description') THEN ALTER TABLE "Advertisement" ADD COLUMN "description" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Advertisement' AND column_name='endDate') THEN ALTER TABLE "Advertisement" ADD COLUMN "endDate" TIMESTAMP(3); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Advertisement' AND column_name='startDate') THEN ALTER TABLE "Advertisement" ADD COLUMN "startDate" TIMESTAMP(3); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='OtpCode' AND column_name='resetToken') THEN ALTER TABLE "OtpCode" ADD COLUMN "resetToken" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Referral' AND column_name='rewardedAt') THEN ALTER TABLE "Referral" ADD COLUMN "rewardedAt" TIMESTAMP(3); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Task' AND column_name='description') THEN ALTER TABLE "Task" ADD COLUMN "description" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Task' AND column_name='endDate') THEN ALTER TABLE "Task" ADD COLUMN "endDate" TIMESTAMP(3); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Task' AND column_name='externalUrl') THEN ALTER TABLE "Task" ADD COLUMN "externalUrl" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Task' AND column_name='proofRequired') THEN ALTER TABLE "Task" ADD COLUMN "proofRequired" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Task' AND column_name='rules') THEN ALTER TABLE "Task" ADD COLUMN "rules" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Task' AND column_name='startDate') THEN ALTER TABLE "Task" ADD COLUMN "startDate" TIMESTAMP(3); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='TaskCategory' AND column_name='isActive') THEN ALTER TABLE "TaskCategory" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='TaskSubmission' AND column_name='proofText') THEN ALTER TABLE "TaskSubmission" ADD COLUMN "proofText" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='TaskSubmission' AND column_name='rejectionReason') THEN ALTER TABLE "TaskSubmission" ADD COLUMN "rejectionReason" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='TaskSubmission' AND column_name='reviewedBy') THEN ALTER TABLE "TaskSubmission" ADD COLUMN "reviewedBy" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='TaskSubmission' AND column_name='rewardAmount') THEN ALTER TABLE "TaskSubmission" ADD COLUMN "rewardAmount" DOUBLE PRECISION; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='TaskSubmission' AND column_name='rewardPaid') THEN ALTER TABLE "TaskSubmission" ADD COLUMN "rewardPaid" BOOLEAN NOT NULL DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='TaskSubmission' AND column_name='startedAt') THEN ALTER TABLE "TaskSubmission" ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='TaskSubmission' AND column_name='submittedAt') THEN ALTER TABLE "TaskSubmission" ADD COLUMN "submittedAt" TIMESTAMP(3); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='banReason') THEN ALTER TABLE "User" ADD COLUMN "banReason" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='flagReason') THEN ALTER TABLE "User" ADD COLUMN "flagReason" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='isBanned') THEN ALTER TABLE "User" ADD COLUMN "isBanned" BOOLEAN NOT NULL DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='isFlagged') THEN ALTER TABLE "User" ADD COLUMN "isFlagged" BOOLEAN NOT NULL DEFAULT false; END IF;
END $$;

-- AlterTable defaults (safe to run multiple times)
ALTER TABLE "Referral" ALTER COLUMN "rewardAmount" SET DEFAULT 100.0;
ALTER TABLE "Referral" ALTER COLUMN "status" SET DEFAULT 'PENDING_ACTIVATION';
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';
ALTER TABLE "TaskSubmission" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';
ALTER TABLE "Withdrawal" ALTER COLUMN "fee" SET DEFAULT 10.0;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "FinancialLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "reference" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "paymentId" TEXT,
    "referralId" TEXT,
    "taskId" TEXT,
    "submissionId" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "linkUrl" TEXT,
    "placement" TEXT NOT NULL DEFAULT 'landing',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SocialLink" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon_key" TEXT,
    "placement" TEXT[] DEFAULT ARRAY['community_row']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "FinancialLedger_type_idx" ON "FinancialLedger"("type");
CREATE INDEX IF NOT EXISTS "FinancialLedger_status_idx" ON "FinancialLedger"("status");
CREATE INDEX IF NOT EXISTS "FinancialLedger_reference_idx" ON "FinancialLedger"("reference");
CREATE INDEX IF NOT EXISTS "FinancialLedger_createdAt_idx" ON "FinancialLedger"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "OtpCode_resetToken_key" ON "OtpCode"("resetToken") WHERE "resetToken" IS NOT NULL;

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FinancialLedger_userId_fkey') THEN
    ALTER TABLE "FinancialLedger" ADD CONSTRAINT "FinancialLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Banner_updatedById_fkey') THEN
    ALTER TABLE "Banner" ADD CONSTRAINT "Banner_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SocialLink_updatedById_fkey') THEN
    ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
