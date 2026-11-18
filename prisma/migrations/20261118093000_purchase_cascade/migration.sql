-- Deleting a video should remove its entitlement rows (Purchase). Nulling the
-- videoId would break the video-xor-course check constraint, so cascade instead.
-- The financial Order/OrderItem records are preserved (they SetNull).

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_videoId_fkey";

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
