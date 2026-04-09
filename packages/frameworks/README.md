# @mirai-app/frameworks - Frameworks Layer

> **Frameworks & Drivers layer of Clean Architecture - Technical configuration**
>
> Outermost layer - can depend on all inner layers

## Purpose

The frameworks layer contains:

- **tRPC Configuration**: Client and server setup
- **Prisma Configuration**: Database client configuration
- **Supabase Configuration**: Supabase client setup
- **Fastify Configuration**: Server configuration (for backend)

## Rules

1. **Configuration Only**: No business logic, only framework setup
2. **Can Use All Inner Layers**: Depends on domain, use-cases, and adapters
3. **Framework-Specific Code**: Contains code specific to tRPC, Prisma, etc.
4. **Reusable Setup**: Configuration that can be reused across apps

## Directory Structure

```
src/
├── index.ts              # Public exports
├── trpc/                 # tRPC configuration
│   ├── client.ts         # tRPC client setup
│   ├── server.ts         # tRPC server setup
│   └── router-factory.ts # Router creation utilities
├── prisma/               # Prisma configuration
│   ├── client.ts         # Prisma client setup
│   └── schema-helpers.ts # Schema utilities
├── supabase/             # Supabase configuration
│   └── client.ts         # Supabase client setup
└── fastify/              # Fastify configuration
    └── server.ts         # Fastify server setup
```

## Example Usage

### tRPC Client Configuration

```typescript
// trpc/client.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../adapters/controllers";

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient(baseUrl: string) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
      }),
    ],
  });
}
```

### tRPC Server Configuration

```typescript
// trpc/server.ts
import { initTRPC } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;
export const procedure = t.procedure;

export const createTRPCRouter = router;

// Protected procedure (requires auth)
export const protectedProcedure = procedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
```

### Prisma Client Configuration

```typescript
// prisma/client.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient };
```

## Testing

Framework tests verify configuration works:

```typescript
import { describe, it, expect } from "bun:test";
import { prisma } from "./prisma/client";

describe("Prisma Configuration", () => {
  it("should create client", () => {
    expect(prisma).toBeDefined();
  });

  it("should connect to database", async () => {
    const result = await prisma.$queryRaw`SELECT 1`;
    expect(result).toBeDefined();
  });
});
```

## References

- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars (DDD section)
