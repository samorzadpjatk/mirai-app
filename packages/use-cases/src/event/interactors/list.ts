import { Event } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { EventGatewayTag } from "../ports/gateway";

/**
 * Input for ListEvents use case
 */
export interface ListEventsInput {
  tripId: string;
  filter?: "upcoming" | "ongoing" | "past" | "all";
  limit?: number;
}

/**
 * Event output item
 */
export interface EventListItem {
  id: string;
  creatorId: string;
  organizerGroupId: string | null;
  title: string;
  startTime: Date;
  endTime: Date;
  location: string;
  description: string;
  files: readonly string[];
  createdAt: Date;
  updatedAt: Date;
  isOngoing: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
}

/**
 * Output DTO for ListEvents use case
 */
export interface ListEventsOutput {
  events: EventListItem[];
  total: number;
}

/**
 * Error types for ListEvents use case
 */
export class ListEventsRepositoryError extends Data.TaggedError(
  "ListEventsRepositoryError",
)<{ message: string }> {}

/**
 * ListEvents Use Case
 *
 * Lists events for a trip with optional filtering.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = listEventsUseCase({
 *   tripId: "trip-123",
 *   filter: "upcoming"
 * });
 * const runnable = program.pipe(
 *   Effect.provideService(EventGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function listEventsUseCase(
  input: ListEventsInput,
): Effect.Effect<ListEventsOutput, ListEventsRepositoryError, EventGatewayTag> {
  return Effect.gen(function* () {
    const eventRepo = yield* EventGatewayTag;

    const filter = input.filter ?? "all";

    // Fetch events based on filter
    const events = yield* (() => {
      switch (filter) {
        case "upcoming":
          return eventRepo.findUpcomingByTripId(input.tripId);
        case "ongoing":
          return eventRepo.findOngoingByTripId(input.tripId);
        case "past":
          return eventRepo.findPastByTripId(input.tripId);
        case "all":
        default:
          return eventRepo.findByTripId(input.tripId);
      }
    })().pipe(
      Effect.mapError(
        () =>
          new ListEventsRepositoryError({
            message: `Failed to fetch events for trip ${input.tripId}`,
          }),
      ),
    );

    // Apply limit if specified
    const limitedEvents =
      input.limit !== undefined ? events.slice(0, input.limit) : events;

    return {
      events: limitedEvents.map(toListItem),
      total: events.length,
    };
  });
}

function toListItem(
  event: { startTime: Date; endTime: Date } & Omit<
    EventListItem,
    "isOngoing" | "hasStarted" | "hasEnded"
  >,
): EventListItem {
  const now = new Date();
  const startTime = event.startTime;
  const endTime = event.endTime;

  const hasStarted = now >= startTime;
  const hasEnded = now >= endTime;
  const isOngoing = hasStarted && !hasEnded;

  return {
    id: event.id,
    creatorId: event.creatorId,
    organizerGroupId: event.organizerGroupId,
    title: event.title,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    description: event.description,
    files: event.files,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    isOngoing,
    hasStarted,
    hasEnded,
  };
}
