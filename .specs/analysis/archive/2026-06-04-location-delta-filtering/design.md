# Plan: GPS-Aware Delta Filtering for Location Updates

## Context

The current location update system sends every GPS movement (every 25m) to the server regardless of GPS accuracy. This causes unnecessary network requests, DB writes, and stream broadcasts when the movement is within the GPS noise margin.

## Objective

Implement adaptive delta filtering based on GPS accuracy to reduce noise updates while maintaining precise tracking when signal quality is high.

---

## Architecture Decision

**Primary: Native-side filtering** (Option A) — prevents network requests for noise before they leave the device.

**Persistence: Hybrid** (Option 3) — combines in-memory state with `SecureStore` backup:
- In-memory `lastSentLocation` for instant filtering (no I/O on every ping)
- `SecureStore` for persistence across app restarts (filter works immediately after restart)

---

## Why Not AsyncStorage

| Issue | AsyncStorage | Impact |
|-------|--------------|--------|
| **Unencrypted** | Plain text on disk | Any app with root access can read GPS coordinates |
| **iOS backup** | Included in unencrypted backups | GPS coordinates leak to iCloud/computer backups |
| **No TTL** | Persists forever | Stale coordinates from days ago remain accessible |
| **Wrong semantic fit** | Meant for preferences/booleans | GPS coordinates are sensitive data, not settings |

**The project already uses `expo-secure-store` ~55.0.13** with a `SecureStore` pattern in `src/services/storage/storage.ts`. This is the correct tool for storing the last sent location.

---

## How the Hybrid Persistence Works

| Scenario | Behavior |
|----------|----------|
| App is running (background task fires) | `lastSentLocation` is in `BackgroundTaskState` → instant filter check, no I/O |
| App restarts / process killed | `SecureStore` provides the last sent location on next task run → filter works immediately |
| `SecureStore` read fails | Falls back to `null` → sends one unfiltered update, then resumes filtering |
| `SecureStore` write fails | No impact — in-memory state is the source of truth for the current session |

**The `SecureStore` write is fire-and-forget** — we don't `await` it, so it never blocks the background task. The `read` only happens when the in-memory state is `null` (first task run after restart).

---

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `apps/native/src/services/background/backgroundLocationTaskUtils.ts` | Add `calculateDistance()`, `shouldSendLocationUpdate()`, `MINIMUM_DELTA_METERS`, `ACCURACY_MULTIPLIER` |
| 2 | `apps/native/src/services/background/backgroundLocationTask.ts` | Add `lastSentLocation` to `BackgroundTaskState`, `getLastSentLocation`/`setLastSentLocation` to `BackgroundTaskDeps`, integrate filtering into `handleBackgroundLocationTask` |
| 3 | `apps/native/src/services/location/constants.ts` | Add `LAST_SENT_LOCATION_KEY` constant |
| 4 | `apps/native/src/services/background/__tests__/backgroundLocationTask.init.test.ts` | Add tests for persistence integration, filtering skips, first-update-always-sends |
| 5 | `apps/native/src/services/__tests__/backgroundLocationTaskPureFunctions.test.ts` | Add pure function tests for `calculateDistance` and `shouldSendLocationUpdate` with all accuracy/delta combinations |

---

## Implementation Details

### 1. `backgroundLocationTaskUtils.ts` — New Pure Functions

```typescript
export const MINIMUM_DELTA_METERS = 15;
export const ACCURACY_MULTIPLIER = 2;

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function shouldSendLocationUpdate(
  newLocation: LocationObject,
  lastSentLocation: LocationObject | null,
  minimumDelta: number = MINIMUM_DELTA_METERS,
  accuracyMultiplier: number = ACCURACY_MULTIPLIER,
): boolean {
  if (!lastSentLocation) return true;

  const accuracy = newLocation.coords.accuracy;
  const threshold =
    accuracy != null
      ? Math.max(accuracy * accuracyMultiplier, minimumDelta)
      : minimumDelta;

  const delta = calculateDistance(
    lastSentLocation.coords.latitude,
    lastSentLocation.coords.longitude,
    newLocation.coords.latitude,
    newLocation.coords.longitude,
  );

  return delta > threshold;
}
```

### 2. `backgroundLocationTask.ts` — State, Deps, and Handler

```typescript
// Add to existing imports
import * as SecureStore from "expo-secure-store";
import {
  calculateDistance,
  MINIMUM_DELTA_METERS,
  shouldSendLocationUpdate,
  ACCURACY_MULTIPLIER,
} from "./backgroundLocationTaskUtils";
import { LAST_SENT_LOCATION_KEY } from "~/services/location/constants";

export interface BackgroundTaskState {
  isSending: boolean;
  lastSentLocation: LocationObject | null;
}

export interface BackgroundTaskDeps {
  shouldSend: () => Promise<boolean>;
  sendUpdate: (location: LocationObject) => Promise<void>;
  getLastSentLocation: () => Promise<<LocationObject | null>;
  setLastSentLocation: (location: LocationObject) => Promise<void>;
}

// In createBackgroundTaskDeps:
async function getLastSentLocation(): Promise<<LocationObject | null> {
  try {
    const raw = await SecureStore.getItemAsync(LAST_SENT_LOCATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocationObject;
  } catch {
    return null;
  }
}

async function setLastSentLocation(location: LocationObject): Promise<void> {
  try {
    await SecureStore.setItemAsync(LAST_SENT_LOCATION_KEY, JSON.stringify(location), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // Fire-and-forget: if SecureStore fails, we still have in-memory state
  }
}

export async function handleBackgroundLocationTask(
  data: { locations?: LocationObject[] } | undefined,
  error: Error | null,
  state: BackgroundTaskState,
  deps: BackgroundTaskDeps,
): Promise<void> {
  if (error) return;
  if (state.isSending) return;

  state.isSending = true;
  try {
    if (!(await deps.shouldSend())) return;

    const latestLocation = data?.locations?.at(-1);
    if (!latestLocation) return;

    const lastSent = state.lastSentLocation ?? (await deps.getLastSentLocation());

    if (!shouldSendLocationUpdate(latestLocation, lastSent)) {
      return;
    }

    await deps.sendUpdate(latestLocation);
    state.lastSentLocation = latestLocation;
    void deps.setLastSentLocation(latestLocation); // Fire-and-forget
  } catch {
    /* no-op */
  } finally {
    state.isSending = false;
  }
}

export function initBackgroundLocationTask(deps: BackgroundTaskDeps): void {
  const state: BackgroundTaskState = { isSending: false, lastSentLocation: null };

  try {
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
      await handleBackgroundLocationTask(
        data as { locations?: LocationObject[] } | undefined,
        error as Error | null,
        state,
        deps,
      );
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("has already been defined")) {
      /* no-op */
    }
  }
}
```

### 3. `constants.ts` — New Key

```typescript
export const LAST_SENT_LOCATION_KEY = "mirai.last_sent_location";
```

---

## The Filtering Formula

```
threshold = max(accuracy * 2, 15)
send_update = distance_moved > threshold
```

### Examples

| GPS Accuracy | Minimum Delta to Send | Behavior |
|--------------|----------------------|----------|
| 5m (excellent) | 10m | Precise tracking, real movement detected |
| 20m (good) | 40m | Only meaningful movement streamed |
| 100m (poor) | 200m | Ignores noise, only large movements |
| 500m (very poor) | 500m | Effectively disabled until signal improves |
| null (unknown) | 15m | Conservative fallback to prevent micro-updates |

---

## Test Plan

### Pure Function Tests (`backgroundLocationTaskPureFunctions.test.ts`)

| Test | Expected Result |
|------|---------------|
| `calculateDistance` identical lat/lon | 0 |
| `calculateDistance` Warsaw (52.2297, 21.0122) to Krakow (50.0647, 19.9450) | ~300km (approximate) |
| `shouldSendLocationUpdate` first location (lastSent = null) | `true` |
| `shouldSendLocationUpdate` accuracy=5m, delta=8m | `false` (below 10m threshold) |
| `shouldSendLocationUpdate` accuracy=5m, delta=15m | `true` (above 10m threshold) |
| `shouldSendLocationUpdate` accuracy=100m, delta=150m | `false` (below 200m threshold) |
| `shouldSendLocationUpdate` accuracy=100m, delta=250m | `true` (above 200m threshold) |
| `shouldSendLocationUpdate` accuracy=null, delta=10m | `false` (falls back to MINIMUM_DELTA=15m) |
| `shouldSendLocationUpdate` accuracy=null, delta=20m | `true` (above 15m threshold) |
| `shouldSendLocationUpdate` accuracy=0, delta=10m | `true` (threshold = max(0, 15) = 15m) |

### Integration Tests (`backgroundLocationTask.init.test.ts`)

| Test | Expected Result |
|------|---------------|
| `handleBackgroundLocationTask` uses `state.lastSentLocation` when available | No `getLastSentLocation` call |
| `handleBackgroundLocationTask` calls `getLastSentLocation` when state is null | SecureStore fallback invoked |
| `handleBackgroundLocationTask` skips send when filtered | No `sendUpdate` call |
| `handleBackgroundLocationTask` calls `setLastSentLocation` after successful send | Fire-and-forget persistence |
| `handleBackgroundLocationTask` does not call `setLastSentLocation` when filtered | No persistence on skip |
| `handleBackgroundLocationTask` first update after restart always sends | `getLastSentLocation` returns null → sends |

---

## Expected Impact

| Metric | Expected Improvement |
|--------|---------------------|
| **DB writes** | 30-70% reduction in urban/poor-signal areas |
| **Network usage** | Proportional reduction in location update requests |
| **Stream load** | Fewer real-time broadcasts to connected friends |
| **Battery life** | Less radio wake-up time for noise updates |
| **Precision** | Maintained when GPS accuracy is excellent (< 10m) |

---

## Rollback Plan

If the filtering is too aggressive:

1. **Immediate**: Change `MINIMUM_DELTA_METERS` from 15 to 10 (or lower)
2. **Short-term**: Change `ACCURACY_MULTIPLIER` from 2 to 1.5 (less conservative)
3. **Nuclear**: Set `MINIMUM_DELTA_METERS = 0` and `ACCURACY_MULTIPLIER = 0` — effectively disables filtering

All three are constants in `backgroundLocationTaskUtils.ts` — one-line changes.

---

## Additional Notes

- **No changes to the `expo-location` configuration** — `distanceInterval: 25`, `deferredUpdatesDistance: 25`, `Accuracy.Balanced` remain as-is. The filtering is an additional layer.
- **No backend changes required** — the server receives the same `updateLocation` calls, just fewer of them.
- **No UI changes** — friends on the map see the same data quality, just with less noise.
- **The `calculateDistance` function is duplicated** in `packages/common/src/utils/location.ts` and `packages/orpc/src/utils/location-validation.ts`. Adding a third copy in `backgroundLocationTaskUtils.ts` is acceptable for now (it's a pure function, 10 lines), but a future refactor should deduplicate these into `@mirai-app/common`.

---

## Decision Matrix

| If you need to... | Change this file |
|-------------------|------------------|
| Adjust filtering sensitivity | `backgroundLocationTaskUtils.ts` — edit `MINIMUM_DELTA_METERS` or `ACCURACY_MULTIPLIER` |
| Disable filtering entirely | `backgroundLocationTaskUtils.ts` — set both constants to 0 |
| Change where last location is stored | `backgroundLocationTask.ts` — edit `getLastSentLocation`/`setLastSentLocation` |
| Add a new storage key | `constants.ts` — add the key constant |

---

*Plan created: 2026-06-04*
*Status: Ready for implementation*
