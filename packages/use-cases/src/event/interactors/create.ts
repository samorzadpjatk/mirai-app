import { Event } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { EventGatewayTag } from "../ports/gateway";

/**
 * Input for CreateEvent use case
 */
export interface CreateEventInput {
  creatorId: string;
  organizerGroupId?: string | null;
  title: string;
  startTime: Date;
  endTime: Date;
  location: string;
  description: string;
  files?: string[];
}

/**
 * Output DTO for CreateEvent use case
 */
export interface CreateEventOutput {
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
 * Error types for CreateEvent use case
 */
export class CreateEventValidationError extends Data.TaggedError(
  "CreateEventValidationError",
)<{ message: string }> {}

export class CreateEventRepositoryError extends Data.TaggedError(
  "CreateEventRepositoryError",
)<{ message: string }> {}

/**
 * CreateEvent Use Case
 *
 * Creates a new event.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = createEventUseCase({
 *   creatorId: "user-123",
 *   title: "Meeting",
 *   startTime: new Date(),
 *   endTime: new Date(),
 *   location: "Conference Room",
 *   description: "Team meeting"
 * });
 * const runnable = program.pipe(
 *   Effect.provideService(EventGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function createEventUseCase(
  input: CreateEventInput,
): Effect.Effect<
  CreateEventOutput,
  CreateEventValidationError | CreateEventRepositoryError,
  EventGatewayTag
> {
  return Effect.gen(function* () {
    const eventRepo = yield* EventGatewayTag;

    // Create the event entity
    const eventEffect = Event.create({
      creatorId: input.creatorId,
      organizerGroupId: input.organizerGroupId,
      title: input.title,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      description: input.description,
      files: input.files,
    });

    const eventResult = yield* eventEffect.pipe(
      Effect.mapError(
        (validationError) =>
          new CreateEventValidationError({
            message: validationError.message,
          }),
      ),
    );

    // Save the event
    const savedEvent = yield* eventRepo.create(eventResult).pipe(
      Effect.mapError(
        () =>
          new CreateEventRepositoryError({
            message: "Failed to save event",
          }),
      ),
    );

    return toOutput(savedEvent);
  });
}

function toOutput(event: Event): CreateEventOutput {
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
  };
}
