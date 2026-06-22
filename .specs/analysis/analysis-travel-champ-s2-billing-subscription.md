# Impact Analysis: S2 — Travel Champ Billing & Subscriptions

**Task:** `.specs/tasks/draft/travel-champ-s2-billing-subscription.feature.md`  
**Depends on:** `.specs/tasks/draft/travel-champ-s1-agency-onboarding.feature.md`  
**Author:** autonomous agent  
**Date:** 2026-06-21  
**Scratchpad:** `.specs/scratchpad/54f95b0e262a74b0.md`

## 1. Executive Summary

Sprint 2 turns Travel Champ into a monetizable SaaS by integrating Stripe Checkout and webhooks, enforcing plan quotas (Starter/Growth/Pro), metering daily usage, billing monthly overages, and exposing a dashboard billing UI. The sprint introduces new database tables, a dedicated billing router, two new oRPC middlewares, a Hono webhook receiver, notification-sender cron jobs, and dashboard pages.

Because the repository currently lacks S1 outcomes (`apps/dashboard`, organization tables, org-scoped procedures, `requireOrgMembership`), S2 cannot be built as-is without first landing S1.

| Risk Area | Level | Rationale |
|---|---|---|
| Dependency on S0/S1 | **High** | S2 assumes `apps/dashboard`, organization schema, org context, and org-scoped `trip.create` already exist. None are present. |
| Stripe webhooks & secrets | **High** | Signature verification on raw body is security-critical; mismount or leaked secret breaks subscription state. |
| Quota middleware on core flows | High | Any bug in `requirePlanQuota` blocks legitimate trip/staff creation or allows over-limit writes. |
| Metered overage accuracy | Medium-High | Incorrect `MAX(dailyTravelers)` computation directly affects customer invoices. |
| Dashboard billing UI | Medium | Pure UI once endpoints exist, but depends on S1 routing/auth scaffold. |

## 2. Affected File Counts

Counts are **S2-specific**; they exclude the unresolved S0/S1 prerequisites that must land first.

| Type of Change | Count | Notes |
|---|---|---|
| **Create** | ~24 | Billing schema, enums/migrations, Stripe webhook route, billing router (queries/mutations/types/index/tests), two middlewares, two notification-sender jobs + tests, two dashboard pages, webhook tests, PGLite tests. |
| **Modify** | ~16 | Schema enums/index/relations, org schema additions (`organizations.*` stripe/plan fields), `root.ts`, `trip` router/mutations, `backend-server/server.ts`, backend/package.json, root/env examples, dashboard router/package.json, possibly `orpc.ts` context helpers. |
| **Delete** | 0 | No S2 deletions. S0 still owes `apps/seed/` removal. |

## 3. Files to Create (S2)

### 3.1 Backend — Billing schema

| File | Purpose |
|---|---|
| `packages/db/src/schema/billing.ts` | `subscriptions`, `usageEvents`, `invoices` tables with Drizzle definitions. |
| `packages/db/drizzle/...` | Generated migrations for new tables and enum changes. |

### 3.2 Backend — Stripe webhook

| File | Purpose |
|---|---|
| `apps/backend-server/src/webhooks/stripe.ts` | Hono route handler for `/webhooks/stripe`; raw-body `constructEvent`; handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`. |
| `apps/backend-server/src/__tests__/webhooks/stripe.test.ts` | Mock `constructEvent` and assert idempotent DB writes + 400 on bad signature. |

### 3.3 Backend — Billing router & middleware

| File | Purpose |
|---|---|
| `packages/orpc/src/api/routers/billing/index.ts` | Barrel exporting `billingRouter`. |
| `packages/orpc/src/api/routers/billing/queries.ts` | `getSubscription`, `getUsage`, `getInvoices`. |
| `packages/orpc/src/api/routers/billing/mutations.ts` | `createCheckoutSession`, `createBillingPortalSession`. |
| `packages/orpc/src/api/routers/billing/types.ts` | Shared Zod/input/output types. |
| `packages/orpc/src/api/routers/billing/__tests__/billing.pglite.test.ts` | PGLite tests mocking Stripe. |
| `packages/orpc/src/api/middleware/requirePlanQuota.ts` | Returns ORPCError `PAYMENT_REQUIRED` (HTTP 402) when `current + count > planLimit`. |
| `packages/orpc/src/api/middleware/requireActiveSubscription.ts` | Allows writes only if subscription active or trial not expired. |
| `packages/orpc/src/api/routers/__tests__/quota.middleware.pglite.test.ts` | Tests trip limit and traveler limit enforcement. |

### 3.4 Worker — Usage metering & overage billing

| File | Purpose |
|---|---|
| `apps/notification-sender/src/jobs/usageMeter.ts` | Nightly job: count active trips + travelers per org and insert `usageEvents`. |
| `apps/notification-sender/src/jobs/overageBiller.ts` | Monthly job: compute `MAX(dailyTravelers)` for prior period and call `stripe.subscriptionItems.createUsageRecord` for overage quantity. |
| `apps/notification-sender/src/__tests__/usageMeter.test.ts` | Assert correct daily counts with fixture orgs/trips/participants. |
| `apps/notification-sender/src/__tests__/overageBiller.test.ts` | Assert overage quantity and tier rate selection (Starter €0.75, Growth €0.50, Pro €0.40). |

### 3.5 Dashboard — Billing UI

| File | Purpose |
|---|---|
| `apps/dashboard/src/pages/Billing.tsx` | Plan card, usage progress bars, invoice table; calls `billing.getSubscription`, `billing.getUsage`, `billing.getInvoices`. |
| `apps/dashboard/src/pages/BillingUpgrade.tsx` | Three-tier pricing cards; calls `billing.createCheckoutSession` then redirects to Stripe. |
| `apps/dashboard/e2e/billing.spec.ts` | Playwright E2E: view usage, upgrade redirect mock. |

## 4. Files to Modify (S2)

### 4.1 Database schema

| File | Change |
|---|---|
| `packages/db/src/schema/enums.ts` | Add `subscriptionStatusEnum` (`trialing`, `active`, `past_due`, `canceled`, `incomplete`, `incomplete_expired`, `unpaid`, `paused`) and `usageMetricEnum` (`ACTIVE_TRIPS`, `TRAVELERS`). |
| `packages/db/src/schema/billing.ts` (relations) | Define `subscriptionsRelations`, `usageEventsRelations`, `invoicesRelations`. |
| `packages/db/src/schema/relations.ts` | Import/export billing relations; wire `organizations.subscriptions` / `organizations.invoices` relations. |
| `packages/db/src/schema/index.ts` | Export new billing tables and inferred types; add tables to `schemaTables`. |
| `packages/db/src/schema/organizations.ts` | Add `stripeCustomerId`, `stripeSubscriptionId` (or rely on `subscriptions` table), `planTier` / `trialEndsAt` if not added by S1. S2 reads trial state from org. |

### 4.2 oRPC core

| File | Change |
|---|---|
| `packages/orpc/src/api/root.ts` | Import and mount `billingRouter` under `appRouter.billing`. |
| `packages/orpc/src/api/routers/trip/index.ts` | Change `create` from `adminProcedure` to org-protected procedure, chain `requireActiveSubscription` + `requirePlanQuota('trips', 1)`. |
| `packages/orpc/src/api/routers/trip/mutations.ts` | Accept `organizationId` in `createTrip` and pass it through (S1 work). |
| `packages/orpc/src/api/routers/organization/mutations.ts` | Add `requirePlanQuota('travelers', 1)` or per-seat check on `inviteStaff` (S1 file). |

### 4.3 Backend server

| File | Change |
|---|---|
| `apps/backend-server/src/server.ts` | Register `app.post('/webhooks/stripe', stripeWebhook)` **before** the oRPC catch-all so raw body is preserved. |
| `apps/backend-server/src/index.ts` | Ensure Stripe env vars are loaded/checked at startup (optional but recommended). |
| `apps/backend-server/package.json` | Add `stripe` dependency. |

### 4.4 Environment variables

| File | Change |
|---|---|
| `environment/.env.example` | Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, plan price IDs, metered price IDs. |
| `apps/backend-server/.env.example` | Same Stripe vars for local backend. |
| `apps/notification-sender/.env.example` | Add Stripe vars if overage job runs in worker; otherwise reuse backend env. |

### 4.5 Dashboard skeleton (S1 files)

| File | Change |
|---|---|
| `apps/dashboard/src/router.tsx` | Add `/billing` and `/billing/upgrade` routes with org-auth guard. |
| `apps/dashboard/src/layouts/DashboardLayout.tsx` | Add "Billing" nav link. |
| `apps/dashboard/package.json` | Add `@stripe/stripe-js` / `react-router-dom` if not already present. |

## 5. Files Potentially to Delete

| File/Path | Reason |
|---|---|
| `apps/seed/` | Deletion belongs to S0, not S2. If still present when S2 starts, it is an inherited blocker. |

## 6. Key Integration Points

| Component | Path | Role in S2 |
|---|---|---|
| Stripe raw-body webhook | `apps/backend-server/src/webhooks/stripe.ts` + `server.ts` | Receives Stripe events, verifies signature with raw payload, updates `subscriptions` / `invoices` rows. Must not be processed by oRPC JSON middleware. |
| Organization context | `packages/orpc/src/api/orpc.ts` (`protectedProcedure`) | Must expose `organizationId` and subscription status so billing/quota middleware can scope DB queries. Requires S1. |
| Quota middleware | `packages/orpc/src/api/middleware/requirePlanQuota.ts` | Mounted on `trip.create` and staff invites; returns HTTP 402 when plan cap exceeded. |
| Active subscription middleware | `packages/orpc/src/api/middleware/requireActiveSubscription.ts` | Blocks writes when trial expired and no active subscription. |
| Billing router | `packages/orpc/src/api/routers/billing/` | Exposes checkout, subscription, usage, and invoice procedures to dashboard clients. |
| Usage metering cron | `apps/notification-sender/src/jobs/usageMeter.ts` | Records daily `ACTIVE_TRIPS` and `TRAVELERS` per org into `usageEvents`. |
| Overage billing job | `apps/notification-sender/src/jobs/overageBiller.ts` | Monthly Stripe metered usage report for traveler overage. |
| Dashboard data fetching | `apps/dashboard/src/pages/Billing.tsx` / `BillingUpgrade.tsx` | React Query + oRPC client reads plan/usage/invoices and initiates Stripe Checkout. |

## 7. Dependency / Blocker Detail

S2 must not start before S1 acceptance criteria are met:

1. `apps/dashboard/` Vite SPA scaffold exists with auth router and `@mirai-app/orpc` client.
2. `packages/db/src/schema/organizations.ts` and `organizationMembers.ts` exist.
3. `trips` and `users` have `organizationId` columns; `trips.organizationId` is NOT NULL.
4. `packages/orpc/src/api/middleware/requireOrgMembership.ts` exists and is wired on org-scoped routers.
5. `protectedProcedure` context includes `dbUser.organizationId` and org role.
6. `trip.create` is already org-role-protected (not global `adminProcedure`).
7. `apps/seed/` is removed.

If S1 is not applied, S2 code will reference non-existent schema, packages, and middleware and will fail type-check/tests.

## 8. Verification Plan

| Area | How |
|---|---|
| Billing schema | PGLite CRUD tests for `subscriptions`, `usageEvents`, `invoices`. |
| Stripe webhook | Unit test with mocked `constructEvent`; verify DB side effects and 400 on bad signature. |
| Quota enforcement | PGLite test: Starter org with 3 trips receives HTTP 402 on 4th trip; same for traveler cap. |
| Active subscription gating | PGLite test: expired trial blocks writes but allows reads. |
| Usage meter | Notification-sender test asserts `usageEvents` rows inserted with correct counts per org. |
| Overage biller | Notification-sender test asserts `createUsageRecord` called with expected quantity and tier rate. |
| Dashboard UI | Playwright E2E mocks Stripe redirect for upgrade flow. |
| Type safety / build | `nx run-many -t typecheck` and `nx run-many -t build` exit 0. |

## 9. Risk Detail

| Risk | Likely Failure Mode | Mitigation |
|---|---|---|
| S1 not applied | S2 references missing org schema/middleware/dashboard; implementation and tests fail. | Block S2 until S1 acceptance criteria pass; re-run impact analysis after S1. |
| Raw body consumed before Stripe webhook | `constructEvent` fails signature verification because Hono/oRPC parsed JSON first. | Mount `/webhooks/stripe` before the oRPC catch-all; use `c.req.raw.text()` and pass raw string to Stripe. |
| Webhook secret mismatch | Stripe events rejected or, worse, accepted without verification if `verify=false` in dev. | Always verify in all environments; store `STRIPE_WEBHOOK_SECRET` per endpoint. |
| Quota counting race | Two concurrent `trip.create` calls both pass the check and exceed the cap. | Use database-level serialization/unique constraints or `SELECT … FOR UPDATE` around quota check + insert in a transaction. |
| Wrong overage quantity | Monthly `MAX(dailyTravelers)` is computed incorrectly (e.g., sum vs max). | Add unit tests with fixture fixture: Starter with 200 travelers = 50 overage × €0.75. |
| Trial expiry edge cases | Writes exactly at trial expiration boundary allowed/disallowed inconsistently. | Use `trialEndsAt > NOW()` comparison and consistent server time (UTC). |
| Missing dashboard scaffold | Cannot create `Billing.tsx` because `apps/dashboard` does not exist. | Complete S1 dashboard skeleton first. |
| Stripe metered price per plan | Overages billed at wrong tier rate after plan upgrade/downgrade. | Store `planTier` on subscription and invoice period; use subscription-period tier rate for overage job. |
