# Travel Champ — Agency self-serve onboarding

## Summary

Reusable reference for building a Vite + React + React Router dashboard where travel-agency owners sign up via Supabase email OTP, create an organization (with slug and trial), manage staff invites, and create org-scoped trips. Covers the matching oRPC/Hono backend, PGLite transaction tests, and Playwright E2E flows.

## When to use

- Adding self-serve B2B signup to a Travel Champ dashboard sprint.
- Implementing an `organization` router with owner/staff/roles.
- Wiring React Query to oRPC in a Vite SPA with protected routes.
- Writing PGLite-backed router tests or Playwright E2E coverage for OTP/onboarding/trips/staff-invite flows.

## Key resources

- Supabase `signInWithOtp` reference: https://supabase.com/docs/reference/javascript/auth-signinwithotp
- Supabase passwordless/OTP guide: https://supabase.com/docs/guides/auth/auth-email-passwordless?queryGroups=language&language=js
- Supabase admin `inviteUserByEmail`: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
- Supabase custom claims / RBAC: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- oRPC getting started: https://orpc.unnoq.com/docs/getting-started
- oRPC Hono adapter doc: https://github.com/dinwwwh/orpc/blob/main/apps/content/docs/adapters/hono.md
- TanStack Query React overview: https://tanstack.com/query/latest/docs/framework/react/overview
- React Router v6 feature overview: https://reactrouter.com/6.30.4/start/overview
- React Router library routing: https://reactrouter.com/start/library/routing
- Hono middleware guide: https://hono.dev/docs/guides/middleware
- Playwright writing tests: https://playwright.dev/docs/writing-tests
- Playwright page object models: https://playwright.dev/docs/pom
- PGLite API (transactions): https://pglite.dev/docs/api
- Vite env and mode: https://vitejs.dev/guide/env-and-mode
- `slugify` slug library: https://github.com/sindresorhus/slugify
- date-fns `formatDistanceToNow`: https://date-fns.org/v3/docs/formatDistanceToNow

## Common patterns

### 1. Self-serve Supabase OTP signup

Use the anon-client `signInWithOtp` for both sign-up and sign-in. Verify the code with `verifyOtp`. Set `shouldCreateUser: false` only when you want to reject unknown emails (not the default owner flow).

```ts
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${window.location.origin}/verify` },
});
```

On `/verify`:

```ts
const { data, error } = await supabase.auth.verifyOtp({
  email,
  token: code,
  type: 'email',
});
```

### 2. Staff email invite + OTP acceptance

Send the invite server-side with a Supabase service-role admin client (`inviteUserByEmail`), embedding an `organizationId` and invite token in the `redirectTo` URL or email metadata. The accept endpoint validates the invite record, then inserts the `organizationMembers` row with `role=STAFF` and `acceptedAt=NOW()`.

### 3. Organization router in oRPC/Hono

Split the organization router into `queries.ts`, `mutations.ts`, and `utils.ts` (project convention for >1000-line routers). Build procedures like:

```ts
const orgProcedure = protectedProcedure
  .use(async ({ context, next }) => {
    const member = await db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.userId, context.user.id),
    });
    if (!member) throw new ORPCError('FORBIDDEN');
    return next({ context: { ...context, member } });
  });
```

`createOrganization` inserts the org, sets `ownerUserId` to the creating user, `planTier='STARTER'`, and `trialEndsAt = now + 14 days`.

### 4. Slug normalization

```ts
import slugify from 'slugify';

function orgSlugFromName(name: string, suffix?: string) {
  const base = slugify(name, { lower: true, strict: true }).slice(0, 60);
  return suffix ? `${base}-${suffix}` : base;
}
```

Always check uniqueness with a DB query; append a short random suffix on collision. Enforce a unique index on `organizations.slug`.

### 5. React Query + oRPC in Vite

Create an oRPC client with a fetch link that injects the Supabase session token:

```ts
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

export const orpc = createORPCClient(
  new RPCLink({
    url: import.meta.env.VITE_API_URL,
    headers: async () => ({
      Authorization: `Bearer ${await getSupabaseToken()}`,
    }),
  })
);
```

Use the React Query integration in components:

```tsx
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery(orpc.organization.getMyOrganization.queryOptions());
```

### 6. Protected React Router routes

```tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenSkeleton />;
  if (!session) return <Navigate to="/signup" state={{ from: location }} replace />;
  return children;
}
```

Wrap dashboard routes under a `/` layout route that renders the protected layout + trial banner.

### 7. Trial banner

Read `organization.trialEndsAt`, compute remaining time with `formatDistanceToNow(trialEndsAt, { addSuffix: true })` or `Math.max(0, differenceInDays(trialEndsAt, new Date()))`. Show a dismissible banner when `trialEndsAt > now`.

### 8. Playwright E2E for OTP flows

Use API helpers / test-inbox webhooks to extract the OTP code, then fill the verify form. Create page objects for `SignupPage`, `OnboardingPage`, `TripsPage` to keep flows readable.

### 9. PGLite transaction tests

```ts
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

const pg = new PGlite();
const db = drizzle(pg);

afterEach(async () => {
  await pg.query('ROLLBACK');
});

test('creates organization', async () => {
  await pg.query('BEGIN');
  // seed user...
  const result = await caller.organization.createOrganization({ name: 'Alpine Ski School' });
  expect(result.slug).toMatch(/^alpine-ski-school/);
});
```

## Pitfalls & mitigations

| Pitfall | Mitigation |
|---|---|
| Supabase email template sends a magic link instead of an OTP if both `{{ .Token }}` and `{{ .ConfirmationURL }}` are present. | Use **only** `{{ .Token }}` for OTP flows; check the template in Supabase Studio before testing. |
| Storing `organizationId` directly in the Supabase access-token custom claim bloats the JWT and can go stale. | Keep membership in the database; resolve it from `context.user.id` in a middleware procedure. |
| `signInWithOtp` auto-creates the user if `shouldCreateUser` is true (default). | Default is correct for self-serve owners; for staff invites, validate the invite token before completion so the new user can only join the intended org. |
| Slug collisions from similar names produce confusing DB unique errors. | Pre-check for the slug and append a random 4-char suffix; keep names in a human column separate from the URL slug. |
| Org-scoped queries forget the membership check and leak cross-org data. | Add a single `orgProcedure` middleware that resolves the user's current membership and short-circuits with `FORBIDDEN`; reuse it for every org-scoped procedure. |
| React Query cache shows data for the previous org after switching org or logging out. | Include `organizationId` in query keys and call `queryClient.clear()` on logout / org switch. |
| Vite env vars not visible in the dashboard build. | Prefix public vars with `VITE_`; read them with `import.meta.env.VITE_*` and type `vite-env.d.ts`. |
| Playwright tests fail because the OTP email arrives asynchronously. | Increase `expect.toPass` retries or expose a test-only endpoint that returns the latest OTP code. |
| PGLite tests leave state between runs. | Wrap each test in `BEGIN ... ROLLBACK` using `pg.transaction()` or explicit SQL in `beforeEach`/`afterEach`. |

## Quick commands / snippets

### Send OTP (owner self-serve)

```ts
const { error } = await supabase.auth.signInWithOtp({ email });
```

### Verify OTP

```ts
const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
```

### Protected org procedure middleware

```ts
export const orgProcedure = protectedProcedure.use(async ({ context, next }) => {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.ownerUserId, context.user.id),
  });
  if (!org) throw new ORPCError('FORBIDDEN');
  return next({ context: { ...context, org } });
});
```

### React Router protected route wrapper

```tsx
<Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
  <Route path="trips" element={<Trips />} />
  <Route path="trips/new" element={<TripsNew />} />
  <Route path="staff" element={<Staff />} />
</Route>
```

### oRPC + React Query usage

```tsx
const { data: org } = useQuery(orpc.organization.getMyOrganization.queryOptions());
const createTrip = useMutation(orpc.trip.createTrip.mutationOptions());
```

### Slug + collision check

```ts
async function uniqueOrgSlug(name: string) {
  let slug = slugify(name, { lower: true, strict: true }).slice(0, 60);
  let attempts = 0;
  while (await db.query.organizations.findFirst({ where: eq(organizations.slug, slug) })) {
    attempts += 1;
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    if (attempts > 10) throw new Error('Unable to generate unique slug');
  }
  return slug;
}
```

### Playwright OTP helper

```ts
export async function getLatestOtp(email: string) {
  const res = await fetch(`${process.env.TEST_API}/test-inbox/${email}`);
  const { code } = await res.json();
  return code;
}
```
