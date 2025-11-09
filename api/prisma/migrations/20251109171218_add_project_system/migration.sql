-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('SPONSORED_POST', 'PRODUCT_REVIEW', 'BRAND_AMBASSADOR', 'EVENT_COVERAGE', 'TUTORIAL_VIDEO', 'UNBOXING', 'GIVEAWAY', 'COLLABORATION', 'STORE_VISIT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectType" "ProjectType" NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "budget" DECIMAL(10,2) NOT NULL,
    "deliverables" TEXT[],
    "requirements" TEXT,
    "location" TEXT,
    "category" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salonId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_salonId_idx" ON "Project"("salonId");

-- CreateIndex
CREATE INDEX "Project_influencerId_idx" ON "Project"("influencerId");

-- CreateIndex
CREATE INDEX "Project_proposedAt_idx" ON "Project"("proposedAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
