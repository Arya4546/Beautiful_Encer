-- AlterTable
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS "applicationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "applicationDeadline" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "isOpen" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "maxApplications" INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PUBLIC';

-- Make influencerId nullable
ALTER TABLE "Project" ALTER COLUMN "influencerId" DROP NOT NULL;

-- Update default status to DRAFT (only if column doesn't have constraints)
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProjectApplication" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "coverLetter" TEXT,
    "proposedBudget" DECIMAL(10,2),
    "estimatedDeliveryDays" INTEGER,
    "portfolioLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjectApplication_projectId_idx" ON "ProjectApplication"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectApplication_influencerId_idx" ON "ProjectApplication"("influencerId");
CREATE INDEX IF NOT EXISTS "ProjectApplication_status_idx" ON "ProjectApplication"("status");
CREATE INDEX IF NOT EXISTS "ProjectApplication_appliedAt_idx" ON "ProjectApplication"("appliedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectApplication_projectId_influencerId_key" ON "ProjectApplication"("projectId", "influencerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Project_visibility_idx" ON "Project"("visibility");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");
CREATE INDEX IF NOT EXISTS "Project_isOpen_idx" ON "Project"("isOpen");
CREATE INDEX IF NOT EXISTS "Project_createdAt_idx" ON "Project"("createdAt");
CREATE INDEX IF NOT EXISTS "Project_category_idx" ON "Project"("category");

-- AddForeignKey (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProjectApplication_projectId_fkey'
    ) THEN
        ALTER TABLE "ProjectApplication" ADD CONSTRAINT "ProjectApplication_projectId_fkey" 
        FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProjectApplication_influencerId_fkey'
    ) THEN
        ALTER TABLE "ProjectApplication" ADD CONSTRAINT "ProjectApplication_influencerId_fkey" 
        FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
