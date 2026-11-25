-- Manual display order for categories.
ALTER TABLE "Category" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Apply the admin's requested initial order (no-ops if a slug is absent).
UPDATE "Category" SET "position" = 0 WHERE "slug" = 'nuke-compositing';
UPDATE "Category" SET "position" = 1 WHERE "slug" = 'davinci-fusion';
UPDATE "Category" SET "position" = 2 WHERE "slug" = 'blender';
UPDATE "Category" SET "position" = 3 WHERE "slug" = 'nuke-studio';
UPDATE "Category" SET "position" = 4 WHERE "slug" = 'davinci-resolve';
