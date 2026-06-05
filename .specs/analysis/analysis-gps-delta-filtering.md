# Codebase Impact Analysis: GPS-Aware Delta Filtering for Location Updates

## Task

Implement GPS-aware delta filtering for location updates to reduce noise while maintaining precise tracking.

## Affected Files

### 1. `apps/native/src/services/background/backgroundLocationTaskUtils.ts`

**Status**: ✅ Already implemented
**Change**: Add `calculateDistance()`, `shouldSendLocationUpdate()`, `MINIMUM_DELTA_METERS`, `ACCURACY_MULTIPLIER`

**Current State**: The file already contains:
- `MINIMUM_DELTA_METERS = 15`
- `ACCURACY_MULTIPLIER = 2`
- `calculateDistance()` with Haversine formula
- `shouldSendLocationUpdate()` with threshold logic

**Verification Needed**: Confirm exports are correct and function signatures match design document.

### 2. `apps/native/src/services/background/backgroundLocationTask.ts`

**Status**: ✅ Already implemented
**Change**: Add `lastSentLocation` to `BackgroundTaskState`, `getLastSentLocation`/`setLastSentLocation` to `BackgroundTaskDeps`, integrate filtering into `handleBackgroundLocationTask`

**Current State**: The file already contains:
- `lastSentLocation: LocationObject | null` in `BackgroundTaskState`
- `getLastSentLocation` and `setLastSentLocation` in `BackgroundTaskDeps`
- `getLastSentLocation()` implementation using `SecureStore`
- `setLastSentLocation()` implementation using `SecureStore` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`
- Filtering logic in `handleBackgroundLocationTask` using `state.lastSentLocation ?? (await deps.getLastSentLocation())`
- Fire-and-forget persistence: `void deps.setLastSentLocation(latestLocation)`

**Verification Needed**: Confirm handler flow matches design document exactly.

### 3. `apps/native/src/services/location/constants.ts`

**Status**: ✅ Already implemented
**Change**: Add `LAST_SENT_LOCATION_KEY` constant

**Current State**: Already contains `LAST_SENT_LOCATION_KEY = "mirai.last_sent_location"`

### 4. `apps/native/src/services/background/__tests__/backgroundLocationTask.init.test.ts`

**Status**: ✅ Already implemented
**Change**: Add tests for persistence integration, filtering skips, first-update-always-sends

**Current State**: Already contains comprehensive tests:
- `initBackgroundLocationTask` tests (defineTask, handler flows)
- `handleBackgroundLocationTask` tests (state persistence, filtering, distance threshold, first update after restart)
- `createBackgroundTaskDeps` tests (sendUpdate, shouldSend, getLastSentLocation, setLastSentLocation)

**Verification Needed**: All tests from design document test plan are present.

### 5. `apps/native/src/services/__tests__/backgroundLocationTaskPureFunctions.test.ts`

**Status**: ⚠️ Partially implemented
**Change**: Add pure function tests for `calculateDistance` and `shouldSendLocationUpdate` with all accuracy/delta combinations

**Current State**: Contains tests for `toFiniteNumberOrUndefined`, `toNonNegativeOrUndefined`, `toHeadingOrUndefined`, and `handleBackgroundLocationTask` but is MISSING direct tests for `calculateDistance` and `shouldSendLocationUpdate`.

**Gap**: The design document specifies these tests:
- `calculateDistance` identical lat/lon → 0
- `calculateDistance` Warsaw to Krakow → ~300km
- `shouldSendLocationUpdate` first location (lastSent = null) → true
- `shouldSendLocationUpdate` accuracy=5m, delta=8m → false
- `shouldSendLocationUpdate` accuracy=5m, delta=15m → true
- `shouldSendLocationUpdate` accuracy=100m, delta=150m → false
- `shouldSendLocationUpdate` accuracy=100m, delta=250m → true
- `shouldSendLocationUpdate` accuracy=null, delta=10m → false
- `shouldSendLocationUpdate` accuracy=null, delta=20m → true
- `shouldSendLocationUpdate` accuracy=0, delta=10m → true

## Integration Points

- `expo-secure-store`: Already imported and used for persistence
- `expo-task-manager`: Already used for background task registration
- `expo-location`: LocationObject type is already used
- `@mirai-app/orpc/client`: `getORPCClient` is already used for sending updates

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Implementation already exists but may not match design doc | Low | Verify each file against design document |
| Missing pure function tests | Low | Add tests to `backgroundLocationTaskPureFunctions.test.ts` |
| Future `calculateDistance` duplication | Low | Document for future refactor into `@mirai-app/shared` |

## Key Findings

1. The implementation is already complete in source files.
2. The integration test file is comprehensive.
3. The pure function test file needs augmentation with `calculateDistance` and `shouldSendLocationUpdate` tests.
4. No backend changes are needed.
5. No UI changes are needed.

## Recommendation

Proceed with verification of existing implementation against design document, and add missing pure function tests.
