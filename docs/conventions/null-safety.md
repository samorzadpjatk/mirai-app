# MIRAI Monorepo Null-Safety Action Plan

> Synthesized from codebase audit: ~85 nullable DB columns, 194 `z.optional()` / 13 `z.nullable()` / 11 double-nullable patterns, 52 `useState<X | null>(null)` instances, 280 `??` fallback expressions, and pervasive `| null` in shared types.

---

## 1. Top Impact Findings

### Finding 1: Double-Nullable `z.optional().nullable()` — Type-Safety Poison
**11 instances** in 3 files (mostly `location-validation.ts`). Creates `T | null | undefined`, forcing consumers to handle **three** states. This is the highest-leverage fix.

### Finding 2: Implicit Database Nullability by Omission
Drizzle columns without `.notNull()` silently default to nullable. The `challenges` table has **14 nullable columns**, `challengeSubmissions` has **8**, `locations` has **8**. Many of these represent business-optional fields (e.g. `dailyStartTime`, `targetLatitude`) but the nullability propagates unchecked through every layer.

### Finding 3: `| null` Propagated Through Shared Types
`PublicUser`, `AuthUser`, and `MapUserLocation` declare `string | null` for names, emails, and images. This forces **every UI component** to defensively coalesce (`?? ""`, `?? "Anonymous"`) rather than handling absence once at the boundary.

### Finding 4: Frontend State Over-Uses `null`
**52 `useState<X | null>(null)`** patterns across 36 files. `null` is often used as a "not loaded yet" sentinel when `undefined` (the React Query default) or a discriminated union would be more precise.

### Finding 5: `??` Fallback Sprawl
**280 nullish-coalescing expressions** in `apps/native` alone, plus **322** in `packages/orpc`. This is a symptom: nullability is not being resolved at the boundary; it leaks into every render and every router handler.

### Finding 6: `strictNullChecks` Is Enabled But Undermined by Design
`tsconfig.base.json` extends `@tsconfig/bun/tsconfig.json` which sets `"strict": true`. The compiler **is** catching nulls — but the team is compensating with mass `?.` and `??` rather than reducing the surface area of nullability.

### Finding 7: No "Boundary Normalization" Convention
There is no documented rule for *where* in the stack a DB `null` becomes a domain default (empty string, `undefined`, `0`, `false`). Every router and component makes an ad-hoc decision.

---

## 2. Concrete Recommendations with Code Examples

### Rec 1: Ban `.optional().nullable()` — Pick One Semantics

**Current (anti-pattern):**
```typescript
// packages/orpc/src/utils/location-validation.ts
export const locationDataSchema = z.object({
  latitude: latitudeSchema.optional().nullable(),   // number | null | undefined
  longitude: longitudeSchema.optional().nullable(), // number | null | undefined
  accuracy: z.number().nonnegative().optional().nullable(),
  // ...
});
```

**Recommended:**
```typescript
// Option A: If the field is truly optional, use only .optional()
// (undefined means "not provided", and that's enough)
export const locationDataSchema = z.object({
  latitude: latitudeSchema.optional(),   // number | undefined
  longitude: longitudeSchema.optional(), // number | undefined
  accuracy: z.number().nonnegative().optional(),
  // ...
});

// Option B: If you must accept null from a legacy client,
// use .transform() to normalize at the boundary
export const locationDataSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable()
    .transform(v => v ?? undefined)
    .optional(),
  // ...
});
```

**Rule:** Never let `T | null | undefined` cross a router boundary. If both shapes are possible inputs, normalize to `T | undefined` immediately after validation.

---

### Rec 2: Normalize Shared Types at the Boundary

**Current:**
```typescript
// packages/shared/src/users/participantResult.ts
export interface PublicUser {
  id: string;
  firstName: string | null;  // leaks null into every component
  lastName: string | null;
  email: string | null;
  role: UserRole;
}

export const toPublicUser = (user, emailMap) => ({
  id: user.id,
  firstName: user.firstName ?? null,  // preserves null
  lastName: user.lastName ?? null,
  email: user.authUserId ? (emailMap.get(user.authUserId) ?? null) : null,
}));
```

**Recommended:**
```typescript
export interface PublicUser {
  id: string;
  firstName: string;  // normalized — never null
  lastName: string;
  email: string;
  role: UserRole;
  displayName: string; // computed, always present
}

export const toPublicUser = (user, emailMap): PublicUser => {
  const firstName = user.firstName ?? "";
  const lastName = user.lastName ?? "";
  return {
    id: user.id,
    firstName,
    lastName,
    email: user.authUserId ? (emailMap.get(user.authUserId) ?? "") : "",
    role: user.role,
    displayName: [firstName, lastName].filter(Boolean).join(" ") || "Użytkownik",
  };
};
```

**Impact:** Every component that renders a user name can drop `?? "Anonymous"`. The fallback lives in **one** mapper function.

---

### Rec 3: Replace `useState<T | null>(null)` with `undefined` or Discriminated Unions

**Current:**
```tsx
// apps/native/src/hooks/admin/useChallengeForm.ts
const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
const [image, setImage] = useState<string | null>(null);
```

**Recommended — Option A (simple):**
```tsx
const [selectedTrip, setSelectedTrip] = useState<string | undefined>(undefined);
const [image, setImage] = useState<string | undefined>(undefined);
// Clearing state becomes `setImage(undefined)` instead of `setImage(null)`
// and aligns with React Query's "no data" shape.
```

**Recommended — Option B (explicit states, for complex UI):**
```tsx
type ImageState =
  | { status: "empty" }
  | { status: "selected"; uri: string }
  | { status: "uploading"; uri: string; progress: number }
  | { status: "uploaded"; url: string };

const [image, setImage] = useState<ImageState>({ status: "empty" });
// No null, no ambiguity, exhaustive switch statements are enforceable.
```

---

### Rec 4: Add `.notNull().default(...)` to Database Columns That Require It

**Current:**
```typescript
// packages/db/src/schema/challenges.ts
basePoints: integer("base_points").default(0).notNull(),   // good
firstPlacePoints: integer("first_place_points"),          // nullable — but is it?
secondPlacePoints: integer("second_place_points"),        // nullable
thirdPlacePoints: integer("third_place_points"),          // nullable
```

**Recommended:**
```typescript
// If the business rule is "0 when not set", make it non-nullable
firstPlacePoints: integer("first_place_points").default(0).notNull(),
secondPlacePoints: integer("second_place_points").default(0).notNull(),
thirdPlacePoints: integer("third_place_points").default(0).notNull(),
```

**Caution:** Changing a nullable column to `notNull()` requires a migration that back-fills existing rows. Only do this when the default is semantically correct for **all** historical data.

**For columns that must stay nullable** (e.g. `targetLatitude` on a non-location-based challenge), add an explicit `.nullable()` to make the intent visible:
```typescript
targetLatitude: real("target_latitude").nullable(),
```

---

### Rec 5: Create Router-Level Boundary Mappers

**Current (inline coalescing in every query):**
```typescript
// packages/orpc/src/api/routers/challenge/queries.ts
return {
  ...challenge,
  firstPlacePoints: challenge.firstPlacePoints ?? 0,
  secondPlacePoints: challenge.secondPlacePoints ?? 0,
  // repeated in every router that touches challenges
};
```

**Recommended:**
```typescript
// packages/shared/src/challenges/challengeMappers.ts
export const toChallengeDto = (dbChallenge: typeof challenges.$inferSelect) => ({
  id: dbChallenge.id,
  name: dbChallenge.name,
  description: dbChallenge.description ?? "",   // boundary normalization
  image: dbChallenge.image ?? null,               // or undefined, depending on contract
  firstPlacePoints: dbChallenge.firstPlacePoints ?? 0,
  secondPlacePoints: dbChallenge.secondPlacePoints ?? 0,
  thirdPlacePoints: dbChallenge.thirdPlacePoints ?? 0,
  targetLatitude: dbChallenge.targetLatitude ?? undefined,
  targetLongitude: dbChallenge.targetLongitude ?? undefined,
  // ...
});

export type ChallengeDto = ReturnType<typeof toChallengeDto>;
```

Then in the router:
```typescript
import { toChallengeDto } from "@mirai-app/shared/challenges";

const challenge = await db.query.challenges.findFirst({ ... });
if (!challenge) throw new ORPCError("NOT_FOUND");
return toChallengeDto(challenge);  // nulls normalized here, never downstream
```

---

### Rec 6: Standardize Query Fallbacks in Hooks, Not Components

**Current (component-level coalescing):**
```tsx
// apps/native/src/app/(tabs)/trips/challenges/[id].tsx
const { data: submissions } = useQuery(orpc.challengeSubmission.getMy.queryOptions());
return (
  <FlatList
    data={submissions ?? []}   // fallback in render
    renderItem={...}
  />
);
```

**Recommended (hook-level normalization):**
```tsx
// apps/native/src/hooks/challenges/useMySubmissions.ts
export function useMySubmissions() {
  return useQuery({
    ...orpc.challengeSubmission.getMy.queryOptions(),
    select: (data) => data ?? [],  // normalize once
  });
}

// Component becomes clean:
const { data: submissions } = useMySubmissions();
return <FlatList data={submissions} renderItem={...} />;
// data is always T[], never undefined
```

---

## 3. Prioritized Action Plan

### Phase 1: Quick Wins (1–2 days, immediate type-safety gains)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 1.1 | **Eliminate all `.optional().nullable()`** → normalize to `.optional()` or `.nullable().transform()` | `location-validation.ts`, `reward/index.ts`, `activityFeed/index.ts` | 2 hrs |
| 1.2 | **Add ESLint rule** banning `.optional().nullable()` and `.nullable().optional()` | `.eslintrc` or `eslint.config.js` | 1 hr |
| 1.3 | **Normalize `PublicUser` and `AuthUser`** → `string` instead of `string \| null` for names/email | `packages/shared/src/users/participantResult.ts`, `stores/authStore.ts` | 3 hrs |
| 1.4 | **Normalize `MapUserLocation`** → `string` with defaults | `packages/shared/src/stores/mapStore.ts` | 1 hr |
| 1.5 | **Fix downstream fallbacks** after shared-type changes | `apps/native` components using `?? ""` on user names | 2 hrs |

**Expected outcome:** ~50 `??` expressions removed from UI layer; `PublicUser` consumers no longer defensively coalesce names.

### Phase 2: Medium Effort (1–2 weeks, structural improvements)

| # | Task | Scope | Effort |
|---|------|-------|--------|
| 2.1 | **Audit DB schema** — decide which nullable columns should have `.default().notNull()` | `packages/db/src/schema/*.ts` | 4 hrs |
| 2.2 | **Write migration** for any column changed from nullable → notNull | `packages/db/drizzle/` | 2 hrs |
| 2.3 | **Create boundary mappers** for high-nullability tables (`challenges`, `challengeSubmissions`, `locations`, `activityFeeds`) | `packages/shared/src/challenges/`, `locations/`, `feed/` | 8 hrs |
| 2.4 | **Refactor frontend state** — replace `useState<T \| null>(null)` with `useState<T \| undefined>()` where `null` is not a meaningful value | `apps/native/src/hooks/`, `components/` | 6 hrs |
| 2.5 | **Move query fallbacks into `select`** hooks | `apps/native/src/hooks/` | 4 hrs |

**Expected outcome:** Routers return DTOs instead of raw DB rows; components receive non-nullable data; 100+ `??` expressions eliminated.

### Phase 3: Architectural (ongoing, policy & culture)

| # | Task | Scope | Effort |
|---|------|-------|--------|
| 3.1 | **Document "Nulls at the Boundary" rule** in `docs/conventions/null-safety.md` | docs | 2 hrs |
| 3.2 | **Add PR checklist item** — "Did you normalize nulls at the API boundary?" | `.github/pull_request_template.md` | 30 min |
| 3.3 | **TypeScript helper types** — `Nullable<T>`, `Present<T>`, `Boundary<T>` | `packages/shared/src/types/` | 2 hrs |
| 3.4 | **Periodic audit** — quarterly grep for new `.optional().nullable()` and `\| null` proliferation | CI script | 1 hr |

---

## 4. "Nulls at the Boundary" Rule

### Definition
> **Null values from the database are allowed only inside `packages/db` and at the immediate API mapper layer. Everywhere else — shared types, router outputs, frontend state, and UI props — nulls must be normalized to domain-appropriate defaults or `undefined`.**

### Boundary Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer              │  Null Policy                          │
├─────────────────────────────────────────────────────────────┤
│  Database (Drizzle) │  NULL allowed — PostgreSQL semantics │
│  DB Queries         │  NULL allowed — raw schema types       │
│  API Mappers        │  NULL normalized → defaults/undefined  │  ← BOUNDARY
│  Router Outputs     │  NO NULL (except truly optional refs)  │
│  Shared Types       │  NO NULL (use undefined or defaults)   │
│  Frontend State     │  NO NULL (use undefined or unions)     │
│  UI Components      │  NO NULL (props are always defined)    │
└─────────────────────────────────────────────────────────────┘
```

### Decision Matrix for Normalization

| DB Value | Domain Meaning | Normalize To | Example |
|----------|---------------|--------------|---------|
| `NULL` string | "Not provided" | `undefined` or `""` | `firstName` → `""` |
| `NULL` number | "Not applicable" | `undefined` or `0` | `firstPlacePoints` → `0` |
| `NULL` boolean | "Not decided" | `undefined` or `false` | `autoApprove` → `false` (already has default) |
| `NULL` timestamp | "Not scheduled" | `undefined` | `startTime` → `undefined` |
| `NULL` FK | "Not assigned" | `undefined` | `reviewedById` → `undefined` |
| `NULL` array | "No items" | `[]` | `imageIds` → `[]` (already has default) |

### Exception: Truly Optional References
If a field is **semantically optional** and there is no sensible default (e.g. `hiddenReason` on an activity that was never hidden), use `undefined` instead of `null`:

```typescript
// Good
interface ActivityFeedDto {
  hiddenReason?: string;  // undefined = not hidden
}

// Avoid
interface ActivityFeedDto {
  hiddenReason: string | null;  // forces ?? null checks everywhere
}
```

---

## 5. Future Code Policy

### ❌ Avoid

1. **`.optional().nullable()`** in Zod schemas — creates `T | null | undefined`.
2. **`string | null`, `number | null`** in shared types and DTOs — normalize at the boundary.
3. **`useState<T | null>(null)`** when `undefined` or a discriminated union is sufficient.
4. **Inline `??` coalescing in JSX** — move normalization to the hook or mapper.
5. **Implicit Drizzle nullability** — always be explicit: either `.notNull()` or `.nullable()`.
6. **Returning raw `table.$inferSelect`** from routers — always map to a DTO.

### ✅ Prefer

1. **`.optional()`** alone for optional Zod fields (yields `T | undefined`).
2. **`.nullable().transform(v => v ?? default)`** when you must accept `null` from a client.
3. **`undefined`** for "not present" in TypeScript APIs and React state.
4. **Boundary mappers** (`toXxxDto`) in `packages/shared` — one place for normalization logic.
5. **`.notNull().default(...)`** in Drizzle when the column should always have a value.
6. **Discriminated unions** for complex UI state instead of `T | null`.
7. **`select` in React Query** hooks to normalize data before it reaches components.

### Code Review Checklist

- [ ] No new `.optional().nullable()` or `.nullable().optional()` introduced.
- [ ] No new `| null` added to shared types without explicit justification.
- [ ] Router outputs use DTOs, not raw `$inferSelect` types.
- [ ] Frontend hooks normalize query data; components do not use `??` for API data.
- [ ] Drizzle schema changes are explicit: `.notNull()` or `.nullable()` — no silent omission.

---

## Appendix: Quick Stats from Audit

| Metric | Count | Location |
|--------|-------|----------|
| `.optional()` | 194 | `packages/orpc` (24 files) |
| `.nullable()` | 13 | `packages/orpc` (5 files) |
| `.optional().nullable()` | 11 | `packages/orpc` (3 files) |
| `??` coalescing | 322 | `packages/orpc` (55 files) |
| `?.` optional chaining | 357 | `packages/orpc` (58 files) |
| `useState<X \| null>(null)` | 52 | `apps/native` (36 files) |
| `?? [] / ?? "" / ?? 0` | 280 | `apps/native` (100 files) |
| Implicit nullable DB columns | ~85 | `packages/db` (24 tables) |

**Note:** `strictNullChecks` is already enabled via `"strict": true` in `@tsconfig/bun/tsconfig.json`. The problem is not compiler configuration — it is **design-level nullability proliferation**.
