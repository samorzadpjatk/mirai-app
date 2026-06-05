# Native App Code Quality

## Bundle Budget

- Every KB matters for OTA updates.
- Before adding any dependency >5KB, verify it replaces an existing dependency of equal or greater size.
- FP libraries (Effect, fp-ts) are NOT recommended here due to bundle cost (Effect v4 = ~20KB, v3 = ~70KB).

## Hook Test Anti-Patterns

**Problem**: 40+ hook test files mock React Query and assert the hook returns mocked data. These tests pass even if actual API integration, caching, or error handling is broken.

**Rule**: Stop writing mock-verification hook tests. Extract pure domain logic into `@mirai-app/shared` and test with real data. Keep hooks as thin React Query shells.

**Extracted to `packages/shared`** (reused across packages):
- `useCommunityFeed.ts` — `toggleHeartSummary`, `filterActivities`
- `useTrips.ts` — `flattenTrips`
- `useChallenges.ts` — `mapChallengeToListItem`, `calculateLeaderboardInfo`, `findUserGroup`
- `useGroups.ts` — `flattenGroups`, `filterGroupsBySearch`
- `useMapLocationStream.ts` — `formatDisplayName`
- `authServer.ts` — `formatDisplayName`

**Extracted to top-level exports** (same file, tested with real data):
- `useTrips.ts` — `calculateAllTrips`
- `useLocationPermissions.ts` — `syncLocationSharingState`, `calculateCanViewOthersLocations`, `executeToggleLocationSharing`, `buildLocationSharingToggle`
- `backgroundLocationTask.ts` — `handleBackgroundLocationTask`
- `backgroundLocationTaskUtils.ts` — `toFiniteNumberOrUndefined`, `toNonNegativeOrUndefined`, `toHeadingOrUndefined`, `calculateDistance`, `shouldSendLocationUpdate`
- `useNotifications.ts` — `calculateIsSubscribed`, `calculateIsSubscribedElsewhere`, `buildPermissionAlertButtons`, `getExpoProjectId`, `shouldRequestNotificationPermission`, `buildNotificationPermissionResult`, `executeToggleSubscription`, `buildNotificationActions`
- `useMapSharing.ts` — `extractSharingUserIds`
- `useMapLocationStream.ts` — `buildLocationUpdateData`, `buildUserDataFromLocationUser`, `removeUserFromLocations`, `isUnauthorizedError`, `isValidLocationEvent`, `processLocationStreamEvent`

**Still affected** (logic embedded in hook bodies, pending extraction):
`useAdmin*`, `useChallenge*`, `useGroup*`, `mapOverlayStore.ts`.

## Pure Function Extraction Pattern

**Context**: Hook files with 30–60 lines of callback wiring, testable only via expensive mock-verification tests.

**Pattern**: Extract domain logic into top-level exported functions with dependencies passed as parameters.

**Naming conventions**:

| Prefix | Use case | Example |
|--------|----------|---------|
| `calculateXxx` | Derived state | `calculateAllTrips` |
| `syncXxx` | Reconcile state | `syncLocationSharingState` |
| `executeXxx` | Side-effect with DI | `executeToggleLocationSharing` |
| `buildXxx` | Factory for callbacks | `buildLocationSharingToggle` |
| `toXxxOrNull` | Type coercion | `toFiniteNumberOrNull` |

## Mock Removal for UI Components

**Pattern**: Remove mocks for shared UI components. Render real components and query by descriptive `testID` props.

**Examples**:
- `ThemedTextInput` → `testID="themed-text-input"`
- `SegmentedOption` → `testID="segmented-option-${label}"`
- `AppModalFooter` → `primaryTestID="app-modal-footer-primary"`
- `ThemedListItem` → `testID="themed-list-item"`

**Avoid**: Generic testIDs like `"test-id"` or `"pressable"`.

## Jest Setup Patterns

**File**: `apps/native/jest.setup.js`

**Key mocks** (configured globally):
- `@expo/vector-icons` → renders as `Text` with `testID="ionicon"`
- `expo-image` → `{ Image: "Image" }` (UserAvatar falls back to initials)
- `react-native-reanimated` → official mock + `setUpTests()`
- `react-native-gesture-handler` → minimal gesture mock
- `@maplibre/maplibre-react-native` → `MapView` renders as `View` with testID

**Rule**: Global `beforeEach(() => { jest.clearAllMocks() })` at line 75 affects ALL tests. Constructor mock properties must use `Object.defineProperty` with getter to survive.

## Dead Code Removal

**Pattern**: When extracting pure functions, audit the original hook/component for dead code.

**Example**: `mountedRef` in `useFileUpload.ts` removed because `useMutation` handles cancellation natively.

## Functional Core, Imperative Shell

- Extract domain logic from hooks to `@mirai-app/shared` as pure functions.
- Hooks remain thin React Query shells.
- If a hook test file exceeds 200 lines mocking React Query, the hook contains extractable domain logic.

## Refactoring Priority

1. `useFileUpload.ts` — Extract `UploadService` class
2. `mapOverlayStore.ts` — Split store, animations, gestures, map logic
3. ✅ Replace `console.error`/`console.warn` — Complete

## Coverage Status

Native app: 83.74% statements, 80.19% branches, 80.22% functions, 84.92% lines — all above 80% threshold. 3,034 tests passing across 267 suites.
