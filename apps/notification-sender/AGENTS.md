# Notification Sender — Quick Reference

> **Agent guidance for background job processing**
>
> For comprehensive patterns, see root AGENTS.md and CLAUDE.md §7-8.

---

## Quick start

1. **Read task spec:** Check `.specs/tasks/in-progress/` for job specifications.
2. **Job design:** Define job type, payload, and retry policy upfront.
3. **TDD first:** Write the failing job processor test before implementation.
4. **Effect everywhere:** Use `Effect.gen` for job orchestration.

---

## Background job patterns

### Job structure (Effect-based)

```ts
// src/jobs/SendNotificationJob.ts
import { Effect, Data } from "effect";

export class SendNotificationJob extends Data.TaggedClass(
  "SendNotificationJob",
)<{
  userId: string;
  message: string;
  retryCount: number;
}> {}

export class JobFailedError extends Data.TaggedError("JobFailedError")<{
  jobId: string;
  reason: string;
}> {}

export const processJob = (job: SendNotificationJob) =>
  Effect.gen(function* () {
    // Idempotent processing: check if already handled
    const existing = yield* checkIfProcessed(job);
    if (existing) {
      return yield* Effect.succeed({ skipped: true });
    }

    // Main processing
    const result = yield* sendNotification(job);

    // Mark as processed
    yield* markProcessed(job);

    return result;
  }).pipe(Effect.timeout("30s"), Effect.retry({ schedule: "exponential" }));
```

---

## Effect scheduling guidance

### Scheduling patterns

```ts
// Recurring job with cron
import { Schedule } from "effect";

const dailyCleanup = Effect.gen(function* () {
  yield* cleanupStaleNotifications();
}).pipe(Effect.schedule(Schedule.cron("0 0 * * *")));

// Delayed job (e.g., scheduled notification)
const delayedSend = (delay: Duration) =>
  Effect.gen(function* () {
    yield* Effect.sleep(delay);
    yield* sendNotification();
  });
```

### Error handling for jobs

```ts
// Always wrap external calls
type SendResult = Effect.Effect<
  NotificationSent,
  NetworkError | RateLimitError,
  never
>;

// Convert failures to job status
const withJobStatus = <E, A>(effect: Effect.Effect<A, E, never>) =>
  effect.pipe(
    Effect.matchEffect({
      onFailure: (error) => updateJobStatus("failed", error),
      onSuccess: (result) => updateJobStatus("completed", result),
    }),
  );
```

---

## Deep Reference

For comprehensive patterns:

- **Root AGENTS.md:** Universal conventions, skill reference
- **CLAUDE.md §7:** SADD Conventions — Parallel vs sequential workflows
- **CLAUDE.md §8:** Kaizen Conventions — PDCA improvement cycles
- **../packages/use-cases/AGENTS.md:** Effect orchestration patterns
