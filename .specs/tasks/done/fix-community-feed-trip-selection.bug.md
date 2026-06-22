---
title: Fix community feed not loading when no trip is selected
type: bug
status: todo
priority: high
---

## Description

### Problem
On the Community tab (`apps/native/src/app/(tabs)/community.tsx`) the feed query is disabled whenever `selectedTripId` is null:

```ts
// useCommunityFeed.ts:205
enabled: Boolean(selectedTripId && feedQueryKey)
```

`selectedTripId` is persisted in SecureStore via `useSelectedTrip`. On a fresh install, after sign-in, or whenever the user has trips but has never picked one, `selectedTripId` is `null`. The screen currently handles this by auto-opening `TripPickerModal` (see `shouldAutoOpenTripPicker` at community.tsx:86-88). If the user dismisses the modal without choosing (`hasDismissedAutoPicker = true`), or if the auto-open logic is bypassed, the feed never loads and the `FlatList` permanently shows the `"Select trip first"` `EmptyState` (community.tsx:364-371).

Even when the user does pick a trip manually, the previous flow required an extra tap. The feed should load immediately when the user has at least one trip available, without forcing a modal interaction.

### Expected behavior
- When `trips` is non-empty AND `selectedTripId` is null AND the user has not explicitly dismissed the picker, silently call `setSelectedTripId(trips[0].id)` once. The feed loads on the next render.
- If the user has previously dismissed the picker (`hasDismissedAutoPicker === true`), do NOT override their choice — keep the "Select trip first" empty state and the manual "swap" tile so they can re-open the picker.
- If `selectedTripId` is set but stale (not present in `trips`), silently re-select the first available trip (when `!hasDismissedAutoPicker`).
- Manual trip switching via the trip tile / `TripPickerModal` continues to work unchanged.

## Acceptance Criteria

1. **AC1 — Auto-select on first load.** Given a logged-in user with ≥1 trip and `selectedTripId === null` (no SecureStore value), opening the Community tab results in `useCommunityFeed` being called with `selectedTripId === trips[0].id` within one render cycle, and the `community.getCommunityFull` query fires.

2. **AC2 — Dismissed state respected.** Given `hasDismissedAutoPicker === true` and `selectedTripId === null`, the auto-select effect does NOT run; `setSelectedTripId` is never called; the "Select trip first" `EmptyState` renders. Opening the picker via the trip tile still works.

3. **AC3 — Stale selection recovered.** Given `selectedTripId === "stale-id"` not present in `trips` and `!hasDismissedAutoPicker`, the effect re-selects `trips[0].id`; the stale id is overwritten in SecureStore.

4. **AC4 — No regression for manual switch.** Given a valid `selectedTripId` present in `trips`, the effect is a no-op. Calling `handleSelectTrip(otherTripId)` updates `selectedTripId` and the feed refetches for the new trip. No modal auto-opens.

5. **AC5 — Empty trips list.** Given `trips.length === 0`, the effect does nothing; existing loading / empty UX is unchanged.

## Affected Files

### Primary (edits / new files)
- `packages/common/src/feed/shouldAutoSelectFirstTrip.ts` — **NEW**. Pure predicate (TDD entry point).
- `packages/common/src/feed/shouldAutoSelectFirstTrip.test.ts` — **NEW**. Unit tests.
- `packages/common/src/feed/index.ts` — re-export the predicate.
- `apps/native/src/hooks/trips/useAutoSelectFirstTrip.ts` — **NEW**. Reusable hook wrapping the effect.
- `apps/native/src/hooks/trips/useAutoSelectFirstTrip.test.tsx` — **NEW**. Hook tests.
- `apps/native/src/hooks/trips/index.ts` — re-export the new hook.
- `apps/native/src/app/(tabs)/community.tsx` — wire the new effect; keep existing modal/handlers.

### Secondary (read-only — confirm contracts only)
- `apps/native/src/hooks/community/useCommunityFeed.ts` — `enabled` semantics unchanged.
- `apps/native/src/hooks/trips/useSelectedTrip.ts` — `setSelectedTripId` mutation API.
- `apps/native/src/hooks/home/useHomeFull.ts` — `trips` shape & loading flags.
- `apps/native/src/services/storage/selectedTripStorage.ts` — SecureStore persistence.

## Architecture / Approach

### Layered design (TDD-friendly)

**1. Pure predicate in `@mirai-app/common`** — single source of truth, testable with real data, no React context:

```ts
// packages/common/src/feed/shouldAutoSelectFirstTrip.ts
export interface ShouldAutoSelectFirstTripArgs {
  trips: ReadonlyArray<{ id: string }>;
  selectedTripId: string | null;
  hasDismissedAutoPicker: boolean;
}

export function shouldAutoSelectFirstTrip({
  trips,
  selectedTripId,
  hasDismissedAutoPicker,
}: ShouldAutoSelectFirstTripArgs): string | null {
  if (trips.length === 0) return null;
  if (hasDismissedAutoPicker) return null;
  const firstId = trips[0].id;
  if (selectedTripId === firstId) return null;              // already correct
  if (selectedTripId === null) return firstId;               // never selected
  if (!trips.some((t) => t.id === selectedTripId)) return firstId; // stale
  return null;
}
```

Returns the trip id to select, or `null` = "no action".

**2. Reusable hook in native** — thin `useEffect` wrapper:

```ts
// apps/native/src/hooks/trips/useAutoSelectFirstTrip.ts
import { useEffect } from "react";
import { shouldAutoSelectFirstTrip } from "@mirai-app/common/feed";
import type { TripListItem } from "~/components/trips/list/types";
import { useSelectedTrip } from "./useSelectedTrip";

export function useAutoSelectFirstTrip(
  trips: ReadonlyArray<TripListItem>,
  hasDismissedAutoPicker: boolean,
): void {
  const { selectedTripId, setSelectedTripId } = useSelectedTrip();
  useEffect(() => {
    const next = shouldAutoSelectFirstTrip({
      trips,
      selectedTripId,
      hasDismissedAutoPicker,
    });
    if (next) setSelectedTripId(next);
  }, [trips, selectedTripId, hasDismissedAutoPicker, setSelectedTripId]);
}
```

**3. Wire into `community.tsx`** — call the hook once near `useSelectedTrip()`:

```ts
useAutoSelectFirstTrip(trips, hasDismissedAutoPicker);
```

Leave `shouldAutoOpenTripPicker` / `isTripPickerOpen` intact — they naturally short-circuit once `selectedTrip` becomes non-null after the effect runs. `handleCloseTripPicker` still sets `hasDismissedAutoPicker = true` so dismiss is honored.

### Why this shape
- Pure predicate in common satisfies native rule: "Extract pure domain logic to `@mirai-app/common` for real-data testing" and avoids the anti-pattern of mocking React Query internals in tests.
- Hook returns `void` — callers can't branch on a return value; the wiring is invisible and side-effect-only.
- Single source of truth: the predicate is the only place that knows the rules.

## Implementation Steps (TDD)

### Step 1 — RED: write failing predicate tests
Create `packages/common/src/feed/shouldAutoSelectFirstTrip.test.ts` covering:
- empty trips → `null`
- trips present, `selectedTripId === null`, `!hasDismissed` → `trips[0].id`
- trips present, `selectedTripId === null`, `hasDismissed === true` → `null`
- trips present, `selectedTripId === trips[0].id` → `null` (no-op)
- trips present, `selectedTripId === "stale"`, `!hasDismissed` → `trips[0].id`
- trips present, `selectedTripId === "stale"`, `hasDismissed === true` → `null`
- trips present, `selectedTripId` is a valid non-first id → `null`

Run: `nx run @mirai-app/common:test -- shouldAutoSelectFirstTrip` → expect FAIL (module not found).

### Step 2 — GREEN: implement predicate
Create `packages/common/src/feed/shouldAutoSelectFirstTrip.ts` (body above). Re-export from `packages/common/src/feed/index.ts`. Re-run → PASS.

### Step 3 — Commit checkpoint 1
```
test(common): add tests for shouldAutoSelectFirstTrip predicate
feat(common): add shouldAutoSelectFirstTrip pure predicate
```

### Step 4 — RED: hook integration test
Create `apps/native/src/hooks/trips/useAutoSelectFirstTrip.test.tsx`. Use React Native Testing Library + mock `expo-secure-store` and the storage module (NOT React Query internals). Assert:
- `trips=[{id:"a"}]`, `selectedTripId=null`, `hasDismissed=false` → `setSelectedTripIdInStorage` called with `"a"`.
- `hasDismissed=true` → no call.
- valid `selectedTripId="a"` → no call.
- stale `selectedTripId="z"` → called with `"a"`.

Run: `nx run @mirai-app/native:test -- useAutoSelectFirstTrip` → FAIL.

### Step 5 — GREEN: implement hook
Create `apps/native/src/hooks/trips/useAutoSelectFirstTrip.ts` (body above). Re-export from `apps/native/src/hooks/trips/index.ts`. Re-run → PASS.

### Step 6 — Commit checkpoint 2
```
test(native): add tests for useAutoSelectFirstTrip hook
feat(native): add useAutoSelectFirstTrip hook
```

### Step 7 — Wire into Community screen
Edit `apps/native/src/app/(tabs)/community.tsx`:
- Import `useAutoSelectFirstTrip`.
- Invoke it once after `useSelectedTrip()`:
  ```ts
  useAutoSelectFirstTrip(trips, hasDismissedAutoPicker);
  ```
- Leave `shouldAutoOpenTripPicker`, `isTripPickerOpen`, `handleSelectTrip`, `handleCloseTripPicker`, `handleOpenTripPicker` unchanged.

### Step 8 — Manual / UI verification
- `nx run @mirai-app/native:dev`
- Fresh install (clear SecureStore `selected_trip_id`): Community tab loads feed immediately, no modal.
- Previously selected trip: tab loads that trip's feed; tapping trip tile opens modal; switching updates feed.
- Dismiss modal without selecting: empty state shows; re-opening picker via tile still works.

### Step 9 — Static checks
```
nx run @mirai-app/common:typecheck
nx run @mirai-app/common:lint
nx run @mirai-app/native:typecheck
nx run @mirai-app/native:lint
nx run @mirai-app/native:test
```

### Step 10 — Commit checkpoint 3
```
feat(native): auto-select first trip on community tab to load feed
```

## Verification

| Layer | Command | Expected |
|---|---|---|
| Predicate unit | `nx run @mirai-app/common:test -- shouldAutoSelectFirstTrip` | all cases pass |
| Hook unit | `nx run @mirai-app/native:test -- useAutoSelectFirstTrip` | all cases pass |
| Common typecheck | `nx run @mirai-app/common:typecheck` | clean |
| Common lint | `nx run @mirai-app/common:lint` | clean |
| Native typecheck | `nx run @mirai-app/native:typecheck` | clean |
| Native lint | `nx run @mirai-app/native:lint` | clean |
| UI smoke | `nx run @mirai-app/native:dev` + manual | feed loads without modal on fresh install |

## Risks / Rollback

### Risks
1. **Overriding explicit dismissal.** Mitigated: predicate checks `hasDismissedAutoPicker`. If user dismisses the modal, auto-select stays silent.
2. **Stale SecureStore write race.** `setSelectedTripId` uses `useMutation` whose `onSuccess` sets query cache; concurrent mounts could double-fire. The `useEffect` deps include `selectedTripId`, so once the mutation resolves the cache, the effect re-runs and the predicate returns `null` (already selected) — no duplicate write.
3. **Wrong trip selected.** We pick `trips[0]` (whatever the home endpoint returns first — likely sorted by start date desc). If business wants a different default (e.g., currently active trip), that's a follow-up issue, out of scope here.
4. **OTA bundle size.** New hook + predicate add <1KB. Within budget.
5. **Test mocking.** Follow existing `expo-secure-store` mock pattern already in repo; do NOT mock React Query internals (anti-pattern per native AGENTS.md).

### Rollback
Revert the three commit checkpoints in reverse order. Each is atomic and independently revertible:
- Revert checkpoint 3 → screen returns to modal-only flow.
- Revert checkpoint 2 → hook removed (must revert 3 first to avoid broken import).
- Revert checkpoint 1 → predicate + tests removed.

Auto-select is purely additive (writes a SecureStore key the existing flow already writes); reverting leaves no corrupt state. Users with an auto-selected id simply keep using that trip.

## Commit Strategy (atomic, TDD-ordered)

| # | Commit message | Files touched |
|---|---|---|
| 1 | `test(common): add tests for shouldAutoSelectFirstTrip predicate`<br>`feat(common): add shouldAutoSelectFirstTrip pure predicate` | `packages/common/src/feed/shouldAutoSelectFirstTrip.ts`, `...test.ts`, `feed/index.ts` |
| 2 | `test(native): add tests for useAutoSelectFirstTrip hook`<br>`feat(native): add useAutoSelectFirstTrip hook` | `apps/native/src/hooks/trips/useAutoSelectFirstTrip.ts`, `...test.tsx`, `hooks/trips/index.ts` |
| 3 | `feat(native): auto-select first trip on community tab to load feed` | `apps/native/src/app/(tabs)/community.tsx` |

Match root `AGENTS.md` commit style (Conventional Commits). Check `git log --oneline -5` for emoji convention before committing.

## Out of Scope
- Changing default trip selection strategy (e.g., "currently active trip" vs `trips[0]`).
- Refactoring `useCommunityFeed`'s `enabled` flag.
- Persisting `hasDismissedAutoPicker` across app restarts (currently in-memory `useState`).
