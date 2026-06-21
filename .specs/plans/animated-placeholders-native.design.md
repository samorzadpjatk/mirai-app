# Animated Placeholders for `apps/native`

## Goal

Replace all loading indicators in `apps/native` with shimmer skeleton placeholders pulled from existing theme tokens.

## Scope

- `LoadingScreen` — full-screen centered shimmer card instead of `ActivityIndicator`.
- `PrimaryLoadingButton` — button label replaced by a small shimmer strip while `isLoading`.
- Existing `*LoadingState` placeholder components:
  - `components/trips/challenges/ChallengeLoadingState.tsx`
  - `components/trips/challenges/ChallengesLoadingState.tsx`
  - `components/trips/groups/details/GroupDetailsLoadingState.tsx`
  - `components/trips/groups/edit/GroupEditLoadingState.tsx`
  - `components/trips/groups/GroupsLoadingState.tsx`
- Inline full-content `ActivityIndicator` usages in screens where the data shape is known.

Out of scope:
- Non-primary content-load spinners, unless they are already in the files above.
- Toast or overlay loading states not represented by a `*LoadingState` component.

## Approach

Build a single reusable `Skeleton` component using `react-native-reanimated` and `expo-linear-gradient`, both already present. No new dependencies.

## Component API

`apps/native/src/components/ui/Skeleton.tsx`

Props:
- `variant`: `"box" | "text" | "circle" | "line"`
- `width`, `height`: explicit dimensions
- `borderRadius`: optional override
- `style`: optional native style override
- `colors`: optional base/highlight overrides

Convenience exports:
- `Skeleton.Line` — quick repeated rows
- `Skeleton.Group` — synchronizes shimmer timing across siblings

Behavior:
- Uses `LinearGradient` masked by the requested shape.
- Translate animation loops via Reanimated shared value.
- Single timing config in the file keeps all skeletons on screen in sync.
- Base and highlight colors default to existing `colors.surfaceDark` / a derived highlight token, supporting both dark and light themes through current tokens.

## Integration

No changes to loading-state gating logic. Only the rendered placeholder changes.

- `LoadingScreen` remains the opaque full-screen loader but renders skeleton shapes.
- `PrimaryLoadingButton` keeps the same interface; internally swaps text for a shimmer strip.
- Screen-level inline spinners become either `LoadingScreen` (opaque wait) or a domain-specific skeleton layout.

## Edge Cases

- **Reduced motion**: read `AccessibilityInfo.isReduceMotionEnabled` and stop the translating shimmer, falling back to static surfaceDark blocks.
- **Theming**: colors resolved at runtime from existing tokens; future light theme changes require no skeleton edits.
- **Performance**: gradient transform runs on the UI thread via a Reanimated worklet.

## Testing

- Add `components/__tests__/ui/Skeleton.test.tsx`:
  - renders each variant
  - respects `width` / `height`
  - disables animation when reduce motion is on
- Update existing tests for `LoadingScreen` and `PrimaryLoadingButton` to assert shimmer presence instead of `ActivityIndicator`.
- No API / MSW tests change.

## Rollout

1. Add `components/ui/Skeleton.tsx` and its tests.
2. Refactor `LoadingScreen`.
3. Refactor `PrimaryLoadingButton`.
4. Refactor each existing `*LoadingState` component.
5. Audit remaining `ActivityIndicator` usages in `app/(tabs)/**/*.tsx` and swap where appropriate.
6. Run `bun run lint` and `bun run test` in `apps/native`.
7. Add a short note under UI Components in `apps/native/README.md`.

## Deliverables

- `.specs/plans/animated-placeholders-native.design.md` (this document)
- One PR branch with all code/test changes

## Assumptions

- No new dependencies.
- Existing tokens supply the required base/highlight colors.
- Reduce-motion accessibility fallback is required.
