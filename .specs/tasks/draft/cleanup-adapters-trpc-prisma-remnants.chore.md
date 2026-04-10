---
title: Remove remaining tRPC and Prisma remnants from adapters layer
deppends_on: []
---

## Initial User Prompt

Launch a follow-up task to clean up the remaining adapters layer tRPC/Prisma remnants. The migration from tRPC to GraphQL and Prisma to Drizzle is mostly complete, but there are still remnants in the adapters layer that need cleanup:

1. Remove remaining Prisma repository files (3 files still exist)
2. Remove adapters/api/trpc.ts and all tRPC router files
3. Update controllers to remove TRPCError imports and tRPC dependencies
4. Clean up trpc-utils/ directory
5. Regenerate lockfile to clean up stale tRPC entries
6. Verify build passes after all removals

## Description

// Will be filled in future stages by business analyst
