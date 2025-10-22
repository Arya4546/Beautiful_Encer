-- AlterTable
ALTER TABLE "SocialMediaAccount" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastAccountChange" TIMESTAMP(3),
ADD COLUMN     "verificationCode" TEXT;
