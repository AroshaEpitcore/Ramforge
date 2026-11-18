-- Deleting a video should remove its viewing-log rows (WatchSession) instead of
-- being blocked by the foreign key.

-- DropForeignKey
ALTER TABLE "WatchSession" DROP CONSTRAINT "WatchSession_videoId_fkey";

-- AddForeignKey
ALTER TABLE "WatchSession" ADD CONSTRAINT "WatchSession_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
