/*
  Warnings:

  - You are about to drop the column `name` on the `Salon` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SalonStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Salon" DROP COLUMN "name",
ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "establishedYear" INTEGER,
ADD COLUMN     "facebookPage" TEXT,
ADD COLUMN     "instagramHandle" TEXT,
ADD COLUMN     "operatingHours" TEXT,
ADD COLUMN     "phoneNo" TEXT,
ADD COLUMN     "preferredCategories" TEXT[],
ADD COLUMN     "profilePic" TEXT,
ADD COLUMN     "status" "SalonStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN     "teamSize" INTEGER,
ADD COLUMN     "tiktokHandle" TEXT,
ADD COLUMN     "website" TEXT;
