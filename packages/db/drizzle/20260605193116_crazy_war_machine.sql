CREATE TYPE "public"."trip_role" AS ENUM('ORGANIZER', 'ADMIN', 'MEMBER', 'COORDINATOR', 'SPONSOR');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"record_id" varchar(36) NOT NULL,
	"action" text NOT NULL,
	"old_values" text,
	"new_values" text,
	"performed_by_id" varchar(36),
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_participants" ALTER COLUMN "role" SET DEFAULT 'MEMBER'::"public"."trip_role";--> statement-breakpoint
ALTER TABLE "trip_participants" ALTER COLUMN "role" SET DATA TYPE "public"."trip_role" USING "role"::"public"."trip_role";--> statement-breakpoint
ALTER TABLE "activity_feeds" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_id_users_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;