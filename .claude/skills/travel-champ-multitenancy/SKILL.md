# Travel Champ Multi-Tenant Migration Skill

## Summary

Reusable reference for the Travel Champ B2B SaaS migration:
renaming the MIRAI/PJApp TypeScript monorepo from `@mirai-app/*` to `@travel-champ/*`,
re-licensing from AGPL-3.0 to proprietary, introducing an `organizations` tenant model in Drizzle,
locking every trip-scoped request behind org-isolation middleware in oRPC + Hono,
and replacing `apps/seed` with a Vite + React + react-router-dom dashboard SPA.

## When to use

- Sprint 0 or later sprints touching package scope, license, tenant schema, org middleware, or dashboard skeleton.
- Adding a new org-scoped entity or router that must inherit `requireOrgMembership`.
- Re-seeding demo agencies or backfilling legacy data into a sentinel organization.
- Standing up a new Vite + React SPA inside the Bun/NX monorepo.

## Key resources

### Monorepo rename & package tooling

- **Bun workspaces** — https://bun.sh/docs/install/workspaces
  - How `workspaces` in root `package.json` resolve `workspace:*` and package names.
- **pacwich / bun-workspaces example** — https://github.com/smorsic/pacwich
  - Zero-config workspace runner that orchestrates `package.json` scripts across Bun/pnpm/npm monorepos.
- **Nx project configuration** — https://nx.dev/reference/project-configuration
  - Nx reads `project.json` / `package.json`, merges scripts with targets, and depends on project names.
- **Nx `move` generator** — https://nx.dev/nx-api/workspace/generators/move
  - Moves a project and can rewrite `tsconfig.base.json` paths / import paths; useful as a reference when manually renaming projects.
- **npm `package.json` `license`** — https://docs.npmjs.com/cli/v10/configuring-npm/package-json#license
  - `license: "UNLICENSED"` or `"SEE LICENSE IN <file>"` for proprietary code.

### Multi-tenant Drizzle schema

- **Drizzle indexes & constraints** — https://orm.drizzle.team/docs/indexes-constraints
  - `index()`, `uniqueIndex()`, `unique()`, composite keys for tenant indexes.
- **Drizzle patterns / goodies** — https://orm.drizzle.team/docs/goodies
  - Helper patterns for table design and relations.
- **clean-stack multi-tenant SaaS boilerplate** — https://github.com/axelhamil/clean-stack
  - Bun + Hono + React 19 + TanStack + Drizzle + Postgres multi-tenant example with role/organization wiring.

### oRPC / Hono middleware & context

- **Middleware in oRPC** — https://orpc.unnoq.com/docs/middleware
  - `.use()` intercepts handlers and can guard/inject context.
- **Context in oRPC** — https://orpc.unnoq.com/docs/context
  - Initial context lets you pass request-scoped data (headers, user, orgId) into procedures.
- **Procedure & router docs** — https://orpc.unnoq.com/docs/procedure, https://orpc.unnoq.com/docs/router
  - Composition rules for chained middleware and router merging.
- **Hono middleware** — https://hono.dev/docs/guides/middleware
  - Execution order and `next()` semantics.
- **Hono `Context.set/get`** — https://hono.dev/docs/api/context
  - Type-safe request variables passed from middleware to handlers.
- **oRPC + Hono monorepo example** — https://github.com/nattstack/example-next-hono-orpc-scalar-monorepo
  - End-to-end monorepo wiring of Next.js, Hono, and oRPC.

### Vite + React + react-router-dom dashboard

- **Vite scaffolding** — https://vitejs.dev/guide/#scaffolding-your-first-vite-project
  - `bun create vite@latest apps/dashboard --template react-ts`.
- **React Router library mode** — https://reactrouter.com/start/library/installation
  - SPA router setup with `createBrowserRouter` / `<RouterProvider>`.
- **React Router v6 tutorial** — https://reactrouter.com/6.30.4/start/tutorial
  - Loader/action patterns still compatible with `react-router-dom` v6 inside Vite SPAs.
- **Kriasoft React starter kit** — https://github.com/kriasoft/react-starter-kit
  - Production-ready Bun + Vite + TypeScript + Tailwind monorepo SPA example.

### Data fetching & testing

- **TanStack Query React quick start** — https://tanstack.com/query/latest/docs/framework/react/quick-start
  - `useQuery` / `useMutation` setup and provider wrapping.
- **TanStack Query repo** — https://github.com/TanStack/query
  - Source and issue reference for advanced patterns.
- **PGlite API** — https://pglite.dev/docs/api
  - `PGlite.create()` constructor options and lifecycle.
- **PGlite repo** — https://github.com/electric-sql/pglite
  - Latest examples and driver compatibility list.
- **Drizzle + PGLite + Vitest example** — https://github.com/rphlmr/drizzle-vitest-pg
  - How to wire `drizzle-orm` with the `pglite` driver for isolated transaction tests.

## Common patterns

### 1. Bulk rename from `@mirai-app/*` to `@travel-champ/*`

```bash
# 1. Source files: imports and string literals
bunx ast-grep --pattern '"@mirai-app/$NAME"' --rewrite '"@travel-champ/$NAME"'
# 2. package.json names
bunx ast-grep -p '"name": "@mirai-app/$N"' -r '"name": "@travel-champ/$N"' --include '*.json'
# 3. Root config files: nx.json, tsconfig.base.json, package.json
sed -i '' 's/@mirai-app\//@travel-champ\//g' nx.json tsconfig.base.json package.json
# 4. Re-run install to validate workspaces
bun install
```

### 2. Proprietary license expression

Root `package.json` and every package:

```json
{
  "license": "UNLICENSED",
  "private": true
}
```

Replace `LICENSE` file with proprietary text and keep a one-line header in source files if required by legal.

### 3. Tenant schema in Drizzle

```typescript
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  planTier: planTierEnum('plan_tier').notNull().default('free'),
  createdAt: timestamp('created_at', { withTz: true }).notNull().defaultNow(),
});

export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: organizationRoleEnum('role').notNull().default('member'),
}, (t) => [
  uniqueIndex('org_members_org_user_unique').on(t.organizationId, t.userId),
]);
```

Apply tenant FKs and indexes:

```typescript
// trips.ts
organizationId: uuid('organization_id').notNull().references(() => organizations.id),
// index
export const tripsOrganizationIdIdx = index('trips_organization_id_idx').on(table.organizationId);

// users.ts — nullable because travelers may not belong to an org
organizationId: uuid('organization_id').references(() => organizations.id),
export const usersOrganizationIdIdx = index('users_organization_id_idx').on(table.organizationId);
```

### 4. Sentinel backfill pattern

When you cannot leave legacy rows orphaned, create one migration organization and assign every pre-existing user/trip to it:

```typescript
const [migrationOrg] = await tx.insert(organizations)
  .values({ name: 'Migration Organization', slug: 'migration' })
  .returning();

await tx.update(users).set({ organizationId: migrationOrg.id }).where(isNull(users.organizationId));
await tx.update(trips).set({ organizationId: migrationOrg.id });
```

### 5. `requireOrgMembership` oRPC middleware

```typescript
export const requireOrgMembership = os
  .$context<{ userId: string; organizationId?: string | null }>()
  .use(async ({ context, path, next }) => {
    if (!context.organizationId) {
      throw new ORPCError('FORBIDDEN', { message: 'User is not affiliated with an organization' });
    }
    // Expect input shape { tripId: string } to be validated by a preceding Zod schema
    const trip = await db.query.trips.findFirst({
      where: eq(trips.id, context.input.tripId),
      columns: { organizationId: true },
    });
    if (!trip || trip.organizationId !== context.organizationId) {
      throw new ORPCError('FORBIDDEN', { message: 'Trip belongs to a different organization' });
    }
    return next({ context: { ...context, organizationId: context.organizationId } });
  });
```

Attach to every trip-scoped router:

```typescript
export const tripRouter = {
  list: authed.use(requireOrgMembership).handler(...),
  getById: authed.use(requireOrgMembership).input(z.object({ tripId: z.string().uuid() })).handler(...),
};
```

### 6. Vite + React + react-router-dom dashboard skeleton

```bash
cd apps
bun create vite@latest dashboard --template react-ts
cd dashboard
bun add react-router-dom @tanstack/react-query @travel-champ/orpc @travel-champ/common
```

`vite.config.ts` proxy for local backend:

```typescript
server: {
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true },
    '/rpc': { target: 'http://localhost:3001', changeOrigin: true },
  },
}
```

### 7. PGLite test harness for Drizzle org isolation

```typescript
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@travel-champ/db/schema';

export async function createTestDb() {
  const client = await PGlite.create({ dataDir: ':memory:' });
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  return { client, db };
}
```

Use a fresh `:memory:` instance per test and wrap router calls in `BEGIN ... ROLLBACK`.

## Pitfalls & mitigations

| Pitfall | Why it happens | Mitigation |
|---------|----------------|------------|
| `@mirai-app` import leftovers | Codemod misses dynamic imports or `tsconfig` paths | Final verification: `aft_search({ query: `"@mirai-app"` })` / `grep -R "@mirai-app" .` must be 0. |
| Workspace lockfile drift after rename | Bun resolves packages by name; if any `name` mismatches, `bun install` fails | Rename all `package.json` `name` fields before install; commit `bun.lock`. |
| Open-source license fragments remain | `LICENSE` file, per-file headers, `package.json` `license` | Replace root `LICENSE`; run `grep -R "AGPL" --include="*.md" --include="*.json" .` and clear. |
| `organizationId` on `trips` left nullable | Multi-tenant queries lose row-level guarantees | Always NOT NULL after backfill migration; keep sentinel migration org. |
| Missing composite unique on membership | Duplicate `(org, user)` rows | Add `uniqueIndex('org_members_org_user_unique').on(t.organizationId, t.userId)` in Drizzle. |
| Middleware runs before input validation | `tripId` may be invalid/untyped | Use `input(z.object({ tripId: z.string().uuid() }))` before `use(requireOrgMembership)`. |
| Context organizationId absent | Auth middleware did not enrich context | Build an `authed` base procedure that resolves user + org and passes it as context. |
| Cross-org leakage in list queries | Router returns all rows instead of filtering by `organizationId` | Add `where: eq(table.organizationId, ctx.organizationId)` to every list/getFirst query. |
| Vite dashboard cannot reach backend | CORS/proxy mismatch in dev | Configure `server.proxy` and ensure Hono permits `localhost:5173` in dev. |
| PGLite tests leak state | Single DB reused across tests | Use `:memory:` instances or rollback wrappers; reset between cases. |
| oRPC client not re-exported from dashboard | Hidden workspace dependency | Import only from `@travel-champ/orpc/client`; keep server/client separation. |
| Insurance for `@mirai-app` path mappings | `tsconfig.base.json` still maps old scope | Update `paths` to `@travel-champ/*` and verify typecheck. |

## Quick commands/snippets

```bash
# Verify zero references to old scope remain
ctx_search({ query: '"@mirai-app"' })

# Install dashboard deps
bun add -d @types/react-router-dom

# Run targeted tests after rename
nx run-many -t typecheck -p @travel-champ/db @travel-champ/orpc
echo $?  # expect 0

# Generate a migration after schema changes
bunx drizzle-kit generate

# Check license leftovers
grep -R "AGPL\|GNU Affero" . --include="*.md" --include="*.json" --include="*.ts" --include="*.tsx" || echo "clean"

# PGLite test one-liner
bun test packages/orpc/src/api/routers/trip/requireOrgMembership.test.ts

# Build all packages under new scope
nx run-many -t build
```

---

Last updated: 2026-06-21
Scope: Travel Champ S0 rename, multi-tenancy, dashboard skeleton
