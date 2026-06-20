---
title: Implement empty state handling for data-driven screens
---

## Initial User Prompt

Create a CEK SDD plan for handling empty/undefined values in React Native UI screens. The user wants empty/invalid objects to NOT be displayed to users. Fix && crash risks, add ListEmptyComponent to FlatLists, create ErrorState component, and implement 4-state pattern (Loading/Error/Empty/Success) across data-driven screens in apps/native.

## Description

### What
Implement a unified, crash-proof empty/undefined value handling strategy across all React Native screens in `apps/native`. This includes:
- Eliminating `&&` conditional rendering crash risks by converting to safe ternary or `!!` patterns
- Adding contextual `ListEmptyComponent` to all screen-level `FlatList` components
- Creating a reusable `ErrorState` component and applying it consistently to all data-driven screens
- Enforcing a 4-state UI pattern (Loading / Error / Empty / Success) on every screen that fetches backend data
- Standardizing domain-specific skeleton loading components with consistent testIDs and styling
- Documenting the conditional rendering safety rule in project conventions

### Why
React Native has a critical difference from web React: falsy values (`""`, `0`) rendered directly inside `<View>` (but not `<Text>`) cause runtime crashes with the error "Text strings must be rendered within a <Text> component". The codebase currently contains 5 concrete crash risks from `&&` leaks, multiple FlatLists that show blank screens when empty, and inconsistent error handling that sometimes silently fails. Standardizing these patterns prevents crashes, improves perceived performance via skeletons, and gives users clear guidance instead of blank screens or silent failures.

## User Scenarios

### Primary Flow: User navigates to a data-driven screen
**Given** the user opens any screen that loads data from the backend (e.g., trips list, group details, admin dashboard)
**When** the screen renders
**Then** the user sees one of four consistent states:
1. **Loading** — a domain-specific skeleton or `LoadingScreen` is shown while data fetches
2. **Error** — an `ErrorState` with a title, message, and optional retry button is shown if the request fails
3. **Empty** — an `EmptyState` with contextual icon, title, and subtitle guidance is shown if the data array/object is empty
4. **Success** — the actual content is rendered once data is available and non-empty

### Error Scenario: Network failure on a trip screen
**Given** the user navigates to a trip-related screen (e.g., trip list, group details, challenges)
**And** the backend request fails or the device is offline
**When** the React Query hook enters the `isError` state
**Then** the screen renders `ErrorState` with the title "Failed to load" and a "Retry" button
**When** the user taps the retry button
**Then** the query refetches and the screen transitions to Loading, then Success or Empty

### Edge Scenario: Empty search results in organizer selection
**Given** an admin user edits a group and searches for organizers to add
**When** the search query returns zero matching users
**Then** the `FlatList` renders a `ListEmptyComponent` showing an icon and text such as "No organizers found" with guidance to adjust search terms
**And** the user never sees a blank white list area

### Edge Scenario: Falsy prop value crash prevention
**Given** a component receives an empty string prop (e.g., `subtitle=""`, `passwordError=""`)
**When** the component renders using the safe conditional pattern (`{value ? <Component /> : null}` or `{!!value && <Component />}`)
**Then** the app does not crash
**And** no empty string or zero is leaked into the JSX tree outside of `<Text>`

## Acceptance Criteria

### AC1: Crash-free conditional rendering (no `&&` leaks)
- **Given** any `.tsx` file in `apps/native/src/`
- **When** it contains JSX conditional rendering outside of a `<Text>` component or style array
- **Then** all `&&` operators are converted to safe patterns:
  - `{!!value && <Component />}` for explicit boolean conversion
  - `{value ? <Component /> : null}` for ternary with null fallback
- **And** a grep for the risky pattern `\{[a-zA-Z_]+\s*&&\s*<` inside `<View>` or root JSX contexts returns **zero matches**
- **And** the 5 known crash-risk files are fixed:
  - `app/auth/login.tsx` (lines 338, 390)
  - `components/common/ui/EmptyState.tsx` (line 46)
  - `components/admin/AdminHeader.tsx` (line 36)
  - `components/admin/AdminModal.tsx` (line 49)

### AC2: FlatList empty states with `ListEmptyComponent`
- **Given** any screen-level `FlatList` or `SectionList` in `apps/native/src/`
- **When** its `data` prop is an empty array
- **Then** it renders a `ListEmptyComponent` that displays contextual guidance (icon + title + subtitle) instead of a blank screen
- **And** the 3 known missing cases are addressed:
  - `app/(tabs)/admin/groups/edit/[groupId].tsx` (organizer selection FlatList)
  - `components/trips/groups/details/GroupApprovedChallenges.tsx`
  - `components/trips/challenges/ChallengeCommunitySubmissionsCard.tsx`
- **And** any `FlatList` inside a Modal that is guarded by an outer conditional has an inline comment documenting the guard and why `ListEmptyComponent` is skipped

### AC3: 4-state pattern (Loading/Error/Empty/Success) on all data-driven screens
- **Given** any screen in `apps/native/src/` that uses React Query `useQuery` or `useInfiniteQuery`
- **When** the screen renders with any query state
- **Then** it handles all four states in the correct priority order:
  1. **Loading** — early return with skeleton or `LoadingScreen`
  2. **Error** — early return with `ErrorState` and optional `onRetry`
  3. **Empty** — early return or inline `EmptyState` with contextual guidance
  4. **Success** — render actual content
- **And** no screen silently fails on error
- **And** no screen shows inconsistent inline error text instead of `ErrorState`

### AC4: `ErrorState` component creation and usage
- **Given** the need for a reusable error display
- **When** `ErrorState` is created at `components/common/ui/ErrorState.tsx`
- **Then** it accepts the following props:
  - `title?: string` (default: "Something went wrong")
  - `message?: string` (default: "We couldn't load this content. Please try again.")
  - `onRetry?: () => void`
  - `retryLabel?: string` (default: "Retry")
- **And** it renders a warning icon, title, message, and an optional retry button with `testID="error-state-retry"`
- **And** the root container has `testID="error-state-container"`
- **And** it is applied to all data-driven screens under:
  - `app/(tabs)/**/*.tsx`
  - `app/(tabs)/admin/**/*.tsx`
  - `app/(tabs)/trips/**/*.tsx`

### AC5: Skeleton loading state standardization
- **Given** any domain-specific skeleton component in `apps/native/src/`
- **When** it renders
- **Then** it has a `testID` matching the pattern `*-loading-state`
- **And** it uses `colors.backgroundDark` as the background color
- **And** it uses placeholder views (shapes/cards) rather than a generic `ActivityIndicator` spinner
- **And** the following existing skeletons are verified and updated if needed:
  - `GroupDetailsLoadingState`
  - `GroupEditLoadingState`
  - `GroupsLoadingState`
  - `ChallengeLoadingState`
  - `ChallengesLoadingState`
- **And** no data-driven screen uses a generic spinner when a domain-specific skeleton exists or could reasonably be created

### AC6: Documentation and linting rules
- **Given** the project's code quality guidelines
- **When** the empty-state handling rule is documented
- **Then** it is added to `docs/conventions/best-practices.md` with the text:
  > **Rule: No `&&` in JSX outside `<Text>`**
  > Always use `!!value && <Component />` or `value ? <Component /> : null` when conditionally rendering inside `<View>` or at the root JSX level. The `&&` operator leaks empty strings and `0`, which crash React Native.
- **And** `apps/native/AGENTS.md` references the rule
- **And** an ESLint rule is considered (and implemented if feasible) to flag `&&` in JSX expression containers where the left side is not explicitly boolean
- **And** the rule is discoverable by future developers without reading the entire design document

## In-Scope

- `apps/native/src/**/*.tsx` files only
- Conditional rendering pattern fixes (`&&` -> ternary or `!!`)
- `ListEmptyComponent` additions to `FlatList` and `SectionList`
- `ErrorState` component creation and integration into all React Query-driven screens
- 4-state pattern (Loading / Error / Empty / Success) implementation on data-driven screens
- Skeleton loading component standardization (`testID`, background color, placeholder views)
- Documentation updates in `docs/conventions/best-practices.md` and `apps/native/AGENTS.md`
- Unit tests for `ErrorState` component
- Integration tests for crash-fix scenarios

## Out-of-Scope

- Backend server changes (`apps/backend-server/`, `packages/orpc/`, `packages/db/`)
- Web or non-React-Native platforms
- New feature development (only state handling of existing screens)
- Performance optimization beyond skeleton standardization
- Internationalization (i18n) of empty/error state messages
- Changes to `packages/auth/`, `packages/common/`, `packages/supabase/`
- Database schema or API contract changes
- Notification sender (`apps/notification-sender/`)
- Seed CLI (`apps/seed/`)

## Given/When/Then Summary for Complex Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| GWT1 | A `.tsx` file in `apps/native/src/` contains JSX conditional rendering | It is audited for `&&` usage | All risky `&&` outside `<Text>` and style arrays are converted to ternary or `!!`; grep returns zero matches |
| GWT2 | A screen-level `FlatList` has empty `data` | The list renders | It shows a `ListEmptyComponent` with contextual guidance; no blank screen |
| GWT3 | A screen uses React Query `useQuery`/`useInfiniteQuery` | Query enters `isError` state | Screen renders `ErrorState` with retry; no silent failures |
| GWT4 | A domain-specific skeleton component renders | It is inspected for standards | It has `testID="*-loading-state"`, uses `colors.backgroundDark`, and avoids `ActivityIndicator` |
| GWT5 | Any data-driven screen renders | Query state changes | It handles Loading, Error, Empty, Success in correct order with early returns |
| GWT6 | A developer reads code quality guidelines | They look for conditional rendering rules | They find the "No `&&` in JSX outside `<Text>`" rule in `docs/conventions/best-practices.md` and `apps/native/AGENTS.md` |

## Current Status

**Status**: ✅ COMPLETE

### Completed Items
- [x] AC1: All risky `&&` patterns converted to safe ternary/`!!`
  - Fixed: `app/auth/login.tsx` (lines 338, 390)
  - Fixed: `components/common/ui/EmptyState.tsx` (line 46)
  - Fixed: `components/admin/AdminHeader.tsx` (line 36)
  - Fixed: `components/admin/AdminModal.tsx` (line 49)
  - Fixed: `app/(tabs)/trips/challenges/[id].tsx` (line 638)
  - Fixed: `app/(tabs)/trips/index.tsx` (line 113)
  - Fixed: `components/admin/transactions/TransactionCard.tsx` (line 68)
  - Fixed: `components/rewards/RewardsView.tsx` (line 276)
  - Fixed: `components/trips/challenges/ChallengesGridItem.tsx` (line 59)
  - Fixed: `components/trips/groups/edit/EditMembersPicker.tsx` (line 92)
- [x] AC2: ListEmptyComponent present in screen-level FlatLists
- [x] AC3: 4-state pattern implemented on data-driven screens (Loading/Error/Empty/Success)
- [x] AC4: ErrorState component created at `components/common/ui/ErrorState.tsx`
- [x] AC4: Unit tests for ErrorState passing (`components/__tests__/common/ui/ErrorState.test.tsx`)
- [x] AC5: Skeleton loading states have correct testIDs (`*-loading-state` pattern)
- [x] AC6: Documentation added to `docs/conventions/best-practices.md`
- [x] AC6: `apps/native/AGENTS.md` references the rule
- [x] Integration tests for crash-fix scenarios added (`components/__tests__/common/ui/ConditionalRendering.test.tsx`)

## Verification Checklist

- [x] `bun run typecheck` in `apps/native` exits with code 0
- [x] `bun run lint` in `apps/native` exits with code 0
- [x] All existing tests pass
- [x] New unit tests for `ErrorState` are added and passing
- [x] New integration tests for crash-fix scenarios are added and passing
- [x] Manual QA: open every modified screen and verify Loading, Error, Empty, Success states
