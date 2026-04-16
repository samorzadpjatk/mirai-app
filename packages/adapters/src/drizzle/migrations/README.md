# Database Composite Indexes for Cursor Pagination

## Overview

This directory contains SQL migrations to add composite indexes for cursor-based pagination across all major tables in the Mirai App database.

## Migration Files

### Primary Migrations

| File                                               | Description                                       |
| -------------------------------------------------- | ------------------------------------------------- |
| `0000_add_all_cursor_pagination_indexes.sql`       | Combined migration with all indexes (recommended) |
| `0001_add_cursor_pagination_indexes_primary.sql`   | Primary tables only (6 indexes)                   |
| `0002_add_cursor_pagination_indexes_secondary.sql` | Secondary tables only (17 indexes)                |

## Index Summary

### Primary Tables (High Priority)

| Table         | Index Name                               | Columns                   | Purpose                     |
| ------------- | ---------------------------------------- | ------------------------- | --------------------------- |
| Events        | `events_start_time_id_idx`               | (startTime, id)           | Event sorting by start time |
| Challenges    | `challenges_created_at_id_idx`           | (createdAt, id)           | Challenge list pagination   |
| Notifications | `notifications_created_at_id_idx`        | (createdAt, id)           | Notification history        |
| Groups        | `groups_created_at_id_idx`               | (createdAt, id)           | Group list pagination       |
| Sponsors      | `sponsors_created_at_id_idx`             | (createdAt, id)           | Sponsor list pagination     |
| ActivityFeed  | `activity_feed_pinned_created_at_id_idx` | (isPinned, createdAt, id) | Pinned-first feed sorting   |

### Secondary Tables

| Table                         | Index Name                                            | Columns          | Purpose               |
| ----------------------------- | ----------------------------------------------------- | ---------------- | --------------------- |
| ChallengeSubmission           | `challenge_submissions_created_at_id_idx`             | (createdAt, id)  | Submission pagination |
| ChallengeSubmission           | `challenge_submissions_vote_score_id_idx`             | (voteScore, id)  | Vote score ranking    |
| ChallengeVote                 | `challenge_votes_created_at_id_idx`                   | (createdAt, id)  | Vote history          |
| Location                      | `locations_timestamp_id_idx`                          | (timestamp, id)  | Location history      |
| LocationSharingRequest        | `location_sharing_requests_created_at_id_idx`         | (createdAt, id)  | Request pagination    |
| SubmissionReport              | `submission_reports_created_at_id_idx`                | (createdAt, id)  | Report moderation     |
| CoinTransaction               | `coin_transactions_created_at_id_idx`                 | (createdAt, id)  | Transaction history   |
| Reward                        | `rewards_created_at_id_idx`                           | (createdAt, id)  | Reward list           |
| RewardPurchase                | `reward_purchases_created_at_id_idx`                  | (createdAt, id)  | Purchase history      |
| Trip                          | `trips_created_at_id_idx`                             | (createdAt, id)  | Trip list             |
| TripResource                  | `trip_resources_created_at_id_idx`                    | (createdAt, id)  | Resource list         |
| TripParticipant               | `trip_participants_created_at_id_idx`                 | (createdAt, id)  | Participant list      |
| User                          | `users_created_at_id_idx`                             | (createdAt, id)  | User list (admin)     |
| ActivityReaction              | `activity_reactions_created_at_id_idx`                | (createdAt, id)  | Reaction pagination   |
| GroupJoinRequest              | `group_join_requests_created_at_id_idx`               | (createdAt, id)  | Join request list     |
| TripSponsor                   | `trip_sponsors_created_at_id_idx`                     | (createdAt, id)  | Trip sponsor list     |
| NotificationDelivery          | `notification_deliveries_created_at_id_idx`           | (createdAt, id)  | Delivery history      |
| NotificationSchedule          | `notification_schedules_created_at_id_idx`            | (createdAt, id)  | Schedule list         |
| NotificationScheduleExecution | `notification_schedule_executions_executed_at_id_idx` | (executedAt, id) | Execution history     |
| PushSubscription              | `push_subscriptions_created_at_id_idx`                | (createdAt, id)  | Subscription list     |

## Applying Migrations

### Option 1: Using psql directly

```bash
# Apply the combined migration
psql $DATABASE_URL -f 0000_add_all_cursor_pagination_indexes.sql
```

### Option 2: Using Prisma (if configured)

```bash
cd apps/seed
bun run db:migrate
```

### Option 3: Using a custom migration script

```bash
# Create a script to run migrations with Bun + Drizzle
bun run migrate
```

## Index Design Rationale

### Composite Index Pattern

All indexes follow the pattern `(sortField, id)` to support:

1. **Efficient cursor pagination**: The database can quickly find the starting position using the cursor value
2. **Stable sorting**: The `id` column acts as a tie-breaker when sort fields have identical values
3. **Covering index optimization**: In many cases, the index can satisfy the query without accessing the heap

### ActivityFeed Special Case

The ActivityFeed uses `(isPinned, createdAt, id)` to support:

- Pinned items appearing first (isPinned DESC)
- Then sorted by createdAt DESC
- ID as tie-breaker

This matches the sorting requirements in the ActivityFeedGateway cursor implementation.

## Performance Considerations

### Storage Overhead

- Each index adds storage overhead (~20-30% per indexed column)
- With 23 new indexes, expect approximately 10-15% total storage increase

### Write Performance

- INSERT and UPDATE operations will have slightly higher latency
- The impact is minimal for the improved read performance on pagination queries

### Maintenance

- All indexes use `CREATE INDEX IF NOT EXISTS` for idempotency
- Indexes can be dropped safely if needed: `DROP INDEX IF EXISTS "index_name"`

## Verification

To verify indexes are created:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%_idx'
ORDER BY indexname;
```

## Related Files

- Drizzle Schema: `packages/frameworks/src/drizzle/schema/*.ts`
- Migration Directory: `packages/adapters/src/drizzle/migrations/`
