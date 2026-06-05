CREATE TABLE "trip_sponsor_display" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"sponsor_id" varchar(36) NOT NULL,
	"height" integer DEFAULT 0 NOT NULL,
	"offset_x" integer DEFAULT 0 NOT NULL,
	"offset_y" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sponsors" DROP CONSTRAINT "sponsors_height_positive";--> statement-breakpoint
ALTER TABLE "sponsors" DROP CONSTRAINT "sponsors_offset_x_positive";--> statement-breakpoint
ALTER TABLE "sponsors" DROP CONSTRAINT "sponsors_offset_y_positive";--> statement-breakpoint
ALTER TABLE "trip_sponsor_display" ADD CONSTRAINT "trip_sponsor_display_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_sponsor_display" ADD CONSTRAINT "trip_sponsor_display_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "trip_sponsor_display" ("id", "trip_id", "sponsor_id", "height", "offset_x", "offset_y")
SELECT gen_random_uuid(), ts."trip_id", ts."sponsor_id", s."height", s."offset_x", s."offset_y"
FROM "trip_sponsors" ts
JOIN "sponsors" s ON s."id" = ts."sponsor_id";--> statement-breakpoint
ALTER TABLE "sponsors" DROP COLUMN "height";--> statement-breakpoint
ALTER TABLE "sponsors" DROP COLUMN "offset_x";--> statement-breakpoint
ALTER TABLE "sponsors" DROP COLUMN "offset_y";