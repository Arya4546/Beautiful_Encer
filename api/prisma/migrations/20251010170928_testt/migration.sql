/*
  Warnings:

  - You are about to drop the column `socialMediaLink` on the `Influencer` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SocialMediaPlatform" AS ENUM ('INSTAGRAM', 'TIKTOK');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'CAROUSEL', 'REEL', 'STORY');

-- AlterTable
ALTER TABLE "Influencer" DROP COLUMN "socialMediaLink";

-- CreateTable
CREATE TABLE "SocialMediaAccount" (
    "id" TEXT NOT NULL,
    "platform" "SocialMediaPlatform" NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "platformUsername" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "followersCount" INTEGER,
    "followingCount" INTEGER,
    "postsCount" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "influencerId" TEXT NOT NULL,

    CONSTRAINT "SocialMediaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaPost" (
    "id" TEXT NOT NULL,
    "platformPostId" TEXT NOT NULL,
    "caption" TEXT,
    "mediaUrl" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "SocialMediaPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialMediaAccount_influencerId_idx" ON "SocialMediaAccount"("influencerId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaAccount_influencerId_platform_key" ON "SocialMediaAccount"("influencerId", "platform");

-- CreateIndex
CREATE INDEX "SocialMediaPost_accountId_idx" ON "SocialMediaPost"("accountId");

-- CreateIndex
CREATE INDEX "SocialMediaPost_postedAt_idx" ON "SocialMediaPost"("postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaPost_accountId_platformPostId_key" ON "SocialMediaPost"("accountId", "platformPostId");

-- AddForeignKey
ALTER TABLE "SocialMediaAccount" ADD CONSTRAINT "SocialMediaAccount_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaPost" ADD CONSTRAINT "SocialMediaPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialMediaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
