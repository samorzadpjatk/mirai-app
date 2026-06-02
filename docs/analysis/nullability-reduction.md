# Nullability Reduction Analysis & Execution Plan

> **Scope:** MIRAI monorepo — reducing null/undefined patterns across database schema, API contracts, and frontend state.
> **Date:** 2026-06-02
> **Status:** Analysis complete — ready for phased execution

---

## Executive Summary

The codebase has **1,087+ nullable/undefined patterns** across **188+ files**. The dominant pattern is `| null` (~918 matches) used for optional string/number fields, with `| undefined` (~175) appearing mostly for async state and optional callbacks. The codebase compensates with heavy use of `??` nullish coalescing (~659) and `?.` optional chaining (~727), creating a defensive-coding sprawl that obscures actual business logic.

**The core issue is design-level nullability proliferation**, not compiler configuration. `strictNullChecks` is already enabled via `@tsconfig/bun/tsconfig.json`. The solution is a **"nulls at the boundary"** rule: allow null/undefined from external sources (database, API, storage), but normalize to strict defaults before data enters business logic, components, and stores.

**Estimated impact:** ~120+ nullable patterns can be eliminated across 40+ files, improving type certainty and reducing defensive `??`/`?.` usage by 30–40%.

---

## 1. Database Schema Analysis — Which Columns Can Become Non-Nullable

Drizzle ORM uses **implicit nullability** — columns without `.notNull()` are nullable. The schema never calls `.nullable()` explicitly. This analysis identifies which columns can be made non-nullable with sensible defaults.

### 1.1 `challenges` table — 14 nullable columns (highest count)

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `description` | nullable | `.notNull().default("")` | Empty string is a valid "no description" state |
| `image` | nullable | **Keep nullable** | Optional image is a legitimate domain concept |
| `dailyStartTime` | nullable | **Keep nullable** | Only meaningful for recurring challenges |
| `dailyEndTime` | nullable | **Keep nullable** | Only meaningful for recurring challenges |
| `firstPlacePoints` | nullable | `.notNull().default(0)` | `basePoints` already defaults to 0; point fields should be consistent |
| `secondPlacePoints` | nullable | `.notNull().default(0)` | Consistency with `basePoints` |
| `thirdPlacePoints` | nullable | `.notNull().default(0)` | Consistency with `basePoints` |
| `startTime` | nullable | **Keep nullable** | HIDDEN challenges don't need start times |
| `endTime` | nullable | **Keep nullable** | HIDDEN challenges don't need end times |
| `votingStartTime` | nullable | **Keep nullable** | Not all challenges have voting |
| `votingEndTime` | nullable | **Keep nullable** | Not all challenges have voting |
| `targetLatitude` | nullable | **Keep nullable** | Only for location-based challenges |
| `targetLongitude` | nullable | **Keep nullable** | Only for location-based challenges |
| `expectedValue` | nullable | **Keep nullable** | Only for certain submission types (e.g., QR code) |

**Immediate wins:** `description`, `firstPlacePoints`, `secondPlacePoints`, `thirdPlacePoints` → **4 columns made non-nullable**.

**Architectural consideration:** `dailyStartTime`/`dailyEndTime` and `targetLatitude`/`targetLongitude` are conditional fields. Consider extracting these into separate tables (`challengeRecurrence`, `challengeLocation`) to eliminate sparse columns entirely. This would remove **6 more nullable columns**.

### 1.2 `challengeSubmissions` table — 8 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `videoId` | nullable | **Keep nullable** | Only for VIDEO submission type |
| `textContent` | nullable | **Keep nullable** | Only for TEXT submission type |
| `latitude` | nullable | **Keep nullable** | Only when location is captured |
| `longitude` | nullable | **Keep nullable** | Only when location is captured |
| `reviewedById` | nullable | **Keep nullable** | Only after review |
| `reviewedAt` | nullable | **Keep nullable** | Only after review |
| `rejectionReason` | nullable | **Keep nullable** | Only when rejected |
| `ranking` | nullable | **Keep nullable** | Only after voting completes |

**Assessment:** All 8 are legitimate conditional fields. The submission table is polymorphic (video/text/photo/location). Consider splitting into `challengeSubmissionPhotos`, `challengeSubmissionVideos`, `challengeSubmissionTexts`, `challengeSubmissionLocations` — each with only their relevant fields. This would eliminate **8 nullable columns** but requires significant refactoring.

### 1.3 `submissionReports` table — 1 nullable column

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `details` | nullable | `.notNull().default("")` | Empty string means "no additional details" |

**Immediate win:** 1 column made non-nullable.

### 1.4 `trips` table — 2 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `description` | nullable | `.notNull().default("")` | Empty string is a valid "no description" state |
| `backgroundImagePath` | nullable | **Keep nullable** | Optional background image is legitimate |

**Immediate win:** 1 column made non-nullable.

### 1.5 `tripResources` table — 7 nullable columns (most problematic)

| Column | Current | Recommendation |
|--------|---------|---------------|
| `description` | nullable | `.notNull().default("")` |
| `url` | nullable | **Part of split** |
| `storagePath` | nullable | **Part of split** |
| `fileName` | nullable | **Part of split** |
| `publicUrl` | nullable | **Part of split** |
| `iconName` | nullable | **Part of split** |
| `value` | nullable | **Part of split** |

**Assessment:** This is a single table trying to represent multiple resource types:
- **LINK** type: uses `url`, `label`, `description`
- **FILE** type: uses `storagePath`, `fileName`, `publicUrl`, `label`, `description`
- **TEXT** type: uses `value`, `label`, `description`
- **ICON** type: uses `iconName`, `label`, `description`

**Recommendation:** Split into type-specific tables:
```typescript
export const tripResourceLinks = pgTable("trip_resource_links", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tripId: varchar("trip_id", { length: 36 }).notNull().references(() => trips.id),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
});

export const tripResourceFiles = pgTable("trip_resource_files", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tripId: varchar("trip_id", { length: 36 }).notNull().references(() => trips.id),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  storagePath: text("storage_path").notNull(),
  fileName: text("file_name").notNull(),
  publicUrl: text("public_url").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
});

export const tripResourceTexts = pgTable("trip_resource_texts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tripId: varchar("trip_id", { length: 36 }).notNull().references(() => trips.id),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  value: text("value").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
});

export const tripResourceIcons = pgTable("trip_resource_icons", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tripId: varchar("trip_id", { length: 36 }).notNull().references(() => trips.id),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  iconName: text("icon_name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
});
```

**Impact:** Eliminates **7 nullable columns** from a single table. Each new table has 0 nullable columns. This is the highest-impact single change.

### 1.6 `tripInsurances` table — 3 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `hospitalName` | nullable | **Keep nullable** | Optional hospital info |
| `hospitalAddress` | nullable | **Keep nullable** | Optional hospital info |
| `hospitalDistance` | nullable | **Keep nullable** | Optional hospital info |

**Assessment:** All 3 are legitimate optional fields. Keep as-is.

### 1.7 `tripInsuranceSteps` table — 2 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `exampleCall` | nullable | **Keep nullable** | Optional example |
| `additionalText` | nullable | **Keep nullable** | Optional additional text |

**Assessment:** Legitimate optional fields. Keep as-is.

### 1.8 `tripParticipants` table — 3 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `groupId` | nullable | **Keep nullable** | Participants may not be assigned to a group yet |
| `wristNumber` | nullable | **Keep nullable** | May not be assigned yet |
| `houseNumber` | nullable | **Keep nullable** | May not be assigned yet |

**Assessment:** All 3 are legitimate lifecycle fields. Keep as-is.

### 1.9 `groups` table — 2 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `description` | nullable | `.notNull().default("")` | Empty string means "no description" |
| `image` | nullable | **Keep nullable** | Optional group image is legitimate |

**Immediate win:** 1 column made non-nullable.

### 1.10 `locations` table — 8 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `accuracy` | nullable | `.notNull().default(0)` | GPS always has some accuracy; 0 means unknown |
| `altitude` | nullable | **Keep nullable** | Not all GPS provides altitude |
| `altitudeAccuracy` | nullable | **Keep nullable** | Not all GPS provides altitude accuracy |
| `heading` | nullable | **Keep nullable** | Stationary users don't have heading |
| `latitude` | nullable | `.notNull()` | A location record MUST have coordinates |
| `longitude` | nullable | `.notNull()` | A location record MUST have coordinates |
| `speed` | nullable | **Keep nullable** | Stationary users don't have speed |
| `lastInactivityNotification` | nullable | **Keep nullable** | Only sent when inactive |

**Immediate wins:** `accuracy`, `latitude`, `longitude` → **3 columns made non-nullable**.

**Note:** `latitude`/`longitude` being nullable is particularly problematic — a `locations` record without coordinates is meaningless. These should definitely be `.notNull()`.

### 1.11 `notificationSchedules` table — 5 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `tripId` | nullable | **Keep nullable** | Global schedules vs trip-specific |
| `notificationTitle` | nullable | `.notNull().default("")` | Empty string means "auto-generated title" |
| `notificationBody` | nullable | `.notNull().default("")` | Empty string means "auto-generated body" |
| `notificationUrl` | nullable | **Keep nullable** | Optional URL |
| `lastRun` | nullable | **Keep nullable** | Hasn't run yet |

**Immediate wins:** `notificationTitle`, `notificationBody` → **2 columns made non-nullable**.

**Architectural consideration:** `notificationTitle`/`notificationBody` being nullable suggests the schedule has a `notificationType` that determines whether these are custom or auto-generated. Consider making them non-null with defaults and using a `isCustomNotification` boolean.

### 1.12 `notifications` table — 1 nullable column

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `tripId` | nullable | **Keep nullable** | Global notifications vs trip-specific |

**Assessment:** Legitimate. Keep as-is.

### 1.13 `notificationPushes` table — 2 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `sentAt` | nullable | **Keep nullable** | Not yet sent |
| `failureReason` | nullable | **Keep nullable** | Only on failure |

**Assessment:** Both are legitimate state-tracking fields. Keep as-is.

### 1.14 `notificationDeliveries` table — 4 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `tripId` | nullable | **Keep nullable** | Global deliveries |
| `scheduleId` | nullable | **Keep nullable** | Ad-hoc deliveries |
| `deliveryCompletedAt` | nullable | **Keep nullable** | Not yet completed |
| `errors` | nullable | **Keep nullable** | No errors |

**Assessment:** All legitimate. Keep as-is.

### 1.15 `rewards` table — 1 nullable column

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `image` | nullable | **Keep nullable** | Optional reward image |

**Assessment:** Legitimate. Keep as-is.

### 1.16 `rewardPurchases` table — 2 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `collectionMethod` | nullable | **Keep nullable** | Not all rewards require collection |
| `statusUpdatedById` | nullable | **Keep nullable** | Not all status changes are by admin |

**Assessment:** Both legitimate. Keep as-is.

### 1.17 `coinTransactions` table — 1 nullable column

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `reason` | nullable | `.notNull().default("")` | Empty string means "no reason provided" |

**Immediate win:** 1 column made non-nullable.

### 1.18 `sponsors` table — 3 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `height` | nullable | `.notNull().default(0)` | 0 means "use default height" |
| `offsetX` | nullable | `.notNull().default(0)` | 0 means "no horizontal offset" |
| `offsetY` | nullable | `.notNull().default(0)` | 0 means "no vertical offset" |

**Immediate wins:** 3 columns made non-nullable.

### 1.19 `events` table — 1 nullable column

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `organizerGroupId` | nullable | **Keep nullable** | Events can be organized by individual users |

**Assessment:** Legitimate. Keep as-is.

### 1.20 `userAgents` table — 2 nullable columns

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `userId` | nullable | **Keep nullable** | Anonymous tracking |
| `endpoint` | nullable | **Keep nullable** | Not always available |

**Assessment:** Both legitimate. Keep as-is.

### 1.21 `users` table — 1 nullable column

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `lastSeenOn` | nullable | **Keep nullable** | New users haven't been seen yet |

**Assessment:** Legitimate. Keep as-is.

### 1.22 `activities` table (from earlier analysis)

**`activityFeeds` — 6 nullable columns:**

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `description` | nullable | `.notNull().default("")` | Empty string means "no description" |
| `imageUrl` | nullable | `.notNull().default("")` | Empty string means "no image" |
| `hiddenByAdmin` | nullable | **Keep nullable** | Only when hidden |
| `hiddenAt` | nullable | **Keep nullable** | Only when hidden |
| `hiddenReason` | nullable | **Keep nullable** | Only when hidden |
| `createdByAdmin` | nullable | **Keep nullable** | System-generated activities may not have admin |

**Immediate wins:** `description`, `imageUrl` → **2 columns made non-nullable**.

**`submissionActivities` — 2 nullable columns:**

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `ranking` | nullable | **Keep nullable** | Only after voting |
| `pointsAwarded` | nullable | **Keep nullable** | Only after scoring |

**Assessment:** Both legitimate. Keep as-is.

**`challengeActivities` — 4 nullable columns:**

| Column | Current | Recommendation | Rationale |
|--------|---------|---------------|-----------|
| `endTime` | nullable | **Keep nullable** | Not all events have end times |
| `submissionType` | nullable | **Keep nullable** | Event-specific |
| `basePoints` | nullable | **Keep nullable** | Event-specific |
| `submissionCount` | nullable | **Keep nullable** | Event-specific |

**Assessment:** All legitimate. Keep as-is.

### 1.23 Summary of DB Schema Changes

| Category | Tables | Columns Made Non-Nullable | Effort |
|----------|--------|--------------------------|--------|
| **Immediate (default values)** | 8 | 15 | 2–3 hours |
| **Architectural (table splits)** | 2 | 15 | 2–3 days |
| **Keep nullable (legitimate)** | 18 | ~65 | — |

**Total nullable columns:** ~85 → **~50 after changes** (41% reduction)

**Columns to make non-nullable with defaults:**
1. `challenges.description` → `.notNull().default("")`
2. `challenges.firstPlacePoints` → `.notNull().default(0)`
3. `challenges.secondPlacePoints` → `.notNull().default(0)`
4. `challenges.thirdPlacePoints` → `.notNull().default(0)`
5. `submissionReports.details` → `.notNull().default("")`
6. `trips.description` → `.notNull().default("")`
7. `tripResources.description` → `.notNull().default("")` (or split table)
8. `groups.description` → `.notNull().default("")`
9. `locations.accuracy` → `.notNull().default(0)`
10. `locations.latitude` → `.notNull()`
11. `locations.longitude` → `.notNull()`
12. `notificationSchedules.notificationTitle` → `.notNull().default("")`
13. `notificationSchedules.notificationBody` → `.notNull().default("")`
14. `coinTransactions.reason` → `.notNull().default("")`
15. `sponsors.height` → `.notNull().default(0)`
16. `sponsors.offsetX` → `.notNull().default(0)`
17. `sponsors.offsetY` → `.notNull().default(0)`
18. `activityFeeds.description` → `.notNull().default("")`
19. `activityFeeds.imageUrl` → `.notNull().default("")`

**Table splits (architectural):**
- `tripResources` → `tripResourceLinks`, `tripResourceFiles`, `tripResourceTexts`, `tripResourceIcons` (eliminates 7 nullable columns)
- `challenges` → extract `challengeRecurrence` (`dailyStartTime`, `dailyEndTime`) and `challengeLocation` (`targetLatitude`, `targetLongitude`, `expectedValue`) (eliminates 6 nullable columns)

---

## 2. API/Router Layer Analysis

### 2.1 Zod Schema Patterns

| Pattern | Count | Files | Impact |
|---------|-------|-------|--------|
| `z.optional()` | 196 | 25 | Medium — partial updates legitimately need optional |
| `z.nullable()` | ~12 | 5 | Low — mostly legitimate |
| `.optional().nullable()` | 7 | 1 (location-validation.ts) | **High** — creates triple-state ambiguity |
| `.nullable().optional()` | 2 | 2 (activityFeed, reward) | **High** — same triple-state issue |

### 2.2 Critical Anti-Patterns

**`packages/orpc/src/utils/location-validation.ts` (lines 31–45):**
```typescript
// BEFORE — triple-state ambiguity
latitude: latitudeSchema.optional().nullable(),
longitude: longitudeSchema.optional().nullable(),
accuracy: z.number().nonnegative().optional().nullable(),
altitude: z.number().optional().nullable(),
altitudeAccuracy: z.number().nonnegative().optional().nullable(),
heading: z.number().min(0).max(360).optional().nullable(),
speed: z.number().nonnegative().optional().nullable(),

// AFTER — clean dual-state
latitude: latitudeSchema.optional(),
longitude: longitudeSchema.optional(),
accuracy: z.number().nonnegative().optional(),
altitude: z.number().optional(),
altitudeAccuracy: z.number().nonnegative().optional(),
heading: z.number().min(0).max(360).optional(),
speed: z.number().nonnegative().optional(),
```

**`packages/orpc/src/api/routers/activityFeed/index.ts` (line 313):**
```typescript
// BEFORE — four-state field
description: z.string().trim().nullable().optional()
// States: undefined, null, "", "text"

// AFTER — two-state field
description: z.string().trim().optional()
// States: undefined, "text" (empty string is valid text)
```

**`packages/orpc/src/api/routers/activityFeed/types.ts` — `ActivityWithRelations`:**
```typescript
// BEFORE — 15 null fields in a single interface
export interface ActivityWithRelations {
  // ...
  description: string | null;
  imageUrl: string | null;
  admin: { ... } | null;
  hiddenBy: { ... } | null;
  submissionActivity: { ... } | null;
  challengeActivity: { ... } | null;
  rankChangeActivity: { ... } | null;
  userPost: { ... } | null;
  // ...
}

// AFTER — discriminated union by activityType
export type ActivityWithRelations =
  | BaseActivity & { activityType: "submission"; submissionActivity: SubmissionActivity }
  | BaseActivity & { activityType: "challenge"; challengeActivity: ChallengeActivity }
  | BaseActivity & { activityType: "rank_change"; rankChangeActivity: RankChangeActivity }
  | BaseActivity & { activityType: "user_post"; userPost: UserPost }
  | BaseActivity & { activityType: "admin"; admin: AdminActivity }
  | BaseActivity & { activityType: "hidden"; hiddenBy: HiddenByActivity };
```

### 2.3 Router Input Schemas — Over-Optionalization

**`packages/orpc/src/api/routers/challenge/index.ts` — 28 optional fields in create schema:**

Many fields marked `.optional()` in create schemas should be required or have defaults:

```typescript
// BEFORE — everything optional
export const createChallengeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),        // should be .default("")
  qrCodeValue: z.string().trim().min(1).optional(),  // conditional on submissionType
  textExpectedPhrase: z.string().trim().min(1).optional(), // conditional on submissionType
  isRecurring: z.boolean().optional(),      // should be .default(false)
  recurringDays: z.number().optional(),       // conditional on isRecurring
  // ... 20 more optional fields
});

// AFTER — required fields + conditional validation
export const createChallengeSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  submissionType: z.enum(["PHOTO", "VIDEO", "TEXT", "QR_CODE", "LOCATION"]),
  // Conditional fields based on submissionType:
  qrCodeValue: z.string().optional(),        // validated in refine()
  textExpectedPhrase: z.string().optional(),
  // ...
}).refine((data) => {
  if (data.submissionType === "QR_CODE" && !data.qrCodeValue) {
    return false;
  }
  return true;
}, { message: "qrCodeValue required when submissionType is QR_CODE" });
```

### 2.4 API Response Normalization

**Current pattern:** Routers return raw Drizzle query results with nulls propagating to the client.

**Recommended pattern:** Add a mapper layer that normalizes nulls to defaults before returning:

```typescript
// packages/orpc/src/api/routers/challenge/mappers.ts
export const normalizeChallenge = (challenge: Challenge) => ({
  ...challenge,
  description: challenge.description ?? "",
  image: challenge.image ?? "",
  firstPlacePoints: challenge.firstPlacePoints ?? 0,
  secondPlacePoints: challenge.secondPlacePoints ?? 0,
  thirdPlacePoints: challenge.thirdPlacePoints ?? 0,
  // ... all nullable fields get defaults
});

// packages/orpc/src/api/routers/challenge/queries.ts
export const getChallengeById = async (db, id) => {
  const challenge = await db.query.challenges.findFirst({ where: eq(challenges.id, id) });
  return challenge ? normalizeChallenge(challenge) : null;
};
```

---

## 3. Frontend (Native App) Analysis

### 3.1 State Management — `useState<X | null>(null)` Anti-Pattern

**Current pattern:** Initializing state with `null` even when empty-state defaults exist.

| File | Current State | Better Default |
|------|--------------|----------------|
| `src/hooks/trips/useTrips.ts:9` | `useState<TripListItem[] \| null>(null)` | `useState<TripListItem[]>([])` |
| `src/hooks/trips/useTripDetails.ts:21` | `useState<TripData \| null>(null)` | Use React Query status |
| `src/hooks/trips/useTripDetails.ts:22` | `useState<string \| null>(null)` | `useState<string>("")` |
| `src/app/auth/login.tsx:41` | `useState<string \| null>(null)` (5× errors) | `useState<string>("")` |
| `src/stores/map/mapStore.ts:42` | `selectedUserId: null` | `selectedUserId: ""` |
| `src/stores/map/mapStore.ts:48` | `followMode: null` | `followMode: "none"` |
| `src/stores/map/mapOverlayStore.ts` | `firstName?: string \| null` | `firstName: string` (default "") |
| `src/hooks/files/useFileUpload.ts:102` | `Error \| null` | `UploadStatus` discriminated union |
| `src/hooks/files/useFileDownload.ts:99` | `Error \| null` | `DownloadStatus` discriminated union |

### 3.2 Query Data Normalization — `??` Fallback Sprawl

**Current pattern:** Components add `?? []` / `?? ""` to every query result.

```typescript
// BEFORE — defensive coding in every component
const { data: group } = useQuery({...});
const { isTripPast } = useTripDetails(group?.trip?.id ?? "");
const { data: currentUserWithGroup } = useQuery({
  ...orpc.user.getMyWithGroup.queryOptions({
    input: { tripId: group?.trip?.id ?? "" },
  }),
  enabled: !!group?.trip?.id,
});

// AFTER — normalization in hook boundary
const { data: group, tripId } = useGroupDetails(groupId);
// tripId is always string ("" if not available)
const { isTripPast } = useTripDetails(tripId);
const { data: currentUserWithGroup } = useQuery({
  ...orpc.user.getMyWithGroup.queryOptions({ input: { tripId } }),
  enabled: !!tripId,
});
```

### 3.3 Navigation Params — Untyped Optional Params

```typescript
// BEFORE — untyped optional params
const params = useLocalSearchParams();
const groupId = typeof params.id === "string" ? params.id : params.id?.[0];

// AFTER — strict typed params with runtime assertion
// src/navigation/types.ts
export type GroupParams = { id: string };

// src/app/(tabs)/trips/groups/[id].tsx
const params = useLocalSearchParams<GroupParams>();
const groupId = assertParam(params.id, "id"); // throws if missing

// src/utils/navigation.ts
export function assertParam<T>(value: T | string[] | undefined, name: string): T {
  if (Array.isArray(value)) return value[0] as T;
  if (value !== undefined) return value;
  throw new Error(`Missing required navigation param: ${name}`);
}
```

### 3.4 Form Handling — Imperative Validation with Null Error States

```typescript
// BEFORE — manual null error states
const [emailError, setEmailError] = useState<string | null>(null);
const [passwordError, setPasswordError] = useState<string | null>(null);

// AFTER — discriminated union for form state
type FormState = 
  | { status: "idle" }
  | { status: "error"; errors: Record<string, string> }
  | { status: "submitting" }
  | { status: "success" };

const [formState, setFormState] = useState<FormState>({ status: "idle" });
```

---

## 4. Shared Utilities Analysis

### 4.1 `packages/shared/src/users/participantResult.ts`

```typescript
// BEFORE — PublicUser with 3 null string fields
export interface PublicUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: UserRole;
}

// AFTER — normalized at boundary
export interface PublicUser {
  id: string;
  firstName: string;   // "" if not set
  lastName: string;    // "" if not set
  email: string;       // "" if not set
  role: UserRole;
  hasName: boolean;    // derived from firstName || lastName
  hasEmail: boolean;   // derived from email
}

// Mapper function in shared package
export const toPublicUser = (user: DbUser): PublicUser => ({
  id: user.id,
  firstName: user.firstName ?? "",
  lastName: user.lastName ?? "",
  email: user.email ?? "",
  role: user.role,
  hasName: !!(user.firstName || user.lastName),
  hasEmail: !!user.email,
});
```

### 4.2 `packages/shared/src/stores/authStore.ts`

```typescript
// BEFORE — AuthUser with 6 nullable fields
export interface AuthUser {
  id: string;
  authUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  emailVerified: Date | null;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
}

// AFTER — normalize nulls to defaults
export interface AuthUser {
  id: string;
  authUserId: string;
  email: string;           // "" if not set
  firstName: string;       // "" if not set
  lastName: string;        // "" if not set
  name: string;            // "" if not set
  emailVerified: Date | null;  // Keep null — legitimate "not verified" state
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
  isEmailVerified: boolean; // derived
  hasName: boolean;         // derived
}
```

---

## 5. Week-by-Week Execution Plan

### Phase 1: Quick Wins (Week 1)

**Goal:** Eliminate the most impactful nullability patterns with minimal risk.

**Day 1–2: Fix Zod double-nullable anti-patterns**
- [ ] `packages/orpc/src/utils/location-validation.ts`: Remove `.nullable()` from all 7 `.optional().nullable()` chains
- [ ] `packages/orpc/src/api/routers/activityFeed/index.ts`: Remove `.nullable()` from `description` field
- [ ] `packages/orpc/src/api/routers/reward/index.ts`: Remove `.nullable()` from `image` field
- [ ] Run `bun run typecheck` in `packages/orpc`
- [ ] Run `bun run test` in `packages/orpc`
- **Impact:** Eliminates 10 triple-state fields. **Risk:** Low — input validation only.

**Day 3–4: Normalize shared type definitions**
- [ ] `packages/shared/src/users/participantResult.ts`: Change `PublicUser` fields from `| null` to `string` with defaults
- [ ] `packages/shared/src/stores/authStore.ts`: Change `AuthUser` string fields from `| null` to `string` with defaults
- [ ] Add `hasName`, `hasEmail`, `isEmailVerified` derived booleans
- [ ] Update all consumers in `apps/native` and `packages/orpc`
- [ ] Run `bun run typecheck` across affected packages
- **Impact:** Removes ~30 `| null` patterns from shared types. **Risk:** Medium — requires updating all consumers.

**Day 5: Fix native `useState` defaults**
- [ ] `apps/native/src/hooks/trips/useTrips.ts`: `useState<TripListItem[]>([])` instead of `null`
- [ ] `apps/native/src/hooks/trips/useTripDetails.ts`: `useState<string>("")` instead of `string | null`
- [ ] `apps/native/src/app/auth/login.tsx`: `useState<string>("")` for all error states
- [ ] `apps/native/src/stores/map/mapStore.ts`: `selectedUserId: ""`, `followMode: "none"`
- [ ] Run `bun run typecheck` in `apps/native`
- [ ] Run `bun run test` in `apps/native`
- **Impact:** Eliminates ~15 `useState<X | null>(null)` patterns. **Risk:** Low — behavior-preserving changes.

### Phase 2: Database Schema Hardening (Week 2)

**Goal:** Make DB columns non-nullable with sensible defaults.

**Day 1–2: Add `.notNull().default()` to simple text fields**
- [ ] `packages/db/src/schema/challenges.ts`: `description` → `.notNull().default("")`
- [ ] `packages/db/src/schema/trips.ts`: `description` → `.notNull().default("")`
- [ ] `packages/db/src/schema/groups.ts`: `description` → `.notNull().default("")`
- [ ] `packages/db/src/schema/activities.ts`: `activityFeeds.description` → `.notNull().default("")`
- [ ] `packages/db/src/schema/activities.ts`: `activityFeeds.imageUrl` → `.notNull().default("")`
- [ ] `packages/db/src/schema/coinTransactions.ts`: `reason` → `.notNull().default("")`
- [ ] `packages/db/src/schema/submissionReports.ts`: `details` → `.notNull().default("")`
- [ ] Generate migration: `cd packages/db && bun run db:generate`
- [ ] Test migration: `cd packages/db && bun run db:push` (dev environment)
- **Impact:** 8 columns made non-nullable. **Risk:** Medium — requires data migration for existing rows.

**Day 3–4: Add `.notNull().default(0)` to point fields**
- [ ] `packages/db/src/schema/challenges.ts`: `firstPlacePoints` → `.notNull().default(0)`
- [ ] `packages/db/src/schema/challenges.ts`: `secondPlacePoints` → `.notNull().default(0)`
- [ ] `packages/db/src/schema/challenges.ts`: `thirdPlacePoints` → `.notNull().default(0)`
- [ ] `packages/db/src/schema/locations.ts`: `accuracy` → `.notNull().default(0)`
- [ ] `packages/db/src/schema/sponsors.ts`: `height` → `.notNull().default(0)`
- [ ] `packages/db/src/schema/sponsors.ts`: `offsetX` → `.notNull().default(0)`
- [ ] `packages/db/src/schema/sponsors.ts`: `offsetY` → `.notNull().default(0)`
- [ ] Generate and test migration
- **Impact:** 7 columns made non-nullable. **Risk:** Medium — numeric defaults must be verified.

**Day 5: Make `locations` coordinates non-nullable**
- [ ] `packages/db/src/schema/locations.ts`: `latitude` → `.notNull()`
- [ ] `packages/db/src/schema/locations.ts`: `longitude` → `.notNull()`
- [ ] Generate and test migration
- [ ] Update `location-validation.ts` to require lat/lng
- [ ] Run `bun run test` in `packages/orpc` (location router tests)
- **Impact:** 2 columns made non-nullable. **Risk:** High — requires verifying all insert paths provide coordinates.

### Phase 3: API Normalization (Week 3)

**Goal:** Add mapper layer to normalize nulls at the API boundary.

**Day 1–2: Create router-level DTO mappers**
- [ ] `packages/orpc/src/api/routers/challenge/mappers.ts`: Normalize all nullable challenge fields
- [ ] `packages/orpc/src/api/routers/group/mappers.ts`: Normalize group description/image
- [ ] `packages/orpc/src/api/routers/activityFeed/mappers.ts`: Normalize activity fields
- [ ] `packages/orpc/src/api/routers/trip/mappers.ts`: Normalize trip description
- [ ] Export mappers from router index files
- [ ] Run `bun run test` in `packages/orpc`
- **Impact:** Nulls stop propagating from routers to clients. **Risk:** Medium — requires comprehensive testing.

**Day 3–4: Create discriminated unions for activity feed**
- [ ] `packages/orpc/src/api/routers/activityFeed/types.ts`: Replace `ActivityWithRelations` with discriminated union
- [ ] Update all activity feed queries to return union type
- [ ] Update `apps/native` components to handle union types
- [ ] Run `bun run test` in both `packages/orpc` and `apps/native`
- **Impact:** Eliminates 15 `| null` fields from activity types. **Risk:** High — affects many UI components.

**Day 5: Wrap query hooks with non-nullable defaults**
- [ ] `apps/native/src/hooks/groups/useGroupDetails.ts`: Return `tripId: string` ("" if not available)
- [ ] `apps/native/src/hooks/trips/useTripDetails.ts`: Return `tripId: string` ("" if not available)
- [ ] `apps/native/src/hooks/trips/useTripResources.ts`: Return `resources: TripResource[]` ([] if not available)
- [ ] Remove `?? []` / `?? ""` from consuming components
- [ ] Run `bun run test` in `apps/native`
- **Impact:** Removes ~50 `??` fallback expressions from components. **Risk:** Medium — hook behavior changes.

### Phase 4: Architectural Changes (Week 4)

**Goal:** Split polymorphic tables to eliminate nullable columns entirely.

**Day 1–2: Split `tripResources` table**
- [ ] Create `tripResourceLinks`, `tripResourceFiles`, `tripResourceTexts`, `tripResourceIcons` tables
- [ ] Write migration to convert existing data
- [ ] Update `packages/orpc/src/api/routers/trip/queries.ts` to query from new tables
- [ ] Update `apps/native` components to handle new data shape
- [ ] Run `bun run test` in all affected packages
- **Impact:** Eliminates 7 nullable columns. **Risk:** High — affects data model and UI.

**Day 3–4: Extract `challengeRecurrence` and `challengeLocation` tables**
- [ ] Create `challengeRecurrence` table (`challengeId`, `dailyStartTime`, `dailyEndTime`, `isRecurring`)
- [ ] Create `challengeLocation` table (`challengeId`, `targetLatitude`, `targetLongitude`, `expectedValue`)
- [ ] Write migration to convert existing data
- [ ] Update `packages/orpc/src/api/routers/challenge/` queries and mutations
- [ ] Update `apps/native` challenge forms
- [ ] Run `bun run test`
- **Impact:** Eliminates 6 nullable columns. **Risk:** High — affects core challenge logic.

**Day 5: Documentation and policy setup**
- [ ] Write `docs/conventions/null-safety.md` with the "nulls at the boundary" rule
- [ ] Add PR checklist item for nullability review
- [ ] Update `AGENTS.md` with null-safety guidelines
- [ ] Run full test suite: `bun run test`
- [ ] Run full type check: `nx run-many -t typecheck`
- **Impact:** Prevents future nullability proliferation. **Risk:** Low.

---

## 6. "Nulls at the Boundary" Rule

### Boundary Matrix

```
┌─────────────────────────────────────────────────────────┐
│  LAYER              │  NULL ALLOWED  │  NORMALIZATION   │
├─────────────────────────────────────────────────────────┤
│  Database (Drizzle) │  Yes           │  .default()      │
│  API Input (Zod)    │  Limited       │  .default()      │
│  API Output (oRPC)    │  No            │  Mapper functions│
│  Client Hooks       │  No            │  Hook wrappers   │
│  Components/Stores  │  No            │  Strict types    │
└─────────────────────────────────────────────────────────┘
```

### Rules for Each Layer

**1. Database Layer:**
- Allow `NULL` for truly optional fields (foreign keys, conditional data, timestamps)
- Use `.notNull().default(...)` for fields that have natural empty states
- Prefer table splits over sparse columns for polymorphic data

**2. API Input (Zod):**
- Use `.optional()` for partial updates
- Never chain `.optional().nullable()` — pick one
- Use `.default()` for fields that should always have a value
- Use `.refine()` for conditional validation instead of making fields nullable

**3. API Output (oRPC):**
- Mapper functions normalize all `null` to defaults before returning
- Return `undefined` instead of `null` for "not found" (use `findFirst` → `undefined`)
- Use discriminated unions instead of `type | null` for variant data

**4. Client Hooks:**
- Wrap `useQuery` in domain-specific hooks that return non-nullable defaults
- Use `status` discriminated unions for async state instead of `data | null` + `isLoading`
- Never expose `null` to components — use `[]`, `""`, or `undefined` with status

**5. Components/Stores:**
- Use `[]` for empty collections
- Use `""` for empty strings
- Use `undefined` for "not yet loaded" (with a status enum)
- Use discriminated unions for variant state

---

## 7. Future Policy — Avoid/Prefer List

### AVOID

| Pattern | Why | Alternative |
|---------|-----|-------------|
| `useState<X \| null>(null)` when a default exists | Creates unnecessary null checks | `useState<X>(default)` |
| `\| null` for optional string/number fields | Empty values are better represented with defaults | `.default("")` / `.default(0)` |
| `z.optional().nullable()` | Creates triple-state ambiguity | `z.optional()` only |
| `z.nullable().optional()` | Same triple-state ambiguity | `z.optional()` only |
| `\| null` in interface properties | Propagates null checks everywhere | Normalize at boundary |
| `?? []` / `?? ""` in components | Defensive coding obscures data flow | Normalize in hook boundary |
| `if (!x)` truthiness checks | Fails for `0`, `""`, `false` | Explicit null checks or `??` |
| `?.` chains on API data | Suggests data isn't normalized | Normalize in mapper before returning |
| `Alert.alert` for form validation | Imperative, hard to test | Pure validation functions + state |
| Sparse polymorphic tables | Too many nullable columns | Split into type-specific tables |

### PREFER

| Pattern | When to Use |
|---------|-------------|
| `useState<T[]>([])` | Empty collections |
| `useState<string>("")` | Empty string fields |
| `useState<number>(0)` | Empty numeric fields |
| `RemoteData<T>` discriminated union | Async state: `{ status: "idle" \| "loading" \| "success" \| "error"; data?: T; error?: Error }` |
| `z.string().default("")` | String fields that can be empty |
| `z.number().default(0)` | Numeric fields that can be zero |
| `z.optional()` only | Partial update schemas |
| `.notNull().default(...)` | Database columns with natural empty states |
| Mapper functions at router boundary | Normalize nulls before returning to client |
| Discriminated unions | Variant data (e.g., activity types, submission types) |
| `hasX: boolean` derived fields | Instead of `X \| null` for presence checks |
| Strict navigation param types | Required params with runtime assertion |

### PR Checklist

Before merging any PR that touches types, schemas, or state:

- [ ] No new `.optional().nullable()` or `.nullable().optional()` chains added
- [ ] No new `useState<X | null>(null)` without justification
- [ ] No new `| null` on string/number types without `.default()` equivalent
- [ ] Database schema changes use `.notNull().default()` where appropriate
- [ ] Router outputs normalize nulls to defaults before returning
- [ ] Components don't add `??` fallbacks — they receive non-nullable data from hooks

---

## 8. Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Nullable DB columns | ~85 | ~50 | -41% |
| `\| null` in shared types | ~30 | ~10 | -67% |
| `useState<X \| null>(null)` | ~52 | ~20 | -62% |
| `??` fallback in components | ~280 | ~150 | -46% |
| `?.` optional chaining | ~727 | ~500 | -31% |
| Triple-state Zod fields | 11 | 0 | -100% |
| `ActivityWithRelations` null fields | 15 | 0 | -100% |

**Total files affected:** 40+ schema, router, hook, and component files.
**Estimated implementation time:** 4 weeks (as outlined above).
**Risk level:** Low-to-medium for weeks 1–2, medium-to-high for weeks 3–4.

---

*Document generated by automated codebase analysis. Review with senior engineers before executing Phase 4 (architectural changes).*
