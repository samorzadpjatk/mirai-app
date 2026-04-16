-- Migration: Add composite indexes for cursor pagination
-- Created: 2026-04-16
-- Purpose: Optimize cursor-based pagination queries across all major tables

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
