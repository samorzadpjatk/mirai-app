ALTER TABLE "challenges" ALTER COLUMN "first_place_points" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "first_place_points" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "second_place_points" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "second_place_points" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "third_place_points" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "third_place_points" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "accuracy" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "accuracy" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "height" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "height" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "offset_x" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "offset_x" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "offset_y" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "offset_y" SET NOT NULL;