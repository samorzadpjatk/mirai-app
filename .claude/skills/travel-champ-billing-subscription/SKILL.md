# Travel Champ S2 — Billing & subscription integration

## Summary

Reusable guide for implementing Travel Champ Sprint 2: Stripe Checkout subscriptions, metered overage billing, webhook signature verification, plan quota enforcement, nightly usage metering, and the dashboard billing UI. Built for the MIRAI monorepo (Hono backend, oRPC routers, PGLite tests, React dashboard).

## When to use

- Adding Stripe Checkout + subscription lifecycle to a Hono/oRPC backend.
- Writing plan quota and active-subscription middleware.
- Creating cron jobs that record daily usage and report monthly overages to Stripe.
- Building a React billing/pricing page and invoice list.
- Writing PGLite tests that mock the Stripe SDK and assert DB side effects.

## Key resources (9)

| Topic | Resource |
|-------|----------|
| Stripe Checkout Sessions | <https://docs.stripe.com/checkout/quickstart?lang=node> |
| Checkout Session create API | <https://docs.stripe.com/api/checkout/sessions/create> |
| Subscription object | <https://docs.stripe.com/api/subscriptions/object> |
| Price object | <https://docs.stripe.com/api/prices/object> |
| Legacy usage records | <https://docs.stripe.com/billing/subscriptions/usage-based-legacy/recording-usage> |
| Modern meter events | <https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api> |
| Webhook quickstart | <https://docs.stripe.com/webhooks/quickstart> |
| Webhook testing CLI | <https://docs.stripe.com/webhooks/test> |
| Hono Request API | <https://hono.dev/docs/api/request> |

## Patterns

### 1. Checkout Session for plan upgrade

- Set `mode: 'subscription'` and pass one `line_items` entry per selected plan. Store the Stripe `price` IDs per tier in env vars.
- Use `client_reference_id` to map the session back to the internal organization/agency.
- Return `session.url` to the dashboard for redirect.

### 2. Plain Hono webhook route

- Do **not** put the Stripe webhook behind oRPC JSON parsing. Stripe requires the raw request body for signature verification.
- Read the body with `await c.req.text()` and verify with `Stripe.webhooks.constructEvent`.
- Handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
- Return 400 on signature/JSON errors; return 200 after idempotent DB updates.

### 3. Plan quota middleware

- `requirePlanQuota(metric, delta)` reads the org's current plan tier limits and current usage.
- Return HTTP 402 (`Payment Required`) when `current + delta > limit`.
- Keep the middleware separate from `requireActiveSubscription` so reads can be free while writes are gated.

### 4. Active subscription middleware

- Allow writes only when the org has an active subscription or an active trial (`subscriptionStatus === 'active' || trialEndsAt > now`).
- Trial expiry should block mutations but allow reads.

### 5. Nightly usage metering cron

- Run at 02:00 UTC. Insert one `usageEvents` row per org per day for `ACTIVE_TRIPS` and `TRAVELERS`.
- Store counts as snapshots; the overage job reads `MAX(daily TRAVELERS)` later.

### 6. Monthly overage billing

- Run at 03:00 UTC. For each org, compute `overage = maxDailyTravelers - planAllowance` for the prior billing period.
- Report the overage quantity once per period via `stripe.subscriptionItems.createUsageRecord({ action: 'set' })` so the final invoice reflects the peak.

### 7. Billing period math

```ts
import { startOfMonth, endOfMonth, addMonths, differenceInDays } from 'date-fns';

const now = new Date();
const periodStart = startOfMonth(addMonths(now, -1));
const periodEnd = endOfMonth(addMonths(now, -1));
```

### 8. Dashboard billing UI

- Plan card: tier name, status badge, trial/subscription dates, upgrade button.
- Usage bars: current / limit for trips and travelers.
- Invoice table: date, amount, currency, status, PDF link.
- Upgrade page: 3 tier cards with feature list; clicking a card calls `createCheckoutSession` and redirects to `session.url`.
- Optional: embed `<stripe-pricing-table pricing-table-id="...">` for a no-code upgrade page.

## Pitfalls & mitigations

| Pitfall | Mitigation |
|---------|------------|
| oRPC parser breaks Stripe webhook signature | Mount `/webhooks/stripe` as a plain `app.post` Hono route and use `c.req.text()`. |
| Duplicate events create duplicate subscriptions/invoices | Upsert on `stripeSubscriptionId`; use `ON CONFLICT` or `eq(id)` update. |
| Usage records reported daily create ever-increasing totals | Use `action: 'set'` once per billing period, or switch to modern meter events with idempotent `identifier`. |
| Webhook secret leaked in tests | Keep `STRIPE_WEBHOOK_SECRET` in `.env`; never commit test keys. |
| Trial expiry not checked on writes | Centralize `requireActiveSubscription` and run it before every mutation router. |
| Over-reporting travelers | Aggregate usage from your own `usageEvents` table, not live counts at invoice time. |
| Checkout cancellation leaves partial DB state | Only upsert subscription rows inside `checkout.session.completed`. |

## Quick snippets

### Create checkout session

```ts
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  client_reference_id: orgId,
  customer: org.stripeCustomerId ?? undefined,
  line_items: [{ price: planPriceId, quantity: 1 }],
  success_url: `${APP_URL}/billing?success=1`,
  cancel_url: `${APP_URL}/billing/upgrade?canceled=1`,
});
return { url: session.url };
```

### Verify webhook in Hono

```ts
app.post('/webhooks/stripe', async (c) => {
  const payload = await c.req.text();
  const sig = c.req.header('stripe-signature');
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig!, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return c.text('Invalid signature', 400);
  }
  switch (event.type) {
    case 'checkout.session.completed': {
      const cs = event.data.object as Stripe.Checkout.Session;
      await upsertSubscriptionFromCheckout(cs);
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscriptionStatus(sub);
      break;
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await syncInvoice(invoice);
      break;
    }
  }
  return c.text('ok', 200);
});
```

### Report monthly overage (legacy meter)

```ts
const overage = Math.max(0, maxTravelers - planAllowance);
if (overage > 0 && meteredSubscriptionItemId) {
  await stripe.subscriptionItems.createUsageRecord(meteredSubscriptionItemId, {
    quantity: overage,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'set',
  });
}
```

### Plan quota middleware

```ts
export const requirePlanQuota = (metric: 'trips' | 'travelers', delta = 1) =>
  middleware(async ({ ctx, next }) => {
    const limit = ctx.org.planLimits[metric];
    const current = await countCurrentUsage(ctx.org.id, metric);
    if (current + delta > limit) {
      throw new ORPCError('PLAN_LIMIT_EXCEEDED', { status: 402 });
    }
    return next();
  });
```

### Mock Stripe in PGLite tests

```ts
import { vi } from 'vitest';

const mockStripe = {
  checkout: { sessions: { create: vi.fn() } },
  subscriptionItems: { createUsageRecord: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
} satisfies Partial<Stripe.Stripe>;

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}));
```

### Usage cron skeleton

```ts
export async function usageMeter() {
  const orgs = await db.select().from(organizations);
  for (const org of orgs) {
    const activeTrips = await countActiveTrips(org.id);
    const travelers = await countTravelers(org.id);
    await db.insert(usageEvents).values([
      { orgId: org.id, metric: 'ACTIVE_TRIPS', value: activeTrips },
      { orgId: org.id, metric: 'TRAVELERS', value: travelers },
    ]);
  }
}
```
