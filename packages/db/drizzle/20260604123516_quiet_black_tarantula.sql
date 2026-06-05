UPDATE "trip_resources" SET "description" = '' WHERE "description" IS NULL;--> statement-breakpoint
ALTER TABLE "trip_resources" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
UPDATE "trips" SET "description" = '' WHERE "description" IS NULL;--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
UPDATE "groups" SET "description" = '' WHERE "description" IS NULL;--> statement-breakpoint
ALTER TABLE "groups" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
UPDATE "challenges" SET "description" = '' WHERE "description" IS NULL;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
UPDATE "submission_reports" SET "details" = '' WHERE "details" IS NULL;--> statement-breakpoint
ALTER TABLE "submission_reports" ALTER COLUMN "details" SET NOT NULL;--> statement-breakpoint
UPDATE "activity_feeds" SET "description" = '' WHERE "description" IS NULL;--> statement-breakpoint
ALTER TABLE "activity_feeds" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
UPDATE "activity_feeds" SET "image_url" = '' WHERE "image_url" IS NULL;--> statement-breakpoint
ALTER TABLE "activity_feeds" ALTER COLUMN "image_url" SET NOT NULL;--> statement-breakpoint
UPDATE "notification_schedules" SET "notification_title" = '' WHERE "notification_title" IS NULL;--> statement-breakpoint
ALTER TABLE "notification_schedules" ALTER COLUMN "notification_title" SET NOT NULL;--> statement-breakpoint
UPDATE "notification_schedules" SET "notification_body" = '' WHERE "notification_body" IS NULL;--> statement-breakpoint
ALTER TABLE "notification_schedules" ALTER COLUMN "notification_body" SET NOT NULL;--> statement-breakpoint
UPDATE "coin_transactions" SET "reason" = '' WHERE "reason" IS NULL;--> statement-breakpoint
ALTER TABLE "coin_transactions" ALTER COLUMN "reason" SET NOT NULL;
