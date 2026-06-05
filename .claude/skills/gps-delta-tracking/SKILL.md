# GPS Delta Filtering for Location Updates

## When to Use

Use this skill when implementing location-based noise filtering in mobile applications using Expo/React Native.

## Pattern Overview

Adaptive delta filtering based on GPS accuracy to reduce noise updates while maintaining precise tracking when signal quality is high.

### Formula

```
threshold = max(accuracy * 2, 15)
send_update = distance_moved > threshold
```

### Threshold Examples

| GPS Accuracy | Minimum Delta to Send | Behavior |
|--------------|----------------------|----------|
| 5m (excellent) | 10m | Precise tracking, real movement detected |
| 20m (good) | 40m | Only meaningful movement streamed |
| 100m (poor) | 200m | Ignores noise, only large movements |
| 500m (very poor) | 500m | Effectively disabled until signal improves |
| null (unknown) | 15m | Conservative fallback to prevent micro-updates |

## Implementation Guidelines

### 1. Pure Functions (Extract to Utils)

```typescript
export const MINIMUM_DELTA_METERS = 15;
export const ACCURACY_MULTIPLIER = 2;

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

### 2. Hybrid Persistence

Use **in-memory state** for instant filtering + **SecureStore** for persistence across restarts:

```typescript
export interface BackgroundTaskState {
  isSending: boolean;
  lastSentLocation: LocationObject | null;
}

// In-memory state is source of truth for current session
const state: BackgroundTaskState = { isSending: false, lastSentLocation: null };

// SecureStore backup for app restarts
async function getLastSentLocation(): Promise<LocationObject | null> {
  const raw = await SecureStore.getItemAsync(LAST_SENT_LOCATION_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

async function setLastSentLocation(location: LocationObject): Promise<void> {
  await SecureStore.setItemAsync(LAST_SENT_LOCATION_KEY, JSON.stringify(location), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
```

### 3. Fire-and-Forget Pattern

```typescript
// NEVER await SecureStore writes in background tasks
void deps.setLastSentLocation(latestLocation);

// Read only when in-memory state is null (first run after restart)
const lastSent = state.lastSentLocation ?? (await deps.getLastSentLocation());
```

### 4. Why Not AsyncStorage

| Issue | AsyncStorage | Impact |
|-------|--------------|--------|
| Unencrypted | Plain text on disk | Any app with root access can read GPS coordinates |
| iOS backup | Included in unencrypted backups | GPS coordinates leak to iCloud/computer backups |
| No TTL | Persists forever | Stale coordinates from days ago remain accessible |
| Wrong semantic fit | Meant for preferences/booleans | GPS coordinates are sensitive data, not settings |

## Rollback Plan

If filtering is too aggressive:

1. **Immediate**: Change `MINIMUM_DELTA_METERS` from 15 to 10
2. **Short-term**: Change `ACCURACY_MULTIPLIER` from 2 to 1.5
3. **Nuclear**: Set both to 0 — disables filtering entirely

## Expected Impact

| Metric | Expected Improvement |
|--------|---------------------|
| DB writes | 30-70% reduction in urban/poor-signal areas |
| Network usage | Proportional reduction in location update requests |
| Stream load | Fewer real-time broadcasts to connected friends |
| Battery life | Less radio wake-up time for noise updates |
| Precision | Maintained when GPS accuracy is excellent (< 10m) |

## Decision Matrix

| If you need to... | Change this file |
|-------------------|------------------|
| Adjust filtering sensitivity | Edit `MINIMUM_DELTA_METERS` or `ACCURACY_MULTIPLIER` |
| Disable filtering entirely | Set both constants to 0 |
| Change where last location is stored | Edit `getLastSentLocation`/`setLastSentLocation` |
| Add a new storage key | Add the key constant |

## Deduplication Note

`calculateDistance` may already exist in other packages (e.g., `@mirai-app/shared`). Consider extracting to a shared utility to avoid duplication.
