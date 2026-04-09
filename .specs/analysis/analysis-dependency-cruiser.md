# Codebase Analysis: Dependency-Cruiser Violations

**Task**: Fix dependency-cruiser violations after package consolidation  
**Analysis Date**: 2026-04-09  
**Analyst**: SDD Code Explorer

---

## Executive Summary

This analysis identifies all files affected by dependency-cruiser violations after the legacy package consolidation. There are **11 unresolvable import errors** and **67 orphan warnings** that need to be addressed.

| Metric                     | Count | Priority        |
| -------------------------- | ----- | --------------- |
| Unresolvable Import Errors | 11    | HIGH (blocking) |
| Orphan Warnings            | 67    | MEDIUM          |
| Files to Modify            | ~15   | -               |
| Configuration Updates      | 2     | HIGH            |

---

## Phase 1: Unresolvable Import Errors

### Error Distribution

All 11 errors are related to **@mirai-app/frameworks** package imports that cannot be resolved.

#### Affected Files

| #   | File                                    | Import Path                    | Package  | Issue                 |
| --- | --------------------------------------- | ------------------------------ | -------- | --------------------- |
| 1   | `apps/seed/index.ts`                    | `@mirai-app/frameworks/prisma`      | prisma   | Export not configured |
| 2   | `apps/seed/src/config/db.ts`            | `@mirai-app/frameworks/prisma`      | prisma   | Export not configured |
| 3   | `apps/seed/src/config/supabase.ts`      | `@mirai-app/frameworks/supabase`    | supabase | Export not configured |
| 4   | `apps/seed/src/rewards.ts`              | `@mirai-app/frameworks/prisma`      | prisma   | Export not configured |
| 5   | `apps/seed/src/sponsors.ts`             | `@mirai-app/frameworks/prisma`      | prisma   | Export not configured |
| 6   | `apps/seed/src/tripInfo.ts`             | `@mirai-app/frameworks/prisma`      | prisma   | Export not configured |
| 7   | `apps/notification-sender/src/index.ts` | `@mirai-app/frameworks/trpc/client` | trpc     | Export not configured |
| 8   | `apps/notification-sender/src/index.ts` | `@mirai-app/frameworks/supabase`    | supabase | Export not configured |

**Note**: apps/notification-sender has 2 errors in one file.

### Root Cause

The `packages/frameworks/package.json` lacks proper `exports` configuration for sub-modules:

- `/prisma` → not exported
- `/supabase` → not exported
- `/trpc/client` → not exported

### Solution

Update `packages/frameworks/package.json` to add exports:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./prisma": "./src/prisma/index.ts",
    "./supabase": "./src/supabase/index.ts",
    "./trpc/client": "./src/trpc/client.ts"
  }
}
```

---

## Phase 2: Orphan Warnings Analysis

### Orphan Categories

#### Category A: Prisma Model Library Files (40 orphans)

**Location**: `packages/frameworks/src/prisma/lib/models/`

These files define Prisma model TypeScript types. They are imported by other modules within the package but dependency-cruiser sees them as orphans because:

1. They are not re-exported from the package's public API
2. They are only used internally

**Files**:

- ActivityFeed.ts, ActivityReaction.ts
- Challenge.ts, ChallengeActivity.ts, ChallengeSubmission.ts, ChallengeVote.ts
- CoinTransaction.ts
- Event.ts
- Group.ts, GroupJoinRequest.ts
- Location.ts, LocationSharingRequest.ts
- Notification.ts, NotificationDelivery.ts, NotificationPush.ts, NotificationSchedule.ts, NotificationScheduleExecution.ts
- PushSubscription.ts
- RankChangeActivity.ts
- Reward.ts, RewardPurchase.ts
- Sponsor.ts
- SubmissionActivity.ts, SubmissionReport.ts
- Trip.ts, TripInsurance.ts, TripInsuranceStep.ts, TripParticipant.ts, TripResource.ts, TripSponsor.ts
- User.ts, UserAgent.ts, UserEvent.ts, UserPost.ts
- models.ts (barrel export file)

**Solution**: Add to `.dependency-cruiser.mjs` exclusions:

```javascript
pathNot: ["packages/frameworks/src/prisma/lib/models/.*\\.ts$"];
```

---

#### Category B: React/UI Components (14 orphans)

**Location**: Various app directories

| File                    | Location                                  | Type             |
| ----------------------- | ----------------------------------------- | ---------------- |
| Sidebar.tsx             | apps/web/src/components/                  | Web component    |
| TopBar.tsx              | apps/native/src/components/               | Native component |
| SafeAreaWrapper.tsx     | apps/native/src/components/               | Native component |
| MapOverlay.tsx          | apps/native/src/components/map/overlays/  | Native component |
| ProgressBar.tsx         | apps/native/src/components/challenges/    | Native component |
| NotificationsHeader.tsx | apps/native/src/components/notifications/ | Native component |
| (tabs)/\* files         | apps/native/src/app/(tabs)/               | Route files      |

**Solution**: Route files and entry points should be excluded. Components may need to be integrated or excluded.

**Recommended exclusions**:

```javascript
pathNot: [
  "apps/.*/app/\\(.*\\)/.*\\.tsx?$", // Route files with (group) syntax
  "apps/native/src/components/.*\\.tsx$", // Native components (entry points)
  "apps/web/src/components/.*\\.tsx$", // Web components
];
```

---

#### Category C: Type Definition Files (5 orphans)

**Location**: Various

| File     | Location                                              | Usage              |
| -------- | ----------------------------------------------------- | ------------------ |
| types.ts | apps/native/src/types/notifications.ts                | Notification types |
| types.ts | apps/seed/src/types.ts                                | Seed types         |
| types.ts | apps/native/src/components/trips/list/types.ts        | Trip list types    |
| types.ts | apps/native/src/components/trips/leaderboard/types.ts | Leaderboard types  |
| types.ts | apps/native/src/components/trips/groups/types.ts      | Group types        |
| types.ts | apps/native/src/components/trips/challenges/types.ts  | Challenge types    |
| types.ts | apps/native/src/components/rewards/types.ts           | Reward types       |

**Solution**: Type files that are only imported but not themselves importing anything appear as orphans. These should be excluded:

```javascript
pathNot: [
  ".*/types\\.ts$", // Any file named types.ts
];
```

---

#### Category D: Configuration Files (4 orphans)

| File                      | Reason                        |
| ------------------------- | ----------------------------- |
| `.dependency-cruiser.mjs` | The config file itself        |
| `happydom.ts`             | Test environment setup        |
| `commitlint.config.cjs`   | Git commit linting config     |
| `metro.config.cjs`        | Metro bundler config (native) |
| `jest.config.cjs`         | Jest config (native)          |
| `jest.setup.cjs`          | Jest setup (native)           |
| `babel.config.cjs`        | Babel config (native)         |
| `tailwind.config.cjs`     | Tailwind config (native)      |
| `astro.config.mjs`        | Astro config (web)            |
| `index.ts`                | App entry point (native)      |

**Solution**: These are already partially covered by existing exclusions but some aren't matching:

```javascript
pathNot: [
  "\\.config\\.(ts|js|cjs|mjs)$", // All config files
  "apps/native/(index|metro|jest|babel|tailwind)\\.config\\.cjs$",
  "apps/native/jest\\.setup\\.cjs$",
  "apps/native/index\\.ts$",
];
```

---

#### Category E: Utility/Hooks Files (4 orphans)

| File                      | Location                                     | Purpose             |
| ------------------------- | -------------------------------------------- | ------------------- |
| camera.ts                 | apps/native/src/utils/                       | Camera utilities    |
| useExpoUpdates.ts         | apps/native/src/hooks/                       | Expo updates hook   |
| runtimeEnv.ts             | apps/native/src/config/                      | Runtime environment |
| challengeFormConstants.ts | apps/native/src/components/admin/challenges/ | Form constants      |

**Solution**: These may be legitimately unused or need integration. Investigate and either:

1. Remove if truly dead code
2. Add exclusions if intentionally standalone

---

## Integration Points

### Layer Dependencies

The violations span multiple layers of the architecture:

```
Apps Layer (apps/seed, apps/notification-sender)
    ↓ (imports)
Frameworks Layer (packages/frameworks)
    ↓ (model imports - orphans)
Database Layer (prisma models)
```

### Risk Assessment

| Area                | Risk Level | Impact                              |
| ------------------- | ---------- | ----------------------------------- |
| Package exports fix | Low        | Apps will correctly resolve imports |
| Orphan exclusions   | Low        | Cosmetic warnings suppressed        |
| Dead code removal   | Medium     | Need verification before deletion   |

---

## Expected Changes

### Files to Modify

1. **packages/frameworks/package.json** - Add exports field
2. **.dependency-cruiser.mjs** - Update orphan exclusions
3. **packages/frameworks/src/index.ts** - May need to re-export models

### Verification Steps

After each change:

```bash
# Verify unresolvable errors are fixed
bunx dependency-cruiser --validate . 2>&1 | grep -c "error"
# Expected: 0

# Verify orphan count is reduced
bunx dependency-cruiser --validate . 2>&1 | grep -c "warn no-orphans"
# Expected: Significantly reduced
```

---

## Key Integration Points

### 1. Package Export Configuration

The fix requires updating package.json exports which affects how other packages import from `@mirai-app/frameworks`. All imports like:

```typescript
import { prisma } from "@mirai-app/frameworks/prisma";
```

Will start working correctly once exports are configured.

### 2. Orphan Exclusions Strategy

The orphan exclusions follow existing patterns in the config. Key principles:

- **Entry points**: Apps and their entry files are legitimate orphans
- **Config files**: Build/runtime configs are legitimate orphans
- **Internal models**: Library files used only within a package are legitimate
- **Type files**: Pure type definitions are often orphans by design

### 3. Similar Patterns

This fix follows the same pattern as the existing exclusions for:

- Repository ports in `packages/use-cases/src/ports/`
- Domain repository interfaces in `packages/domain/src/repositories/`
- Test and config files

---

## Recommended Implementation Order

1. **Phase 1**: Fix package exports (high impact, fixes all errors)
2. **Phase 2**: Update orphan exclusions in dependency-cruiser config
3. **Phase 3**: Verify all violations are resolved
4. **Phase 4**: Document any remaining tech debt

---

## Appendix: Full Violation List

### Unresolvable Errors (11)

```
apps/seed/index.ts → @mirai-app/frameworks/prisma
apps/seed/src/config/db.ts → @mirai-app/frameworks/prisma
apps/seed/src/config/supabase.ts → @mirai-app/frameworks/supabase
apps/seed/src/rewards.ts → @mirai-app/frameworks/prisma
apps/seed/src/sponsors.ts → @mirai-app/frameworks/prisma
apps/seed/src/tripInfo.ts → @mirai-app/frameworks/prisma
apps/notification-sender/src/index.ts → @mirai-app/frameworks/trpc/client
apps/notification-sender/src/index.ts → @mirai-app/frameworks/supabase
```

### Orphan Warnings by Category

- Prisma models: 40 files
- React components: 14 files
- Type definitions: 5 files
- Configuration files: 4 files
- Utility/hooks: 4 files

**Total**: 67 orphan warnings
