---
title: S4 — Add agency white-label branding and challenge template library
depends_on: [.specs/tasks/draft/travel-champ-s3-dashboard-analytics-admin-crud.feature.md]
---

## Initial User Prompt

Add white-label support so agencies can brand the traveler app from the dashboard. Build a challenge template library with 5 pre-built packs (40 templates) that agencies can clone into any trip with one click.

## Description

Sprint 4 turns the generic Travel Champ app into a brandable agency experience and accelerates trip setup. Agencies configure brand colors, logo, and custom domain in the dashboard; the native traveler app fetches this branding at runtime and applies it. A template library seeded with 40 realistic challenges across 5 trip types (City Break, Adventure, Cruise, Ski, Festival) lets agencies populate trips instantly via a clone-to-trip action.

**Scope**:
- Included: Org branding columns, dashboard branding settings, `/api/branding/:slug` endpoint, custom domain resolution middleware, native runtime theme loader, `challengeTemplates` + `challengeTemplatePacks` schema + seed, template clone router + dashboard UI.
- Excluded: Multi-app store distribution under multiple brands (single app, runtime branding only).

## User Scenarios

1. **Primary Flow**: Agency owner sets primary color to `#FF6B35` and logo in dashboard → native app launched with `EXPO_PUBLIC_ORG_SLUG=agency-slug` shows those colors.
2. **Alternative Flow**: Owner browses "Adventure Tour Challenge Pack" → clicks "Clone to Trip" → 8 challenges appear in target trip with start times offset from trip start.
3. **Error Handling**: Unknown `orgSlug` falls back to default Travel Champ theme; malformed custom domain returns default branding.

## Architecture Overview

### Solution Strategy

- **Schema additions**:
  - `organizations.brandPrimaryColor`, `brandSecondaryColor`, `logoPath`, `customDomain`, `travelerAppTheme`.
  - `challengeTemplates` (individual challenge blueprint).
  - `challengeTemplatePacks` (named collection of template IDs + trip type).
- **Backend endpoint**: `GET /api/branding/:slug` (custom Hono route) returning JSON branding config.
- **Custom domain**: `identifyOrg` middleware resolves org from `Host` header or `?orgSlug=`.
- **Native theme loader**: Fetch `/api/branding/:slug.json` on startup, cache 24h in AsyncStorage, apply via React Context; fallback to default.
- **Template clone**: `template.clonePackToTrip({tripId, packId})` creates `challenges` from templates, applying `defaultStartOffsetMin` relative to `trip.startDate`.

### Key Architectural Decisions

1. **Runtime branding (not separate builds)**: Faster to launch; single app binary.
2. **JSON theme config on CDN/Hono**: Native app needs network access at first launch, then cached.
3. **Templates as immutable blueprints**: Cloned challenges become independent rows; edits do not affect the template pack.

### Expected Changes

| Type | Path | Change |
|---|---|---|
| Modify | `packages/db/src/schema/organizations.ts` | add branding columns |
| Create | `packages/db/src/schema/challengeTemplates.ts` | templates + packs |
| Modify | `packages/db/src/schema/enums.ts` | add `tripTypeEnum` |
| Create | `apps/backend-server/src/middleware/identifyOrg.ts` | org resolution |
| Create | `apps/backend-server/src/routes/branding.ts` | branding endpoint |
| Create | `packages/orpc/src/api/routers/template/` | list + clone |
| Create | `apps/native/src/branding/runtimeTheme.ts` | theme loader |
| Modify | `apps/native/src/app/_layout.tsx` | apply theme |
| Create | `apps/dashboard/scripts/seedTemplates.ts` | 5 packs / 40 templates |
| Create | `apps/dashboard/src/pages/SettingsBranding.tsx` | branding form |
| Create | `apps/dashboard/src/pages/Templates.tsx` | template library |

## Implementation Process

### Phase 1: White-label schema + backend (8h)
- **Step 1.1**: Extend `organizations` with branding columns; add `tripTypeEnum`.
- **Step 1.2**: Create `identifyOrg` middleware resolving from Host header or query.
- **Step 1.3**: Create custom Hono route `/api/branding/:slug`.
- **Step 1.4**: Write tests (PGLite + curl).

### Phase 2: Native runtime theme (4h)
- **Step 2.1**: Create `runtimeTheme.ts` loader with AsyncStorage caching.
- **Step 2.2**: Wire theme context into native app `_layout.tsx`.
- **Step 2.3**: Add E2E asserting app loads with agency brand colors.

### Phase 3: Template schema + seed (4h)
- **Step 3.1**: Create `challengeTemplates.ts` and `challengeTemplatePacks.ts` schema.
- **Step 3.2**: Write PGLite tests.
- **Step 3.3**: Seed 5 packs × 8 = 40 templates with realistic content.

### Phase 4: Template router + clone (6h)
- **Step 4.1**: Create `template` router (listPacks, getPack, clonePackToTrip).
- **Step 4.2**: Implement clone logic applying start offsets.
- **Step 4.3**: Add PGLite test asserting 8 challenges with correct start times.

### Phase 5: Dashboard UI (6h)
- **Step 5.1**: Build `SettingsBranding.tsx` with color pickers, logo upload, domain input, preview.
- **Step 5.2**: Build `Templates.tsx` pack grid + clone modal.
- **Step 5.3**: Add E2E for clone-to-trip flow.

## Verification

### Functional verification
- Dashboard branding update persists and reflects in `/api/branding/:slug`.
- Native app launched with `EXPO_PUBLIC_ORG_SLUG=agency-slug` applies brand colors.
- Custom domain resolves to correct org branding.
- Cloning a pack creates exactly 8 challenges in target trip with `startTime = trip.startDate + defaultStartOffsetMin`.
- Unknown org slug falls back to default theme.

### Test coverage
- PGLite tests for template clone logic.
- Unit test for native runtime theme loader + fallback.
- Curl test for branding endpoint and custom domain.
- Playwright E2E for dashboard clone-to-trip.
- E2E for native white-label theme application.

## Files touched (estimated)

- `packages/db/src/schema/organizations.ts`
- `packages/db/src/schema/challengeTemplates.ts` (NEW)
- `packages/db/src/schema/enums.ts`
- `apps/backend-server/src/middleware/identifyOrg.ts` (NEW)
- `apps/backend-server/src/routes/branding.ts` (NEW)
- `packages/orpc/src/api/routers/template/` (NEW)
- `apps/native/src/branding/runtimeTheme.ts` (NEW)
- `apps/native/src/app/_layout.tsx`
- `apps/dashboard/scripts/seedTemplates.ts` (NEW)
- `apps/dashboard/src/pages/SettingsBranding.tsx` (NEW)
- `apps/dashboard/src/pages/Templates.tsx` (NEW)
- `apps/dashboard/src/components/ClonePackModal.tsx` (NEW)
