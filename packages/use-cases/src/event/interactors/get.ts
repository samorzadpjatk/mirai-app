import { Data, Effect } from "effect";
import { EventGatewayTag } from "../ports/gateway";
import type { EventDTO } from "../dto";

/**
 * Input for GetEvent use case
 */
export interface GetEventInput {
  eventId: string;
}

/**
 * Output DTO for GetEvent use case
 */
export interface GetEventOutput {
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
}

/**
 * Error types for GetEvent use case
 */
export class EventNotFoundError extends Data.TaggedError("EventNotFoundError")<{
  eventId: string;
}> {}

export class EventRepositoryError extends Data.TaggedError(
  "EventRepositoryError",
)<{ message: string }> {}

/**
 * GetEvent Use Case
 *
 * Retrieves a single event by ID.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getEventUseCase({ eventId: "event-123" });
 * const runnable = program.pipe(
 *   Effect.provideService(EventGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getEventUseCase(
  input: GetEventInput,
): Effect.Effect<
  GetEventOutput,
  EventNotFoundError | EventRepositoryError,
  EventGatewayTag
> {
  return Effect.gen(function* () {
    const eventRepo = yield* EventGatewayTag;

    const event = yield* eventRepo.findById(input.eventId).pipe(
      Effect.mapError(
        () =>
          new EventRepositoryError({
            message: `Failed to fetch event ${input.eventId}`,
          }),
      ),
    );

    if (!event) {
      return yield* Effect.fail(
        new EventNotFoundError({ eventId: input.eventId }),
      );
    }

    return toOutput(event);
  });
}

function toOutput(event: EventDTO): GetEventOutput {
  return {
    id: event.id,
    creatorId: event.createdById,
    organizerGroupId: event.groupId ?? null,
    title: event.title,
    startTime: event.startTime,
    endTime: event.endTime ?? event.startTime,
    location: event.location ?? "",
    description: event.description ?? "",
    files: [], // Events don't have files in DTO, return empty array
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}
