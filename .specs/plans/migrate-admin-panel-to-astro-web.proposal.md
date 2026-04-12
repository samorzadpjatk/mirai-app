---
title: "Migrate Admin Panel to Astro Web"
type: proposal
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-migrate-admin-panel-to-astro-web/proposal.md"
---

## Why

The admin panel is currently embedded in the React Native mobile app (`apps/native/src/app/(tabs)/admin/`), which limits accessibility and creates maintenance overhead. Admin features require a desktop-friendly interface with better UX for data management tasks. Separating the admin panel into a dedicated Astro-based web application will provide better tooling, improved performance, and easier deployment while maximizing code reuse from existing packages (`@mirai-app/auth`, `@mirai-app/trpc`, etc.).

## What Changes

- Extract entire admin panel from React Native app into new Astro web application
- Create new `apps/admin-web` directory with Astro skeleton and configuration
- Migrate all admin routes, components, and hooks to web-compatible implementations
- Configure shared package imports (`@mirai-app/auth`, `@mirai-app/trpc`, `@mirai-app/db`, `@mirai-app/supabase`) for web environment
- Adapt React Native components (modals, cards, forms) to web-native equivalents
- Set up authentication flow using existing `@mirai-app/auth` package
- Configure tRPC client for web environment using `@mirai-app/trpc`
- Create web-specific routing structure matching existing admin functionality
- Remove admin panel code from React Native app after successful migration

## Capabilities

### New Capabilities

- `astro-web-skeleton`: Astro project setup with TypeScript, routing, shared package integration, and monorepo configuration
- `admin-auth-web`: Web-based authentication using existing `@mirai-app/auth` package adapted for browser environment
- `admin-panel-pages`: Core admin pages (users, groups, challenges, rewards, notifications, schedules, transactions, coins, activities) ported to Astro/React
- `admin-component-migration`: Migration of admin-specific React Native components (cards, modals, forms) to web-compatible React components
- `trpc-web-client`: tRPC client configuration for Astro with proper server/client boundaries

### Modified Capabilities

## Impact

**Affected Code:**

- `apps/native/src/app/(tabs)/admin/` - entire directory to be removed
- `apps/native/src/components/admin/` - components to be migrated and removed
- `apps/native/src/hooks/admin/` - hooks to be adapted for web and removed

**New Code:**

- `apps/admin-web/` - new Astro application
- Monorepo configuration in `turbo.json` and root `package.json`

**Dependencies:**

- Add Astro and web-specific dependencies to new admin-web package
- Reuse existing packages: `@mirai-app/auth`, `@mirai-app/trpc`, `@mirai-app/db`, `@mirai-app/supabase`, `@mirai-app/shared`
- May require adapting package exports for web environment compatibility

**Systems:**

- Deployment: New web application requires separate deployment pipeline
- Backend: No changes to tRPC server or database schema
- Mobile app: Reduced bundle size and simplified navigation after admin removal
