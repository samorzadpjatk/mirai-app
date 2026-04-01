## Why

The admin web application currently ships 600KB+ of JavaScript on every page load (230KB AuthProvider, 200KB AdminApp with all pages, 175KB React runtime), resulting in 3-5 second time-to-interactive. The monolithic `<AdminApp client:only>` component bundles all 20+ admin pages into a single client-side SPA with manual path matching, bypassing Astro's file-based routing and preventing code splitting. This architecture conflicts with Astro's islands paradigm and creates unnecessary performance overhead.

## What Changes

- Migrate from monolithic `<AdminApp client:only>` to Astro islands architecture with file-based routing
- Create shared `@mirai-app/admin-hooks` package for admin hooks (currently duplicated between native and web apps)
- Unify tRPC client setup: migrate admin-web to use `@mirai-app/trpc/client` (matching native app)
- Break apart AdminApp into page-specific islands with `GlobalProviders` for shared context
- Convert all admin pages to Astro file-based routing (users, groups, challenges, rewards, activity, notifications, transactions, coins, schedules, dashboard)
- Add Astro view transitions for smooth SPA-like navigation
- Maintain full compatibility with React Native app's admin hooks and components
- Target bundle size: ~150-200KB per page (vs current 600KB)

## Capabilities

### New Capabilities

- `shared-admin-hooks`: Unified admin hooks package (`@mirai-app/admin-hooks`) used by both native and web apps, containing all `useAdmin*` hooks with tRPC queries
- `global-providers-island`: Single `GlobalProviders` island component containing AuthProvider, APIProvider (tRPC), TripProvider, Header, and TripSelector - loaded on every admin page
- `admin-islands-pages`: All admin pages converted to Astro file-based routing with page-specific island components for interactive content
- `unified-trpc-client`: Admin-web uses `@mirai-app/trpc/client` (APIProvider, useTRPC) instead of manual client creation, matching native app pattern
- `view-transitions`: Astro view transitions enabled for smooth page navigation

### Modified Capabilities

## Impact

**Affected Code:**

- `apps/admin-web/src/components/AdminApp.tsx` - deleted, replaced with islands
- `apps/admin-web/src/components/TRPCProvider.tsx` - replaced with APIProvider from `@mirai-app/trpc/client`
- `apps/admin-web/src/hooks/admin/*.ts` - moved to `packages/admin-hooks/src/`
- `apps/native/src/hooks/admin/*.ts` - moved to `packages/admin-hooks/src/`
- `apps/admin-web/src/layouts/AdminLayout.astro` - refactored to use GlobalProviders island
- `apps/admin-web/src/pages/*.astro` - all admin pages rewritten to use islands

**New Code:**

- `packages/admin-hooks/` - new shared package for admin hooks
- `apps/admin-web/src/components/providers/GlobalProviders.tsx` - wraps auth, tRPC, trip context
- Page-specific island components for each admin page (UsersPageContent, GroupsPageContent, etc.)

**Dependencies:**

- Add `@mirai-app/admin-hooks` as dependency in both `apps/native` and `apps/admin-web`
- Update `@mirai-app/trpc/client` usage in `apps/admin-web`
- Add Astro view transitions

**Performance:**

- Bundle size reduction: 600KB → ~150-200KB per page (70% reduction)
- Time to interactive: 3-5s → ~1-2s estimated
- Better code splitting: only load JS needed for current page

**Compatibility:**

- React Native app continues to work with shared hooks
- UI components remain platform-specific (native uses React Native primitives, web uses HTML)
- tRPC client setup now consistent across both platforms
