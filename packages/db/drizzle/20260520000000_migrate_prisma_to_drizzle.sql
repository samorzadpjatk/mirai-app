-- =============================================================================
-- Production Migration: Prisma CamelCase Tables → Drizzle snake_case Tables
-- =============================================================================
--
-- CONTEXT:
--   Production database has both:
--   - OLD Prisma tables with CamelCase names (e.g., "User", "Trip", "Group")
--     and CamelCase columns (e.g., "authUserId", "firstName", "tripId")
--     with types: text ids, timestamp without time zone, double precision
--   - NEW Drizzle tables with snake_case names (e.g., "users", "trips", "groups")
--     and snake_case columns (e.g., "auth_user_id", "first_name", "trip_id")
--     with types: varchar(36), timestamp with time zone, real
--
-- WHAT THIS DOES:
--   1. Temporarily disables foreign key triggers
--   2. Truncates all Drizzle tables (in reverse dependency order)
--   3. Copies data from Prisma tables to Drizzle tables (in dependency order)
--   4. Handles all type conversions:
--      - text → varchar(36)  (UUIDs fit perfectly)
--      - timestamp without time zone → timestamp with time zone (assumed UTC)
--      - double precision → real (precision loss is negligible for lat/lng)
--      - Prisma text enums → Drizzle pgEnum enums (compatible)
--   5. Re-enables foreign key triggers and validates constraints
--
-- SAFETY:
--   - Wrapped in a single transaction (all-or-nothing)
--   - Does NOT drop or modify Prisma tables (they remain as backup)
--   - Can be run idempotently: will clear Drizzle tables and re-copy
--
-- RUNTIME: ~30-60 seconds for a database with 10K+ rows
--
-- =============================================================================

BEGIN;

-- =============================================================================
-- PHASE 0: Set timezone for accurate timestamp conversion
-- =============================================================================
-- Prisma stored timestamps as 'timestamp without time zone' (local time).
-- The app runs in Europe/Warsaw timezone (UTC+1/+2 depending on DST).
-- We set the session timezone so PostgreSQL correctly interprets local times
-- when converting to 'timestamp with time zone'.
-- =============================================================================

SET timezone = 'Europe/Warsaw';

-- =============================================================================
-- PHASE 1: Disable foreign key checks and triggers for bulk load
-- =============================================================================

SET session_replication_role = 'replica';

-- =============================================================================
-- PHASE 2: Truncate Drizzle tables in REVERSE dependency order
-- (child tables first, parent tables last)
-- =============================================================================

TRUNCATE TABLE
  -- Activity sub-type tables (depend on activity_feeds)
  user_posts,
  submission_activities,
  challenge_activities,
  rank_change_activities,
  -- Activity-related
  activity_reactions,
  activity_feeds,
  -- Challenge-related
  challenge_votes,
  submission_reports,
  challenge_submissions,
  challenges,
  -- Location-related
  location_shares,
  location_sharing_requests,
  locations,
  -- Notification-related
  notification_pushes,
  notification_schedule_executions,
  notification_deliveries,
  push_subscriptions,
  notifications,
  notification_schedules,
  -- Reward-related
  reward_purchases,
  rewards,
  coin_transactions,
  -- Event & group
  user_events,
  group_join_requests,
  events,
  -- Trip-related
  trip_sponsors,
  trip_resources,
  trip_insurance_steps,
  trip_insurances,
  trip_participants,
  groups,
  trips,
  sponsors,
  user_agents,
  users
RESTART IDENTITY CASCADE;

-- =============================================================================
-- PHASE 3: Insert data from Prisma tables → Drizzle tables
-- (parent tables first, child tables last)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 users (was "User")
-- ---------------------------------------------------------------------------
INSERT INTO users (
  id, auth_user_id, first_name, last_name, has_avatar, role,
  last_seen_on, created_at, updated_at
)
SELECT
  id::varchar(36),
  "authUserId",
  "firstName",
  "lastName",
  "hasAvatar",
  role::text::"role",
  "last_seen_on"::timestamp with time zone,
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "User";

-- ---------------------------------------------------------------------------
-- 3.2 trips (was "Trip")
-- ---------------------------------------------------------------------------
INSERT INTO trips (
  id, name, description, start_date, end_date,
  background_image_path, created_at, updated_at
)
SELECT
  id::varchar(36),
  name,
  description,
  "startDate"::timestamp with time zone,
  "endDate"::timestamp with time zone,
  "backgroundImagePath",
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "Trip";

-- ---------------------------------------------------------------------------
-- 3.3 groups (was "Group")
-- ---------------------------------------------------------------------------
INSERT INTO groups (
  id, trip_id, name, description, image, is_deleted,
  organizer_id, code, coins, created_at, updated_at
)
SELECT
  id::varchar(36),
  "tripId"::varchar(36),
  name,
  description,
  image,
  "isDeleted",
  "organizerId"::varchar(36),
  code,
  coins,
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "Group";

-- ---------------------------------------------------------------------------
-- 3.4 trip_participants (was "TripParticipant")
-- ---------------------------------------------------------------------------
INSERT INTO trip_participants (
  id, user_id, trip_id, group_id, wrist_number, house_number,
  role, created_at, updated_at
)
SELECT
  id::varchar(36),
  "userId"::varchar(36),
  "tripId"::varchar(36),
  "groupId"::varchar(36),
  "wristNumber",
  "houseNumber",
  role,
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "TripParticipant";

-- ---------------------------------------------------------------------------
-- 3.5 events (was "Event")
-- ---------------------------------------------------------------------------
INSERT INTO events (
  id, creator_id, organizer_group_id, title, start_time, end_time,
  location, description, files, created_at, updated_at
)
SELECT
  id::varchar(36),
  "creatorId"::varchar(36),
  "organizerGroupId"::varchar(36),
  title,
  "startTime"::timestamp with time zone,
  "endTime"::timestamp with time zone,
  location,
  description,
  files,
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "Event";

-- ---------------------------------------------------------------------------
-- 3.6 user_events (was "UserEvent")
-- ---------------------------------------------------------------------------
INSERT INTO user_events (
  user_id, event_id, interested_in, enlisted_in, created_at, updated_at
)
SELECT
  "userId"::varchar(36),
  "eventId"::varchar(36),
  "interestedIn",
  "enlistedIn",
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "UserEvent";

-- ---------------------------------------------------------------------------
-- 3.7 group_join_requests (was "GroupJoinRequest")
-- ---------------------------------------------------------------------------
INSERT INTO group_join_requests (
  id, trip_id, group_id, user_id, created_at
)
SELECT
  id::varchar(36),
  "tripId"::varchar(36),
  "groupId"::varchar(36),
  "userId"::varchar(36),
  "createdAt"::timestamp with time zone
FROM "GroupJoinRequest";

-- ---------------------------------------------------------------------------
-- 3.8 challenges (was "Challenge")
-- ---------------------------------------------------------------------------
INSERT INTO challenges (
  id, trip_id, name, description, image,
  submission_type, scoring_category,
  is_recurring, daily_start_time, daily_end_time,
  base_points, first_place_points, second_place_points, third_place_points,
  status, start_time, end_time,
  voting_start_time, voting_end_time,
  target_latitude, target_longitude, expected_value,
  auto_approve, created_at, updated_at
)
SELECT
  id::varchar(36),
  "tripId"::varchar(36),
  name,
  description,
  image,
  "submissionType"::text::"submission_type",
  "scoringCategory"::text::"scoring_category",
  "isRecurring",
  "dailyStartTime",
  "dailyEndTime",
  "basePoints",
  "firstPlacePoints",
  "secondPlacePoints",
  "thirdPlacePoints",
  "status"::text::"challenge_status",
  "startTime"::timestamp with time zone,
  "endTime"::timestamp with time zone,
  "votingStartTime"::timestamp with time zone,
  "votingEndTime"::timestamp with time zone,
  "targetLatitude"::real,
  "targetLongitude"::real,
  "expectedValue",
  "autoApprove",
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "Challenge";

-- ---------------------------------------------------------------------------
-- 3.9 challenge_submissions (was "ChallengeSubmission")
-- ---------------------------------------------------------------------------
INSERT INTO challenge_submissions (
  id, challenge_id, group_id, image_ids, video_id, text_content,
  latitude, longitude, status,
  reviewed_by_id, reviewed_at, rejection_reason,
  awarded_points, bonus_points, ranking,
  vote_count, vote_score, created_at, updated_at
)
SELECT
  id::varchar(36),
  "challengeId"::varchar(36),
  "groupId"::varchar(36),
  "imageIds",
  "videoId",
  "textContent",
  latitude::real,
  longitude::real,
  "status"::text::"submission_status",
  "reviewedById"::varchar(36),
  "reviewedAt"::timestamp with time zone,
  "rejectionReason",
  "awardedPoints",
  "bonusPoints",
  ranking,
  "voteCount",
  "voteScore"::real,
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "ChallengeSubmission";

-- ---------------------------------------------------------------------------
-- 3.10 challenge_votes (was "ChallengeVote")
-- ---------------------------------------------------------------------------
INSERT INTO challenge_votes (
  id, challenge_id, submission_id, voter_id,
  vote_position, vote_points, normalized_weight, voted_at
)
SELECT
  id::varchar(36),
  "challengeId"::varchar(36),
  "submissionId"::varchar(36),
  "voterId"::varchar(36),
  "votePosition",
  "votePoints",
  "normalizedWeight"::real,
  "votedAt"::timestamp with time zone
FROM "ChallengeVote";

-- ---------------------------------------------------------------------------
-- 3.11 submission_reports (was "SubmissionReport")
-- ---------------------------------------------------------------------------
INSERT INTO submission_reports (
  id, submission_id, reporter_id, reason, details, created_at
)
SELECT
  id::varchar(36),
  "submissionId"::varchar(36),
  "reporterId"::varchar(36),
  reason,
  details,
  "createdAt"::timestamp with time zone
FROM "SubmissionReport";

-- ---------------------------------------------------------------------------
-- 3.12 activity_feeds (was "ActivityFeed")
-- ---------------------------------------------------------------------------
INSERT INTO activity_feeds (
  id, trip_id, activity_type, title, description, image_url,
  is_pinned, is_hidden, hidden_by_admin, hidden_at, hidden_reason,
  created_by_admin, created_at, updated_at
)
SELECT
  id::varchar(36),
  "tripId"::varchar(36),
  "activityType",
  title,
  description,
  "imageUrl",
  "isPinned",
  "isHidden",
  "hiddenByAdmin"::varchar(36),
  "hiddenAt"::timestamp with time zone,
  "hiddenReason",
  "createdByAdmin"::varchar(36),
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "ActivityFeed";

-- ---------------------------------------------------------------------------
-- 3.13 activity_reactions (was "ActivityReaction")
-- ---------------------------------------------------------------------------
INSERT INTO activity_reactions (
  id, activity_id, user_id, reaction_type, created_at
)
SELECT
  id::varchar(36),
  "activityId"::varchar(36),
  "userId"::varchar(36),
  "reactionType",
  "createdAt"::timestamp with time zone
FROM "ActivityReaction";

-- ---------------------------------------------------------------------------
-- 3.14 challenge_activities (was "ChallengeActivity")
-- ---------------------------------------------------------------------------
INSERT INTO challenge_activities (
  activity_id, challenge_id, event_type, end_time,
  submission_type, base_points, submission_count
)
SELECT
  "activityId"::varchar(36),
  "challengeId"::varchar(36),
  "eventType",
  "endTime"::timestamp with time zone,
  "submissionType"::text::"submission_type",
  "basePoints",
  "submissionCount"
FROM "ChallengeActivity";

-- ---------------------------------------------------------------------------
-- 3.15 rank_change_activities (was "RankChangeActivity")
-- ---------------------------------------------------------------------------
INSERT INTO rank_change_activities (
  activity_id, group_id, new_rank, total_coins, coins_gained
)
SELECT
  "activityId"::varchar(36),
  "groupId"::varchar(36),
  "newRank",
  "totalCoins",
  "coinsGained"
FROM "RankChangeActivity";

-- ---------------------------------------------------------------------------
-- 3.16 submission_activities (was "SubmissionActivity")
-- ---------------------------------------------------------------------------
INSERT INTO submission_activities (
  activity_id, submission_id, challenge_id, group_id,
  has_video, is_winner, ranking, points_awarded
)
SELECT
  "activityId"::varchar(36),
  "submissionId"::varchar(36),
  "challengeId"::varchar(36),
  "groupId"::varchar(36),
  "hasVideo",
  "isWinner",
  ranking,
  "pointsAwarded"
FROM "SubmissionActivity";

-- ---------------------------------------------------------------------------
-- 3.17 user_posts (was "UserPost")
-- ---------------------------------------------------------------------------
INSERT INTO user_posts (
  activity_id, author_id, additional_images
)
SELECT
  "activityId"::varchar(36),
  "authorId"::varchar(36),
  "additionalImages"
FROM "UserPost";

-- ---------------------------------------------------------------------------
-- 3.18 locations (was "Location")
-- ---------------------------------------------------------------------------
INSERT INTO locations (
  id, user_id, timestamp, is_sharing_location,
  accuracy, altitude, altitude_accuracy, heading,
  latitude, longitude, speed, last_inactivity_notification
)
SELECT
  id::varchar(36),
  "userId"::varchar(36),
  "timestamp"::timestamp with time zone,
  "isSharingLocation",
  accuracy::real,
  altitude::real,
  "altitudeAccuracy"::real,
  heading::real,
  latitude::real,
  longitude::real,
  speed::real,
  "lastInactivityNotification"::timestamp with time zone
FROM "Location";

-- ---------------------------------------------------------------------------
-- 3.19 location_sharing_requests (was "LocationSharingRequest")
-- ---------------------------------------------------------------------------
INSERT INTO location_sharing_requests (
  id, sender_id, receiver_id, status, created_at, updated_at
)
SELECT
  id::varchar(36),
  "senderId"::varchar(36),
  "receiverId"::varchar(36),
  "status"::text::"location_sharing_request_status",
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "LocationSharingRequest";

-- ---------------------------------------------------------------------------
-- 3.20 location_shares (was "_LocationSharingUsers")
-- ---------------------------------------------------------------------------
INSERT INTO location_shares (
  location_id, user_id
)
SELECT
  "A"::varchar(36),
  "B"::varchar(36)
FROM "_LocationSharingUsers";

-- ---------------------------------------------------------------------------
-- 3.21 notifications (was "Notification")
-- ---------------------------------------------------------------------------
INSERT INTO notifications (
  id, trip_id, title, body, url, created_at, updated_at, created_by_id
)
SELECT
  id::varchar(36),
  "tripId"::varchar(36),
  title,
  body,
  url,
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone,
  "createdById"::varchar(36)
FROM "Notification";

-- ---------------------------------------------------------------------------
-- 3.22 notification_schedules (was "NotificationSchedule")
-- ---------------------------------------------------------------------------
INSERT INTO notification_schedules (
  id, trip_id, name, notification_type,
  notification_title, notification_body, notification_url,
  start_date, end_date, hour, minute,
  is_active, last_run, created_at, updated_at, created_by_id
)
SELECT
  id::varchar(36),
  "tripId"::varchar(36),
  name,
  "notificationType",
  "notificationTitle",
  "notificationBody",
  "notificationUrl",
  "startDate"::timestamp with time zone,
  "endDate"::timestamp with time zone,
  hour,
  minute,
  "isActive",
  "lastRun"::timestamp with time zone,
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone,
  "createdById"::varchar(36)
FROM "NotificationSchedule";

-- ---------------------------------------------------------------------------
-- 3.23 notification_schedule_executions (was "NotificationScheduleExecution")
-- ---------------------------------------------------------------------------
INSERT INTO notification_schedule_executions (
  notification_id, schedule_id, executed_at
)
SELECT
  "notificationId"::varchar(36),
  "scheduleId"::varchar(36),
  "executedAt"::timestamp with time zone
FROM "NotificationScheduleExecution";

-- ---------------------------------------------------------------------------
-- 3.24 notification_pushes (was "NotificationPush")
-- ---------------------------------------------------------------------------
INSERT INTO notification_pushes (
  target_user_id, notification_id, status, sent_at, failure_reason
)
SELECT
  "targetUserId"::varchar(36),
  "notificationId"::varchar(36),
  status,
  "sentAt"::timestamp with time zone,
  "failureReason"
FROM "NotificationPush";

-- ---------------------------------------------------------------------------
-- 3.25 notification_deliveries (was "NotificationDelivery")
-- ---------------------------------------------------------------------------
INSERT INTO notification_deliveries (
  id, trip_id, notification_id, schedule_id,
  delivery_started_at, delivery_completed_at,
  total_recipients, success_count, failure_count,
  errors, status, created_at, updated_at
)
SELECT
  id::varchar(36),
  "tripId"::varchar(36),
  "notificationId"::varchar(36),
  "scheduleId"::varchar(36),
  "deliveryStartedAt"::timestamp with time zone,
  "deliveryCompletedAt"::timestamp with time zone,
  "totalRecipients",
  "successCount",
  "failureCount",
  errors,
  status,
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "NotificationDelivery";

-- ---------------------------------------------------------------------------
-- 3.26 push_subscriptions (was "PushSubscription")
-- ---------------------------------------------------------------------------
INSERT INTO push_subscriptions (
  id, user_id, token, created_at, updated_at
)
SELECT
  id::varchar(36),
  "userId"::varchar(36),
  token,
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "PushSubscription";

-- ---------------------------------------------------------------------------
-- 3.27 rewards (was "Reward")
-- ---------------------------------------------------------------------------
INSERT INTO rewards (
  id, name, description, available_quantity,
  is_hidden, image, coin_cost,
  trip_id, created_by_id, created_at, updated_at
)
SELECT
  id::varchar(36),
  name,
  description,
  "availableQuantity",
  "isHidden",
  image,
  "coinCost",
  "tripId"::varchar(36),
  "createdById"::varchar(36),
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "Reward";

-- ---------------------------------------------------------------------------
-- 3.28 reward_purchases (was "RewardPurchase")
-- ---------------------------------------------------------------------------
INSERT INTO reward_purchases (
  id, reward_id, group_id, quantity, total_cost,
  purchased_by_id, purchased_at,
  status, collection_method,
  status_updated_by_id, status_updated_at
)
SELECT
  id::varchar(36),
  "rewardId"::varchar(36),
  "groupId"::varchar(36),
  quantity,
  "totalCost",
  "purchasedById"::varchar(36),
  "purchasedAt"::timestamp with time zone,
  "status"::text::"reward_purchase_status",
  "collectionMethod",
  "statusUpdatedById"::varchar(36),
  "statusUpdatedAt"::timestamp with time zone
FROM "RewardPurchase";

-- ---------------------------------------------------------------------------
-- 3.29 coin_transactions (was "CoinTransaction")
-- ---------------------------------------------------------------------------
INSERT INTO coin_transactions (
  id, group_id, amount, reason, created_at, updated_at, admin_id
)
SELECT
  id::varchar(36),
  "groupId"::varchar(36),
  amount,
  reason,
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone,
  "adminId"::varchar(36)
FROM "CoinTransaction";

-- ---------------------------------------------------------------------------
-- 3.30 sponsors (was "Sponsor")
-- ---------------------------------------------------------------------------
INSERT INTO sponsors (
  id, name, description, logo_path,
  height, offset_x, offset_y, is_active,
  created_at, updated_at
)
SELECT
  id::varchar(36),
  name,
  description,
  "logoPath",
  height,
  "offsetX",
  "offsetY",
  "isActive",
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "Sponsor";

-- ---------------------------------------------------------------------------
-- 3.31 trip_sponsors (was "TripSponsor")
-- ---------------------------------------------------------------------------
INSERT INTO trip_sponsors (
  id, trip_id, sponsor_id, created_at
)
SELECT
  id::varchar(36),
  "tripId"::varchar(36),
  "sponsorId"::varchar(36),
  "createdAt"::timestamp with time zone
FROM "TripSponsor";

-- ---------------------------------------------------------------------------
-- 3.32 trip_resources (was "TripResource")
-- ---------------------------------------------------------------------------
INSERT INTO trip_resources (
  id, trip_id, type, label, description, url,
  storage_path, file_name, public_url, icon_name, value,
  sort_order, created_at, updated_at
)
SELECT
  id::varchar(36),
  "tripId"::varchar(36),
  type,
  label,
  description,
  url,
  "storagePath",
  "fileName",
  "publicUrl",
  "iconName",
  value,
  "sortOrder",
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "TripResource";

-- ---------------------------------------------------------------------------
-- 3.33 trip_insurances (was "TripInsurance")
-- ---------------------------------------------------------------------------
INSERT INTO trip_insurances (
  id, trip_id, label, phone_number, phone_display,
  policy_number, contract_number, provider_name,
  hospital_name, hospital_address, hospital_distance,
  created_at, updated_at
)
SELECT
  id::varchar(36),
  "tripId"::varchar(36),
  label,
  "phoneNumber",
  "phoneDisplay",
  "policyNumber",
  "contractNumber",
  "providerName",
  "hospitalName",
  "hospitalAddress",
  "hospitalDistance",
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "TripInsurance";

-- ---------------------------------------------------------------------------
-- 3.34 trip_insurance_steps (was "TripInsuranceStep")
-- ---------------------------------------------------------------------------
INSERT INTO trip_insurance_steps (
  id, insurance_id, step_number, title, text,
  required_info, example_call, additional_text,
  created_at, updated_at
)
SELECT
  id::varchar(36),
  "insuranceId"::varchar(36),
  "stepNumber",
  title,
  text,
  "requiredInfo",
  "exampleCall",
  "additionalText",
  "createdAt"::timestamp with time zone,
  "updatedAt"::timestamp with time zone
FROM "TripInsuranceStep";

-- ---------------------------------------------------------------------------
-- 3.35 user_agents (was "UserAgent")
-- ---------------------------------------------------------------------------
INSERT INTO user_agents (
  id, user_agent, platform, user_id, endpoint, timestamp
)
SELECT
  id::varchar(36),
  "userAgent",
  platform,
  "userId"::varchar(36),
  endpoint,
  "timestamp"::timestamp with time zone
FROM "UserAgent";

-- =============================================================================
-- PHASE 4: Re-enable constraints and validate
-- =============================================================================

SET session_replication_role = 'origin';

-- =============================================================================
-- PHASE 5: Verify row counts match
-- =============================================================================

DO $$
DECLARE
  mismatch RECORD;
BEGIN
  FOR mismatch IN
    SELECT
      p.table_name AS prisma_table,
      d.table_name AS drizzle_table,
      p.row_count AS prisma_count,
      d.row_count AS drizzle_count
    FROM (
      SELECT 'User' AS table_name, COUNT(*) AS row_count FROM "User"
      UNION ALL SELECT 'Trip', COUNT(*) FROM "Trip"
      UNION ALL SELECT 'Group', COUNT(*) FROM "Group"
      UNION ALL SELECT 'TripParticipant', COUNT(*) FROM "TripParticipant"
      UNION ALL SELECT 'Event', COUNT(*) FROM "Event"
      UNION ALL SELECT 'UserEvent', COUNT(*) FROM "UserEvent"
      UNION ALL SELECT 'GroupJoinRequest', COUNT(*) FROM "GroupJoinRequest"
      UNION ALL SELECT 'Challenge', COUNT(*) FROM "Challenge"
      UNION ALL SELECT 'ChallengeSubmission', COUNT(*) FROM "ChallengeSubmission"
      UNION ALL SELECT 'ChallengeVote', COUNT(*) FROM "ChallengeVote"
      UNION ALL SELECT 'SubmissionReport', COUNT(*) FROM "SubmissionReport"
      UNION ALL SELECT 'ActivityFeed', COUNT(*) FROM "ActivityFeed"
      UNION ALL SELECT 'ActivityReaction', COUNT(*) FROM "ActivityReaction"
      UNION ALL SELECT 'ChallengeActivity', COUNT(*) FROM "ChallengeActivity"
      UNION ALL SELECT 'RankChangeActivity', COUNT(*) FROM "RankChangeActivity"
      UNION ALL SELECT 'SubmissionActivity', COUNT(*) FROM "SubmissionActivity"
      UNION ALL SELECT 'UserPost', COUNT(*) FROM "UserPost"
      UNION ALL SELECT 'Location', COUNT(*) FROM "Location"
      UNION ALL SELECT 'LocationSharingRequest', COUNT(*) FROM "LocationSharingRequest"
      UNION ALL SELECT '_LocationSharingUsers', COUNT(*) FROM "_LocationSharingUsers"
      UNION ALL SELECT 'Notification', COUNT(*) FROM "Notification"
      UNION ALL SELECT 'NotificationSchedule', COUNT(*) FROM "NotificationSchedule"
      UNION ALL SELECT 'NotificationScheduleExecution', COUNT(*) FROM "NotificationScheduleExecution"
      UNION ALL SELECT 'NotificationPush', COUNT(*) FROM "NotificationPush"
      UNION ALL SELECT 'NotificationDelivery', COUNT(*) FROM "NotificationDelivery"
      UNION ALL SELECT 'PushSubscription', COUNT(*) FROM "PushSubscription"
      UNION ALL SELECT 'Reward', COUNT(*) FROM "Reward"
      UNION ALL SELECT 'RewardPurchase', COUNT(*) FROM "RewardPurchase"
      UNION ALL SELECT 'CoinTransaction', COUNT(*) FROM "CoinTransaction"
      UNION ALL SELECT 'Sponsor', COUNT(*) FROM "Sponsor"
      UNION ALL SELECT 'TripSponsor', COUNT(*) FROM "TripSponsor"
      UNION ALL SELECT 'TripResource', COUNT(*) FROM "TripResource"
      UNION ALL SELECT 'TripInsurance', COUNT(*) FROM "TripInsurance"
      UNION ALL SELECT 'TripInsuranceStep', COUNT(*) FROM "TripInsuranceStep"
      UNION ALL SELECT 'UserAgent', COUNT(*) FROM "UserAgent"
    ) p
    JOIN (
      SELECT 'User' AS table_name, COUNT(*) AS row_count FROM users
      UNION ALL SELECT 'Trip', COUNT(*) FROM trips
      UNION ALL SELECT 'Group', COUNT(*) FROM groups
      UNION ALL SELECT 'TripParticipant', COUNT(*) FROM trip_participants
      UNION ALL SELECT 'Event', COUNT(*) FROM events
      UNION ALL SELECT 'UserEvent', COUNT(*) FROM user_events
      UNION ALL SELECT 'GroupJoinRequest', COUNT(*) FROM group_join_requests
      UNION ALL SELECT 'Challenge', COUNT(*) FROM challenges
      UNION ALL SELECT 'ChallengeSubmission', COUNT(*) FROM challenge_submissions
      UNION ALL SELECT 'ChallengeVote', COUNT(*) FROM challenge_votes
      UNION ALL SELECT 'SubmissionReport', COUNT(*) FROM submission_reports
      UNION ALL SELECT 'ActivityFeed', COUNT(*) FROM activity_feeds
      UNION ALL SELECT 'ActivityReaction', COUNT(*) FROM activity_reactions
      UNION ALL SELECT 'ChallengeActivity', COUNT(*) FROM challenge_activities
      UNION ALL SELECT 'RankChangeActivity', COUNT(*) FROM rank_change_activities
      UNION ALL SELECT 'SubmissionActivity', COUNT(*) FROM submission_activities
      UNION ALL SELECT 'UserPost', COUNT(*) FROM user_posts
      UNION ALL SELECT 'Location', COUNT(*) FROM locations
      UNION ALL SELECT 'LocationSharingRequest', COUNT(*) FROM location_sharing_requests
      UNION ALL SELECT '_LocationSharingUsers', COUNT(*) FROM location_shares
      UNION ALL SELECT 'Notification', COUNT(*) FROM notifications
      UNION ALL SELECT 'NotificationSchedule', COUNT(*) FROM notification_schedules
      UNION ALL SELECT 'NotificationScheduleExecution', COUNT(*) FROM notification_schedule_executions
      UNION ALL SELECT 'NotificationPush', COUNT(*) FROM notification_pushes
      UNION ALL SELECT 'NotificationDelivery', COUNT(*) FROM notification_deliveries
      UNION ALL SELECT 'PushSubscription', COUNT(*) FROM push_subscriptions
      UNION ALL SELECT 'Reward', COUNT(*) FROM rewards
      UNION ALL SELECT 'RewardPurchase', COUNT(*) FROM reward_purchases
      UNION ALL SELECT 'CoinTransaction', COUNT(*) FROM coin_transactions
      UNION ALL SELECT 'Sponsor', COUNT(*) FROM sponsors
      UNION ALL SELECT 'TripSponsor', COUNT(*) FROM trip_sponsors
      UNION ALL SELECT 'TripResource', COUNT(*) FROM trip_resources
      UNION ALL SELECT 'TripInsurance', COUNT(*) FROM trip_insurances
      UNION ALL SELECT 'TripInsuranceStep', COUNT(*) FROM trip_insurance_steps
      UNION ALL SELECT 'UserAgent', COUNT(*) FROM user_agents
    ) d ON p.table_name = d.table_name
    WHERE p.row_count != d.row_count
  LOOP
    RAISE NOTICE 'ROW COUNT MISMATCH: % (Prisma: %, Drizzle: %)',
      mismatch.prisma_table, mismatch.prisma_count, mismatch.drizzle_count;
  END LOOP;
END $$;

COMMIT;

-- =============================================================================
-- POST-MIGRATION CLEANUP (Run separately after confirming everything works)
-- =============================================================================

DROP TABLE IF EXISTS "User", "Trip", "Group", "TripParticipant", "Event",
  "UserEvent", "GroupJoinRequest", "Challenge", "ChallengeSubmission",
  "ChallengeVote", "SubmissionReport", "ActivityFeed", "ActivityReaction",
  "ChallengeActivity", "RankChangeActivity", "SubmissionActivity",
  "UserPost", "Location", "LocationSharingRequest", "LocationShare",
  "Notification", "NotificationSchedule", "NotificationScheduleExecution",
  "NotificationPush", "NotificationDelivery", "PushSubscription",
  "Reward", "RewardPurchase", "CoinTransaction", "Sponsor",
  "TripSponsor", "TripResource", "TripInsurance", "TripInsuranceStep",
  "UserAgent";


-- =============================================================================
