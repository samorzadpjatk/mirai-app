# Database Schema Analysis: MIRAI/PJApp

> **Scope:** Complete analysis of the `@mirai-app/db` schema against the native app's business intent and industry best practices for event management database design.
> **Last Updated:** 2026-06-04

---

## 1. Executive Summary

The MIRAI database schema comprises **38 tables** across 9 logical domains, supporting an event/trip management platform for student integration trips. The schema demonstrates **strong foundational design** with UUIDs, proper timestamp handling, PostgreSQL enums, and comprehensive indexing. However, it exhibits **significant null-safety gaps**, **missing business-rule constraints**, and **several design decisions that create friction** between the data model and the app's actual business requirements.

**Key Changes Since Last Analysis:**
- `user_agents` table is **scheduled for removal** — no telemetry data should be persisted in the application database
- Location history is **intentionally absent** — only current location is stored per user
- Check constraints are now required to be declared via Drizzle ORM (not raw SQL)

**Verdict:** The schema is **functionally adequate** for the current feature set but requires targeted improvements to achieve data-modeling excellence, particularly around boundary normalization, constraint enforcement, and alignment with real-world event management patterns.

---

## 2. Schema Overview

### 2.1 Table Inventory (38 tables)

| Domain | Tables | Purpose |
|--------|--------|---------|
| **Core** | `users` | User accounts |
| **Telemetry** | `user_agents` | ⚠️ **Legacy** — scheduled for removal, no DB persistence |
| **Trip Management** | `trips`, `trip_participants`, `trip_insurances`, `trip_insurance_steps`, `trip_resource_links`, `trip_resource_files`, `trip_resource_texts`, `trip_resource_icons` | Trip lifecycle, participants, resources, insurance |
| **Groups** | `groups`, `group_join_requests` | Teams within trips, membership requests |
| **Challenges** | `challenges`, `challenge_submissions`, `challenge_votes`, `submission_reports`, `challenge_recurrence`, `challenge_location` | Gamified tasks with scoring and voting |
| **Activity Feed** | `activity_feeds`, `activity_reactions`, `submission_activities`, `challenge_activities`, `rank_change_activities`, `user_posts` | Social feed with reactions and polymorphic content |
| **Notifications** | `notifications`, `notification_schedules`, `notification_schedule_executions`, `notification_pushes`, `notification_deliveries`, `push_subscriptions` | Multi-channel notification system |
| **Location** | `locations`, `location_sharing_requests`, `location_shares` | Real-time GPS tracking and privacy (current snapshot only) |
| **Rewards** | `rewards`, `reward_purchases`, `coin_transactions` | Virtual economy with group wallets |
| **Sponsors** | `sponsors`, `trip_sponsors` | Partner/sponsor management |

### 2.2 Enums (7 types)

| Enum | Values | Used In |
|------|--------|---------|
| `role` | USER, ADMIN, MODERATOR, SERVICE | `users` |
| `submission_type` | IMAGE, MULTI_IMAGE, VIDEO, TEXT, IMAGE_LOCATION, LOCATION, QR_CODE | `challenges`, `challenge_activities` |
| `scoring_category` | SPEED, UNLIMITED, JUDGED_STAFF, PEER_VOTING | `challenges` |
| `challenge_status` | HIDDEN, VISIBLE, ACTIVE, VOTING_PHASE, COMPLETED, CANCELLED | `challenges` |
| `submission_status` | PENDING, APPROVED, REJECTED | `challenge_submissions` |
| `location_sharing_request_status` | PENDING, ACCEPTED, REJECTED | `location_sharing_requests` |
| `reward_purchase_status` | BOUGHT, ACCEPTED, IN_DELIVERY, CANCELLED, DELIVERED | `reward_purchases` |

---

## 3. Business Intent Alignment

### 3.1 What the App Does (Native App Analysis)

The MIRAI native app is a **mobile-first platform** for student integration trips with these core business flows:

1. **Trip Management** — Users join trips, get assigned wrist numbers and house numbers, view trip info, insurance, sponsors, and resources.
2. **Group Formation** — Users join/create groups within trips. Groups compete in challenges.
3. **Challenge System** — Multi-type challenges (photo, video, text, GPS, QR code) with scoring categories (speed, judged, peer voting, unlimited). Group submissions are reviewed, voted on, and ranked.
4. **Virtual Economy** — Groups earn coins from challenges. Coins are spent on rewards. Admins manage coin transactions.
5. **Activity Feed** — Social feed showing news, photos, challenge events, rank changes, and user posts. Supports reactions (hearts).
6. **Real-time Location** — Users share GPS coordinates with friends. Location sharing requires explicit request/acceptance. **Only current location is stored — no history.**
7. **Notifications** — Scheduled and ad-hoc push notifications. Admin-managed notification templates.
8. **Admin Panel** — Role-based admin for managing users, groups, challenges, rewards, coins, notifications, and activity feed.

### 3.2 Schema → Business Mapping

| Business Requirement | Schema Support | Rating |
|----------------------|---------------|--------|
| User accounts with roles | `users` with `role` enum | ✅ Strong |
| Trip lifecycle management | `trips` + `trip_participants` | ✅ Strong |
| Group formation & membership | `groups` + `group_join_requests` | ✅ Strong |
| Multi-type challenges | `challenges` with `submission_type` enum | ✅ Strong |
| Group submissions & scoring | `challenge_submissions` + `challenge_votes` | ✅ Strong |
| Virtual economy (coins) | `groups.coins` + `coin_transactions` | ⚠️ Adequate |
| Reward catalog & purchases | `rewards` + `reward_purchases` | ✅ Strong |
| Social activity feed | `activity_feeds` + polymorphic subtypes | ✅ Strong (but complex) |
| Location sharing (current only) | `locations` + `location_sharing_requests` | ✅ Strong |
| Push notifications | `notifications` + `push_subscriptions` | ✅ Strong |
| Scheduled notifications | `notification_schedules` | ✅ Strong |
| Sponsor management | `sponsors` + `trip_sponsors` | ✅ Strong |
| Insurance info | `trip_insurances` + `trip_insurance_steps` | ✅ Strong |
| Trip resources | `trip_resource_*` tables | ⚠️ Adequate |
| Audit trail / history | **Missing** | ❌ Weak |
| Purchase history per user | `reward_purchases` (group-level) | ⚠️ Weak |
| Challenge history / versioning | **Missing** | ❌ Weak |
| Data retention / archival | **Missing** | ❌ Weak |
| Proper telemetry / observability | `user_agents` (legacy) | ❌ Weak — table should be removed |

---

## 4. Best Practices Assessment

### 4.1 ✅ Strengths (Well-Designed)

#### 4.1.1 UUID Primary Keys
All tables use `varchar(36)` with `randomUUID()` default. This is a **best practice** for distributed systems, prevents enumeration attacks, and supports cross-platform compatibility.

#### 4.1.2 Timestamp Handling
`timestamp` with `withTimezone: true` is used consistently. This follows the best practice of **always storing times with timezone** to avoid ambiguity.

#### 4.1.3 PostgreSQL Enums
Native PostgreSQL enums (`pgEnum`) are used for constrained value sets. This is **superior to application-level enums** because it enforces constraints at the database level.

#### 4.1.4 Junction Tables for Many-to-Many
Proper junction tables with composite primary keys:
- `location_shares` (locationId + userId)
- `notification_schedule_executions` (notificationId + scheduleId + executedAt)
- `notification_pushes` (targetUserId + notificationId)
- `trip_sponsors` (tripId + sponsorId, with separate PK)

#### 4.1.5 Foreign Key Indexing
Most foreign key columns are indexed, either explicitly or implicitly via `unique()` or `index()` constraints. This is critical for JOIN performance.

#### 4.1.6 Activity Feed Polymorphism
The `activity_feeds` base table with subtype tables (`submission_activities`, `challenge_activities`, `rank_change_activities`, `user_posts`) is a **valid and scalable pattern** for a social feed. It avoids sparse columns and allows type-specific data.

#### 4.1.7 Soft Delete Pattern
`groups` has `isDeleted` boolean. This is the correct approach for preserving referential integrity.

#### 4.1.8 Naming Conventions
Consistent `camelCase` in code / `snake_case` in DB via Drizzle's `casing: "snake_case"`. Boolean columns use `is`/`has` prefixes.

#### 4.1.9 No `.default()` for User Data
Per project convention, user-provided content (names, descriptions, titles) is `.notNull()` without `.default()`. This prevents accidental empty-string defaults.

#### 4.1.10 Comprehensive Notification System
The notification domain (6 tables) supports scheduled, ad-hoc, and push notifications with delivery tracking. This is enterprise-grade design.

#### 4.1.11 Current-Only Location Storage
The `locations` table stores **only the latest location per user** (`userId` is `unique`). This is **intentional by design** — the app does not need or want location history. This reduces privacy risk, storage overhead, and GDPR complexity.

**When a user disables location sharing, the location row should be deleted from the database** (not just marked as `isSharingLocation = false`). This is a privacy-by-design requirement: if the user stops sharing, their location data should not remain in the system.

---

### 4.2 ⚠️ Issues (Needs Improvement)

#### 4.2.1 Null-Safety Proliferation (CRITICAL)

**Finding:** ~85 nullable columns across 24 tables. The null-safety audit (see `docs/conventions/null-safety.md`) identified this as the **highest-leverage issue** in the codebase.

**Impact:**
- `challenges` has 14 nullable columns
- `challengeSubmissions` has 8 nullable columns
- `locations` has 8 nullable columns
- 280 `??` coalescing expressions in `apps/native`
- 322 `??` coalescing expressions in `packages/orpc`

**Root Cause:** Drizzle's default behavior makes columns nullable when `.notNull()` is omitted. Many columns that should have sensible defaults are silently nullable.

**Example:**
```typescript
// challenges.ts — currently nullable
firstPlacePoints: integer("first_place_points").default(0).notNull(), // good
secondPlacePoints: integer("second_place_points"), // nullable — but should it be?
// The docs recommend: secondPlacePoints: integer("second_place_points").default(0).notNull()
```

**Recommendation:** Audit every nullable column. Apply `.default().notNull()` where the default is semantically correct for all historical data. For truly optional fields, add explicit `.nullable()` to document intent.

---

#### 4.2.2 Missing CHECK Constraints (HIGH)

**Finding:** No database-level `CHECK` constraints for business rules.

**Impact:** Business rules are enforced only in application code, creating a gap where invalid data can enter via:
- Direct SQL queries
- Migration bugs
- Data import scripts

**Required Check Constraints (to be declared via Drizzle ORM):**

```typescript
import { check, sql } from "drizzle-orm/pg-core";

// Time ranges
// In challenges: check("challenges_time_valid", sql`end_time > start_time OR end_time IS NULL`)
// In trips: check("trips_dates_valid", sql`end_date > start_date`)

// Non-negative values
// In groups: check("groups_coins_non_negative", sql`coins >= 0`)
// In rewards: check("rewards_quantity_positive", sql`available_quantity >= 0`)
// In rewards: check("rewards_coin_cost_positive", sql`coin_cost >= 0`)
// In coin_transactions: check("coin_transactions_amount_non_zero", sql`amount <> 0`)

// Valid enum ranges
// In challenge_submissions: check("awarded_points_non_negative", sql`awarded_points >= 0`)
// In challenge_submissions: check("bonus_points_non_negative", sql`bonus_points >= 0`)

// Geographic coordinates (CRITICAL for privacy)
// In locations:
check("locations_latitude_valid", sql`latitude BETWEEN -90 AND 90`),
check("locations_longitude_valid", sql`longitude BETWEEN -180 AND 180`),

// In challenge_location:
check("challenge_location_latitude_valid", sql`target_latitude BETWEEN -90 AND 90`),
check("challenge_location_longitude_valid", sql`target_longitude BETWEEN -180 AND 180`),

// Challenge voting
// In challenge_votes: check("vote_position_positive", sql`vote_position > 0`)
// In challenge_votes: check("vote_points_positive", sql`vote_points > 0`)
```

**Important:** Drizzle ORM supports `check()` via `drizzle-orm/pg-core`. **Use `sql` template literals**, not operator functions (`gt()`, `gte()`, etc.), due to a Drizzle bug that generates parameterized placeholders (`$1`) in CHECK constraints, which PostgreSQL rejects in DDL.

```typescript
// ✅ CORRECT
import { check, sql } from "drizzle-orm/pg-core";
check("price_positive", sql`${table.price} > 0`)

// ❌ WRONG (generates invalid SQL)
import { gt } from "drizzle-orm";
check("price_positive", gt(table.price, 0))
```

**Recommendation:** Add `CHECK` constraints to all schema files using Drizzle ORM's declarative API. This is a one-time schema change with immediate safety benefits.

---

#### 4.2.3 Legacy Telemetry Table (`user_agents`) (HIGH)

**Finding:** The `user_agents` table is a minimal, unstructured telemetry store. It only captures: `userAgent` string, `platform` (ios/android), `endpoint`, `userId`, and `timestamp`. It lacks:
- Event types / semantic categories
- Session identifiers
- App versioning
- Consent state / privacy metadata
- Structured device metadata
- Deduplication support

**Current Implementation:** Populated by `mobileAppMiddleware` in `packages/orpc/src/api/trpc.ts` via fire-and-forget `INSERT`. Only enabled when `enableUserAgentTelemetry()` is called.

**Why This Needs Removal:**
1. **No schema evolution** — Adding a new field requires a migration
2. **No privacy controls** — No consent tracking or data minimization
3. **No correlation** — Cannot correlate with sessions, errors, or business events
4. **Wrong architecture** — Telemetry should be exported to observability backends, not stored in the application database

**Recommended Action:** Drop `user_agents` table from the schema. Telemetry will be handled via non-DB observability infrastructure (see separate observability planning document). No replacement table should be created — the database is not the correct place for telemetry data.

**Implementation:**
1. **Drop `user_agents` table** — Remove from schema, generate migration
2. **Remove `mobileAppMiddleware`** — Delete the fire-and-forget INSERT from `packages/orpc/src/api/trpc.ts`
3. **Remove `userAgentsRelations`** — Remove from `packages/db/src/schema/relations.ts`
4. **Remove exports** — Remove from `packages/db/src/schema/index.ts` and `packages/db/src/index.ts`

---

#### 4.2.4 Location Handling Does Not Delete on Disable (MEDIUM)

**Finding:** When a user disables location sharing, the `updateSharingSettings` mutation in `packages/orpc/src/api/routers/location/mutations.ts` sets `isSharingLocation = false` but **does not delete the location row**.

**Current Behavior:**
```typescript
// Upsert location for user
await db.insert(locations).values({ ... })
  .onConflictDoUpdate({
    target: locations.userId,
    set: { isSharingLocation: false, timestamp: new Date() },
  });
```

**Privacy Impact:** The user's last known coordinates remain in the database indefinitely. This violates the principle of data minimization.

**Required Behavior:**
When `isSharingLocation` is set to `false`:
1. Delete the user's row from `locations`
2. Cascade delete all associated `location_shares` rows (FK already has `onDelete: "cascade"`)
3. Update any active `location_sharing_requests` to `REJECTED` or `CANCELLED`

```typescript
// In updateSharingSettings mutation
if (!isSharingLocation) {
  await db.delete(locations).where(eq(locations.userId, context.dbUser.id));
  // location_shares will cascade delete automatically
}
```

**Note:** The `locations` table intentionally stores **only current location** — there is no `location_history` table. This is a privacy-by-design decision: the app does not need to know where a user has been, only where they are right now (if sharing). If the user disables sharing, the data should be gone.

---

#### 4.2.5 Trip Resources Split into 4 Tables (MEDIUM)

**Finding:** `trip_resource_links`, `trip_resource_files`, `trip_resource_texts`, `trip_resource_icons` have identical structures: `tripId`, `label`, `type`, `sortOrder`, `createdAt`, `updatedAt` + 1-2 type-specific fields.

**Analysis:** This is a **polymorphic resource pattern**. The current design is **normalized but verbose**.

**Trade-offs:**
- ✅ Each table has clear, type-specific constraints
- ✅ No sparse columns
- ✅ Simple queries per resource type
- ❌ 4 nearly identical tables to maintain
- ❌ Adding a new resource type requires a new table
- ❌ No unified resource listing without `UNION ALL`

**Recommendation:** For the current scale (4 types), this is acceptable. If the number of resource types grows beyond 6, consider a unified `trip_resources` table with `resource_type` enum and a JSONB `metadata` column for type-specific fields.

---

#### 4.2.6 sponsors Table Mixes Data and Presentation (MEDIUM)

**Finding:** `sponsors` has `height`, `offsetX`, `offsetY` columns.

**Analysis:** These are **UI layout properties**, not business data. They should be in a `sponsor_layouts` or `trip_sponsor_config` table, or in a JSONB `display_config` column.

**Recommendation:** Move `height`, `offsetX`, `offsetY` to a `trip_sponsor_display` table (FK to `trip_sponsors`), or use a JSONB column. This separates data from presentation.

---

#### 4.2.7 No Audit Trail / Versioning (MEDIUM)

**Finding:** No `createdBy`, `updatedBy`, `version`, `audit_log`, or `history` tables.

**Business Impact:**
- Cannot track who changed what and when
- Cannot recover from accidental data changes
- Cannot debug data corruption
- Cannot support compliance requirements (GDPR data processing records)

**Recommendation:** Add a lightweight `audit_logs` table:

```typescript
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tableName: text("table_name").notNull(),
  recordId: varchar("record_id", { length: 36 }).notNull(),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE
  oldValues: text("old_values"), // JSON
  newValues: text("new_values"), // JSON
  performedById: varchar("performed_by_id", { length: 36 }).references(() => users.id),
  performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow().notNull(),
});
```

Use Drizzle's `.$onUpdate()` or database triggers to populate this. Alternatively, add `createdBy`/`updatedBy` to high-value tables (`challenges`, `rewards`, `groups`).

---

#### 4.2.8 rewardPurchases Group-Level Instead of User-Level (MEDIUM)

**Finding:** `rewardPurchases` has `groupId` and `purchasedById`, but the purchase is fundamentally at the **group level**. Individual users don't have purchase history.

**Business Impact:**
- Cannot show a user's personal purchase history
- Cannot track who initiated vs. who authorized a purchase
- Cannot support "purchaser ≠ beneficiary" scenarios

**Recommendation:** Consider adding `userPurchases` junction table for individual user-level purchase tracking, or document that the current model is intentional (group-level economy).

---

#### 4.2.9 No Full-Text Search Support (MEDIUM)

**Finding:** No `tsvector` columns or GIN indexes for text search.

**Business Impact:** Searching groups, challenges, or users likely does full table scans or `LIKE '%term%'` queries.

**Recommendation:** Add PostgreSQL full-text search via a dedicated search table with `tsvector` columns, or add `tsvector` columns to high-value tables if search becomes a priority.

---

#### 4.2.10 challenge_location Design Is Unusual (LOW)

**Finding:** `challenge_location` has `expectedValue` as `text` type. For a location-based challenge, this is the expected QR code or text value to match.

**Analysis:** This is **not a geographic location** despite the table name. The `challenge_location` table is really a **location-matching challenge configuration**.

**Recommendation:** Rename to `challenge_location_match` or `challenge_location_config` to clarify intent. Or merge into `challenges` with a `locationConfig` JSONB column if this is the only location-specific config.

---

#### 4.2.11 No Data Retention / Archival Strategy (LOW)

**Finding:** No `deletedAt`, `archivedAt`, or `isArchived` on most tables. No purge strategy for old data.

**Tables that grow unbounded:**
- `activity_feeds` — social posts accumulate
- `locations` — overwritten, but history lost (intentional)
- `challenge_votes` — votes accumulate per challenge
- `notification_pushes` — push records accumulate
- `coin_transactions` — financial records (should never be deleted)

**Recommendation:**
- Add `archivedAt` to `activity_feeds` for old trip content
- Consider partitioning `activity_feeds` by `tripId` or `createdAt`
- Add retention policy for `notification_pushes` (e.g., 90 days)
- Keep `coin_transactions` indefinitely (financial audit trail)

---

#### 4.2.12 tripParticipants.role Is Text, Not Enum (LOW)

**Finding:** `tripParticipants.role` is `text("role").default("MEMBER").notNull()` instead of an enum.

**Analysis:** This is inconsistent with the project's use of enums for other constrained fields. The `role` field on `users` uses `roleEnum`.

**Recommendation:** Create a `tripRoleEnum` with values like `MEMBER`, `ORGANIZER`, `TRIP_ADMIN`, `HELPER`.

---

## 5. Comparison with Industry Best Practices

| Best Practice | MIRAI Status | Gap |
|---------------|-------------|-----|
| UUID primary keys | ✅ Implemented | None |
| Timestamps with timezone | ✅ Implemented | None |
| PostgreSQL enums | ✅ Implemented | None |
| Junction tables for many-to-many | ✅ Implemented | None |
| Index foreign keys | ✅ Implemented | None |
| Soft deletes | ⚠️ Partial (only `groups`) | Add to more tables |
| CHECK constraints | ❌ Missing | Critical gap |
| Boundary normalization | ❌ Missing | ~85 nullable columns leak |
| Audit trail | ❌ Missing | No versioning/history |
| Full-text search | ❌ Missing | No `tsvector`/`GIN` |
| Table partitioning | ❌ Missing | Not needed yet, but plan for scale |
| Money as integer minor units | ⚠️ Partial | Uses whole coins, acceptable |
| Location history | ✅ **Intentionally absent** | Privacy-by-design — current location only |
| Data retention policies | ❌ Missing | No automatic purging |
| Location deletion on disable | ❌ Missing | Row persists after disable |

---

## 6. Recommendations (Prioritized)

### Phase 1: Critical (Immediate)

1. **Add CHECK constraints via Drizzle ORM** for business rules (time ranges, non-negative values, coordinates)
   - Use `check()` from `drizzle-orm/pg-core` with `sql` template literals
   - Never use operator functions (`gt()`, `gte()`, etc.) in CHECK constraints
   - Add to: `locations`, `challenges`, `trips`, `groups`, `rewards`, `coin_transactions`, `challenge_submissions`, `challenge_votes`, `challenge_location`

2. **Audit nullability** — decide which nullable columns should have `.default().notNull()`

3. **Delete location on disable** — In `updateSharingSettings`, when `isSharingLocation = false`, delete the `locations` row and cascade-delete `location_shares`

### Phase 2: High (Next Sprint)

4. **Drop `user_agents` table** — Remove legacy telemetry table from schema and associated middleware
   - Remove `user_agents` table definition from schema
   - Remove `mobileAppMiddleware` from `packages/orpc/src/api/trpc.ts`
   - Generate migration to drop the table
   - Note: Telemetry is a non-DB concern; observability infrastructure handled separately

5. **Add audit trail** (`audit_logs` table or `createdBy`/`updatedBy` columns)

6. **Separate sponsor display data** from sponsor business data

7. **Add data retention policies** for unbounded tables (notifications, activity feeds)

### Phase 3: Medium (Next Quarter)

8. **Add full-text search** support for key searchable tables
9. **Add archival/retention strategy** for unbounded tables
10. **Create `tripRoleEnum`** for `tripParticipants.role`
11. **Consider unifying trip resource tables** if more types are added

### Phase 4: Low (Nice to Have)

12. **Rename `challenge_location`** to clarify it's a matching config

---

## 7. Conclusion

The MIRAI database schema is **well-architected at the foundation level** — it uses modern PostgreSQL features, follows Drizzle conventions, and has comprehensive coverage of the app's business domains. The schema supports a complex gamified event platform with social features, real-time location, and a virtual economy.

**The primary gaps are:**
1. **Null-safety normalization** — the biggest friction point between the database and the rest of the stack
2. **Missing database-level constraints** — business rules are not enforced by PostgreSQL
3. **Lack of audit/versioning** — no way to track changes or recover from mistakes
4. **Legacy telemetry table** — `user_agents` should be dropped from the database schema
5. **Privacy gaps** — location data persists after user disables sharing
6. **Business-logic mismatches** — sponsor data mixed with presentation, trip resources overly split

**These are all fixable issues.** The schema is not fundamentally flawed — it needs **incremental hardening** and **alignment refinement** to achieve production-grade data modeling.

**Overall Grade:** **B+** — Solid foundation, needs constraint hardening, privacy improvements, and legacy table cleanup.

---

## Appendix A: Drizzle ORM Check Constraint Syntax

```typescript
import { pgTable, serial, integer, check, sql } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
}, (table) => [
  check("price_check", sql`${table.price} >= 0`),
  check("quantity_check", sql`${table.quantity} >= 0`),
]);
```

**Important:** Always use `sql` template literals. Never use `gt()`, `gte()`, `lt()`, `lte()`, `eq()`, `ne()` operator functions inside `check()` — they generate parameterized SQL (`$1`) which is invalid in CHECK constraints.

---

## Appendix B: Location Deletion on Disable (Required Change)

In `packages/orpc/src/api/routers/location/mutations.ts`, the `updateSharingSettings` function must be updated:

```typescript
export const updateSharingSettings = async (
  context: LocationContext,
  input: {
    isSharingLocation: boolean;
    userIdsToShareWith?: string[];
    tripId?: string;
  },
) => {
  const { isSharingLocation, userIdsToShareWith, tripId } = input;

  // ... trip validation ...

  if (!isSharingLocation) {
    // Privacy-by-design: delete location data when user disables sharing
    await context.db
      .delete(locations)
      .where(eq(locations.userId, context.dbUser.id));

    return { isSharingLocation: false, usersToShareWith: [] };
  }

  // ... existing sharing enabled logic ...
};
```

This ensures that when a user disables location sharing, their coordinates are **completely removed** from the database, not just hidden.
