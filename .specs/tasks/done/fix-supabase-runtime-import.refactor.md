---
title: Fix Supabase runtime import in tRPC context
type: refactor
---

## Initial User Prompt

Fix the remaining runtime import from @repo/frameworks/supabase in packages/adapters/src/api/trpc.ts to complete the cyclic dependency fix

## Description

### Problem Statement

The tRPC context file (`packages/adapters/src/api/trpc.ts`) still has **one runtime import** from frameworks:

```typescript
import { createSupabaseClient } from "@repo/frameworks/supabase";
```

This import is used to create the Supabase client within the adapters layer, which violates Clean Architecture principles. The adapters layer should receive dependencies via injection rather than importing them directly.

### Current State

The trpc.ts file currently:

1. ✅ Receives `db: PrismaClient` via context parameter (FIXED)
2. ❌ Still imports and calls `createSupabaseClient` from frameworks (NEEDS FIX)

### Architecture Violation

```
Current (Partial Fix):
┌───────────────┐      type-only       ┌───────────────┐
│   adapters    │ ◄──────────────────── │  frameworks   │
│               │                       │   (prisma)    │
│  createTRPC   │ ◄──────────────────── │               │
│   Context     │    runtime import     │  (supabase)   │
│               │    (VIOLATION!)       │               │
└───────────────┘                       └───────────────┘

Target (Clean):
┌───────────────┐      type-only       ┌───────────────┐
│   adapters    │ ◄──────────────────── │  frameworks   │
│               │                       │   (prisma)    │
│  createTRPC   │ ◄──────────────────── │               │
│   Context     │    receives deps      │  (supabase)   │
│               │    via context        │               │
└───────────────┘                       └───────────────┘
```

## Scope

### Included

- Modify trpc.ts to receive SupabaseClient via context parameter
- Update backend-server to create and inject Supabase client
- Ensure type-only imports from frameworks/supabase
- Update context type definition

### Excluded

- No changes to Supabase client creation logic (stays in frameworks)
- No changes to how Supabase is used in routers
- No changes to other framework imports

## Acceptance Criteria

- [ ] **No runtime imports**: trpc.ts has no runtime imports from @repo/frameworks/supabase
- [ ] **Context receives supabase**: createTRPCContext accepts supabase client via parameter
- [ ] **Type-only imports**: Only type imports remain from frameworks/supabase
- [ ] **Backend updated**: backend-server creates and injects Supabase client
- [ ] **All routers work**: Existing router code continues to function

## Implementation Process

### Phase 1: Update tRPC Context Type

#### Step 1.1: Modify Context Interface

**File:** packages/adapters/src/api/trpc.ts

**Current:**

```typescript
export interface TRPCContext {
  db: PrismaClient;
  supabase: SupabaseClient;
  headers: Headers;
  accessToken: string | null;
}
```

**Change:** Keep interface but receive supabase via parameter

**Success Criteria:**

- Context interface accepts supabase from parameter
- No changes needed to interface structure

---

#### Step 1.2: Update createTRPCContext Function

**Current:**

```typescript
export const createTRPCContext = (opts: {
  headers: Headers;
  db: PrismaClient;
  supabaseUrl: string;
  supabaseKey: string;
  connectionParams?: Record<string, string>;
}): TRPCContext => {
  // Creates supabase internally
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  // ...
};
```

**Change:**

```typescript
export const createTRPCContext = (opts: {
  headers: Headers;
  db: PrismaClient;
  supabase: SupabaseClient; // NEW: Receive via parameter
  connectionParams?: Record<string, string>;
}): TRPCContext => {
  // Use injected supabase
  return { db: opts.db, supabase: opts.supabase, ... };
};
```

**Success Criteria:**

- Function signature updated
- No createSupabaseClient call
- Supabase received via opts.supabase

---

#### Step 1.3: Update Imports

**Current:**

```typescript
import {
  createSupabaseClient,
  type SupabaseClient,
} from "@repo/frameworks/supabase";
```

**Change:**

```typescript
import type { SupabaseClient } from "@repo/frameworks/supabase";
```

**Success Criteria:**

- Only type import remains
- No runtime import of createSupabaseClient

---

### Phase 2: Update Backend Server

#### Step 2.1: Create Supabase Client in Backend

**File:** apps/backend-server/src/server.ts

**Add:**

```typescript
import { createSupabaseClient } from "@repo/frameworks/supabase";

// In context creation:
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

return createTRPCContext({
  headers,
  db,
  supabase, // NEW: Pass supabase client
  connectionParams,
});
```

**Success Criteria:**

- Backend imports createSupabaseClient
- Supabase client created in backend
- Passed to createTRPCContext

---

### Phase 3: Update Factories (if needed)

#### Step 3.1: Check Factory Functions

**Check:** packages/frameworks/src/factories/

If any factory creates tRPC context, it needs updating to pass supabase.

**Success Criteria:**

- All context creation points updated
- Factories pass supabase correctly

---

### Phase 4: Verification

#### Step 4.1: Verify No Runtime Imports

**Command:**

```bash
grep -r "from.*@repo/frameworks/supabase" packages/adapters/src --include="*.ts" | grep -v "import type"
```

**Expected:** Empty result (no runtime imports)

**Success Criteria:**

- No runtime imports from frameworks/supabase

---

#### Step 4.2: Verify Build Success

**Command:**

```bash
cd packages/adapters && bun run build
```

**Success Criteria:**

- Build passes
- No TypeScript errors

---

#### Step 4.3: Verify Tests Pass

**Command:**

```bash
cd packages/adapters && bun test
```

**Success Criteria:**

- All tests pass
- Context creation works

---

#### Step 4.4: Integration Test

**Command:**

```bash
cd apps/backend-server && bun run dev
```

**Test:**

- API endpoints work
- Authentication works
- Supabase client functions correctly

**Success Criteria:**

- Server starts
- API calls succeed
- No runtime errors

---

## Verification

### Phase 1: Context Update

**Level**: Single Judge
**Threshold**: 4.0/5.0

**Rubric:**

- No runtime import: createSupabaseClient not imported
- Type-only import: Only SupabaseClient type imported
- Parameter added: supabase in opts parameter

### Phase 2: Backend Update

**Level**: Single Judge
**Threshold**: 4.0/5.0

**Rubric:**

- Client created: Supabase created in backend
- Injection correct: Passed to context function
- No double creation: Not created in both places

### Phase 4: Final Verification

**Level**: Panel of 2 Judges
**Threshold**: 4.5/5.0

**Rubric:**

- Import verification: No runtime imports
- Build success: Compiles without errors
- Tests pass: All adapters tests pass
- Integration works: Backend server functions

## Definition of Done

- [x] trpc.ts has no runtime imports from frameworks/supabase
- [x] Context receives SupabaseClient via parameter
- [x] Backend server creates and injects Supabase client
- [x] Build passes in adapters package
- [x] Tests pass
- [x] Integration verified (backend server works)
- [x] Task moved to done folder
