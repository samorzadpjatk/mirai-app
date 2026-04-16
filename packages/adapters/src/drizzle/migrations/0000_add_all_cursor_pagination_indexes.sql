-- Migration: Add composite indexes for cursor pagination - Combined
-- Created: 2026-04-16
-- Purpose: Optimize cursor-based pagination queries across all tables
-- This file combines both primary and secondary index migrations

-- ==========================================
-- PRIMARY TABLES (High Priority)
-- ==========================================

-- Events table: index on (startTime, id) for startTime-based pagination
CREATE INDEX IF NOT EXISTS "events_start_time_id_idx" ON "Event" ("startTime", "id");

-- Challenges table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "challenges_created_at_id_idx" ON "Challenge" ("createdAt", "id");

-- Notifications table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "notifications_created_at_id_idx" ON "Notification" ("createdAt", "id");

-- Groups table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "groups_created_at_id_idx" ON "Group" ("createdAt", "id");

-- Sponsors table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "sponsors_created_at_id_idx" ON "Sponsor" ("createdAt", "id");

-- Activity Feed table: index on (isPinned, createdAt, id) for pinned-first pagination
CREATE INDEX IF NOT EXISTS "activity_feed_pinned_created_at_id_idx" ON "ActivityFeed" ("isPinned", "createdAt", "id");

-- ==========================================
-- SECONDARY TABLES
-- ==========================================

-- Challenge Submissions table: indexes on (createdAt, id) and (voteScore, id)
CREATE INDEX IF NOT EXISTS "challenge_submissions_created_at_id_idx" ON "ChallengeSubmission" ("createdAt", "id");
CREATE INDEX IF NOT EXISTS "challenge_submissions_vote_score_id_idx" ON "ChallengeSubmission" ("voteScore", "id");

-- Challenge Votes table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "challenge_votes_created_at_id_idx" ON "ChallengeVote" ("createdAt", "id");

-- Locations table: index on (timestamp, id)
CREATE INDEX IF NOT EXISTS "locations_timestamp_id_idx" ON "Location" ("timestamp", "id");

-- Location Sharing Requests table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "location_sharing_requests_created_at_id_idx" ON "LocationSharingRequest" ("createdAt", "id");

-- Submission Reports table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "submission_reports_created_at_id_idx" ON "SubmissionReport" ("createdAt", "id");

-- Coin Transactions table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "coin_transactions_created_at_id_idx" ON "CoinTransaction" ("createdAt", "id");

-- Rewards table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "rewards_created_at_id_idx" ON "Reward" ("createdAt", "id");

-- Reward Purchases table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "reward_purchases_created_at_id_idx" ON "RewardPurchase" ("createdAt", "id");

-- Trips table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "trips_created_at_id_idx" ON "Trip" ("createdAt", "id");

-- Trip Resources table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "trip_resources_created_at_id_idx" ON "TripResource" ("createdAt", "id");

-- Trip Participants table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "trip_participants_created_at_id_idx" ON "TripParticipant" ("createdAt", "id");

-- Users table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "users_created_at_id_idx" ON "User" ("createdAt", "id");

-- Activity Reactions table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "activity_reactions_created_at_id_idx" ON "ActivityReaction" ("createdAt", "id");

-- Group Join Requests table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "group_join_requests_created_at_id_idx" ON "GroupJoinRequest" ("createdAt", "id");

-- Trip Sponsors table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "trip_sponsors_created_at_id_idx" ON "TripSponsor" ("createdAt", "id");

-- Notification Deliveries table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "notification_deliveries_created_at_id_idx" ON "NotificationDelivery" ("createdAt", "id");

-- Notification Schedules table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "notification_schedules_created_at_id_idx" ON "NotificationSchedule" ("createdAt", "id");

-- Notification Schedule Executions table: index on (executedAt, id)
CREATE INDEX IF NOT EXISTS "notification_schedule_executions_executed_at_id_idx" ON "NotificationScheduleExecution" ("executedAt", "id");

-- Push Subscriptions table: index on (createdAt, id)
CREATE INDEX IF NOT EXISTS "push_subscriptions_created_at_id_idx" ON "PushSubscription" ("createdAt", "id");
