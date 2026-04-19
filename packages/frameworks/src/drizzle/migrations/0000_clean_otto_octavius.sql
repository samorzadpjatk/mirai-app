CREATE TYPE "public"."Role" AS ENUM('USER', 'ADMIN', 'MODERATOR', 'SERVICE');--> statement-breakpoint
CREATE TYPE "public"."TripStatus" AS ENUM('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ChallengeStatus" AS ENUM('HIDDEN', 'VISIBLE', 'ACTIVE', 'VOTING_PHASE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ScoringCategory" AS ENUM('SPEED', 'UNLIMITED', 'JUDGED_STAFF', 'PEER_VOTING');--> statement-breakpoint
CREATE TYPE "public"."SubmissionStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."SubmissionType" AS ENUM('IMAGE', 'MULTI_IMAGE', 'VIDEO', 'TEXT', 'IMAGE_LOCATION', 'LOCATION', 'QR_CODE');--> statement-breakpoint
CREATE TYPE "public"."VotePosition" AS ENUM('UPVOTE', 'DOWNVOTE', 'NEUTRAL');--> statement-breakpoint
CREATE TYPE "public"."LocationSharingRequestStatus" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."NotificationPriority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."NotificationStatus" AS ENUM('DRAFT', 'READY', 'SENT', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."DeliveryStatus" AS ENUM('pending', 'success', 'partial_failure', 'failure');--> statement-breakpoint
CREATE TYPE "public"."RewardPurchaseStatus" AS ENUM('BOUGHT', 'ACCEPTED', 'IN_DELIVERY', 'CANCELLED', 'DELIVERED');--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authUserId" varchar(255) NOT NULL,
	"firstName" varchar(255) NOT NULL,
	"lastName" varchar(255) NOT NULL,
	"hasAvatar" boolean DEFAULT false NOT NULL,
	"role" "Role" DEFAULT 'USER' NOT NULL,
	"last_seen_on" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_authUserId_unique" UNIQUE("authUserId")
);
--> statement-breakpoint
CREATE TABLE "TripInsurance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"provider" varchar(255),
	"policyNumber" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TripInsuranceStep" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insuranceId" uuid NOT NULL,
	"stepNumber" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TripParticipant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"tripId" uuid NOT NULL,
	"groupId" uuid,
	"wristNumber" varchar(50),
	"houseNumber" varchar(50),
	"role" varchar(20) DEFAULT 'MEMBER' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TripResource" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"label" varchar(255) NOT NULL,
	"description" text,
	"url" text,
	"storagePath" text,
	"fileName" varchar(255),
	"publicUrl" text,
	"iconName" varchar(100),
	"value" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Trip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"backgroundImagePath" text,
	"status" "TripStatus" DEFAULT 'PLANNING' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "GroupJoinRequest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid NOT NULL,
	"groupId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image" text,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"organizerId" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Group_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ChallengeSubmission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challengeId" uuid NOT NULL,
	"groupId" uuid NOT NULL,
	"imageIds" text[] DEFAULT '{}',
	"videoId" text,
	"textContent" text,
	"latitude" real,
	"longitude" real,
	"status" "SubmissionStatus" DEFAULT 'PENDING' NOT NULL,
	"reviewedById" uuid,
	"reviewedAt" timestamp,
	"rejectionReason" text,
	"awardedPoints" integer DEFAULT 0 NOT NULL,
	"bonusPoints" integer DEFAULT 0 NOT NULL,
	"ranking" integer,
	"voteCount" integer DEFAULT 0 NOT NULL,
	"voteScore" real DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ChallengeVote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challengeId" uuid NOT NULL,
	"submissionId" uuid NOT NULL,
	"voterId" uuid NOT NULL,
	"tripParticipantId" uuid NOT NULL,
	"position" "VotePosition" NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"isStaffVote" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Challenge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image" text,
	"submissionType" "SubmissionType" NOT NULL,
	"scoringCategory" "ScoringCategory" NOT NULL,
	"isRecurring" boolean DEFAULT false NOT NULL,
	"dailyStartTime" varchar(10),
	"dailyEndTime" varchar(10),
	"basePoints" integer DEFAULT 0 NOT NULL,
	"firstPlacePoints" integer,
	"secondPlacePoints" integer,
	"thirdPlacePoints" integer,
	"status" "ChallengeStatus" DEFAULT 'HIDDEN' NOT NULL,
	"startTime" timestamp,
	"endTime" timestamp,
	"votingStartTime" timestamp,
	"votingEndTime" timestamp,
	"targetLatitude" real,
	"targetLongitude" real,
	"expectedValue" text,
	"autoApprove" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LocationSharingRequest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requesterId" uuid NOT NULL,
	"targetId" uuid NOT NULL,
	"status" "LocationSharingRequestStatus" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_LocationUsersShareWith" (
	"A" uuid NOT NULL,
	"B" uuid NOT NULL,
	CONSTRAINT "_LocationUsersShareWith_A_B_pk" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "Location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"isSharingLocation" boolean DEFAULT false NOT NULL,
	"accuracy" real,
	"altitude" real,
	"altitudeAccuracy" real,
	"heading" real,
	"latitude" real,
	"longitude" real,
	"speed" real,
	"lastInactivityNotification" timestamp,
	CONSTRAINT "Location_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "ActivityFeed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid NOT NULL,
	"activityType" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"imageUrl" text,
	"isPinned" boolean DEFAULT false NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"hiddenByAdmin" uuid,
	"hiddenAt" timestamp,
	"hiddenReason" text,
	"createdByAdmin" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ActivityReaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activityId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"reactionType" varchar(50) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"url" text,
	"status" "NotificationStatus" DEFAULT 'DRAFT' NOT NULL,
	"priority" "NotificationPriority" DEFAULT 'NORMAL' NOT NULL,
	"scheduledFor" timestamp,
	"sentAt" timestamp,
	"failureReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdById" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PushSubscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"expoPushToken" varchar(255) NOT NULL,
	"platform" varchar(20) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "NotificationDelivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid,
	"notificationId" uuid NOT NULL,
	"scheduleId" uuid,
	"deliveryStartedAt" timestamp,
	"deliveryCompletedAt" timestamp,
	"totalRecipients" integer,
	"successCount" integer,
	"failureCount" integer,
	"errors" text,
	"status" "DeliveryStatus" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "NotificationDelivery_notificationId_unique" UNIQUE("notificationId")
);
--> statement-breakpoint
CREATE TABLE "NotificationScheduleExecution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheduleId" uuid NOT NULL,
	"notificationId" uuid NOT NULL,
	"executedAt" timestamp DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	CONSTRAINT "NotificationScheduleExecution_notificationId_unique" UNIQUE("notificationId")
);
--> statement-breakpoint
CREATE TABLE "NotificationSchedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"notificationType" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"scheduledFor" timestamp NOT NULL,
	"sendToAll" boolean DEFAULT false NOT NULL,
	"targetGroupIds" text[],
	"isSent" boolean DEFAULT false NOT NULL,
	"isDraft" boolean DEFAULT false NOT NULL,
	"createdBy" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CoinTransaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid NOT NULL,
	"groupId" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" text,
	"adminId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RewardPurchase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rewardId" uuid NOT NULL,
	"groupId" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"totalCost" integer NOT NULL,
	"status" "RewardPurchaseStatus" DEFAULT 'BOUGHT' NOT NULL,
	"collectionMethod" varchar(100),
	"purchasedById" uuid NOT NULL,
	"statusUpdatedById" uuid,
	"statusUpdatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Reward" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"availableQuantity" integer NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"image" text,
	"coinCost" integer NOT NULL,
	"tripId" uuid NOT NULL,
	"createdById" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Sponsor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"logoPath" text NOT NULL,
	"height" integer,
	"offsetX" integer,
	"offsetY" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TripSponsor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid NOT NULL,
	"sponsorId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SubmissionReport" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submissionId" uuid NOT NULL,
	"reporterId" uuid NOT NULL,
	"reason" varchar(100) NOT NULL,
	"details" text,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"reviewedById" uuid,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "better_auth_account" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "better_auth_session" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"token" varchar(255) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "better_auth_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "better_auth_user" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(2048),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "better_auth_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "better_auth_verification" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "TripInsurance" ADD CONSTRAINT "TripInsurance_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TripInsuranceStep" ADD CONSTRAINT "TripInsuranceStep_insuranceId_TripInsurance_id_fk" FOREIGN KEY ("insuranceId") REFERENCES "public"."TripInsurance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TripParticipant" ADD CONSTRAINT "TripParticipant_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TripResource" ADD CONSTRAINT "TripResource_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Group" ADD CONSTRAINT "Group_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChallengeSubmission" ADD CONSTRAINT "ChallengeSubmission_challengeId_Challenge_id_fk" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChallengeSubmission" ADD CONSTRAINT "ChallengeSubmission_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChallengeVote" ADD CONSTRAINT "ChallengeVote_challengeId_Challenge_id_fk" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChallengeVote" ADD CONSTRAINT "ChallengeVote_submissionId_ChallengeSubmission_id_fk" FOREIGN KEY ("submissionId") REFERENCES "public"."ChallengeSubmission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_LocationUsersShareWith" ADD CONSTRAINT "_LocationUsersShareWith_A_User_id_fk" FOREIGN KEY ("A") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_LocationUsersShareWith" ADD CONSTRAINT "_LocationUsersShareWith_B_User_id_fk" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityFeed" ADD CONSTRAINT "ActivityFeed_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityReaction" ADD CONSTRAINT "ActivityReaction_activityId_ActivityFeed_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."ActivityFeed"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "NotificationSchedule" ADD CONSTRAINT "NotificationSchedule_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_adminId_User_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RewardPurchase" ADD CONSTRAINT "RewardPurchase_rewardId_Reward_id_fk" FOREIGN KEY ("rewardId") REFERENCES "public"."Reward"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RewardPurchase" ADD CONSTRAINT "RewardPurchase_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TripSponsor" ADD CONSTRAINT "TripSponsor_sponsorId_Sponsor_id_fk" FOREIGN KEY ("sponsorId") REFERENCES "public"."Sponsor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubmissionReport" ADD CONSTRAINT "SubmissionReport_submissionId_ChallengeSubmission_id_fk" FOREIGN KEY ("submissionId") REFERENCES "public"."ChallengeSubmission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubmissionReport" ADD CONSTRAINT "SubmissionReport_reviewedById_User_id_fk" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "better_auth_account" ADD CONSTRAINT "better_auth_account_user_id_better_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."better_auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "better_auth_session" ADD CONSTRAINT "better_auth_session_user_id_better_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."better_auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_created_at_id_idx" ON "User" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "trip_insurance_trip_id_idx" ON "TripInsurance" USING btree ("tripId");--> statement-breakpoint
CREATE INDEX "trip_insurance_created_at_id_idx" ON "TripInsurance" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "trip_insurance_steps_insurance_id_idx" ON "TripInsuranceStep" USING btree ("insuranceId");--> statement-breakpoint
CREATE INDEX "trip_insurance_steps_step_number_idx" ON "TripInsuranceStep" USING btree ("insuranceId","stepNumber");--> statement-breakpoint
CREATE INDEX "trip_insurance_steps_created_at_id_idx" ON "TripInsuranceStep" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "trip_participants_created_at_id_idx" ON "TripParticipant" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "trip_resources_created_at_id_idx" ON "TripResource" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "trips_created_at_id_idx" ON "Trip" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "group_join_requests_created_at_id_idx" ON "GroupJoinRequest" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "groups_created_at_id_idx" ON "Group" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "challenge_submissions_created_at_id_idx" ON "ChallengeSubmission" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "challenge_submissions_vote_score_id_idx" ON "ChallengeSubmission" USING btree ("voteScore","id");--> statement-breakpoint
CREATE INDEX "challenge_votes_created_at_id_idx" ON "ChallengeVote" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "challenges_created_at_id_idx" ON "Challenge" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "location_sharing_requests_created_at_id_idx" ON "LocationSharingRequest" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "location_users_share_with_A_idx" ON "_LocationUsersShareWith" USING btree ("A");--> statement-breakpoint
CREATE INDEX "location_users_share_with_B_idx" ON "_LocationUsersShareWith" USING btree ("B");--> statement-breakpoint
CREATE INDEX "locations_timestamp_id_idx" ON "Location" USING btree ("timestamp","id");--> statement-breakpoint
CREATE INDEX "activity_feed_pinned_created_at_id_idx" ON "ActivityFeed" USING btree ("isPinned","createdAt","id");--> statement-breakpoint
CREATE INDEX "activity_reactions_created_at_id_idx" ON "ActivityReaction" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "notifications_created_at_id_idx" ON "Notification" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "push_subscriptions_created_at_id_idx" ON "PushSubscription" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_created_at_id_idx" ON "NotificationDelivery" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "notification_schedule_executions_executed_at_id_idx" ON "NotificationScheduleExecution" USING btree ("executedAt","id");--> statement-breakpoint
CREATE INDEX "notification_schedules_created_at_id_idx" ON "NotificationSchedule" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "coin_transactions_created_at_id_idx" ON "CoinTransaction" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "reward_purchases_created_at_id_idx" ON "RewardPurchase" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "rewards_created_at_id_idx" ON "Reward" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "sponsors_created_at_id_idx" ON "Sponsor" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "trip_sponsors_created_at_id_idx" ON "TripSponsor" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "submission_reports_created_at_id_idx" ON "SubmissionReport" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "better_auth_account_user_id_idx" ON "better_auth_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "better_auth_account_provider_idx" ON "better_auth_account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "better_auth_session_token_idx" ON "better_auth_session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "better_auth_session_user_id_idx" ON "better_auth_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "better_auth_session_expires_at_idx" ON "better_auth_session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "better_auth_user_email_idx" ON "better_auth_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "better_auth_user_created_at_idx" ON "better_auth_user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "better_auth_verification_identifier_idx" ON "better_auth_verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "better_auth_verification_expires_at_idx" ON "better_auth_verification" USING btree ("expires_at");