---
title: Fix community screen no-session early return blocking login redirect
type: bug
status: todo
priority: medium
---

## Description

### Problem
`apps/native/src/app/(tabs)/community.tsx` returns `null` when no auth session is present (lines 249-251), after an imperative `useEffect` (lines 73-77) attempts `router.replace("/auth/login")`. The `return null` commits an empty tree; the post-commit effect can race with the root layout's `Stack.Protected` guard unmounting the route, so the redirect does not reliably fire.

Root layout (`apps/native/src/app/_layout.tsx`) already guards `(tabs)` with `Stack.Protected guard={hasSession}` and `auth/login` with `guard={!hasSession}`. The community-level guard is therefore a defensive fallback — it must be reliable.

### Expected behavior
Replace the imperative `useEffect` redirect + `return null` with a declarative `<Redirect href="/auth/login" />` from `expo-router`. Declarative `Redirect` acts during render (not after commit), eliminating the race. Remove the now-unused `useEffect` import while keeping `useRouter` (still used by `setParams` and `router.push`).

## Acceptance Criteria

1. **AC1 — Declarative redirect.** When `!session && !isLoadingSession`, `CommunityScreen` renders `<Redirect href="/auth/login" />` instead of `null`.
2. **AC2 — Imperative redirect removed.** The `useEffect` block at lines 73-77 is removed.
3. **AC3 — Imports cleaned.** `Redirect` is added to the `expo-router` import; `useEffect` is removed from the `react` import if no other usage exists.
4. **AC4 — Authenticated path unchanged.** With a valid session, the community feed renders as before.
5. **AC5 — Quality gates pass.** `nx run @mirai-app/native:lint`, `nx run @mirai-app/native:typecheck`, and `nx run @mirai-app/native:test` all exit 0.

## Affected Files

### Primary
- `apps/native/src/app/(tabs)/community.tsx` — remove `useEffect` redirect; replace `return null` with `<Redirect href="/auth/login" />`; adjust imports.
- `apps/native/src/app/(tabs)/__tests__/community.test.tsx` — **NEW**. Component test asserting the declarative redirect when unauthenticated.

### Secondary (read-only)
- `apps/native/src/app/_layout.tsx` — confirm root guards.

## Architecture / Approach

### Why declarative `<Redirect>`
1. **Render-phase execution:** `Redirect` acts during render, before commit. The `useEffect` approach acts after commit — the window where the route can unmount (via `Stack.Protected`) before the effect runs is exactly the race.
2. **Idiomatic expo-router:** `<Redirect>` is the documented pattern; `(tabs)/index.tsx` already uses it.
3. **Defensive depth:** keeps a screen-level fallback behind the root guard so a transient guard edge case does not render the feed with no session.

### Test strategy (TDD)
- Mock `@mirai-app/auth/client`'s `useAuth` to return `{ session: null, isLoading: false }`.
- Stub the three data hooks (`useHomeFull`, `useCommunityFeed`, `useSelectedTrip`) so the component mounts to the guard branch only.
- Mock `expo-router` `Redirect` to render `<View testID="redirect-to-login" />`.
- Assert `getByTestId("redirect-to-login")` is present (RED before fix, GREEN after).
- Add second assertion: valid session ⇒ no redirect sentinel.

## Implementation Steps (TDD)

### Step 1 — RED: write failing test
Create `apps/native/src/app/(tabs)/__tests__/community.test.tsx`:
- Mock `expo-router` via `jest.requireActual` + override `Redirect`.
- Mock `@mirai-app/auth/client` to unauthenticated.
- Stub `~/hooks/home` `useHomeFull`, `~/hooks/community/useCommunityFeed`, and `~/hooks/trips` `useSelectedTrip`.
- Render `<CommunityScreen />`, assert redirect sentinel is present.

Run: `nx run @mirai-app/native:test -- community` → expect FAIL.

### Step 2 — GREEN: apply fix
Edit `apps/native/src/app/(tabs)/community.tsx`:
- Add `Redirect` to `expo-router` import:
  ```ts
  import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
  ```
- Delete the `useEffect` redirect block (lines 73-77).
- Replace lines 249-251:
  ```tsx
  if (!session) {
    return <Redirect href="/auth/login" />;
  }
  ```
- Remove `useEffect` from `react` import if unused.

Run: `nx run @mirai-app/native:test -- community` → expect PASS.

### Step 3 — REFACTOR: add authenticated assertion
Add test case for valid session ⇒ no redirect sentinel. Run full native tests.

### Step 4 — Static checks
```
nx run @mirai-app/native:lint
nx run @mirai-app/native:typecheck
nx run @mirai-app/native:test
```

### Step 5 — Manual / UI verification
- `nx run @mirai-app/native:dev`
- Sign out from profile tab ⇒ app lands on `/auth/login`.
- Force deep link to community while signed out ⇒ lands on `/auth/login`, no blank screen.
- Sign in ⇒ community feed renders normally.

### Step 6 — Commit
```
fix(native): redirect community screen to login declaratively

Replace imperative useEffect + `return null` auth guard with a declarative
<Redirect href="/auth/login" />. The post-commit effect raced with the root
Stack.Protected guard unmounting the route, so the redirect did not reliably
fire and users could see a blank screen.

- Remove useEffect redirect block (community.tsx:73-77)
- Replace `return null` with `<Redirect href="/auth/login" />` (community.tsx:249-251)
- Add Redirect to expo-router import; drop unused useEffect import
- Add component test asserting redirect sentinel renders when unauthenticated
```

## Verification

| Layer | Command | Expected |
|---|---|---|
| Component unit | `nx run @mirai-app/native:test -- community` | new redirect test passes |
| Native test | `nx run @mirai-app/native:test` | all green |
| Native lint | `nx run @mirai-app/native:lint` | clean |
| Native typecheck | `nx run @mirai-app/native:typecheck` | clean |
| UI smoke | `nx run @mirai-app/native:dev` + manual | no blank screen on unauthenticated deep link |

## Risks / Rollback

### Risks
1. **Redirect loops.** `Redirect` to `/auth/login` behind root `Stack.Protected` guard should not loop because `auth/login` is guarded by `!hasSession`. If the guard logic changes, this could loop; keep an eye on `app/_layout.tsx`.
2. **Test fragility.** Mocking `Redirect` relies on test setup. Follow existing native testing patterns.

### Rollback
Revert the single atomic commit. No state changes beyond the source code.

## Out of Scope
- Applying the same pattern to other tab screens (worth a follow-up refactor).
- Changing the auth guard in `app/_layout.tsx`.
