/*
  Warnings:

  - You are about to drop the column `status` on the `Influencer` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Salon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Influencer" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Salon" DROP COLUMN "status";

-- DropEnum
DROP TYPE "public"."InfluencerStatus";

-- DropEnum
DROP TYPE "public"."SalonStatus";
