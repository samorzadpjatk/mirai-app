UPDATE "challenges" SET "first_place_points" = 0 WHERE "first_place_points" IS NULL;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "first_place_points" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "first_place_points" SET NOT NULL;--> statement-breakpoint
UPDATE "challenges" SET "second_place_points" = 0 WHERE "second_place_points" IS NULL;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "second_place_points" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "second_place_points" SET NOT NULL;--> statement-breakpoint
UPDATE "challenges" SET "third_place_points" = 0 WHERE "third_place_points" IS NULL;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "third_place_points" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "third_place_points" SET NOT NULL;--> statement-breakpoint
UPDATE "locations" SET "accuracy" = 0 WHERE "accuracy" IS NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "accuracy" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "accuracy" SET NOT NULL;--> statement-breakpoint
UPDATE "sponsors" SET "height" = 0 WHERE "height" IS NULL;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "height" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "height" SET NOT NULL;--> statement-breakpoint
UPDATE "sponsors" SET "offset_x" = 0 WHERE "offset_x" IS NULL;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "offset_x" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "offset_x" SET NOT NULL;--> statement-breakpoint
UPDATE "sponsors" SET "offset_y" = 0 WHERE "offset_y" IS NULL;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "offset_y" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "offset_y" SET NOT NULL;