CREATE TYPE "public"."challenge_status" AS ENUM('HIDDEN', 'VISIBLE', 'ACTIVE', 'VOTING_PHASE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."location_sharing_request_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."reward_purchase_status" AS ENUM('BOUGHT', 'ACCEPTED', 'IN_DELIVERY', 'CANCELLED', 'DELIVERED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN', 'MODERATOR', 'SERVICE');--> statement-breakpoint
CREATE TYPE "public"."scoring_category" AS ENUM('SPEED', 'UNLIMITED', 'JUDGED_STAFF', 'PEER_VOTING');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('IMAGE', 'MULTI_IMAGE', 'VIDEO', 'TEXT', 'IMAGE_LOCATION', 'LOCATION', 'QR_CODE');--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"auth_user_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"has_avatar" boolean DEFAULT false NOT NULL,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"last_seen_on" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "trip_insurance_steps" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"insurance_id" varchar(36) NOT NULL,
	"step_number" integer NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"required_info" text[] DEFAULT '{}' NOT NULL,
	"example_call" text,
	"additional_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_insurances" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"label" text NOT NULL,
	"phone_number" text NOT NULL,
	"phone_display" text NOT NULL,
	"policy_number" text NOT NULL,
	"contract_number" text NOT NULL,
	"provider_name" text NOT NULL,
	"hospital_name" text,
	"hospital_address" text,
	"hospital_distance" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "trip_insurances_trip_id_unique" UNIQUE("trip_id")
);
--> statement-breakpoint
CREATE TABLE "trip_participants" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"group_id" varchar(36),
	"wrist_number" text,
	"house_number" text,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_resources" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"url" text,
	"storage_path" text,
	"file_name" text,
	"public_url" text,
	"icon_name" text,
	"value" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"background_image_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"creator_id" varchar(36) NOT NULL,
	"organizer_group_id" varchar(36),
	"title" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"location" text NOT NULL,
	"description" text NOT NULL,
	"files" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_events" (
	"user_id" varchar(36) NOT NULL,
	"event_id" varchar(36) NOT NULL,
	"interested_in" boolean DEFAULT false NOT NULL,
	"enlisted_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_events_user_id_event_id_pk" PRIMARY KEY("user_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "group_join_requests" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"organizer_id" varchar(36) NOT NULL,
	"code" text NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "groups_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "challenge_submissions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"challenge_id" varchar(36) NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"image_ids" text[] DEFAULT '{}' NOT NULL,
	"video_id" text,
	"text_content" text,
	"latitude" real,
	"longitude" real,
	"status" "submission_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by_id" varchar(36),
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"awarded_points" integer DEFAULT 0 NOT NULL,
	"bonus_points" integer DEFAULT 0 NOT NULL,
	"ranking" integer,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"vote_score" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_votes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"challenge_id" varchar(36) NOT NULL,
	"submission_id" varchar(36) NOT NULL,
	"voter_id" varchar(36) NOT NULL,
	"vote_position" integer NOT NULL,
	"vote_points" integer NOT NULL,
	"normalized_weight" real DEFAULT 1 NOT NULL,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text,
	"submission_type" "submission_type" NOT NULL,
	"scoring_category" "scoring_category" NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"daily_start_time" text,
	"daily_end_time" text,
	"base_points" integer DEFAULT 0 NOT NULL,
	"first_place_points" integer,
	"second_place_points" integer,
	"third_place_points" integer,
	"status" "challenge_status" DEFAULT 'HIDDEN' NOT NULL,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"voting_start_time" timestamp with time zone,
	"voting_end_time" timestamp with time zone,
	"target_latitude" real,
	"target_longitude" real,
	"expected_value" text,
	"auto_approve" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_reports" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"submission_id" varchar(36) NOT NULL,
	"reporter_id" varchar(36) NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_feeds" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"activity_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"hidden_by_admin" varchar(36),
	"hidden_at" timestamp with time zone,
	"hidden_reason" text,
	"created_by_admin" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_reactions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"activity_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"reaction_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_activities" (
	"activity_id" varchar(36) PRIMARY KEY NOT NULL,
	"challenge_id" varchar(36) NOT NULL,
	"event_type" text NOT NULL,
	"end_time" timestamp with time zone,
	"submission_type" "submission_type",
	"base_points" integer,
	"submission_count" integer
);
--> statement-breakpoint
CREATE TABLE "rank_change_activities" (
	"activity_id" varchar(36) PRIMARY KEY NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"new_rank" integer NOT NULL,
	"total_coins" integer NOT NULL,
	"coins_gained" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_activities" (
	"activity_id" varchar(36) PRIMARY KEY NOT NULL,
	"submission_id" varchar(36) NOT NULL,
	"challenge_id" varchar(36) NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"has_video" boolean NOT NULL,
	"is_winner" boolean DEFAULT false NOT NULL,
	"ranking" integer,
	"points_awarded" integer
);
--> statement-breakpoint
CREATE TABLE "user_posts" (
	"activity_id" varchar(36) PRIMARY KEY NOT NULL,
	"author_id" varchar(36) NOT NULL,
	"additional_images" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36),
	"notification_id" varchar(36) NOT NULL,
	"schedule_id" varchar(36),
	"delivery_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivery_completed_at" timestamp with time zone,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"errors" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "notification_deliveries_notification_id_unique" UNIQUE("notification_id")
);
--> statement-breakpoint
CREATE TABLE "notification_pushes" (
	"target_user_id" varchar(36) NOT NULL,
	"notification_id" varchar(36) NOT NULL,
	"status" text NOT NULL,
	"sent_at" timestamp with time zone,
	"failure_reason" text,
	CONSTRAINT "notification_pushes_target_user_id_notification_id_pk" PRIMARY KEY("target_user_id","notification_id")
);
--> statement-breakpoint
CREATE TABLE "notification_schedule_executions" (
	"notification_id" varchar(36) NOT NULL,
	"schedule_id" varchar(36) NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_schedule_executions_notification_id_schedule_id_executed_at_pk" PRIMARY KEY("notification_id","schedule_id","executed_at")
);
--> statement-breakpoint
CREATE TABLE "notification_schedules" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36),
	"name" text NOT NULL,
	"notification_type" text NOT NULL,
	"notification_title" text,
	"notification_body" text,
	"notification_url" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"hour" integer NOT NULL,
	"minute" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"created_by_id" varchar(36) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36),
	"title" text NOT NULL,
	"body" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"created_by_id" varchar(36) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_shares" (
	"location_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	CONSTRAINT "location_shares_location_id_user_id_pk" PRIMARY KEY("location_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "location_sharing_requests" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"sender_id" varchar(36) NOT NULL,
	"receiver_id" varchar(36) NOT NULL,
	"status" "location_sharing_request_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"is_sharing_location" boolean DEFAULT false NOT NULL,
	"accuracy" real,
	"altitude" real,
	"altitude_accuracy" real,
	"heading" real,
	"latitude" real,
	"longitude" real,
	"speed" real,
	"last_inactivity_notification" timestamp with time zone,
	CONSTRAINT "locations_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "coin_transactions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"amount" integer NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"admin_id" varchar(36) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_purchases" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"reward_id" varchar(36) NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"quantity" integer NOT NULL,
	"total_cost" integer NOT NULL,
	"status" "reward_purchase_status" DEFAULT 'BOUGHT' NOT NULL,
	"collection_method" text,
	"purchased_by_id" varchar(36) NOT NULL,
	"status_updated_by_id" varchar(36),
	"status_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"available_quantity" integer NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"image" text,
	"coin_cost" integer NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"created_by_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"logo_path" text NOT NULL,
	"height" integer,
	"offset_x" integer,
	"offset_y" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_sponsors" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"sponsor_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_agents" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_agent" text NOT NULL,
	"platform" text NOT NULL,
	"user_id" varchar(36),
	"endpoint" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_insurance_steps" ADD CONSTRAINT "trip_insurance_steps_insurance_id_trip_insurances_id_fk" FOREIGN KEY ("insurance_id") REFERENCES "public"."trip_insurances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_insurances" ADD CONSTRAINT "trip_insurances_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_participants" ADD CONSTRAINT "trip_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_participants" ADD CONSTRAINT "trip_participants_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_participants" ADD CONSTRAINT "trip_participants_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_resources" ADD CONSTRAINT "trip_resources_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_group_id_groups_id_fk" FOREIGN KEY ("organizer_group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_submission_id_challenge_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."challenge_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_voter_id_trip_participants_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."trip_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_reports" ADD CONSTRAINT "submission_reports_submission_id_challenge_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."challenge_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_reports" ADD CONSTRAINT "submission_reports_reporter_id_trip_participants_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."trip_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_feeds" ADD CONSTRAINT "activity_feeds_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_feeds" ADD CONSTRAINT "activity_feeds_hidden_by_admin_users_id_fk" FOREIGN KEY ("hidden_by_admin") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_feeds" ADD CONSTRAINT "activity_feeds_created_by_admin_users_id_fk" FOREIGN KEY ("created_by_admin") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reactions" ADD CONSTRAINT "activity_reactions_activity_id_activity_feeds_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reactions" ADD CONSTRAINT "activity_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_activities" ADD CONSTRAINT "challenge_activities_activity_id_activity_feeds_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_activities" ADD CONSTRAINT "challenge_activities_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_change_activities" ADD CONSTRAINT "rank_change_activities_activity_id_activity_feeds_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_change_activities" ADD CONSTRAINT "rank_change_activities_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_activities" ADD CONSTRAINT "submission_activities_activity_id_activity_feeds_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_activities" ADD CONSTRAINT "submission_activities_submission_id_challenge_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."challenge_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_activities" ADD CONSTRAINT "submission_activities_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_activities" ADD CONSTRAINT "submission_activities_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_posts" ADD CONSTRAINT "user_posts_activity_id_activity_feeds_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_posts" ADD CONSTRAINT "user_posts_author_id_trip_participants_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."trip_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_pushes" ADD CONSTRAINT "notification_pushes_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_pushes" ADD CONSTRAINT "notification_pushes_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_schedule_executions" ADD CONSTRAINT "notification_schedule_executions_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_schedule_executions" ADD CONSTRAINT "notification_schedule_executions_schedule_id_notification_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."notification_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_schedules" ADD CONSTRAINT "notification_schedules_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_schedules" ADD CONSTRAINT "notification_schedules_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_shares" ADD CONSTRAINT "location_shares_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_shares" ADD CONSTRAINT "location_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_sharing_requests" ADD CONSTRAINT "location_sharing_requests_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_sharing_requests" ADD CONSTRAINT "location_sharing_requests_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_purchases" ADD CONSTRAINT "reward_purchases_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_purchases" ADD CONSTRAINT "reward_purchases_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_purchases" ADD CONSTRAINT "reward_purchases_purchased_by_id_users_id_fk" FOREIGN KEY ("purchased_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_purchases" ADD CONSTRAINT "reward_purchases_status_updated_by_id_users_id_fk" FOREIGN KEY ("status_updated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_sponsors" ADD CONSTRAINT "trip_sponsors_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_sponsors" ADD CONSTRAINT "trip_sponsors_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_agents" ADD CONSTRAINT "user_agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trip_insurance_steps_insurance_id_step_number_idx" ON "trip_insurance_steps" USING btree ("insurance_id","step_number");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_participants_user_id_trip_id_unique" ON "trip_participants" USING btree ("user_id","trip_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_participants_trip_id_wrist_number_unique" ON "trip_participants" USING btree ("trip_id","wrist_number");--> statement-breakpoint
CREATE INDEX "trip_participants_trip_id_group_id_idx" ON "trip_participants" USING btree ("trip_id","group_id");--> statement-breakpoint
CREATE INDEX "trip_resources_trip_id_type_idx" ON "trip_resources" USING btree ("trip_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "group_join_requests_trip_id_user_id_unique" ON "group_join_requests" USING btree ("trip_id","user_id");--> statement-breakpoint
CREATE INDEX "group_join_requests_group_id_created_at_idx" ON "group_join_requests" USING btree ("group_id","created_at");--> statement-breakpoint
CREATE INDEX "group_join_requests_user_id_trip_id_idx" ON "group_join_requests" USING btree ("user_id","trip_id");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_submissions_challenge_id_group_id_unique" ON "challenge_submissions" USING btree ("challenge_id","group_id");--> statement-breakpoint
CREATE INDEX "challenge_submissions_challenge_id_status_idx" ON "challenge_submissions" USING btree ("challenge_id","status");--> statement-breakpoint
CREATE INDEX "challenge_submissions_group_id_idx" ON "challenge_submissions" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_votes_challenge_id_submission_id_voter_id_unique" ON "challenge_votes" USING btree ("challenge_id","submission_id","voter_id");--> statement-breakpoint
CREATE INDEX "challenge_votes_challenge_id_idx" ON "challenge_votes" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "challenge_votes_submission_id_idx" ON "challenge_votes" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "challenges_trip_id_status_idx" ON "challenges" USING btree ("trip_id","status");--> statement-breakpoint
CREATE INDEX "challenges_is_recurring_idx" ON "challenges" USING btree ("is_recurring");--> statement-breakpoint
CREATE INDEX "submission_reports_submission_id_idx" ON "submission_reports" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "activity_feeds_trip_id_created_at_idx" ON "activity_feeds" USING btree ("trip_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_feeds_trip_id_is_pinned_idx" ON "activity_feeds" USING btree ("trip_id","is_pinned");--> statement-breakpoint
CREATE INDEX "activity_feeds_trip_id_is_hidden_idx" ON "activity_feeds" USING btree ("trip_id","is_hidden");--> statement-breakpoint
CREATE INDEX "activity_feeds_trip_id_activity_type_idx" ON "activity_feeds" USING btree ("trip_id","activity_type");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_reactions_activity_id_user_id_reaction_type_unique" ON "activity_reactions" USING btree ("activity_id","user_id","reaction_type");--> statement-breakpoint
CREATE INDEX "activity_reactions_activity_id_idx" ON "activity_reactions" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_reactions_user_id_idx" ON "activity_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "challenge_activities_challenge_id_idx" ON "challenge_activities" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "challenge_activities_event_type_idx" ON "challenge_activities" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "rank_change_activities_group_id_idx" ON "rank_change_activities" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "rank_change_activities_new_rank_idx" ON "rank_change_activities" USING btree ("new_rank");--> statement-breakpoint
CREATE INDEX "submission_activities_submission_id_idx" ON "submission_activities" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submission_activities_challenge_id_idx" ON "submission_activities" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "submission_activities_group_id_idx" ON "submission_activities" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "submission_activities_is_winner_idx" ON "submission_activities" USING btree ("is_winner");--> statement-breakpoint
CREATE INDEX "user_posts_author_id_idx" ON "user_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_delivery_started_at_idx" ON "notification_deliveries" USING btree ("delivery_started_at");--> statement-breakpoint
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_deliveries_schedule_id_idx" ON "notification_deliveries" USING btree ("schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_user_id_token_unique" ON "push_subscriptions" USING btree ("user_id","token");--> statement-breakpoint
CREATE UNIQUE INDEX "location_sharing_requests_sender_id_receiver_id_unique" ON "location_sharing_requests" USING btree ("sender_id","receiver_id");--> statement-breakpoint
CREATE INDEX "location_sharing_requests_receiver_id_status_idx" ON "location_sharing_requests" USING btree ("receiver_id","status");--> statement-breakpoint
CREATE INDEX "location_sharing_requests_sender_id_status_idx" ON "location_sharing_requests" USING btree ("sender_id","status");--> statement-breakpoint
CREATE INDEX "reward_purchases_reward_id_idx" ON "reward_purchases" USING btree ("reward_id");--> statement-breakpoint
CREATE INDEX "reward_purchases_group_id_idx" ON "reward_purchases" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "reward_purchases_status_idx" ON "reward_purchases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reward_purchases_status_updated_by_id_idx" ON "reward_purchases" USING btree ("status_updated_by_id");--> statement-breakpoint
CREATE INDEX "rewards_trip_id_idx" ON "rewards" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "sponsors_is_active_idx" ON "sponsors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sponsors_created_at_idx" ON "sponsors" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_sponsors_trip_id_sponsor_id_unique" ON "trip_sponsors" USING btree ("trip_id","sponsor_id");--> statement-breakpoint
CREATE INDEX "trip_sponsors_trip_id_idx" ON "trip_sponsors" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_sponsors_sponsor_id_idx" ON "trip_sponsors" USING btree ("sponsor_id");--> statement-breakpoint
CREATE INDEX "user_agents_timestamp_idx" ON "user_agents" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "user_agents_platform_idx" ON "user_agents" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "user_agents_user_id_idx" ON "user_agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_agents_user_agent_idx" ON "user_agents" USING btree ("user_agent");