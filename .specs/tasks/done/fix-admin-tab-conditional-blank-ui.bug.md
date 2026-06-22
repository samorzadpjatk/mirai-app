---
title: Fix admin tab conditional rendering that blanks the native tab UI
type: bug
status: todo
priority: high
---

## Description

### Problem
`apps/native/src/app/(tabs)/_layout.tsx:54-59` conditionally renders `<NativeTabs.Trigger name="admin">` via `{hasAdminAccess && (...)}`. Toggling `hasAdminAccess` (derived from `useUser()`) adds/removes a tab at runtime, which remounts the entire `NativeTabs` navigator and blanks the whole tab UI.

### Expected behavior
- The admin trigger is always present in the React tree (stable navigator config, always 5 tabs).
- Non-admins have the tab hidden via the `hidden` prop; admins see and can navigate to it.
- The route for `name="admin"` already resolves to `(tabs)/admin/index.tsx`, so no new route file is needed.

## Acceptance Criteria

1. **AC1 — Stable trigger.** `<NativeTabs.Trigger name="admin">` is always rendered (no `{... && ...}` wrapper) inside the `NativeTabs` tree.
2. **AC2 — Visibility gated by role.** The trigger carries `hidden={!hasAdminAccess(user?.role)}` so non-admins do not see it.
3. **AC3 — No blank UI.** Switching tabs or resolving `useUser()` no longer remounts the native tab navigator; the whole UI does not disappear.
4. **AC4 — Admin hub reachable.** Users with `ADMIN` or `MODERATOR` role see the Admin tab, tap it, and land on the existing `(tabs)/admin/index.tsx` hub.
5. **AC5 — No regression for non-admins.** Non-admin users do not see the Admin tab and the remaining four tabs render and switch correctly.
6. **AC6 — Quality gates pass.** `nx run @mirai-app/native:lint`, `nx run @mirai-app/native:typecheck`, and `nx run @mirai-app/native:test` all exit 0.

## Affected Files

### Primary (edits / new files)
- `packages/common/src/users/hasAdminAccess.ts` — **NEW**. Pure role helper.
- `packages/common/src/users/__tests__/hasAdminAccess.test.ts` — **NEW**. Unit tests.
- `packages/common/src/users/index.ts` — re-export the helper.
- `apps/native/src/app/(tabs)/_layout.tsx` — make trigger static + `hidden`; import helper.
- `apps/native/src/app/(tabs)/admin/_layout.tsx` — DRY the role check using the helper.

### Secondary (read-only)
- `apps/native/src/app/_layout.tsx` — confirm `Stack.Protected guard={hasSession}` already gates `(tabs)`.
- `apps/native/src/app/(tabs)/admin/index.tsx` — confirm it is the existing admin hub.

## Architecture / Approach

1. **Pure helper in `@mirai-app/common/users`** (TDD):
   ```ts
   export function hasAdminAccess(role: string | undefined | null): boolean {
     return role === "ADMIN" || role === "MODERATOR";
   }
   ```
   Returns `false` for everything else, including case variants.

2. **Make trigger static and hidden** in `(tabs)/_layout.tsx`:
   - Replace conditional block with always-rendered trigger.
   - Pass `hidden={!hasAdminAccess(user?.role)}`.
   - Remove the local `hasAdminAccess` boolean to avoid shadowing the imported helper.

3. **DRY `(tabs)/admin/_layout.tsx`** by replacing inline role expression with the helper (import aliased if needed to avoid local var shadowing).

### Why this shape
- Native AGENTS.md rule: "Extract pure domain logic to `@mirai-app/common` for real-data testing". The helper is unit-testable and removes duplicated role checks across the codebase.
- `NativeTabs.Trigger hidden` is the documented visibility mechanism; conditionally mounting children is not allowed because it remounts the native navigator.

## Implementation Steps (TDD)

### Step 1 — RED: write helper tests
Create `packages/common/src/users/__tests__/hasAdminAccess.test.ts` with cases:
- `"ADMIN"` → `true`
- `"MODERATOR"` → `true`
- `"USER"` → `false`
- `undefined` → `false`
- `null` → `false`
- `""` → `false`
- `"admin"` → `false` (case-sensitive)
- unknown string → `false`

Run: `nx run @mirai-app/common:test -- hasAdminAccess` → expect FAIL.

### Step 2 — GREEN: implement helper
Create `packages/common/src/users/hasAdminAccess.ts` (body above). Re-export from `packages/common/src/users/index.ts`. Re-run tests → PASS.

### Step 3 — Commit checkpoint 1
```
feat(common): add hasAdminAccess role helper with tests
```

### Step 4 — Make admin trigger static
Edit `apps/native/src/app/(tabs)/_layout.tsx`:
- Add import: `import { hasAdminAccess } from "@mirai-app/common/users";`
- Replace lines 54-59:
  ```tsx
  // BEFORE
  {hasAdminAccess && (
    <NativeTabs.Trigger name="admin">
      <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      <NativeTabs.Trigger.Label>Admin</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  )}
  ```
  with:
  ```tsx
  <NativeTabs.Trigger name="admin" hidden={!hasAdminAccess(user?.role)}>
    <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
    <NativeTabs.Trigger.Label>Admin</NativeTabs.Trigger.Label>
  </NativeTabs.Trigger>
  ```
- Remove the now-unused local `hasAdminAccess` boolean.

### Step 5 — DRY admin layout role check
Edit `apps/native/src/app/(tabs)/admin/_layout.tsx`:
- Replace inline expression with `hasAdminAccess(user?.role)`.
- Alias import if local var shadows helper.

### Step 6 — Static checks
```
nx run @mirai-app/common:test
nx run @mirai-app/native:lint
nx run @mirai-app/native:typecheck
nx run @mirai-app/native:test
```

### Step 7 — Manual UI verification
- Launch `nx run @mirai-app/native:ios`.
- Login as **ADMIN**: Admin tab visible, opens hub and sub-routes without blanking.
- Login as **USER**: Admin tab hidden, remaining tabs switch without blanking.
- Cold-start as admin: Admin tab visible on first paint, no flash/blank.

### Step 8 — Commit checkpoint 2
```
fix(native): make admin tab trigger static and hidden for non-admins
```

## Verification

| Layer | Command | Expected |
|---|---|---|
| Helper unit | `nx run @mirai-app/common:test -- hasAdminAccess` | all cases pass |
| Common test | `nx run @mirai-app/common:test` | green |
| Native typecheck | `nx run @mirai-app/native:typecheck` | clean |
| Native lint | `nx run @mirai-app/native:lint` | clean |
| Native test | `nx run @mirai-app/native:test` | green |
| UI smoke | `nx run @mirai-app/native:ios` + manual | no blank UI; visibility matches role |

## Risks / Rollback

### Risks
1. **Helper shadowed by local var.** Use an alias when importing if the file keeps a local boolean.
2. **`hidden` prop not supported on version.** Verified: `expo-router@55.0.14` types include `hidden?: boolean` on `NativeTabs.Trigger`. If running SDK 54, verify against installed types.
3. **Admin route missing.** Existing `(tabs)/admin/index.tsx` is already the target; no route creation needed.

### Rollback
Revert the two commits in reverse order. Each is atomic and independently revertible. 

## Commit Strategy (Atomic)

| # | Commit message | Files touched |
|---|---|---|
| 1 | `feat(common): add hasAdminAccess role helper with tests` | `packages/common/src/users/hasAdminAccess.ts`, `...test.ts`, `users/index.ts` |
| 2 | `fix(native): make admin tab trigger static and hidden for non-admins` | `apps/native/src/app/(tabs)/_layout.tsx`, `apps/native/src/app/(tabs)/admin/_layout.tsx` |

## Out of Scope
- Refactoring other role checks across backend/seed (can be done in follow-up refactor).
- Visual redesign of admin tab.
