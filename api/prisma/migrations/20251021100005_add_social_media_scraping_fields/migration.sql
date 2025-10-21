-- AlterTable
ALTER TABLE "SocialMediaAccount" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "profileUrl" TEXT;
