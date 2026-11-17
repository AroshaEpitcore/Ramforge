-- Anonymous reviews: make userId optional, add a guest author name, and
-- default new reviews to visible (no moderation). Existing hidden reviews are
-- flipped visible.

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "authorName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "approved" SET DEFAULT true;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Make all existing reviews visible.
UPDATE "Review" SET "approved" = true WHERE "approved" = false;
