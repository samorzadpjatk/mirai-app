CREATE TABLE "trip_resource_files" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"storage_path" text NOT NULL,
	"file_name" text NOT NULL,
	"public_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_resource_icons" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"icon_name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_resource_links" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_resource_texts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
INSERT INTO "trip_resource_links" ("id", "trip_id", "label", "type", "url", "description", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "trip_id", "label", "type", COALESCE("url", ''), COALESCE("description", ''), "sort_order", "created_at", "updated_at"
FROM "trip_resources"
WHERE "url" IS NOT NULL;--> statement-breakpoint
INSERT INTO "trip_resource_files" ("id", "trip_id", "label", "type", "storage_path", "file_name", "public_url", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "trip_id", "label", "type", COALESCE("storage_path", ''), COALESCE("file_name", ''), COALESCE("public_url", ''), "sort_order", "created_at", "updated_at"
FROM "trip_resources"
WHERE "storage_path" IS NOT NULL;--> statement-breakpoint
INSERT INTO "trip_resource_texts" ("id", "trip_id", "label", "type", "value", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "trip_id", "label", "type", COALESCE("value", ''), "sort_order", "created_at", "updated_at"
FROM "trip_resources"
WHERE "value" IS NOT NULL;--> statement-breakpoint
INSERT INTO "trip_resource_icons" ("id", "trip_id", "label", "type", "icon_name", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "trip_id", "label", "type", COALESCE("icon_name", ''), "sort_order", "created_at", "updated_at"
FROM "trip_resources"
WHERE "icon_name" IS NOT NULL;--> statement-breakpoint
DROP TABLE "trip_resources" CASCADE;--> statement-breakpoint
ALTER TABLE "trip_resource_files" ADD CONSTRAINT "trip_resource_files_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_resource_icons" ADD CONSTRAINT "trip_resource_icons_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_resource_links" ADD CONSTRAINT "trip_resource_links_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_resource_texts" ADD CONSTRAINT "trip_resource_texts_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trip_resource_files_trip_id_idx" ON "trip_resource_files" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_resource_icons_trip_id_idx" ON "trip_resource_icons" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_resource_links_trip_id_idx" ON "trip_resource_links" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_resource_texts_trip_id_idx" ON "trip_resource_texts" USING btree ("trip_id");