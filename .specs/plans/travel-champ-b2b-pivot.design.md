# Travel Champ — B2B SaaS Pivot Plan

> Strategic design for converting MIRAI/PJApp into a B2B SaaS platform for small/mid-sized travel agencies.
> Positioning: **During-trip engagement platform** (not loyalty, not booking).
> Methodology: SDD + Agile (2-week sprints).
> Status: Design approved; implementation tasks ready for `/sdd:plan` refinement.

## Goal

Build Travel Champ as a B2B SaaS that lets travel agencies turn their tours into gamified experiences, keeping travelers engaged during the trip with challenges, rewards, leaderboards, and live activity — increasing repeat bookings and differentiating agencies from competitors.

## Market Rationale

- Gamified Tourism Experiences market: $2.3B (2024) → $4.3B (2032), 17.5% CAGR (HTF Market Intelligence).
- SME gamification adoption growing at 27.65% CAGR (Mordor Intelligence).
- Existing MIRAI/PJApp codebase already has ~70% of B2B needs: challenges engine, virtual economy, groups, activity feed, live map, notifications, sponsors, admin screens, audit, oRPC + Expo + Hono + Drizzle stack.
- Competitor gap: Kangaroo Rewards, Talon.One, Enable3, adivaha, Trawex, PERS are pre/post-booking loyalty engines. **Travel Champ owns the during-trip engagement wedge** — live challenges, scavenger hunts, QR/location challenges, peer voting, real-time map.

## Scope

### In scope
- Rename `@mirai-app/*` → `@travel-champ/*`.
- License change: AGPL-3.0 → proprietary.
- Multi-tenancy (organizations/agencies).
- Stripe billing & subscription (3 tiers + overage).
- White-label traveler app branding (colors, logo, custom domain).
- Vite + React SPA dashboard for agency owners.
- Challenge template library (5 packs × 8 = 40 templates).
- i18n EN+PL via backend-driven translation maps.
- Strip native app admin screens; keep only on-site staff tools + traveler-facing tabs.
- Post-trip summary with repeat-booking CTA.

### Out of scope
- Building a booking engine (integrate later via Rezdy/FareHarbor webhooks).
- Replacing CRM (export engagement data).
- Freemium tier (14-day trial only).
- Global launch before EU validation.

## Non-Goals

- Do not rebuild challenge/reward/group routers from scratch — reuse existing oRPC routers.
- Do not add Next.js or new frameworks — dashboard uses existing monorepo stack (Vite + React + Hono).
- Do not change core gamification mechanics — only repackage for B2B multi-tenancy.
- Do not store i18n strings in files on frontend — backend is single source of truth.

## Architecture Overview

### Stack
- **Traveler app**: Expo React Native (existing).
- **Dashboard**: Vite + React + TypeScript SPA with `react-router-dom`; served by Hono backend in prod.
- **Backend**: Hono + oRPC + PostgreSQL + Drizzle ORM + Supabase auth.
- **Billing**: Stripe Checkout + Stripe Webhooks + metered overage billing.
- **Tooling**: NX + Bun (existing).

### New components
1. **`packages/db/src/schema/organizations.ts`** — agencies as tenants.
2. **`packages/db/src/schema/organizationMembers.ts`** — owner/admin/staff membership.
3. **`packages/db/src/schema/billing.ts`** — subscriptions, usageEvents, invoices.
4. **`packages/db/src/schema/challengeTemplates.ts`** — reusable challenge + pack templates.
5. **`packages/orpc/src/api/middleware/requireOrgMembership.ts`** — org-scoped access control.
6. **`packages/orpc/src/api/middleware/requirePlanQuota.ts`** — tier limit enforcement.
7. **`packages/orpc/src/api/middleware/requireActiveSubscription.ts`** — trial/subscription gating.
8. **`packages/orpc/src/api/routers/organization/`** — org CRUD + staff invite.
9. **`packages/orpc/src/api/routers/billing/`** — checkout, subscription, usage, invoices.
10. **`packages/orpc/src/api/routers/analytics/`** — org KPIs and engagement metrics.
11. **`packages/orpc/src/api/routers/template/`** — template pack listing and cloning.
12. **`packages/orpc/src/api/routers/i18n/`** (custom Hono route) — backend translation maps.
13. **`packages/orpc/src/api/routers/travelerProfile/`** — cross-trip carry-over.
14. **`apps/dashboard/`** — Vite SPA replacing `apps/seed`.
15. **`apps/backend-server/src/webhooks/stripe.ts`** — Stripe lifecycle webhook.
16. **`apps/backend-server/src/middleware/identifyOrg.ts`** — custom domain resolution.

### Data model changes
- `organizations` (new) — tenant root.
- `organizationMembers` (new) — user↔org↔role.
- `trips.organizationId` (added) — trip scoped to agency.
- `users.organizationId` (added) — agency staff linked to org.
- `subscriptions`, `usageEvents`, `invoices` (new) — billing.
- `challengeTemplates`, `challengeTemplatePacks` (new) — template library.
- `travelerProfiles` (new) — cross-trip carry-over.

### Security model
- All trip-scoped routers verified to belong to caller's organization (`requireOrgMembership`).
- Plan quotas checked before creation mutations.
- Trial/subscription gates write mutations.
- Internal/public endpoint split preserved for notification workers.

## Pricing

Hybrid tiered + traveler usage:

| Plan | Monthly | Annual (−20%) | Trips | Travelers/mo | Overage |
|---|---|---|---|---|---|
| Starter | €89 | €855 | 3 | 150 | €0.75 |
| Growth | €249 | €2,390 | 15 | 1,000 | €0.50 |
| Pro | €599 | €5,750 | Unlimited | 5,000 | €0.40 |
| Enterprise | Custom | Custom | Custom | Custom | Custom |

14-day trial; 25% discount for multi-year.

## User Scenarios

### Scenario 1: Agency owner signs up and configures first tour
1. Agency owner visits dashboard, enters email, verifies OTP.
2. Creates organization and lands on trip list.
3. Creates a 7-day tour with dates, description, hero image.
4. Clones "Adventure Tour Challenge Pack" — 8 challenges appear pre-scheduled.
5. Invites 2 staff members via email.

### Scenario 2: Traveler participates in a trip
1. Traveler receives trip invite link, signs in via OTP.
2. Joins a group, sees challenges, earns coins.
3. Submits a photo for peer-voted challenge.
4. Checks leaderboard and live map during trip.
5. After trip, sees summary with badges and repeat-booking CTA.

### Scenario 3: Agency owner monitors ROI
1. Owner opens dashboard home.
2. Sees KPIs: active trips, travelers this month, challenge completion rate.
3. Drills into a trip: per-day engagement, top travelers.
4. Exports engagement data or upgrades plan as travelers grow.

## Sprint Plan

| Sprint | Weeks | Outcome | Demo |
|---|---|---|---|
| S0 | 1-2 | Rename + multi-tenancy + Vite dashboard skeleton | "We're now Travel Champ" |
| S1 | 3-4 | Agency signup + trip creation + staff invite | "First agency onboarded" |
| S2 | 5-6 | Stripe billing + usage metering | "First paying customer possible" |
| S3 | 7-8 | Dashboard KPIs + admin CRUD migration | "Agency owner manages everything" |
| S4 | 9-10 | White-label + template library | "Branded sales demo" |
| S5 | 11-12 | i18n EN+PL + native on-site tools + post-trip | "EU-market ready" |
| S6+ | 13-20 | Booking integrations + analytics pipeline | Post-MVP |

Critical path: S0 → S1 → S2 → S3 → S5 (10 weeks). S4 can parallel S3.

## Atomic Task Files

The implementation is decomposed into the following CEK SDD task files in `.specs/tasks/draft/`.
Each task is refined with `/sdd:plan` before moving to `.specs/tasks/todo/`.

1. **`travel-champ-s0-rename-multitenancy.feature.md`** — foundation: rename, schema, middleware, Vite dashboard skeleton, seed.
2. **`travel-champ-s1-agency-onboarding.feature.md`** — organization/trip routers, signup flow, trip CRUD UI, staff invite.
3. **`travel-champ-s2-billing-subscription.feature.md`** — Stripe webhooks, billing routers, plan quota, usage metering + overage billing, trial gating.
4. **`travel-champ-s3-dashboard-analytics-admin-crud.feature.md`** — analytics router, KPI dashboard, traveler roster, admin CRUD migration from native to dashboard.
5. **`travel-champ-s4-white-label-templates.feature.md`** — white-label config, branding endpoint, native runtime theme, template schema + seed + clone router + UI.
6. **`travel-champ-s5-i18n-native-onsite.feature.md`** — backend i18n route, extract strings, useTranslations hook, strip native admin + add staff tools, traveler profiles, post-trip summary.

## Rollout & Verification

- Each sprint is a 2-week SDD cycle: spec → `/sdd:plan` refinement → implementation → LLM-as-Judge verification → demo.
- `nx run-many -t build && nx run-many -t typecheck && nx run-many -t test` must stay green between sprints.
- Every new router/schema has a failing PGLite test first (TDD).
- Every dashboard flow has a Playwright E2E test.

## Deliverables

- `.specs/plans/travel-champ-b2b-pivot.design.md` (this document).
- Six atomic task files in `.specs/tasks/draft/`.
- OMO plan retained as `.omo/plans/travel-champ-b2b-pivot.md` for reference.

## Assumptions

- Stripe account set up with products/prices for 3 plans + metered overages.
- Supabase project configured for OTP auth in production.
- Domain `travelchamp.app` available for custom-domain feature.
- Existing tests green at start of S0.
