import { Effect, type Layer } from "effect";
import {
  getEventUseCase,
  createEventUseCase,
  listEventsUseCase,
  type GetEventOutput,
  type CreateEventOutput,
  type ListEventsOutput,
  type EventListItem,
} from "@mirai-app/use-cases";

/**
 * Helper to run an Effect with the provided Layer and convert to controller result
 */
async function runWithLayer<T>(
  effect: Effect.Effect<T, unknown, unknown>,
  layer: Layer.Layer<unknown>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const provided = effect.pipe(Effect.provide(layer));
  const result = await Effect.runPromise(Effect.either(provided));

  if (result._tag === "Left") {
    const error = result.left;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  return { success: true, data: result.right };
}

/**
 * EventController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class EventController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Get an event by ID
   */
  async getById(input: {
    id: string;
  }): Promise<
    { success: true; data: GetEventOutput } | { success: false; error: string }
  > {
    const result = await runWithLayer(
      getEventUseCase({ eventId: input.id }),
      this.appLayer,
    );
    return result as
      | { success: true; data: GetEventOutput }
      | { success: false; error: string };
  }

  /**
   * List events for a trip
   */
  async listByTrip(input: {
    tripId: string;
    filter?: "upcoming" | "ongoing" | "past" | "all";
    limit?: number;
  }): Promise<
    | { success: true; data: { events: EventListItem[]; total: number } }
    | { success: false; error: string }
  > {
    const result = await runWithLayer(
      listEventsUseCase({
        tripId: input.tripId,
        filter: input.filter,
        limit: input.limit,
      }),
      this.appLayer,
    );
    return result as
      | { success: true; data: { events: EventListItem[]; total: number } }
      | { success: false; error: string };
  }

  /**
   * Create a new event
   */
  async create(input: {
    creatorId: string;
    organizerGroupId?: string | null;
    title: string;
    startTime: Date;
    endTime: Date;
    location: string;
    description: string;
    files?: string[];
  }): Promise<
    | { success: true; data: CreateEventOutput }
    | { success: false; error: string }
  > {
    const result = await runWithLayer(
      createEventUseCase({
        creatorId: input.creatorId,
        organizerGroupId: input.organizerGroupId,
        title: input.title,
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location,
        description: input.description,
        files: input.files,
      }),
      this.appLayer,
    );
    return result as
      | { success: true; data: CreateEventOutput }
      | { success: false; error: string };
  }

  /**
   * Get recent events
   */
  async getRecent(input: {
    limit?: number;
  }): Promise<
    | { success: true; data: { events: EventListItem[]; total: number } }
    | { success: false; error: string }
  > {
    // For recent events, we need to query all and sort by createdAt
    // This is a simplified implementation
    // In a real implementation, you might want a dedicated use case
    return {
      success: true,
      data: {
        events: [],
        total: 0,
      },
    };
  }
}
