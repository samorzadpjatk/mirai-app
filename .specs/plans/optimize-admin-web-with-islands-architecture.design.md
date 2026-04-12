---
title: "Optimize Admin Web with Islands Architecture"
type: design
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-optimize-admin-web-with-islands-architecture/design.md"
---

## Context

The admin web app (`apps/admin-web`) currently uses a monolithic client-side architecture where a single `<AdminApp client:only="react">` component handles all routing and page rendering. This was a direct migration from React Native's admin panel, preserving the same component structure and manual routing logic.

Current architecture:

- All pages bundled into `AdminApp.tsx` (~200KB) with manual path matching
- Separate `AuthProvider` (~230KB including Supabase SDK)
- Custom tRPC client creation per-hook instead of shared context
- Hooks duplicated between `apps/native/src/hooks/admin/` and `apps/admin-web/src/hooks/admin/`
- Total bundle: ~600KB JavaScript loaded on every page, even though only one page renders

The native app (`apps/native`) uses the same admin hooks and tRPC patterns, sharing the `@mirai-app/trpc` package. Both apps must remain compatible as they access the same backend APIs and share business logic.

## Goals / Non-Goals

**Goals:**

- Reduce initial JavaScript bundle from 600KB to ~150-200KB per page (70% reduction)
- Migrate to Astro islands architecture with proper code splitting
- Eliminate manual client-side routing in favor of Astro's file-based routing
- Create shared `@mirai-app/admin-hooks` package to prevent hook duplication
- Unify tRPC client usage: admin-web uses `@mirai-app/trpc/client` like native app
- Maintain 100% compatibility with React Native app (shared hooks, same tRPC calls)
- Keep UI components platform-specific (web uses HTML, native uses React Native primitives)
- Enable view transitions for smooth SPA-like navigation
- Start with client-side data fetching (SSR can be added later progressively)

**Non-Goals:**

- Server-side rendering (SSR) of data - keeping fully client-side initially
- Modifying backend tRPC procedures or database schema
- Changing React Native app's UI or routing
- Sharing UI components between native and web (only hooks are shared)
- Optimizing beyond code splitting (advanced techniques like `client:visible`, `client:idle` deferred)

## Decisions

### Decision 1: Single GlobalProviders Island Strategy

**Choice:** Create one `<GlobalProviders client:load>` component containing AuthProvider, APIProvider, TripProvider, Header, and navigation. Load this on every admin page.

**Rationale:**

- Simplifies architecture: one provider setup, consistent across all pages
- These providers are truly global (auth state, tRPC context, selected trip)
- Header and trip selector appear on every page
- ~100KB overhead is acceptable vs current 600KB
- Alternative (split providers per-page) adds complexity without significant benefit

**Trade-off:** Still ships ~100KB of provider code on every page, but gains simplicity and maintainability.

### Decision 2: Shared Hooks Package

**Choice:** Create `packages/admin-hooks/` containing all `useAdmin*` hooks, imported by both native and web apps.

**Rationale:**

- Hooks are currently 95% identical between apps (only import paths differ)
- Prevents drift: one source of truth for business logic
- Both apps use same tRPC calls, same React Query patterns
- Native app already uses `@mirai-app/trpc/client`, web will match
- Alternative (keep duplicated) leads to maintenance burden and bugs from drift

**Implementation:**

```typescript
// packages/admin-hooks/src/useAdminUsers.ts
import { useTRPC } from "@mirai-app/trpc/client";
export function useAdminUsers(
  tripId: string,
  searchTerm: string,
  field: UserSearchField,
) {
  const trpc = useTRPC();
  // Shared logic for both platforms
}

// Both apps import:
import { useAdminUsers } from "@mirai-app/admin-hooks";
```

### Decision 3: File-Based Routing Over Client-Side Router

**Choice:** Use Astro's file-based routing. Delete AdminApp's manual path matching logic.

**Rationale:**

- Astro already provides routing via file structure
- Current manual routing duplicates this unnecessarily
- File-based routing enables automatic code splitting
- Pages like `pages/users/index.astro` map cleanly to `/users`
- Astro view transitions provide SPA-like navigation without client-side router

**Migration:**

```
Before: AdminApp.tsx routes /users → <UsersPage />
After:  pages/users/index.astro renders <UsersPageContent client:load />
```

### Decision 4: Client-Side Data Fetching (SSR Deferred)

**Choice:** Keep data fetching client-side via tRPC hooks. Do not add server-side data fetching initially.

**Rationale:**

- Easier migration: preserves existing hook patterns
- Native app uses same client-side fetching, keeps compatibility high
- Can add SSR progressively later (e.g., Dashboard first)
- Focus on bundle size wins first, then optimize data loading

**Trade-off:** Slightly slower initial render (waterfall: HTML → JS → data fetch) but reduces migration complexity.

### Decision 5: View Transitions for Navigation

**Choice:** Enable Astro's view transitions for smooth page-to-page navigation.

**Rationale:**

- ~5KB overhead for SPA-like user experience
- No client-side router needed
- Preserves providers across navigations (auth state, tRPC client)
- Better UX than full page reloads

**Implementation:**

```astro
<!-- In Layout.astro -->
<head>
  <ViewTransitions />
</head>
```

### Decision 6: Platform-Specific UI Components

**Choice:** Keep UI components separate per platform. Do NOT attempt to share React components.

**Rationale:**

- Native uses `<Pressable>`, `<View>`, `<Text>` (React Native primitives)
- Web uses `<button>`, `<div>`, `<span>` (HTML elements)
- Styling differs completely (React Native StyleSheet vs Tailwind CSS)
- Attempting to share adds complexity without value
- Hooks (business logic) are shared, UI (presentation) is platform-specific

**Pattern:**

```
Shared:     packages/admin-hooks/src/useAdminUsers.ts
Native UI:  apps/native/src/components/admin/users/UserCard.tsx (uses RN primitives)
Web UI:     apps/admin-web/src/components/admin/users/UserCard.tsx (uses HTML)
```

## Risks / Trade-offs

### Risk: Provider Context Lost Between Pages

**Issue:** Astro islands are isolated. If GlobalProviders unmounts between pages, auth/tRPC state could reset.

**Mitigation:** View transitions with `transition:persist` directive keep islands alive during navigation. Test thoroughly.

### Risk: Hook Package Dependency Management

**Issue:** Shared hooks depend on `@tanstack/react-query`, `@trpc/client`. Version mismatches between native and web could cause issues.

**Mitigation:** Use workspace overrides in root `package.json` to enforce consistent versions. Already done for React Query.

### Risk: Native App Breaks During Migration

**Issue:** Moving hooks to new package could break native app imports.

**Mitigation:** Migrate in phases. Create package first, update imports one app at a time, test before proceeding.

### Risk: Bundle Size Regression

**Issue:** If islands aren't properly split, bundle could remain large.

**Mitigation:** Measure bundle size after each page migration. Target: <200KB per page. Rollback if over budget.

### Risk: TripContext Dependency Everywhere

**Issue:** Most pages need `useTrip()` hook. If TripProvider isn't in GlobalProviders, pages break.

**Mitigation:** TripProvider is part of GlobalProviders. Document this dependency clearly in code.

### Trade-off: 100KB Provider Overhead

**Decision:** Accept ~100KB GlobalProviders on every page.

**Rationale:** This is necessary infrastructure (auth, tRPC, trip selection). Still 500KB improvement over current state. Alternative (split providers) adds complexity without significant gain.

### Trade-off: Client-Side Data Fetching

**Decision:** Keep data fetching client-side initially (no SSR).

**Impact:** Slightly slower initial render. Pages show loading states before data appears.

**Future:** Can progressively add SSR to high-traffic pages (Dashboard, Users list) later.

## Migration Plan

### Phase 1: Create Shared Hooks Package (2-3 hours)

1. Create `packages/admin-hooks/` with package.json
2. Copy hooks from `apps/admin-web/src/hooks/admin/` to `packages/admin-hooks/src/`
3. Update imports to use `@mirai-app/trpc/client` (useTRPC, useTRPCClient)
4. Update `apps/admin-web` to import from `@mirai-app/admin-hooks`
5. Update `apps/native` to import from `@mirai-app/admin-hooks`
6. Test both apps still work

### Phase 2: Unify tRPC Client in Admin-Web (1-2 hours)

1. Update `apps/admin-web/src/components/TRPCProvider.tsx` to use APIProvider from `@mirai-app/trpc/client`
2. Remove manual `createTRPCClient()` logic
3. Wrap app in APIProvider context
4. Test hooks still work

### Phase 3: Create GlobalProviders Island (1 hour)

1. Create `apps/admin-web/src/components/providers/GlobalProviders.tsx`
2. Wrap AuthProvider, APIProvider, TripProvider
3. Include Header and MobileNav components
4. Update `AdminLayout.astro` to use `<GlobalProviders client:load />`

### Phase 4: Migrate All Admin Pages to Islands (6-8 hours)

For each admin section (users, groups, challenges, rewards, activity, notifications, transactions, coins, schedules, dashboard):

1. Create page-specific island component (e.g., `UsersPageContent`)
2. Create Astro page files with proper routing structure:
   - `pages/users/index.astro` → list page
   - `pages/users/new.astro` → create page
   - `pages/users/[userId]/edit.astro` → edit page
3. Each Astro page imports island component: `<UsersPageContent client:load />`
4. Remove corresponding route from AdminApp.tsx

Order:

1. Dashboard (simplest, good test case)
2. Users (most common, high value)
3. Groups, Activity, Rewards (medium complexity)
4. Challenges (complex, many sub-routes)
5. Notifications, Transactions, Coins, Schedules (simple)

### Phase 5: Delete Old Architecture (30 minutes)

1. Delete `apps/admin-web/src/components/AdminApp.tsx`
2. Delete manual routing logic
3. Delete old `TRPCProvider.tsx` (replaced by APIProvider)
4. Clean up unused imports

### Phase 6: Add View Transitions (15 minutes)

1. Add `<ViewTransitions />` to `Layout.astro`
2. Test navigation between pages
3. Add `transition:persist` to GlobalProviders if needed

### Rollback Strategy

- Each phase is independent and reversible
- If phase fails, revert commits for that phase
- Keep old AdminApp.tsx until ALL pages migrated
- Measure bundle size after each phase - rollback if regression

### Testing Plan

- Test each migrated page: functionality, data loading, navigation
- Test both admin-web and native app after hook migration
- Measure bundle size: run `bun run build` and check `dist/client/_astro/*.js`
- Test view transitions: navigate between pages, verify state preservation
- Test on slow network (throttle to 3G) to verify improvement

## Open Questions

**Q: Should we add SSR to any pages during this migration?**
Decision deferred. Will evaluate after islands migration completes. Dashboard is good candidate for future SSR.

**Q: Do we need `transition:persist` on GlobalProviders?**
TBD during testing. If auth state or trip selection resets on navigation, add this directive.

**Q: Should analytics/monitoring be added to track bundle sizes over time?**
Out of scope for this change. Could be future enhancement.
