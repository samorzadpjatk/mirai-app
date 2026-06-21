---
title: Implement animated shimmer skeleton placeholders in native app
---

## Initial User Prompt

.replace all loading indicators in apps/native with shimmer skeleton placeholders pulled from existing theme tokens. Design plan at `.specs/plans/animated-placeholders-native.design.md`.

## Description

Replace every loading indicator in `apps/native` with shimmer skeleton placeholders driven by existing theme tokens, so users see content-shaped placeholders instead of bare spinners during data fetches and async actions. Scope covers the opaque full-screen `LoadingScreen`, the in-button `PrimaryLoadingButton` state, the existing `*LoadingState` placeholder components (`ChallengeLoadingState`, `ChallengesLoadingState`, `GroupDetailsLoadingState`, `GroupEditLoadingState`, `GroupsLoadingState`), and inline `ActivityIndicator` usages in screens where the data shape is known. A single reusable `Skeleton` component (variants: `box`, `text`, `circle`, `line`; with `Skeleton.Line` and `Skeleton.Group` convenience exports) backs the change, built from already-installed `react-native-reanimated` and `expo-linear-gradient`. No new dependencies, no changes to loading-state gating logic, and no API/MSW test changes. Reduced-motion users must receive a static fallback.

## Acceptance Criteria

- `apps/native/src/components/ui/Skeleton.tsx` exists and renders `box`, `text`, `circle`, and `line` variants that respect explicit `width`, `height`, and optional `borderRadius`/`style`/`colors` props.
- `Skeleton.Line` renders repeated rows and `Skeleton.Group` synchronizes shimmer timing across sibling skeletons.
- Skeleton colors resolve at runtime from existing theme tokens (`colors.surfaceDark` and a derived highlight) and adapt to dark and light themes with no skeleton-specific edits.
- `LoadingScreen` renders skeleton shapes instead of `ActivityIndicator` while preserving its opaque full-screen loader behavior and public interface.
- `PrimaryLoadingButton` keeps its existing interface; while `isLoading`, the label is replaced by a shimmer strip rather than a spinner.
- Each existing `*LoadingState` component (`ChallengeLoadingState`, `ChallengesLoadingState`, `GroupDetailsLoadingState`, `GroupEditLoadingState`, `GroupsLoadingState`) renders skeleton layouts instead of `ActivityIndicator`.
- Inline `ActivityIndicator` usages in `app/(tabs)/**/*.tsx` where the data shape is known are swapped for `LoadingScreen` or a domain-specific skeleton layout.
- When `AccessibilityInfo.isReduceMotionEnabled` is true, the translating shimmer stops and falls back to static `surfaceDark` blocks.
- `components/__tests__/ui/Skeleton.test.tsx` is added and asserts: each variant renders, `width`/`height` are respected, and animation is disabled when reduce motion is on.
- Existing tests for `LoadingScreen` and `PrimaryLoadingButton` are updated to assert shimmer presence instead of `ActivityIndicator`.
- No API or MSW tests change.
- `bun run lint` and `bun run test` pass in `apps/native`.
- A short note is added under UI Components in `apps/native/README.md`.

## Out of Scope

- Non-primary content-load spinners not already represented by a `*LoadingState` component.
- Toast or overlay loading states not represented by a `*LoadingState` component.
- New runtime dependencies.
- Changes to loading-state gating logic or data-fetching behavior.

## Architecture Overview

> Synthesized from research skill `.claude/skills/react-native-shimmer-skeleton/SKILL.md` and codebase analysis `.specs/analysis/analysis-animated-placeholders-native.md`. Design-level only — no implementation code.

### Solution strategy

Build a single reusable `Skeleton` component at `apps/native/src/components/ui/Skeleton.tsx` (the `components/ui/` directory does not yet exist and must be created). The shimmer is a `LinearGradient` (named export from `expo-linear-gradient`) wrapped in an `Animated.View` whose `transform: [{ translateX }]` is driven by a Reanimated 4.x `useSharedValue` looped via `withRepeat(withTiming(...))`. Masking is achieved with an outer `View` carrying `overflow: 'hidden'` + `borderRadius` — **no `@react-native-masked-view/masked-view` dependency** (not installed; do not add). Only `transform` is animated; `backgroundColor`, `width`, and `height` are never animated, keeping the loop on the UI thread. Container width is measured once via `onLayout` into a shared value (no `useState` re-render).

### Key decisions

1. **No new dependencies** — `react-native-reanimated@4.2.1` and `expo-linear-gradient@~55.0.13` are already present in `apps/native/package.json`.
2. **Theme tokens for colors** — base color resolves at runtime from `colors.surfaceDark` (`#272935`); highlight derives from the existing `colors.whiteOpacity15` (`rgba(255,255,255,0.15)`) token family. Both resolve via `~/styles` so dark and light themes work with no skeleton-specific edits. If a dedicated `skeletonHighlight` token is preferred, it can be added to `apps/native/src/styles/colors.ts` (additive; snapshot in `styles/__tests__/styles.test.ts` may need update) — otherwise derive inline in `Skeleton.tsx`.
3. **Reduced-motion static fallback** — use Reanimated's synchronous `useReducedMotion()` hook. When true, render a static `colors.surfaceDark` block with no `Animated.View` and no gradient. Also pass `reduceMotion: ReduceMotion.System` to `withTiming` as defense-in-depth, and `cancelAnimation(progress)` on unmount so skeletons that unmount mid-loop do not leak. For short-lived loaders (`LoadingScreen`, `*LoadingState`) `useReducedMotion()` alone is sufficient; long-lived skeletons would need an `AccessibilityInfo.addEventListener('reduceMotionChanged')` subscription, which is out of scope here.
4. **UI-thread worklet** — `useAnimatedStyle` in Reanimated 4.x is automatically treated as a worklet (no `'worklet';` directive needed inside). Shimmer loop uses `Easing.linear` for a constant sweep speed; a single `DURATION_MS` constant keeps all siblings in sync. `Skeleton.Group` is provided as a convenience wrapper; lift a single `progress` shared value via context only if visible drift is reported.
5. **`React.memo`** the `Skeleton` to prevent parent re-renders from restarting the animation loop.

### Component contract

**File:** `apps/native/src/components/ui/Skeleton.tsx`

**Props:**
- `variant: "box" | "text" | "circle" | "line"`
- `width`, `height` — explicit dimensions
- `borderRadius?` — optional override
- `style?` — optional `ViewStyle` override
- `colors?: { base: string; highlight: string }` — optional base/highlight overrides
- `testID?`

**Variant → shape mapping:**
- `box` → `borderRadius.md` (12)
- `line` / `text` → `height: typography.base`, `borderRadius.sm` (8)
- `circle` → `borderRadius = width / 2` (or `borderRadius.full` = 9999)

**Convenience exports:**
- `Skeleton.Line` — quick repeated rows
- `Skeleton.Group` — synchronizes shimmer timing across siblings

### Files to create (3)

| # | Path | Purpose |
|---|---|---|
| 1 | `apps/native/src/components/ui/Skeleton.tsx` | Reusable Skeleton component with variants + convenience exports. |
| 2 | `apps/native/src/components/__tests__/ui/Skeleton.test.tsx` | Tests: each variant renders, `width`/`height` respected, animation disabled when reduce motion on. |
| 3 | `apps/native/src/components/__tests__/ui/` | New test directory (auto-created with file). |

### Files to modify (16)

| # | Path | Reason |
|---|---|---|
| 1 | `apps/native/src/components/LoadingScreen.tsx` | Swap `ActivityIndicator` for Skeleton; fix hardcoded `#00ced1` → `colors.primary`. Keep `{ message? }` interface. |
| 2 | `apps/native/src/components/__tests__/LoadingScreen.test.tsx` | Replace `getByLabelText("Loading indicator")` with skeleton testID assertion. |
| 3 | `apps/native/src/components/common/buttons/PrimaryLoadingButton.tsx` | Swap `ActivityIndicator` for `Skeleton.Line` while `isLoading`. Keep interface. |
| 4 | `apps/native/src/components/__tests__/common/PrimaryLoadingButton.test.tsx` | Replace `getByTestId("button-loading-indicator")` with skeleton testID assertion. |
| 5 | `apps/native/src/components/trips/challenges/ChallengeLoadingState.tsx` | Swap `View` placeholders for `Skeleton`. |
| 6 | `apps/native/src/components/trips/challenges/ChallengesLoadingState.tsx` | Swap `View` placeholders for `Skeleton`. |
| 7 | `apps/native/src/components/trips/groups/GroupsLoadingState.tsx` | Swap `View` placeholders for `Skeleton`. |
| 8 | `apps/native/src/components/trips/groups/details/GroupDetailsLoadingState.tsx` | Swap `View` placeholders for `Skeleton`. |
| 9 | `apps/native/src/components/trips/groups/edit/GroupEditLoadingState.tsx` | Swap `View` placeholders for `Skeleton`. |
| 10 | `apps/native/src/components/__tests__/trips/challenges/ChallengeLoadingState.test.tsx` | Keep green (minor tweak if needed). |
| 11 | `apps/native/src/components/__tests__/trips/challenges/ChallengesLoadingState.test.tsx` | Keep green (minor tweak if needed). |
| 12 | `apps/native/src/components/__tests__/trips/groups/GroupsLoadingState.test.tsx` | Keep green (minor tweak if needed). |
| 13 | `apps/native/src/styles/colors.ts` | Only if adding `skeletonHighlight` token (prefer deriving inline). |
| 14 | `apps/native/src/styles/__tests__/styles.test.ts` | Update snapshot only if `colors.ts` touched. |
| 15 | `apps/native/README.md` | Add Skeleton entry under "Shared UI Components" (line 61). |
| 16 | `apps/native/jest.setup.js` | Add `expo-linear-gradient` mock if not already present. |

### Integration points (interface-stable — no consumer changes)

- **`LoadingScreen` consumers (5 screens):** `app/(tabs)/trips/partners/[id].tsx`, `trips/info.tsx`, `trips/details.tsx`, `trips/index.tsx`, `community.tsx`. Interface `{ message? }` unchanged.
- **`PrimaryLoadingButton` consumers (16 files):** `app/auth/login.tsx`, admin screens (`admin/notifications/new.tsx`, `admin/users/new.tsx`, `admin/users/edit/[userId].tsx`, `admin/groups/new.tsx`, `admin/groups/edit/[groupId].tsx`, `admin/rewards/new.tsx`, `admin/rewards/edit/[rewardId].tsx`, `admin/activity/new.tsx`, `admin/activity/edit/[activityId].tsx`), `components/trips/groups/create/CreateGroupButton.tsx`, `components/trips/groups/edit/SaveGroupButton.tsx`, `components/common/ui/AppModalFooter.tsx`, `components/admin/coins/CoinOperationScreen.tsx`, `components/admin/challenges/ChallengeFormFields.tsx`. Interface unchanged.
- **`*LoadingState` consumers** — no props, no changes.
- **Theme tokens** — additive only if new token added; downstream `colors` consumers unaffected.

### Screen-level `ActivityIndicator` swaps (rollout step 5 audit)

14 primary content-load spinners (`size="large"`) in `app/(tabs)/**/*.tsx` + 1 in `app/auth/login.tsx` (line 424) are swap candidates: `notifications/index.tsx`, `trips/leaderboard/index.tsx`, `admin/notifications/index.tsx`, `admin/users/index.tsx`, `admin/transactions/index.tsx`, `admin/schedules/index.tsx`, `admin/groups/index.tsx`, `admin/coins/index.tsx`, `admin/activity/index.tsx`, `admin/challenges/judgement.tsx`, `admin/challenges/index.tsx`, `admin/challenges/submissions.tsx`, `admin/challenges/[id].tsx`, `community.tsx`. Each becomes either `LoadingScreen` (opaque wait) or a domain-specific skeleton layout. Inline small spinners (`size="small"`) are likely out of scope per design plan.

### Risk hotspots

1. **Reanimated mock in `jest.setup.js`** — verify it supports `useSharedValue` / `useAnimatedStyle` before writing Skeleton tests.
2. **`expo-linear-gradient` in tests** — may need a mock; check `ChallengeHeroCard.test.tsx` for an existing pattern.
3. **`LoadingScreen` + `PrimaryLoadingButton` test breakage** — existing assertions (`getByLabelText("Loading indicator")`, `getByTestId("button-loading-indicator")`) will fail and must be updated.
4. **`components/ui/` directory does not exist** — must be created.
5. **`GroupDetailsLoadingState` + `GroupEditLoadingState` have no tests** — refactor is safe; adding tests is optional net-new coverage.
6. **`CoinOperationScreen.test.tsx`** uses `PrimaryLoadingButton` indirectly — verify it stays green after the button refactor.

### References

- Research skill: `.claude/skills/react-native-shimmer-skeleton/SKILL.md`
- Codebase analysis: `.specs/analysis/analysis-animated-placeholders-native.md`
- Design plan: `.specs/plans/animated-placeholders-native.design.md`

## Implementation Process

> Ordered implementation steps grouped into Setup → Foundational → LoadingState → Screen → Polish. Each step is interface-stable: no consumer changes required. Steps within a group may parallelize; groups are sequential (each depends on the prior group's outputs).

### Group A — Setup

#### Step 1 — Create `Skeleton` component and tests [DONE]

- **Goal:** Deliver the reusable shimmer primitive that every downstream step consumes.
- **Concrete output:**
  - New directory `apps/native/src/components/ui/` (does not exist yet).
  - `apps/native/src/components/ui/Skeleton.tsx` — `Skeleton` component with `box`/`text`/`circle`/`line` variants, `Skeleton.Line` and `Skeleton.Group` convenience exports, `React.memo`'d, Reanimated 4.x `useSharedValue` + `withRepeat(withTiming(...))` loop on `transform: [{ translateX }]`, `useReducedMotion()` static fallback, `cancelAnimation` on unmount, `onLayout` container-width measure into a shared value (no `useState`).
  - `apps/native/src/components/__tests__/ui/Skeleton.test.tsx` — asserts each variant renders, `width`/`height` respected, animation disabled when reduce motion on.
  - `apps/native/jest.setup.js` — add `expo-linear-gradient` mock (and verify Reanimated mock supports `useSharedValue`/`useAnimatedStyle`); follow existing pattern from `ChallengeHeroCard.test.tsx` if present.
- **Success criteria:**
  - `Skeleton.tsx` exports `Skeleton` (default + named), `Skeleton.Line`, `Skeleton.Group`.
  - Colors resolve from `colors.surfaceDark` + derived highlight (inline or via new `skeletonHighlight` token in `apps/native/src/styles/colors.ts`).
  - `bun run test apps/native/src/components/__tests__/ui/Skeleton.test.tsx` passes.
  - `bun run lint` clean on new files.
- **Subtasks:**
  1. Create `components/ui/` directory.
  2. Decide inline-derive vs. add `skeletonHighlight` token to `styles/colors.ts` (if token added, update `styles/__tests__/styles.test.ts` snapshot).
  3. Implement `Skeleton` core (variants, props, animated style worklet, `onLayout` measure).
  4. Implement `Skeleton.Line` (repeated rows) and `Skeleton.Group` (timing sync wrapper).
  5. Add `expo-linear-gradient` + verify Reanimated mocks in `jest.setup.js`.
  6. Write `Skeleton.test.tsx` (variant render, dimensions, reduce-motion fallback).
- **Effort:** Medium
- **Blockers/risks:**
  - **Risk:** Reanimated mock in `jest.setup.js` does not support `useSharedValue`/`useAnimatedStyle`. **Mitigation:** audit `jest.setup.js` first; extend mock before writing tests.
  - **Risk:** `expo-linear-gradient` mock missing. **Mitigation:** add minimal mock returning a `View` with children.
  - **Risk:** `components/ui/` directory absent. **Mitigation:** trivial `mkdir` — no blocker.

### Group B — Foundational

#### Step 2 — Refactor `LoadingScreen` to render skeletons [DONE]

- **Goal:** Replace the opaque full-screen `ActivityIndicator` with skeleton shapes while preserving the `{ message? }` interface and opaque loader behavior.
- **Concrete output:**
  - `apps/native/src/components/LoadingScreen.tsx` — swap `ActivityIndicator` for `Skeleton` (box + line layout); fix hardcoded `#00ced1` → `colors.primary`.
  - `apps/native/src/components/__tests__/LoadingScreen.test.tsx` — replace `getByLabelText("Loading indicator")` with skeleton `testID` assertion.
- **Success criteria:**
  - `LoadingScreen` renders `Skeleton` shapes instead of `ActivityIndicator`.
  - Public interface `{ message? }` unchanged — 5 consumer screens (`app/(tabs)/trips/partners/[id].tsx`, `trips/info.tsx`, `trips/details.tsx`, `trips/index.tsx`, `community.tsx`) need no edits.
  - Updated test green.
- **Subtasks:**
  1. Read current `LoadingScreen.tsx` to confirm interface and `#00ced1` hardcode.
  2. Swap `ActivityIndicator` for `Skeleton` layout (opaque container preserved).
  3. Update test assertions.
- **Effort:** Small
- **Blockers/risks:**
  - **Risk:** Existing test assertion `getByLabelText("Loading indicator")` breaks. **Mitigation:** update assertion in same PR.
  - **Risk:** Opaque full-screen behavior regresses. **Mitigation:** preserve container `View` with opaque background; verify visually.

#### Step 3 — Refactor `PrimaryLoadingButton` to use shimmer strip [DONE]

- **Goal:** Replace the in-button `ActivityIndicator` with a `Skeleton.Line` shimmer strip while `isLoading`, keeping the button interface unchanged.
- **Concrete output:**
  - `apps/native/src/components/common/buttons/PrimaryLoadingButton.tsx` — swap `ActivityIndicator` for `Skeleton.Line`.
  - `apps/native/src/components/__tests__/common/PrimaryLoadingButton.test.tsx` — replace `getByTestId("button-loading-indicator")` with skeleton `testID` assertion.
- **Success criteria:**
  - While `isLoading`, label replaced by shimmer strip (no spinner).
  - Button interface unchanged — 16 consumer files (login, admin screens, `CreateGroupButton`, `SaveGroupButton`, `AppModalFooter`, `CoinOperationScreen`, `ChallengeFormFields`) need no edits.
  - Updated test green; `CoinOperationScreen.test.tsx` (uses button indirectly) stays green.
- **Subtasks:**
  1. Read current `PrimaryLoadingButton.tsx` to confirm interface and spinner testID.
  2. Swap `ActivityIndicator` for `Skeleton.Line` sized to label.
  3. Update test assertions.
  4. Run `CoinOperationScreen.test.tsx` to verify no indirect breakage.
- **Effort:** Small
- **Blockers/risks:**
  - **Risk:** `CoinOperationScreen.test.tsx` indirectly depends on button internals. **Mitigation:** run that test after refactor; if it asserts the spinner testID, update it too.

### Group C — LoadingState

#### Step 4 — Refactor the 5 existing `*LoadingState` components [DONE]

- **Goal:** Replace `View`-placeholder / `ActivityIndicator` internals in all 5 `*LoadingState` components with `Skeleton` layouts.
- **Concrete output:**
  - `apps/native/src/components/trips/challenges/ChallengeLoadingState.tsx` — swap `View` placeholders for `Skeleton`.
  - `apps/native/src/components/trips/challenges/ChallengesLoadingState.tsx` — swap `View` placeholders for `Skeleton`.
  - `apps/native/src/components/trips/groups/GroupsLoadingState.tsx` — swap `View` placeholders for `Skeleton`.
  - `apps/native/src/components/trips/groups/details/GroupDetailsLoadingState.tsx` — swap `View` placeholders for `Skeleton`.
  - `apps/native/src/components/trips/groups/edit/GroupEditLoadingState.tsx` — swap `View` placeholders for `Skeleton`.
  - `apps/native/src/components/__tests__/trips/challenges/ChallengeLoadingState.test.tsx` — keep green (minor tweak if needed).
  - `apps/native/src/components/__tests__/trips/challenges/ChallengesLoadingState.test.tsx` — keep green (minor tweak if needed).
  - `apps/native/src/components/__tests__/trips/groups/GroupsLoadingState.test.tsx` — keep green (minor tweak if needed).
- **Success criteria:**
  - All 5 components render `Skeleton` layouts instead of `View`/`ActivityIndicator`.
  - No props — no consumer changes.
  - Existing 3 test files stay green; `GroupDetailsLoadingState` + `GroupEditLoadingState` have no tests (refactor safe; adding tests optional).
- **Subtasks:**
  1. Refactor `ChallengeLoadingState` + update its test if needed.
  2. Refactor `ChallengesLoadingState` + update its test if needed.
  3. Refactor `GroupsLoadingState` + update its test if needed.
  4. Refactor `GroupDetailsLoadingState` (no test — manual visual check).
  5. Refactor `GroupEditLoadingState` (no test — manual visual check).
- **Effort:** Medium
- **Blockers/risks:**
  - **Risk:** `GroupDetailsLoadingState` + `GroupEditLoadingState` have no tests — regressions could ship undetected. **Mitigation:** manual visual check on a device/simulator; optionally add smoke tests.
  - **Risk:** Existing tests assert `View` structure. **Mitigation:** update assertions to skeleton testIDs.

### Group D — Screen

#### Step 5 — Audit and swap remaining `ActivityIndicator` usages in screens [DONE]

- **Goal:** Replace the 14 primary content-load spinners (`size="large"`) in `app/(tabs)/**/*.tsx` + 1 in `app/auth/login.tsx` (line 424) with `LoadingScreen` or domain-specific skeleton layouts.
- **Concrete output:**
  - Swap candidates (each becomes `LoadingScreen` for opaque wait, or a domain-specific skeleton layout):
    - `app/(tabs)/notifications/index.tsx`
    - `app/(tabs)/trips/leaderboard/index.tsx`
    - `app/(tabs)/admin/notifications/index.tsx`
    - `app/(tabs)/admin/users/index.tsx`
    - `app/(tabs)/admin/transactions/index.tsx`
    - `app/(tabs)/admin/schedules/index.tsx`
    - `app/(tabs)/admin/groups/index.tsx`
    - `app/(tabs)/admin/coins/index.tsx`
    - `app/(tabs)/admin/activity/index.tsx`
    - `app/(tabs)/admin/challenges/judgement.tsx`
    - `app/(tabs)/admin/challenges/index.tsx`
    - `app/(tabs)/admin/challenges/submissions.tsx`
    - `app/(tabs)/admin/challenges/[id].tsx`
    - `app/(tabs)/community.tsx`
    - `app/auth/login.tsx` (line 424)
- **Success criteria:**
  - No `size="large"` `ActivityIndicator` remains in `app/(tabs)/**/*.tsx` or `app/auth/login.tsx` for primary content-load.
  - Inline small spinners (`size="small"`) left as-is per design plan (out of scope).
  - Each swapped screen renders `LoadingScreen` or a domain skeleton during data fetch.
- **Subtasks:**
  1. Grep `ActivityIndicator` with `size="large"` across `app/(tabs)` + `app/auth/login.tsx` to confirm the 15 candidates.
  2. For each screen, decide `LoadingScreen` (opaque wait) vs. domain skeleton layout based on whether the screen has a known content shape.
  3. Apply swaps in batches (e.g., admin screens together, trips together).
  4. Run affected screen tests; manual visual check on simulator.
- **Effort:** Large
- **Blockers/risks:**
  - **Risk:** Scope creep into `size="small"` inline spinners. **Mitigation:** explicitly out of scope per design plan; leave small spinners.
  - **Risk:** Some screens may lack a clear content shape for domain skeletons. **Mitigation:** default to `LoadingScreen` when shape is ambiguous.
  - **Risk:** Test coverage thin for screen-level loading states. **Mitigation:** manual visual QA per swapped screen.

### Group E — Polish

#### Step 6 — Update README and run lint/test

- **Goal:** Document the new `Skeleton` component and verify the whole change passes lint + tests.
- **Concrete output:**
  - `apps/native/README.md` — add Skeleton entry under "Shared UI Components" (line 61).
  - Run `bun run lint` and `bun run test` in `apps/native`.
- **Success criteria:**
  - README note added.
  - `bun run lint` passes.
  - `bun run test` passes (all existing + new Skeleton tests green).
  - No API or MSW tests changed.
- **Subtasks:**
  1. Add README entry (1-2 lines under UI Components).
  2. Run `bun run lint` — fix any new lint errors in touched files.
  3. Run `bun run test` — fix any regressions introduced by the refactor.
  4. Final manual visual check: dark + light theme, reduce-motion on + off.
- **Effort:** Small
- **Blockers/risks:**
  - **Risk:** Lint/test failures from earlier steps surface here. **Mitigation:** run lint/test after each prior step, not just at the end; this step is the final gate, not the first check.

### Blockers and Risks (cross-cutting)

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | Reanimated mock in `jest.setup.js` lacks `useSharedValue`/`useAnimatedStyle` support | Medium | High | Audit + extend mock in Step 1 before writing Skeleton tests. |
| 2 | `expo-linear-gradient` mock missing | Medium | Medium | Add minimal mock in Step 1; reference `ChallengeHeroCard.test.tsx` pattern. |
| 3 | `LoadingScreen` + `PrimaryLoadingButton` test assertions break | High | Low | Update assertions in-step (Steps 2 & 3). |
| 4 | `components/ui/` directory absent | High | Trivial | `mkdir` in Step 1. |
| 5 | `GroupDetailsLoadingState` + `GroupEditLoadingState` have no tests | High | Medium | Manual visual check; optionally add smoke tests in Step 4. |
| 6 | `CoinOperationScreen.test.tsx` indirectly depends on `PrimaryLoadingButton` internals | Low | Medium | Run that test after Step 3; update if it asserts spinner testID. |
| 7 | Scope creep into `size="small"` inline spinners | Medium | Medium | Explicitly out of scope; leave small spinners. |
| 8 | `styles/__tests__/styles.test.ts` snapshot breaks if `skeletonHighlight` token added | Low | Low | Update snapshot in Step 1 if token path chosen. |
| 9 | Reduce-motion fallback not exercised in tests | Medium | Medium | Step 1 test must assert animation disabled when reduce motion on. |
| 10 | Shimmer drift across siblings in long-lived screens | Low | Low | `Skeleton.Group` provided; lift shared `progress` value via context only if drift reported. |

### Definition of Done

- [X] `apps/native/src/components/ui/Skeleton.tsx` exists with `box`/`text`/`circle`/`line` variants, `Skeleton.Line`, `Skeleton.Group`.
- [X] `apps/native/src/components/__tests__/ui/Skeleton.test.tsx` asserts variants, dimensions, reduce-motion fallback.
- [X] `LoadingScreen` renders skeletons; interface `{ message? }` unchanged; test updated.
- [X] `PrimaryLoadingButton` renders shimmer strip while `isLoading`; interface unchanged; test updated.
- [X] All 5 `*LoadingState` components render `Skeleton` layouts.
- [X] 15 primary content-load `ActivityIndicator` usages in screens swapped for `LoadingScreen` or domain skeletons.
- [X] Reduce-motion users see static `surfaceDark` blocks (no animation).
- [X] `apps/native/README.md` has Skeleton entry under UI Components.
- [X] `bun run lint` passes in `apps/native`.
- [X] `bun run test` passes in `apps/native`.
- [X] No API or MSW tests changed.
- [X] No new runtime dependencies added.

### Implementation Summary

| Step # | Description | Files | Effort | Risk |
|--------|-------------|-------|--------|------|
| 1 | Create `Skeleton` component + tests + mocks | `components/ui/Skeleton.tsx`, `components/__tests__/ui/Skeleton.test.tsx`, `jest.setup.js`, (`styles/colors.ts`, `styles/__tests__/styles.test.ts` if token added) | Medium | Medium (Reanimated/LinearGradient mocks) |
| 2 | Refactor `LoadingScreen` to skeletons | `components/LoadingScreen.tsx`, `components/__tests__/LoadingScreen.test.tsx` | Small | Low |
| 3 | Refactor `PrimaryLoadingButton` to shimmer strip | `components/common/buttons/PrimaryLoadingButton.tsx`, `components/__tests__/common/PrimaryLoadingButton.test.tsx` | Small | Low (watch `CoinOperationScreen.test.tsx`) |
| 4 | Refactor 5 `*LoadingState` components | `components/trips/challenges/ChallengeLoadingState.tsx`, `ChallengesLoadingState.tsx`, `components/trips/groups/GroupsLoadingState.tsx`, `components/trips/groups/details/GroupDetailsLoadingState.tsx`, `components/trips/groups/edit/GroupEditLoadingState.tsx`, 3 test files | Medium | Medium (2 components untested) |
| 5 | Audit + swap 15 screen-level `ActivityIndicator` usages | 15 files in `app/(tabs)/**/*.tsx` + `app/auth/login.tsx` | Large | Medium (scope creep, thin test coverage) |
| 6 | Update README + run lint/test | `apps/native/README.md` | Small | Low |

## Parallelization

> Dependency-aware reordering of the 6 implementation steps into 4 execution batches. Step 1 is the foundation (every consumer imports `Skeleton`); Steps 2–4 are independent consumers and run concurrently; Step 5 (screen audit) and the README doc update run concurrently after Batch 1; the final lint/test gate runs last as the verification gate. Scratchpad analysis: `.specs/scratchpad/parallelization-shimmer.md`.

### Dependency summary

| Step | Depends on | Blocks | Parallel with |
|------|-----------|--------|---------------|
| 1 (Skeleton + tests + mocks) | — (root workspace) | 2, 3, 4, 5, 6 | None (sequential foundation) |
| 2 (LoadingScreen) | 1 | 6b (final gate) | 3, 4 |
| 3 (PrimaryLoadingButton) | 1 | 6b (final gate) | 2, 4 |
| 4 (5 `*LoadingState` components) | 1 | 5 (ideally), 6b (final gate) | 2, 3 |
| 5 (15 screen `ActivityIndicator` swaps) | 1 (hard); 2 or 4 (ideal — representative skeleton pattern to mirror) | 6b (final gate) | 6a (README) |
| 6a (README entry) | 1 (needs component name/contract) | — | 5 |
| 6b (lint + test final gate) | 2, 3, 4, 5, 6a | — | None (final verification) |

### Batch ordering

#### Batch 0 — Foundation (sequential, blocks all)

- **Step 1 — Create `Skeleton` component + tests + mocks**
  - **Agent:** `build`
  - **Parallel with:** None
  - **Rationale:** Every downstream step imports `Skeleton` / `Skeleton.Line` / `Skeleton.Group`. The Reanimated + `expo-linear-gradient` mocks in `jest.setup.js` must land here or all consumer tests break. Medium effort, medium risk — single agent keeps the mock + component + test contract coherent.
  - **Exit gate:** `bun run test apps/native/src/components/__tests__/ui/Skeleton.test.tsx` green; `bun run lint` clean on new files.

#### Batch 1 — Consumers (parallel ×3, after Step 1)

- **Step 2 — Refactor `LoadingScreen` to render skeletons**
  - **Agent:** `visual-engineering`
  - **Parallel with:** Step 3, Step 4
  - **Rationale:** UI/styling work — swap spinner for skeleton layout, preserve opaque container. Small effort, low risk. Interface `{ message? }` stable, so no consumer edits.
- **Step 3 — Refactor `PrimaryLoadingButton` to shimmer strip**
  - **Agent:** `visual-engineering`
  - **Parallel with:** Step 2, Step 4
  - **Rationale:** UI/styling work — `Skeleton.Line` sized to label. Small effort. Watch `CoinOperationScreen.test.tsx` for indirect breakage (run after refactor).
- **Step 4 — Refactor 5 `*LoadingState` components**
  - **Agent:** `visual-engineering`
  - **Parallel with:** Step 2, Step 3
  - **Rationale:** UI/styling work — 5 independent component refactors + 3 test tweaks. Medium effort. `GroupDetailsLoadingState` + `GroupEditLoadingState` untested → manual visual check required. Could be split across two `visual-engineering` agents (challenges pair vs. groups trio) if throughput is needed.
  - **Exit gate:** All 3 existing `*LoadingState` tests green; manual visual check on the 2 untested components.

#### Batch 2 — Screen audit + docs (parallel ×2, after Batch 1)

- **Step 5 — Audit + swap 15 screen-level `ActivityIndicator` usages**
  - **Agent:** `build`
  - **Parallel with:** Step 6a
  - **Rationale:** Large, mechanical sweep across 15 files in `app/(tabs)/**/*.tsx` + `app/auth/login.tsx`. Hard dependency only on Step 1, but ideally runs after Step 2 (`LoadingScreen`) and at least one Step 4 `*LoadingState` land so the swap pattern (opaque `LoadingScreen` vs. domain skeleton) is established. `build` agent — not visual-engineering — because the work is grep-driven mechanical swaps, not new UI design. Default to `LoadingScreen` when content shape is ambiguous.
- **Step 6a — Add README entry under UI Components**
  - **Agent:** `haiku`
  - **Parallel with:** Step 5
  - **Rationale:** Trivial 1–2 line doc addition. Needs Step 1 component name/contract only. `haiku` suffices — no implementation logic.

#### Batch 3 — Final verification gate (sequential, after Batch 2)

- **Step 6b — Run `bun run lint` + `bun run test` in `apps/native`; final manual visual check**
  - **Agent:** `oracle`
  - **Parallel with:** None
  - **Rationale:** Verification/review task — `oracle` reviews the full diff, runs the gate, and confirms the Definition of Done checklist. Must run after Steps 2, 3, 4, 5, 6a so all regressions surface here. Includes final dark/light + reduce-motion on/off visual check.
  - **Exit gate:** `bun run lint` passes; `bun run test` passes; no API/MSW tests changed; Definition of Done all checked.

### Parallelization diagram

```
BATCH 0 — Foundation (sequential, blocks all)
┌──────────────────────────────────────────────────────┐
│ Step 1: Skeleton component + tests + mocks (build)    │
│   • components/ui/Skeleton.tsx                        │
│   • components/__tests__/ui/Skeleton.test.tsx         │
│   • jest.setup.js (Reanimated + LinearGradient mocks)│
│   EXIT: Skeleton tests green, lint clean              │
└──────────────────────────┬───────────────────────────┘
                           │ (hard dependency)
                           ▼
BATCH 1 — Consumers (parallel ×3)
┌──────────────────┬─────────────────────┬────────────────────────┐
│ Step 2           │ Step 3              │ Step 4                 │
│ LoadingScreen    │ PrimaryLoadingButton│ 5 *LoadingState        │
│ (visual-eng)     │ (visual-eng)        │ (visual-eng)            │
│ Small / Low risk │ Small / Low risk    │ Medium / Medium risk   │
│                  │ watch CoinOp test   │ 2 untested → visual QA │
└────────┬─────────┴──────────┬──────────┴───────────┬────────────┘
         │                    │                      │
         └────────────────────┼──────────────────────┘
                              │ (all consumers done)
                              ▼
BATCH 2 — Screen audit + docs (parallel ×2)
┌────────────────────────────────┬──────────────────────────────┐
│ Step 5                         │ Step 6a                      │
│ 15 screen ActivityIndicator    │ README entry (haiku)         │
│ swaps (build)                  │ • apps/native/README.md      │
│ Large / Medium risk            │ Trivial doc update           │
│ default → LoadingScreen         │                              │
└──────────────┬─────────────────┴──────────────┬───────────────┘
               │                                  │
               └────────────────┬─────────────────┘
                                │ (all implementation done)
                                ▼
BATCH 3 — Final verification gate (sequential)
┌──────────────────────────────────────────────────────────────┐
│ Step 6b: lint + test gate + DoD checklist (oracle)            │
│   • bun run lint  • bun run test                              │
│   • dark/light + reduce-motion on/off visual check            │
│   EXIT: Definition of Done all checked                        │
└──────────────────────────────────────────────────────────────┘
```

### Sub-agent execution directive

Dispatch the 4 batches sequentially. Within each batch, fan out to parallel sub-agents:

1. **Batch 0** — Dispatch ONE `build` agent for Step 1. **Block** until Skeleton tests pass and lint is clean. Do not start Batch 1 until the `Skeleton` export + mocks are merged — every consumer imports from here.
2. **Batch 1** — Dispatch THREE `visual-engineering` agents in parallel: Step 2 (`LoadingScreen`), Step 3 (`PrimaryLoadingButton`), Step 4 (5 `*LoadingState` components). Optionally split Step 4 into two `visual-engineering` agents (challenges pair + groups trio) for extra throughput. **Block** until all three report green tests. Run `CoinOperationScreen.test.tsx` after Step 3 lands.
3. **Batch 2** — Dispatch TWO agents in parallel: ONE `build` agent for Step 5 (15-file screen sweep) and ONE `haiku` agent for Step 6a (README entry). Step 5 should ideally start after at least one Batch 1 consumer lands so the swap pattern is established, but can start as soon as Step 1 is done if throughput is critical. **Block** until both report done.
4. **Batch 3** — Dispatch ONE `oracle` agent for Step 6b. Runs `bun run lint` + `bun run test` across `apps/native`, verifies no API/MSW tests changed, and walks the Definition of Done checklist. Final dark/light + reduce-motion visual check. **Block** until all checks pass — this is the release gate.

**Maximum parallelism:** 3 agents (Batch 1). **Critical path:** Step 1 → Batch 1 → Step 5 → Step 6b. **Verification:** `oracle` runs the final gate; per-step test runs happen inside each agent before reporting done.

## Verifications

> LLM-as-Judge rubrics for each implementation step. Levels: **HIGH** (panel of 2 judges, threshold 4.0/5.0), **MEDIUM** (single judge, threshold 3.5/5.0), **LOW** (no judge, self-verify against rubric). Rubric weights sum to 1.0 per step. Scratchpad analysis: `.specs/scratchpad/verifications-shimmer.md`.

### Step 1 — Create `Skeleton` component and tests

- **Verification level:** HIGH (panel of 2 judges)
- **Threshold:** 4.0/5.0
- **Artifacts:** `apps/native/src/components/ui/Skeleton.tsx`, `apps/native/src/components/__tests__/ui/Skeleton.test.tsx`, `apps/native/jest.setup.js`
- **Rubric:**
  1. **Variant Contract Compliance** (0.25): `box`/`text`/`circle`/`line` variants render with correct `borderRadius` mapping (`box`→12, `line`/`text`→8, `circle`→`width/2` or 9999); `Skeleton.Line` (repeated rows) and `Skeleton.Group` (timing sync wrapper) convenience exports present and callable.
  2. **Animation Implementation** (0.25): Reanimated 4.x `useSharedValue` + `withRepeat(withTiming(...))` drives `transform: [{ translateX }]` only (no animated `backgroundColor`/`width`/`height`); `onLayout` measures container width into a shared value (no `useState` re-render); `cancelAnimation(progress)` called on unmount; `Easing.linear` + single `DURATION_MS` constant for sibling sync.
  3. **Reduce-Motion Fallback** (0.20): `useReducedMotion()` returns static `colors.surfaceDark` block with no `Animated.View` and no gradient; `ReduceMotion.System` passed to `withTiming` as defense-in-depth.
  4. **Test Coverage** (0.20): `Skeleton.test.tsx` asserts each variant renders, `width`/`height` props respected, animation disabled when reduce motion on; `expo-linear-gradient` mock + Reanimated mock in `jest.setup.js` support `useSharedValue`/`useAnimatedStyle` (tests green).
  5. **Theme Token Resolution** (0.10): Colors resolve at runtime from `colors.surfaceDark` (`#272935`) + derived highlight (inline or via `skeletonHighlight` token in `styles/colors.ts`); dark + light themes work with no skeleton-specific edits; `styles/__tests__/styles.test.ts` snapshot updated if token path chosen.

### Step 2 — Refactor `LoadingScreen` to render skeletons

- **Verification level:** MEDIUM (single judge)
- **Threshold:** 3.5/5.0
- **Artifacts:** `apps/native/src/components/LoadingScreen.tsx`, `apps/native/src/components/__tests__/LoadingScreen.test.tsx`
- **Rubric:**
  1. **Spinner Replacement** (0.30): `ActivityIndicator` replaced with `Skeleton` (box + line layout); hardcoded `#00ced1` fixed to `colors.primary`.
  2. **Interface Stability** (0.30): Public interface `{ message? }` unchanged; 5 consumer screens (`app/(tabs)/trips/partners/[id].tsx`, `trips/info.tsx`, `trips/details.tsx`, `trips/index.tsx`, `community.tsx`) need no edits.
  3. **Opaque Container Preservation** (0.25): Full-screen opaque loader behavior preserved (container `View` with opaque background); visual parity with prior behavior except spinner → skeleton.
  4. **Test Assertion Update** (0.15): `getByLabelText("Loading indicator")` replaced with skeleton `testID` assertion; `LoadingScreen.test.tsx` green.

### Step 3 — Refactor `PrimaryLoadingButton` to use shimmer strip

- **Verification level:** MEDIUM (single judge)
- **Threshold:** 3.5/5.0
- **Artifacts:** `apps/native/src/components/common/buttons/PrimaryLoadingButton.tsx`, `apps/native/src/components/__tests__/common/PrimaryLoadingButton.test.tsx`
- **Rubric:**
  1. **Shimmer Strip Integration** (0.30): `ActivityIndicator` replaced with `Skeleton.Line` sized to label while `isLoading`; no spinner rendered.
  2. **Interface Stability** (0.30): Button interface unchanged; 16 consumer files (login, admin screens, `CreateGroupButton`, `SaveGroupButton`, `AppModalFooter`, `CoinOperationScreen`, `ChallengeFormFields`) need no edits.
  3. **Test Assertion Update** (0.20): `getByTestId("button-loading-indicator")` replaced with skeleton `testID` assertion; `PrimaryLoadingButton.test.tsx` green.
  4. **Indirect Dependency Safety** (0.20): `CoinOperationScreen.test.tsx` (uses button indirectly) stays green after refactor; no indirect breakage.

### Step 4 — Refactor the 5 existing `*LoadingState` components

- **Verification level:** MEDIUM (single judge)
- **Threshold:** 3.5/5.0
- **Artifacts:** `ChallengeLoadingState.tsx`, `ChallengesLoadingState.tsx`, `GroupsLoadingState.tsx`, `GroupDetailsLoadingState.tsx`, `GroupEditLoadingState.tsx` + 3 test files
- **Rubric:**
  1. **Skeleton Layout Fidelity** (0.25): All 5 components render `Skeleton` layouts matching their content shape (challenge card, challenges list, groups list, group details, group edit form).
  2. **View/ActivityIndicator Removal** (0.25): No `View`-placeholder or `ActivityIndicator` internals remain in the 5 `*LoadingState` components; grep confirms zero hits.
  3. **Existing Test Green** (0.20): 3 existing test files (`ChallengeLoadingState.test.tsx`, `ChallengesLoadingState.test.tsx`, `GroupsLoadingState.test.tsx`) stay green; assertions updated to skeleton `testID` where needed.
  4. **Untested Component Safety** (0.20): `GroupDetailsLoadingState` + `GroupEditLoadingState` (no tests) verified via manual visual check on simulator — screenshot evidence attached to PR.
  5. **No Props / No Consumer Changes** (0.10): All 5 components keep no-props interface; no consumer edits required.

### Step 5 — Audit and swap remaining `ActivityIndicator` usages in screens

- **Verification level:** MEDIUM (single judge)
- **Threshold:** 3.5/5.0
- **Artifacts:** 15 files in `app/(tabs)/**/*.tsx` + `app/auth/login.tsx` (line 424)
- **Rubric:**
  1. **Swap Completeness** (0.25): All 15 primary content-load `ActivityIndicator` (`size="large"`) usages swapped for `LoadingScreen` or domain skeleton layout; grep confirms zero `size="large"` hits in `app/(tabs)/**/*.tsx` + `app/auth/login.tsx`.
  2. **Scope Discipline** (0.25): No `size="small"` inline spinners touched (out of scope per design plan); diff contains only the 15 target files.
  3. **Swap Pattern Appropriateness** (0.20): `LoadingScreen` used for opaque wait; domain skeleton used when content shape is known; default to `LoadingScreen` when ambiguous.
  4. **No Consumer Interface Breakage** (0.15): Screen public interfaces unchanged; no downstream edits required.
  5. **Manual Visual QA** (0.15): Each swapped screen renders skeleton during data fetch on simulator (dark + light theme); screenshot evidence sampled across admin + trips + community screens.

### Step 6a — Update README [DONE]

- **Verification level:** LOW (no judge — self-verify against rubric)
- **Threshold:** N/A (self-verify)
- **Artifacts:** `apps/native/README.md`
- **Rubric:**
  1. **Entry Presence** (0.40): Skeleton entry added under "Shared UI Components" (line 61).
  2. **Accuracy** (0.30): Entry documents component name, variants (`box`/`text`/`circle`/`line`), and convenience exports (`Skeleton.Line`, `Skeleton.Group`).
  3. **Conciseness** (0.20): 1–2 lines; no redundant detail; matches existing entry style.
  4. **Placement** (0.10): Entry in correct section; follows existing README formatting.

### Step 6b — Final lint/test gate [DONE]

- **Verification level:** HIGH (panel of 2 judges)
- **Threshold:** 4.0/5.0
- **Artifacts:** `bun run lint` output, `bun run test` output, Definition of Done checklist, final visual check screenshots
- **Rubric:**
  1. **Lint Pass** (0.25): `bun run lint` passes in `apps/native` with no new errors in touched files; lint output attached.
  2. **Test Pass** (0.25): `bun run test` passes in `apps/native` (all existing + new `Skeleton.test.tsx` green); test output attached.
  3. **No API/MSW Changes** (0.20): No API or MSW tests changed; diff confined to `apps/native`; `git diff -- packages/orpc packages/db` empty.
  4. **Definition of Done Checklist** (0.20): All DoD items checked; no new runtime dependencies added (`package.json` diff empty for runtime deps).
  5. **Final Visual Check** (0.10): Dark + light theme, reduce-motion on + off verified on simulator; screenshot evidence covers `LoadingScreen`, `PrimaryLoadingButton`, at least one `*LoadingState`, and one swapped screen.

### Verification Summary

| Step | Level | Threshold | Artifact | Judge Focus |
|------|-------|-----------|----------|-------------|
| 1 | HIGH (panel of 2) | 4.0/5.0 | `components/ui/Skeleton.tsx`, `__tests__/ui/Skeleton.test.tsx`, `jest.setup.js` | Variant contract, animation impl, reduce-motion fallback, test coverage, theme tokens |
| 2 | MEDIUM (single) | 3.5/5.0 | `LoadingScreen.tsx`, `__tests__/LoadingScreen.test.tsx` | Spinner replacement, interface stability, opaque container, test update |
| 3 | MEDIUM (single) | 3.5/5.0 | `PrimaryLoadingButton.tsx`, `__tests__/common/PrimaryLoadingButton.test.tsx` | Shimmer strip, interface stability, test update, indirect dependency safety |
| 4 | MEDIUM (single) | 3.5/5.0 | 5 `*LoadingState.tsx` + 3 test files | Skeleton fidelity, View/ActivityIndicator removal, test green, untested safety, no consumer changes |
| 5 | MEDIUM (single) | 3.5/5.0 | 15 screen files in `app/(tabs)/**/*.tsx` + `app/auth/login.tsx` | Swap completeness, scope discipline, pattern appropriateness, no breakage, visual QA |
| 6a | LOW (none) | N/A | `apps/native/README.md` | Entry presence, accuracy, conciseness, placement |
| 6b | HIGH (panel of 2) | 4.0/5.0 | `bun run lint` + `bun run test` output, DoD checklist, visual check screenshots | Lint pass, test pass, no API/MSW changes, DoD checklist, final visual check |

### Verification Execution Plan

> Judges run after each batch completes (not mid-batch). Per-step test runs happen inside each agent before reporting done; judges evaluate the artifact + test output, not the implementation process.

1. **After Batch 0 (Step 1):** Dispatch HIGH panel of 2 judges on `Skeleton.tsx` + `Skeleton.test.tsx` + `jest.setup.js` mocks. **Block** Batch 1 until both judges score ≥4.0/5.0. Rationale: every downstream step imports `Skeleton` — a flawed foundation propagates everywhere.
2. **After Batch 1 (Steps 2, 3, 4):** Dispatch 3 MEDIUM single-judge evaluations in parallel — one per step. **Block** Batch 2 until each scores ≥3.5/5.0. Rationale: consumer refactors are independent; parallel evaluation mirrors parallel implementation.
3. **After Batch 2 (Steps 5, 6a):** Dispatch 1 MEDIUM single-judge evaluation on Step 5 (15-file screen sweep). Step 6a is LOW — no judge; the `haiku` agent self-verifies against the 4-item rubric before reporting done. **Block** Batch 3 until Step 5 scores ≥3.5/5.0.
4. **After Batch 3 (Step 6b):** Dispatch HIGH panel of 2 judges on the final lint/test gate + DoD checklist + visual check screenshots. **Release gate** — must score ≥4.0/5.0 from both judges before merge. Rationale: this is the last verification before the change ships; a panel catches regressions a single judge might miss.

**Judge dispatch summary:**
- Batch 0 → 1 HIGH panel (2 judges) on Step 1.
- Batch 1 → 3 MEDIUM single judges on Steps 2, 3, 4 (parallel).
- Batch 2 → 1 MEDIUM single judge on Step 5; Step 6a self-verified (LOW).
- Batch 3 → 1 HIGH panel (2 judges) on Step 6b (release gate).

**Total judge dispatches:** 4 HIGH judges (2 panels) + 5 MEDIUM judges = 9 judge runs across 7 steps.
