UPDATE "locations" SET "latitude" = 0 WHERE "latitude" IS NULL;--> statement-breakpoint
UPDATE "locations" SET "longitude" = 0 WHERE "longitude" IS NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "latitude" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "longitude" SET NOT NULL;