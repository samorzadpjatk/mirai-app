# Codebase Impact Analysis — Animated Shimmer Skeleton Placeholders

Task: `.specs/tasks/draft/animated-placeholders-native.feature.md`
Design plan: `.specs/plans/animated-placeholders-native.design.md`
Scope: `apps/native`

## Summary

| Category | Count |
|---|---|
| Existing `*LoadingState` components | 5 |
| Existing `*LoadingState` tests | 3 (of 5) |
| `LoadingScreen` definition + test | 1 + 1 |
| `PrimaryLoadingButton` definition + test | 1 + 1 |
| `ActivityIndicator` usages in `app/(tabs)/**/*.tsx` | 23 files / 38 usages |
| `ActivityIndicator` usages in `app/auth/login.tsx` | 1 |
| `ActivityIndicator` usages in `components/**/*.tsx` (excl. tests) | 27 files / ~35 usages |
| Theme token files relevant | 2 (`colors.ts`, `index.ts`) |
| Files to CREATE | 3 |
| Files to MODIFY (in-scope) | 16 |
| Files to DELETE | 0 |
| Risk rating | **Medium** |

---

## 1. Existing `*LoadingState` Components

All five components already render `colors.surfaceDark` blocks — direct swap targets for `<Skeleton variant="box">`. None use `ActivityIndicator`; they are static placeholder layouts.

| # | Component | Path | testID | Placeholder children |
|---|---|---|---|---|
| 1 | `ChallengeLoadingState` | `apps/native/src/components/trips/challenges/ChallengeLoadingState.tsx` | `challenge-loading-state` | hero, title, 2× description, section, 2× submission (7 blocks) |
| 2 | `ChallengesLoadingState` | `apps/native/src/components/trips/challenges/ChallengesLoadingState.tsx` | `challenges-loading-state` | 3 rows × 2 cards (6 blocks) |
| 3 | `GroupDetailsLoadingState` | `apps/native/src/components/trips/groups/details/GroupDetailsLoadingState.tsx` | `group-details-loading-state` | hero, title, 3 stats, section, 3 members (9 blocks) |
| 4 | `GroupEditLoadingState` | `apps/native/src/components/trips/groups/edit/GroupEditLoadingState.tsx` | `group-edit-loading-state` | 3 label/input pairs + button (7 blocks) |
| 5 | `GroupsLoadingState` | `apps/native/src/components/trips/groups/GroupsLoadingState.tsx` | `groups-loading-state` | 4 card placeholders |

**Action:** MODIFY all 5 — replace `<View style={...surfaceDark...}>` with `<Skeleton variant="box" width={...} height={...} borderRadius={...}>`. Keep `testID` on container.

---

## 2. `LoadingScreen`

- **Definition:** `apps/native/src/components/LoadingScreen.tsx` (default export)
- **Re-export:** `apps/native/src/components/index.ts` (line 3)
- **Test:** `apps/native/src/components/__tests__/LoadingScreen.test.tsx`

### Current implementation notes

- Renders `<ActivityIndicator size="large" color="#00ced1" accessibilityLabel="Loading indicator" />` + `<Text>{message}</Text>`.
- Hardcodes `#00ced1` instead of `colors.primary` — refactor should fix.
- Opaque `colors.backgroundDark` container, centered.
- Props: `{ message?: string }` (default `"Loading..."`).

### Test assertions that will break

- `it("renders activity indicator")` — `screen.getByLabelText("Loading indicator")` will fail when ActivityIndicator is removed.
- Must update to assert skeleton presence (e.g. `getByTestId("loading-screen-skeleton")`).

### Usages (5 screens)

| File |
|---|
| `apps/native/src/app/(tabs)/trips/partners/[id].tsx` |
| `apps/native/src/app/(tabs)/trips/info.tsx` |
| `apps/native/src/app/(tabs)/trips/details.tsx` |
| `apps/native/src/app/(tabs)/trips/index.tsx` |
| `apps/native/src/app/(tabs)/community.tsx` |

**Action:** MODIFY definition + test. Usages unchanged (interface stable).

---

## 3. `PrimaryLoadingButton`

- **Definition:** `apps/native/src/components/common/buttons/PrimaryLoadingButton.tsx` (named export)
- **Test:** `apps/native/src/components/__tests__/common/PrimaryLoadingButton.test.tsx`

### Current implementation notes

- When `isLoading`, renders `<ActivityIndicator testID={`${testID}-loading-indicator`} size="small" color={colors.backgroundDark} />` instead of `<Text>{label}</Text>`.
- Button container: `colors.primary` background, `borderRadius.xl`, `shadows.primaryGlow`.
- Props: `{ label, isLoading, onPress, disabled?, style?, textStyle?, activeOpacity?, testID? }`.

### Test assertions that will break

- `it("should show loading indicator when isLoading is true")` — `screen.getByTestId("button-loading-indicator")` will fail.
- Must update to assert skeleton strip testID (e.g. `${testID}-skeleton`).

### Usages (16 files import `PrimaryLoadingButton`)

| File |
|---|
| `apps/native/src/app/(tabs)/admin/notifications/new.tsx` |
| `apps/native/src/app/(tabs)/admin/users/new.tsx` |
| `apps/native/src/app/(tabs)/admin/users/edit/[userId].tsx` |
| `apps/native/src/app/(tabs)/admin/groups/new.tsx` |
| `apps/native/src/app/(tabs)/admin/groups/edit/[groupId].tsx` |
| `apps/native/src/app/(tabs)/admin/rewards/new.tsx` |
| `apps/native/src/app/(tabs)/admin/rewards/edit/[rewardId].tsx` |
| `apps/native/src/app/(tabs)/admin/activity/new.tsx` |
| `apps/native/src/app/(tabs)/admin/activity/edit/[activityId].tsx` |
| `apps/native/src/app/auth/login.tsx` |
| `apps/native/src/components/trips/groups/create/CreateGroupButton.tsx` |
| `apps/native/src/components/trips/groups/edit/SaveGroupButton.tsx` |
| `apps/native/src/components/common/ui/AppModalFooter.tsx` |
| `apps/native/src/components/admin/coins/CoinOperationScreen.tsx` |
| `apps/native/src/components/admin/challenges/ChallengeFormFields.tsx` |
| `apps/native/src/components/__tests__/admin/CoinOperationScreen.test.tsx` (test consumer) |

**Action:** MODIFY definition + test. Usages unchanged (interface stable).

---

## 4. `ActivityIndicator` Usages in `app/(tabs)/**/*.tsx`

23 files, 38 usages. Design plan rollout step 5: "Audit remaining `ActivityIndicator` usages in `app/(tabs)/**/*.tsx` and swap where appropriate."

### Primary content-load spinners (size="large") — swap candidates

| File | Line | Current | Recommended swap |
|---|---|---|---|
| `app/(tabs)/notifications/index.tsx` | 62 | `size="large" color="#00ced1"` | `LoadingScreen` or notification skeleton |
| `app/(tabs)/trips/leaderboard/index.tsx` | 60 | `size="large" color={colors.primary}` | leaderboard skeleton |
| `app/(tabs)/admin/notifications/index.tsx` | 317 | `size="large"` | admin list skeleton |
| `app/(tabs)/admin/users/index.tsx` | 101 | `size="large"` | user list skeleton |
| `app/(tabs)/admin/transactions/index.tsx` | 118 | `size="large"` | transaction list skeleton |
| `app/(tabs)/admin/schedules/index.tsx` | 221 | `size="large"` | schedule list skeleton |
| `app/(tabs)/admin/groups/index.tsx` | 106 | `size="large"` | admin groups skeleton |
| `app/(tabs)/admin/coins/index.tsx` | 273 | `size="large"` | coin ops skeleton |
| `app/(tabs)/admin/activity/index.tsx` | 176 | `size="large"` | activity list skeleton |
| `app/(tabs)/admin/challenges/judgement.tsx` | 39 | `size="large"` | judgement skeleton |
| `app/(tabs)/admin/challenges/index.tsx` | 423 | `size="large"` | admin challenges skeleton |
| `app/(tabs)/admin/challenges/submissions.tsx` | 183 | `size="large"` | submissions skeleton |
| `app/(tabs)/admin/challenges/[id].tsx` | 177 | `size="large"` | challenge detail skeleton |
| `app/(tabs)/community.tsx` | 306 | `size="large"` | community skeleton |

### Inline small spinners (size="small") — likely out of scope per design plan

| File | Lines | Count |
|---|---|---|
| `app/(tabs)/trips/groups/index.tsx` | 119 | 1 |
| `app/(tabs)/trips/challenges/index.tsx` | 310 | 1 |
| `app/(tabs)/trips/challenges/vote/[id].tsx` | 120, 529 | 2 |
| `app/(tabs)/trips/index.tsx` | 117 | 1 |
| `app/(tabs)/profile/edit.tsx` | 249, 308 | 2 |
| `app/(tabs)/admin/notifications/new.tsx` | 340 | 1 |
| `app/(tabs)/admin/notifications/index.tsx` | 341, 402, 433 | 3 |
| `app/(tabs)/admin/users/index.tsx` | 130 | 1 |
| `app/(tabs)/admin/transactions/index.tsx` | 142 | 1 |
| `app/(tabs)/admin/groups/index.tsx` | 142 | 1 |
| `app/(tabs)/admin/rewards/index.tsx` | 506, 659, 887 | 3 |
| `app/(tabs)/admin/challenges/index.tsx` | 574 | 1 |
| `app/(tabs)/admin/challenges/staff-vote.tsx` | 344 | 1 |
| `app/(tabs)/admin/index.tsx` | 203 | 1 |
| `app/(tabs)/community.tsx` | 372 | 1 |

### Auth screen

| File | Line | Notes |
|---|---|---|
| `app/auth/login.tsx` | 424 | `size="large"` — separate from `PrimaryLoadingButton` usage in same file. Swap candidate. |

---

## 5. `ActivityIndicator` Usages in `components/**/*.tsx`

27 files, ~35 usages. Per design plan scope, these are OUT of scope unless already in a `*LoadingState` file. Listed for awareness.

### In-scope (refactor targets)

| File | Reason |
|---|---|
| `components/LoadingScreen.tsx` | Refactor target #1. |
| `components/common/buttons/PrimaryLoadingButton.tsx` | Refactor target #2. |

### Out-of-scope (inline small spinners, image/upload fallbacks, map UI)

| File | Context |
|---|---|
| `components/notifications/CreateScheduleModal.tsx` | modal inline |
| `components/map/MapActionButtons.tsx` | map action buttons |
| `components/map/LocationPicker.tsx` | location picker |
| `components/map/modals/ManageSharingModal.tsx` | sharing modal |
| `components/trips/groups/create/MembersPicker.tsx` | picker |
| `components/trips/groups/edit/EditMembersPicker.tsx` | picker |
| `components/trips/groups/details/FullscreenSubmissionSlide.tsx` | image load |
| `components/trips/groups/details/SubmissionCircle.tsx` | submission circle |
| `components/trips/groups/GroupImagePicker.tsx` | image upload |
| `components/trips/challenges/ChallengeUploadProgressCard.tsx` | upload progress |
| `components/trips/challenges/ChallengeCommunitySubmissionsCard.tsx` | submissions card |
| `components/trips/details/TripNewsSection.tsx` | news section |
| `components/profile/ProfileActionsSection.tsx` | button inline |
| `components/common/CachedImage.tsx` | image fallback (bare `<ActivityIndicator />`) |
| `components/common/TripPickerModal.tsx` | picker modal |
| `components/camera/PhotoCaptureModal.tsx` | camera modal |
| `components/judgement/JudgementContent.tsx` | judgement |
| `components/judgement/SubmissionAssetPreview.tsx` | video load |
| `components/admin/AdminModal.tsx` | admin modal |
| `components/admin/rewards/AdminRewardDetailModal.tsx` | reward modal |
| `components/admin/rewards/AdminRewardsModal.tsx` | rewards modal |
| `components/admin/challenges/EditChallengeModal.tsx` | edit modal |
| `components/admin/challenges/ChallengeFormFields.tsx` | form fields (uses PrimaryLoadingButton) |
| `components/admin/challenges/SubmissionReviewCard.tsx` | review card |

---

## 6. Theme Token Files

### Primary token source

- **`apps/native/src/styles/colors.ts`** — single source of truth for all colors.
  - `surfaceDark: "#272935"` — base skeleton color (already used by every `*LoadingState`).
  - `backgroundDark: "#17181c"` — container background.
  - `cardDark: "#1b2828"` — card surface.
  - `whiteOpacity*` family (`whiteOpacity10` through `whiteOpacity90`) — candidates for derived highlight token.
  - **No existing `skeleton*` or `highlight*` tokens.** Design plan says "derived highlight token" — implementation must either:
    - (a) Add a new token (e.g. `skeletonHighlight: "rgba(255,255,255,0.12)"`) to `colors.ts`, OR
    - (b) Derive highlight in `Skeleton.tsx` from existing `whiteOpacity12` / `whiteOpacity15`.

### Token aggregator

- **`apps/native/src/styles/index.ts`** — re-exports `colors`, `spacing`, `borderRadius`, `typography`, `shadows`, `commonStyles`, plus `theme` aggregate. Skeleton should import from `~/styles`.

### Supporting style files

- `apps/native/src/styles/spacing.ts` — `borderRadius.sm/md/lg/xl/full` available for skeleton variants.
- `apps/native/src/styles/shadows.ts` — available if skeleton needs elevation.
- `apps/native/src/styles/__tests__/styles.test.ts` — has snapshot at `__snapshots__/styles.test.ts.snap`. If new token added to `colors.ts`, snapshot may need update.

---

## 7. Existing Test Locations

### `LoadingScreen` test

- **Path:** `apps/native/src/components/__tests__/LoadingScreen.test.tsx`
- **Assertions to update:**
  - `it("renders activity indicator")` → `getByLabelText("Loading indicator")` will fail. Replace with skeleton testID assertion.

### `PrimaryLoadingButton` test

- **Path:** `apps/native/src/components/__tests__/common/PrimaryLoadingButton.test.tsx`
- **Assertions to update:**
  - `it("should show loading indicator when isLoading is true")` → `getByTestId("button-loading-indicator")` will fail. Replace with skeleton strip testID assertion.

### `*LoadingState` tests (3 of 5)

| Test | Path | Status |
|---|---|---|
| `ChallengeLoadingState.test.tsx` | `apps/native/src/components/__tests__/trips/challenges/ChallengeLoadingState.test.tsx` | Existing — keep green. |
| `ChallengesLoadingState.test.tsx` | `apps/native/src/components/__tests__/trips/challenges/ChallengesLoadingState.test.tsx` | Existing — keep green. |
| `GroupsLoadingState.test.tsx` | `apps/native/src/components/__tests__/trips/groups/GroupsLoadingState.test.tsx` | Existing — keep green. |
| `GroupDetailsLoadingState.test.tsx` | (missing) | No test — optional add. |
| `GroupEditLoadingState.test.tsx` | (missing) | No test — optional add. |

### Skeleton test (to create)

- **Path:** `apps/native/src/components/__tests__/ui/Skeleton.test.tsx`
- **Directory `components/__tests__/ui/` does not exist** — must be created.
- Required cases per design plan:
  - renders each variant (`box`, `text`, `circle`, `line`)
  - respects `width` / `height`
  - disables animation when reduce motion is on

### Other tests referencing `ActivityIndicator` (out-of-scope subjects)

| Test | Subject | Impact |
|---|---|---|
| `components/__tests__/trips/groups/edit/EditMembersPicker.test.tsx` | EditMembersPicker | None (out of scope). |
| `components/__tests__/trips/groups/MembersPicker.test.tsx` | MembersPicker | None (out of scope). |
| `components/__tests__/trips/groups/GroupImagePicker.test.tsx` | GroupImagePicker | None (out of scope). |
| `components/__tests__/map/ManageSharingModal.test.tsx` | ManageSharingModal | None (out of scope). |
| `components/__tests__/trips/challenges/ChallengeUploadProgressCard.test.tsx` | ChallengeUploadProgressCard | None (out of scope). |
| `components/__tests__/admin/CoinOperationScreen.test.tsx` | CoinOperationScreen (uses PrimaryLoadingButton) | Verify still green after PrimaryLoadingButton refactor. |

---

## 8. Dependencies Check

| Dependency | Version | Status |
|---|---|---|
| `expo-linear-gradient` | `~55.0.13` | ✓ Present in `apps/native/package.json` |
| `react-native-reanimated` | `4.2.1` | ✓ Present; mocked in `apps/native/jest.setup.js` |

**Note:** Verify `jest.setup.js` reanimated mock supports `useSharedValue` / `useAnimatedStyle` before writing Skeleton tests. `expo-linear-gradient` may need a mock — check if `ChallengeHeroCard.test.tsx` already mocks it.

---

## 9. Risk / Impact Assessment

**Overall: MEDIUM**

### Risk hotspots

1. **Reanimated mock in tests** — existing `jest.setup.js` mocks `react-native-reanimated`. Skeleton uses `useSharedValue` + `useAnimatedStyle`. If mock is shallow, tests may not render gradient. **Verify before writing Skeleton tests.**
2. **`expo-linear-gradient` in tests** — may need mock in `jest.setup.js`. Check `ChallengeHeroCard.test.tsx` for existing pattern.
3. **Reduce-motion hook** — `AccessibilityInfo.isReduceMotionEnabled` is async (returns a Promise). Skeleton must handle initial `false` then update. Tests must mock `AccessibilityInfo`. No current usages of `AccessibilityInfo` in `apps/native/src` — new pattern.
4. **LoadingScreen test breakage** — `getByLabelText("Loading indicator")` assertion will fail. Must update test.
5. **PrimaryLoadingButton test breakage** — `getByTestId("button-loading-indicator")` assertion will fail. Must update test.
6. **Hardcoded color `#00ced1` in LoadingScreen** — current code hardcodes primary color. Refactor should use `colors.primary`.
7. **`components/ui/` directory does not exist** — must be created. README claims "Shared UI components are located in `src/components/ui/`" but actual structure uses `components/common/buttons/`. Design plan specifies `components/ui/Skeleton.tsx` — follow the plan.
8. **`GroupDetailsLoadingState` and `GroupEditLoadingState` have NO tests** — refactor is safe but adding tests would be net new coverage.
9. **`app/(tabs)/admin/notifications/index.tsx`** — densest file with 4 spinners. If touched in step 5 audit, refactor carefully.
10. **`CoinOperationScreen.test.tsx`** — uses `PrimaryLoadingButton` indirectly. Verify stays green after button refactor.

### Integration points

- **`LoadingScreen` consumers (5 screens)** — interface stable (`message?` prop), no changes needed in consumers.
- **`PrimaryLoadingButton` consumers (16 files)** — interface stable (`label`, `isLoading`, `onPress`, etc.), no changes needed in consumers.
- **`*LoadingState` consumers** — interface stable (no props), no changes needed in consumers.
- **Theme tokens** — if new `skeletonHighlight` token added to `colors.ts`, all downstream consumers of `colors` are unaffected (additive change).

---

## 10. Action Classification

### CREATE (3 files)

| # | Path | Description |
|---|---|---|
| 1 | `apps/native/src/components/ui/Skeleton.tsx` | New reusable Skeleton component with `variant`, `Skeleton.Line`, `Skeleton.Group`. |
| 2 | `apps/native/src/components/__tests__/ui/Skeleton.test.tsx` | New test for Skeleton component. |
| 3 | `apps/native/src/components/__tests__/ui/` | New test directory (auto-created with file). |

### MODIFY (16 files)

| # | Path | Reason |
|---|---|---|
| 1 | `apps/native/src/components/LoadingScreen.tsx` | Swap ActivityIndicator for Skeleton. |
| 2 | `apps/native/src/components/__tests__/LoadingScreen.test.tsx` | Update assertion from ActivityIndicator label to skeleton testID. |
| 3 | `apps/native/src/components/common/buttons/PrimaryLoadingButton.tsx` | Swap ActivityIndicator for Skeleton.Line. |
| 4 | `apps/native/src/components/__tests__/common/PrimaryLoadingButton.test.tsx` | Update assertion from loading-indicator testID to skeleton testID. |
| 5 | `apps/native/src/components/trips/challenges/ChallengeLoadingState.tsx` | Swap View placeholders for Skeleton. |
| 6 | `apps/native/src/components/trips/challenges/ChallengesLoadingState.tsx` | Swap View placeholders for Skeleton. |
| 7 | `apps/native/src/components/trips/groups/GroupsLoadingState.tsx` | Swap View placeholders for Skeleton. |
| 8 | `apps/native/src/components/trips/groups/details/GroupDetailsLoadingState.tsx` | Swap View placeholders for Skeleton. |
| 9 | `apps/native/src/components/trips/groups/edit/GroupEditLoadingState.tsx` | Swap View placeholders for Skeleton. |
| 10 | `apps/native/src/components/__tests__/trips/challenges/ChallengeLoadingState.test.tsx` | Keep green (may need minor tweak). |
| 11 | `apps/native/src/components/__tests__/trips/challenges/ChallengesLoadingState.test.tsx` | Keep green (may need minor tweak). |
| 12 | `apps/native/src/components/__tests__/trips/groups/GroupsLoadingState.test.tsx` | Keep green (may need minor tweak). |
| 13 | `apps/native/src/styles/colors.ts` | Add `skeletonHighlight` token (or derive in Skeleton). |
| 14 | `apps/native/src/styles/__tests__/styles.test.ts` | Update if snapshot breaks from new token. |
| 15 | `apps/native/README.md` | Add Skeleton entry under "Shared UI Components" section (line 61). |
| 16 | `apps/native/jest.setup.js` | Possibly add `expo-linear-gradient` mock if not present. |

### DELETE (0 files)

None. No source files are removed; `ActivityIndicator` imports are removed from refactored files but the files themselves remain.

---

## 11. Out-of-Scope but Noted

- `components/common/CachedImage.tsx` — bare `<ActivityIndicator />` as image fallback. Could become `Skeleton.box` in a future task.
- `components/trips/challenges/ChallengeCommunitySubmissionsCard.tsx` — large content-load spinner that could become a domain skeleton.
- `app/(tabs)/admin/notifications/index.tsx` — 4 spinners, densest file. Refactor carefully if touched later.
- Inline small spinners in 23 screen files — design plan step 5 says "audit and swap where appropriate." Primary content-load (size="large") spinners are the priority; small inline button spinners can remain if they sit inside non-loading-state components.
