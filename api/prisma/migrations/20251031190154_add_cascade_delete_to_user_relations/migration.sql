-- DropForeignKey
ALTER TABLE "public"."Influencer" DROP CONSTRAINT "Influencer_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Salon" DROP CONSTRAINT "Salon_userId_fkey";

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
