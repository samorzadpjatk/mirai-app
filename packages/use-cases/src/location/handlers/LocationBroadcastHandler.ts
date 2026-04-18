import { Effect, Data } from "effect";
import type { LocationUpdated, IEventHandler, UserId } from "@mirai-app/domain";
import type { ILocationBroadcastService, LocationUpdate } from "./LocationBroadcastService";

/**
 * DeliveryError - Tagged error for location broadcast delivery failures
 *
 * Used internally for per-delivery error tracking before being caught
 * and logged. Never propagates outside the handler.
 */
class DeliveryError extends Data.TaggedError("DeliveryError")<{
  userId: UserId;
  cause: unknown;
}> {}

/**
 * LocationBroadcastHandler - Event handler for LocationUpdated events
 *
 * Subscribes to LocationUpdated domain events and fans out location updates
 * to all friends in the sharing list. Implements error isolation to ensure
 * one friend's delivery failure does not block others (AC7).
 *
 * Key features:
 * - Parallel delivery to all friends using Effect.all with unbounded concurrency
 * - Per-delivery error isolation via Effect.catchAll
 * - Fire-and-forget for offline friends (no blocking retry)
 * - Outer catchAll prevents EventBus disruption
 * - Comprehensive logging of success and failure
 *
 * Error isolation architecture:
 * 1. Each delivery is wrapped with Effect.catchAll to isolate per-friend errors
 * 2. The entire handler is wrapped with Effect.catchAll to prevent EventBus crash
 * 3. All errors are logged but never propagated
 *
 * Dependencies: ILocationBroadcastService (injected via constructor)
 */
export class LocationBroadcastHandler implements IEventHandler<LocationUpdated, never> {
  readonly eventTag = "LocationUpdated";

  constructor(private readonly broadcastService: ILocationBroadcastService) {}

  /**
   * Handle a LocationUpdated event by fanning out to all friends
   *
   * Extracts the sharing list from the event payload and broadcasts the
   * location update to each friend in parallel. Each delivery is isolated
   * so one failure does not affect others.
   *
   * @param event - The LocationUpdated domain event
   * @returns Effect that completes when all deliveries are done (never fails)
   */
  handle(event: LocationUpdated): Effect.Effect<void, never, never> {
    return Effect.gen(this, function* () {
      yield* Effect.log("Processing LocationUpdated event").pipe(
        Effect.annotateLogs({
          eventId: event.eventId,
          userId: event.userId,
          friendCount: event.sharingList.length,
        })
      );

      // Handle empty sharing list - nothing to do
      if (event.sharingList.length === 0) {
        yield* Effect.log("No friends to broadcast to (empty sharing list)").pipe(
          Effect.annotateLogs({
            eventId: event.eventId,
            userId: event.userId,
          })
        );
        return;
      }

      // Create the location update payload once
      const locationUpdate: LocationUpdate = {
        userId: event.userId,
        latitude: event.coordinates.latitude,
        longitude: event.coordinates.longitude,
        accuracy: event.accuracy ?? null,
        timestamp: event.occurredAt,
      };

      // Create delivery Effects for each friend with error isolation
      // Each delivery is wrapped with catchAll to prevent one failure from affecting others
      const deliveries = event.sharingList.map((friendId) =>
        this.broadcastService.broadcast(friendId, locationUpdate).pipe(
          Effect.tap(() =>
            Effect.log("Location broadcast delivered").pipe(
              Effect.annotateLogs({
                eventId: event.eventId,
                fromUserId: event.userId,
                toUserId: friendId,
              })
            )
          ),
          Effect.catchAll((error: unknown) =>
            Effect.gen(function* () {
              yield* Effect.logWarning("Location broadcast delivery failed").pipe(
                Effect.annotateLogs({
                  eventId: event.eventId,
                  fromUserId: event.userId,
                  toUserId: friendId,
                  error: error instanceof Error ? error.message : String(error),
                })
              );
              // Return void to continue processing other friends
              return yield* Effect.void;
            })
          )
        )
      );

      // Execute all deliveries in parallel with unbounded concurrency
      // This ensures no friend blocks another friend's delivery
      yield* Effect.all(deliveries, { concurrency: "unbounded" });

      yield* Effect.log("LocationUpdated event processing complete").pipe(
        Effect.annotateLogs({
          eventId: event.eventId,
          userId: event.userId,
          friendCount: event.sharingList.length,
        })
      );
    }).pipe(
      // Outer catchAll to prevent any EventBus disruption
      // This ensures handler crashes don't crash the entire EventBus
      Effect.catchAll((error) =>
        Effect.gen(this, function* () {
          yield* Effect.logError("Unhandled error in LocationBroadcastHandler").pipe(
            Effect.annotateLogs({
              error,
              eventTag: this.eventTag,
              eventId: event.eventId,
            })
          );
          // Ensure we always return void, never fail
          return yield* Effect.void;
        })
      )
    );
  }
}
