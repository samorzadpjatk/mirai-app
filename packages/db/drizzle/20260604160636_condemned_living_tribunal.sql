ALTER TABLE "challenge_location" ALTER COLUMN "target_latitude" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "challenge_location" ALTER COLUMN "target_longitude" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "challenge_location" ALTER COLUMN "expected_value" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "challenge_recurrence" ALTER COLUMN "daily_start_time" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "challenge_recurrence" ALTER COLUMN "daily_end_time" DROP DEFAULT;