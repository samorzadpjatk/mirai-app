---
title: Migrate RealtimePort and RealtimeSubscription interfaces to Effect pattern
depends_on:
  - migrate-supabase-realtime-adapter-to-effect.refactor.md
---

## Initial User Prompt

Migrate the RealtimePort interface and RealtimeSubscription interface from Result pattern to Effect pattern to match the updated SupabaseRealtimeAdapter implementation.

The SupabaseRealtimeAdapter has been migrated to Effect pattern but the interface still uses Result:

- RealtimePort.subscribe returns Result<RealtimeSubscription, ...> but needs Effect.Effect<...>
- RealtimePort.broadcast returns Promise<Result<...>> but needs Effect.Effect<...>
- RealtimePort.trackPresence returns Promise<Result<...>> but needs Effect.Effect<...>
- RealtimeSubscription.unsubscribe returns Result<void, ...> but needs Effect.Effect<...>

## Description

// Will be filled in future stages by business analyst
