# Plan: Empty/Undefined Value Handling in React Native UI Screens

## Context

The MIRAI native app (`apps/native`) renders data from the backend (oRPC + React Query) across dozens of screens. React Native has a critical difference from web React: **falsy values rendered directly in JSX cause crashes**. An empty string `""` or the number `0` inside a `<View>` (but not inside `<Text>`) throws:

> "Text strings must be rendered within a <Text> component"

Additionally, empty or invalid objects should never be displayed to users. The app currently has:
- **Good patterns**: reusable `EmptyState`, `LoadingScreen`, domain-specific skeletons, null-coalescing defaults (`data ?? []`)
- **Risky patterns**: `&&` conditional rendering that can leak empty strings, missing `ListEmptyComponent` on some FlatLists, inconsistent error handling
- **Concrete crash risks**: 3 files with `&&` inside `<View>` where the left-hand value could be `""`

## Objective

Implement a unified, crash-proof empty/undefined value handling strategy across all React Native screens in `apps/native` such that:
1. **Empty/invalid objects are never displayed to users**
2. **All 4 UI states are handled consistently**: Loading, Empty, Error, Success
3. **No `&&` leaks falsy values** that crash React Native
4. **All lists have contextual empty states** with guidance, not blank screens
5. **Skeleton loading states** are preferred over spinners for perceived performance

---

## Research Findings

### Existing Reusable Components (Good Foundation)

| Component | Location | Purpose |
|-----------|----------|---------|
| `EmptyState` | `components/common/ui/EmptyState.tsx` | Core reusable: icon + title + subtitle |
| `LoadingScreen` | `components/LoadingScreen.tsx` | Full-screen spinner with message |
| `AlertsEmptyState` | `components/alerts/AlertsEmptyState.tsx` | Alert-specific wrapper |
| `TripsEmptyState` | `components/trips/list/TripsEmptyState.tsx` | Trip list empty state |
| `LeaderboardEmptyState` | `components/trips/leaderboard/LeaderboardEmptyState.tsx` | Leaderboard empty state |
| `EmptyStateCard` | `components/judgement/EmptyStateCard.tsx` | Judgement empty state card |
| `GroupDetailsLoadingState` | `components/trips/groups/details/GroupDetailsLoadingState.tsx` | Group details skeleton |
| `GroupEditLoadingState` | `components/trips/groups/edit/GroupEditLoadingState.tsx` | Group edit skeleton |
| `GroupsLoadingState` | `components/trips/groups/GroupsLoadingState.tsx` | Groups list skeleton |
| `ChallengeLoadingState` | `components/trips/challenges/ChallengeLoadingState.tsx` | Challenge details skeleton |
| `ChallengesLoadingState` | `components/trips/challenges/ChallengesLoadingState.tsx` | Challenges list skeleton |

### Concrete Crash Risks (Fix Immediately)

These files use `&&` inside `<View>` (not `<Text>`). If the left-hand value is ever `""`, React Native crashes:

| # | File | Line | Risky Code |
|---|------|------|------------|
| 1 | `app/auth/login.tsx` | 338 | `{passwordError && <Text style={styles.modalErrorText}>{passwordError}</Text>}` |
| 2 | `app/auth/login.tsx` | 390 | `{verifyError && <Text style={styles.modalErrorText}>{verifyError}</Text>}` |
| 3 | `components/common/ui/EmptyState.tsx` | 46 | `{subtitle && <Text style={styles.emptyStateText}>{subtitle}</Text>}` |
| 4 | `components/admin/AdminHeader.tsx` | 36 | `{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}` |
| 5 | `components/admin/AdminModal.tsx` | 49 | `{actions && <View style={{ padding: spacing.lg, paddingTop: 0 }}>{actions}</View>}` |

**Fix**: Convert all to ternary `condition ? <Component /> : null` or use `!!value`.

### FlatLists Missing ListEmptyComponent

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `app/(tabs)/admin/groups/edit/[groupId].tsx` | 219 | Organizer selection FlatList — empty search shows blank list |
| 2 | `components/trips/groups/details/GroupApprovedChallenges.tsx` | 141 | FlatList inside Modal — guarded by early `null` return, but no explicit empty state |
| 3 | `components/trips/challenges/ChallengeCommunitySubmissionsCard.tsx` | 270 | Gallery FlatList inside Modal — guarded by `hasAnySubmissions`, but no explicit empty state |

### Good Defensive Patterns to Preserve

- **Array coalescing**: `submissionsQuery.data ?? []`, `transactions ?? []`, `trips ?? []`
- **Primitive coalescing**: `position ?? "-"`, `completedChallengesCount ?? 0`
- **Early return loading**: `if (isLoading) return <LoadingScreen />`
- **Early return error**: `if (!group) return <AdminHeader title="Error" subtitle="Group not found" />`
- **Boolean conversion**: `isMyGroup={Boolean(myGroupId && group.id === myGroupId)}`

---

## Architecture Decision

### Unified 4-State Pattern

Every data-driven screen MUST handle these 4 states in this order:

```
1. LOADING    → Skeleton or LoadingScreen (early return)
2. ERROR      → ErrorState with retry action (early return)
3. EMPTY      → EmptyState with contextual guidance (early return or inline)
4. SUCCESS    → Actual content
```

### Conditional Rendering Rule

**BANNED inside `<View>` or at root JSX level:**
```tsx
// ❌ CRASH RISK: leaks "" or 0
{value && <Component />}
{value && "text"}
```

**REQUIRED patterns:**
```tsx
// ✅ Safe: explicit boolean conversion
{!!value && <Component />}
{Boolean(value) && <Component />}

// ✅ Safe: ternary with null fallback
{value ? <Component /> : null}

// ✅ Safe: inside <Text> only (empty string is valid text child)
<Text>{value && "suffix"}</Text>

// ✅ Safe: nullish coalescing for defaults
const items = data ?? [];
const name = userName ?? "Anonymous";
```

### List Empty State Rule

**All `FlatList` and `SectionList` MUST have `ListEmptyComponent`:**
```tsx
<FlatList
  data={items}
  renderItem={renderItem}
  ListEmptyComponent={
    <EmptyState
      icon="list"
      title="No items found"
      subtitle="Pull down to refresh or check back later"
    />
  }
/>
```

Exception: Lists inside Modals that are already guarded by an outer conditional (e.g., modal only opens when `hasAnySubmissions` is true) may skip `ListEmptyComponent` if the guard is documented.

---

## Implementation Phases

### Phase 1: Fix Concrete Crash Risks (Immediate)

| # | File | Change |
|---|------|--------|
| 1 | `app/auth/login.tsx` | Convert lines 338, 390: `{passwordError ? <Text...> : null}` |
| 2 | `components/common/ui/EmptyState.tsx` | Convert line 46: `{subtitle ? <Text...> : null}` |
| 3 | `components/admin/AdminHeader.tsx` | Convert line 36: `{subtitle ? <Text...> : null}` |
| 4 | `components/admin/AdminModal.tsx` | Convert line 49: `{actions ? <View...> : null}` |

**Acceptance**: All 4 files use safe ternary or `!!` patterns. No `&&` remains inside `<View>` where the left side could be `""` or `0`.

### Phase 2: Add Missing ListEmptyComponent

| # | File | Change |
|---|------|--------|
| 1 | `app/(tabs)/admin/groups/edit/[groupId].tsx` | Add `ListEmptyComponent` to organizer selection FlatList |
| 2 | `components/trips/groups/details/GroupApprovedChallenges.tsx` | Add `ListEmptyComponent` or document why it's guarded |
| 3 | `components/trips/challenges/ChallengeCommunitySubmissionsCard.tsx` | Add `ListEmptyComponent` or document why it's guarded |

**Acceptance**: All screen-level FlatLists show a contextual empty state. Guarded modal FlatLists have inline comments explaining the guard.

### Phase 3: Audit & Fix All `&&` in JSX

Systematically scan all `.tsx` files in `apps/native/src/` for `&&` used in JSX expression containers (`{ ... && ... }`).

**Categorize each occurrence:**
- **Safe**: Inside `<Text>` component, or left side is guaranteed boolean
- **Risky**: Inside `<View>`/root level, left side could be `""`, `0`, or `undefined`
- **Style array**: `style={[styles.base, isActive && styles.active]}` — safe, keep as-is

**Fix all risky occurrences** by converting to `!!leftSide && <RightSide />` or ternary.

**Acceptance**: Zero risky `&&` patterns remain in `apps/native/src/`. A grep for `\{[a-zA-Z_]+\s*&&\s*<` inside `<View>` contexts returns no matches.

### Phase 4: Standardize Error States

Currently, error handling is inconsistent:
- Some screens show `AdminHeader` with "Error" title
- Some screens show inline error text
- Some screens silently fail

**Create `ErrorState` component** (if not already existing) in `components/common/ui/ErrorState.tsx`:
```tsx
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}
```

**Apply to all data-driven screens** that use React Query:
```tsx
if (query.isError) {
  return (
    <ErrorState
      title="Failed to load"
      message={query.error?.message ?? "Something went wrong"}
      onRetry={query.refetch}
    />
  );
}
```

**Acceptance**: All screens with React Query `useQuery`/`useInfiniteQuery` handle `isError` with `ErrorState`. No screen silently fails.

### Phase 5: Skeleton Standardization

**Current state**: Domain-specific skeletons exist but are inconsistent. Some use `ActivityIndicator`, some use placeholder cards.

**Decision**: Keep domain-specific skeletons (they match the layout of the actual content), but standardize their structure:
- All skeletons MUST have `testID="*-loading-state"`
- All skeletons MUST use the same background color (`colors.backgroundDark`)
- All skeletons SHOULD use `react-native-reanimated` or placeholder views (not just spinners) for better perceived performance

**Acceptance**: All skeleton components have consistent styling and testIDs. No screen uses a generic `ActivityIndicator` when a domain-specific skeleton exists or could be created.

### Phase 6: Documentation & Linting

**Add a code quality rule** to `docs/conventions/best-practices.md` or `apps/native/AGENTS.md`:

> **Rule: No `&&` in JSX outside `<Text>`**
> Always use `!!value && <Component />` or `value ? <Component /> : null` when conditionally rendering inside `<View>` or at the root JSX level. The `&&` operator leaks empty strings and `0`, which crash React Native.

**Consider an ESLint rule** (if feasible) to flag `&&` in JSX expression containers where the left side is not explicitly boolean.

**Acceptance**: The rule is documented and referenced in the native app's code quality guidelines.

---

## Files to Modify

### Phase 1 (Crash Fixes)
| File | Lines |
|------|-------|
| `apps/native/src/app/auth/login.tsx` | 338, 390 |
| `apps/native/src/components/common/ui/EmptyState.tsx` | 46 |
| `apps/native/src/components/admin/AdminHeader.tsx` | 36 |
| `apps/native/src/components/admin/AdminModal.tsx` | 49 |

### Phase 2 (ListEmptyComponent)
| File | Action |
|------|--------|
| `apps/native/src/app/(tabs)/admin/groups/edit/[groupId].tsx` | Add `ListEmptyComponent` to FlatList |
| `apps/native/src/components/trips/groups/details/GroupApprovedChallenges.tsx` | Add `ListEmptyComponent` or document guard |
| `apps/native/src/components/trips/challenges/ChallengeCommunitySubmissionsCard.tsx` | Add `ListEmptyComponent` or document guard |

### Phase 3 (Audit All `&&`)
| Scope | Action |
|-------|--------|
| `apps/native/src/**/*.tsx` | Systematic audit of all `&&` in JSX |

### Phase 4 (ErrorState)
| File | Action |
|------|--------|
| `apps/native/src/components/common/ui/ErrorState.tsx` | **Create** new component |
| `apps/native/src/app/(tabs)/**/*.tsx` | Add error handling to all data-driven screens |
| `apps/native/src/app/(tabs)/admin/**/*.tsx` | Add error handling to admin screens |
| `apps/native/src/app/(tabs)/trips/**/*.tsx` | Add error handling to trip screens |

### Phase 5 (Skeleton Standardization)
| File | Action |
|------|--------|
| `apps/native/src/components/trips/groups/details/GroupDetailsLoadingState.tsx` | Add testID, verify styling |
| `apps/native/src/components/trips/groups/edit/GroupEditLoadingState.tsx` | Add testID, verify styling |
| `apps/native/src/components/trips/groups/GroupsLoadingState.tsx` | Add testID, verify styling |
| `apps/native/src/components/trips/challenges/ChallengeLoadingState.tsx` | Add testID, verify styling |
| `apps/native/src/components/trips/challenges/ChallengesLoadingState.tsx` | Add testID, verify styling |

### Phase 6 (Docs)
| File | Action |
|------|--------|
| `docs/conventions/best-practices.md` | Add "No `&&` in JSX outside `<Text>`" rule |
| `apps/native/AGENTS.md` | Reference the rule |

---

## Component Specifications

### `EmptyState` (Existing — Minor Fix)

```tsx
// components/common/ui/EmptyState.tsx
// CHANGE: Line 46
{subtitle ? <Text style={styles.emptyStateText}>{subtitle}</Text> : null}
```

### `ErrorState` (New)

```tsx
// components/common/ui/ErrorState.tsx
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "~/styles";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  retryLabel = "Retry",
}: ErrorStateProps) {
  return (
    <View testID="error-state-container" style={styles.container}>
      <Ionicons name="warning-outline" size={48} color={colors.error} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity testID="error-state-retry" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    textAlign: "center",
  },
  message: {
    fontSize: typography.base,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
});
```

---

## Test Plan

### Unit Tests for `ErrorState`

| Test | Expected Result |
|------|---------------|
| Renders with default title and message | Title = "Something went wrong", message visible |
| Renders custom title and message | Custom text displayed |
| Hides retry button when `onRetry` is undefined | No `error-state-retry` testID found |
| Shows retry button when `onRetry` is provided | `error-state-retry` testID found, press calls handler |
| Has `error-state-container` testID | Query by testID succeeds |

### Integration Tests for Crash Fixes

| Test | Expected Result |
|------|---------------|
| `EmptyState` with `subtitle=""` | Renders without crash, no subtitle text shown |
| `AdminHeader` with `subtitle=""` | Renders without crash, no subtitle shown |
| `AdminModal` with `actions={0}` | Renders without crash, no actions view shown |
| `login.tsx` with `passwordError=""` | Renders without crash, no error text shown |

### Snapshot/Visual Tests

| Test | Expected Result |
|------|---------------|
| All skeleton components have `testID` | Query by `*-loading-state` pattern succeeds |
| All `FlatList` screens have `ListEmptyComponent` | No blank list when data is empty |

---

## Acceptance Criteria

1. **Crash-free**: A grep for `\{[a-zA-Z_]+\s*&&\s*<` in `apps/native/src/**/*.tsx` (excluding style arrays and `<Text>` children) returns **zero matches**.
2. **No blank lists**: Every screen-level `FlatList` has a `ListEmptyComponent` showing contextual guidance.
3. **4-state coverage**: Every data-driven screen handles Loading, Empty, Error, and Success states.
4. **Consistent components**: `EmptyState`, `ErrorState`, `LoadingScreen`, and domain skeletons are the **only** ways to render non-success states.
5. **Empty objects hidden**: Empty strings, `0`, `null`, and `undefined` are never rendered directly to users outside of `<Text>` components.
6. **Tests pass**: All existing tests pass, new tests for `ErrorState` and crash fixes are added and passing.
7. **Type-check clean**: `bun run typecheck` in `apps/native` exits with code 0.
8. **Lint clean**: `bun run lint` in `apps/native` exits with code 0.

---

## Rollback Plan

If any change introduces regressions:

1. **Phase 1 changes are safe** — ternaries are behaviorally identical to `&&` for non-empty strings.
2. **Phase 2-4 changes are additive** — removing `ListEmptyComponent` or `ErrorState` returns to the previous behavior (blank screen), which is not worse than before.
3. **Nuclear rollback**: Revert the specific commit. All changes are localized to `apps/native/src/`.

---

## CEK SDD Workflow

This plan follows the CEK SDD workflow:

| Step | Status | Artifact |
|------|--------|----------|
| 1. **Brainstorm** | ✅ Complete | This document |
| 2. **Add Task** | ⏳ Next | `.specs/tasks/todo/empty-state-handling.feature.md` |
| 3. **Plan Task** | ⏳ Pending | Refined task with parallelized sub-tasks |
| 4. **Implement** | ⏳ Pending | Code changes per phases |
| 5. **Verify** | ⏳ Pending | Tests, lint, typecheck, manual QA |
| 6. **Archive** | ⏳ Pending | Move task to `.specs/tasks/done/` |

### Next Steps

1. Run `sdd:add-task` to create the draft task file from this plan.
2. Run `sdd:plan` to refine and parallelize the implementation.
3. Begin Phase 1 (crash fixes) immediately — they are zero-risk and high-impact.

---

## Decision Matrix

| If you need to... | Change this file |
|-------------------|------------------|
| Fix a crash from `&&` leaking empty string | Convert to ternary `? ... : null` in the specific file |
| Add an empty state to a list | Add `ListEmptyComponent` to the `FlatList` |
| Add an error state to a screen | Use `ErrorState` component with `onRetry` |
| Change loading appearance | Edit the domain-specific `*LoadingState` component |
| Change empty state styling | Edit `components/common/ui/EmptyState.tsx` |
| Change error state styling | Edit `components/common/ui/ErrorState.tsx` |

---

*Plan created: 2026-06-04*
*Status: Ready for task creation and implementation*
*Scope: `apps/native` only*
