CREATE TABLE "challenge_location" (
	"challenge_id" varchar(36) PRIMARY KEY NOT NULL,
	"target_latitude" real DEFAULT 0 NOT NULL,
	"target_longitude" real DEFAULT 0 NOT NULL,
	"expected_value" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_recurrence" (
	"challenge_id" varchar(36) PRIMARY KEY NOT NULL,
	"daily_start_time" text DEFAULT '' NOT NULL,
	"daily_end_time" text DEFAULT '' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_days" integer DEFAULT 0 NOT NULL,
	"type" text DEFAULT 'DAILY' NOT NULL
);
--> statement-breakpoint
DROP INDEX "challenges_is_recurring_idx";--> statement-breakpoint
ALTER TABLE "challenge_location" ADD CONSTRAINT "challenge_location_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_recurrence" ADD CONSTRAINT "challenge_recurrence_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "challenge_recurrence" ("challenge_id", "daily_start_time", "daily_end_time", "is_recurring", "recurring_days", "type")
SELECT "id", COALESCE("daily_start_time", ''), COALESCE("daily_end_time", ''), COALESCE("is_recurring", false), 0, 'DAILY'
FROM "challenges";--> statement-breakpoint
INSERT INTO "challenge_location" ("challenge_id", "target_latitude", "target_longitude", "expected_value")
SELECT "id", COALESCE("target_latitude", 0), COALESCE("target_longitude", 0), COALESCE("expected_value", '')
FROM "challenges";--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN "is_recurring";--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN "daily_start_time";--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN "daily_end_time";--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN "target_latitude";--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN "target_longitude";--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN "expected_value";
