import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getEventUseCase,
  type GetEventInput,
  EventNotFoundError,
  EventRepositoryError,
} from "./get";
import { EventGatewayTag, type EventGateway } from "../ports/gateway";
import type { EventDTO, EventType, EventStatus } from "../dto";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Mock EventGateway for testing
 */
function createMockEventGateway(
  events: EventDTO[] = [],
  options: {
    shouldFailFind?: boolean;
  } = {},
): EventGateway {
  const eventMap = new Map(events.map((e) => [e.id, e]));

  return {
    create: (event: EventDTO) => {
      eventMap.set(event.id, event);
      return Effect.succeed(event);
    },

    findById: (id: string) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database error",
          }),
        );
      }
      const event = eventMap.get(id);
      return Effect.succeed(event ?? null);
    },

    findByStatus: () => Effect.succeed([]),

    findAll: () =>
      Effect.succeed({
        items: Array.from(eventMap.values()),
        total: eventMap.size,
        limit: eventMap.size,
        offset: 0,
        hasMore: false,
      }),

    update: (event: EventDTO) => Effect.succeed(event),

    updateStatus: (id: string, status: string) => {
      const event = eventMap.get(id);
      if (event) {
        return Effect.succeed({ ...event, status: status as EventStatus });
      }
      return Effect.fail(
        new DatabaseError({
          operation: "updateStatus",
          message: "Event not found",
        }),
      );
    },

    delete: () => Effect.succeed(void 0),

    exists: () => Effect.succeed(false),

    countByStatus: () => Effect.succeed(0),

    findByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findUpcomingByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findOngoingByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findPastByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),
  };
}

function createMockEventDTO(overrides: Partial<EventDTO> = {}): EventDTO {
  const now = new Date();
  return {
    id: overrides.id ?? "event-123",
    tripId: overrides.tripId ?? "trip-123",
    groupId: overrides.groupId ?? null,
    title: overrides.title ?? "Test Event",
    description: overrides.description ?? null,
    location: overrides.location ?? null,
    startTime: overrides.startTime ?? now,
    endTime: overrides.endTime ?? null,
    type: overrides.type ?? ("ACTIVITY" as EventType),
    status: overrides.status ?? ("PUBLISHED" as EventStatus),
    maxParticipants: overrides.maxParticipants ?? null,
    createdById: overrides.createdById ?? "user-123",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe("[UNIT] getEventUseCase", () => {
  it("should return event when found by ID", async () => {
    const mockEvent = createMockEventDTO({
      id: "event-456",
      title: "Welcome Dinner",
      location: "Main Hall",
      startTime: new Date("2024-07-01T18:00:00"),
      endTime: new Date("2024-07-01T21:00:00"),
    });
    const mockGateway = createMockEventGateway([mockEvent]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: GetEventInput = { eventId: "event-456" };
    const program = getEventUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("event-456");
    expect(result.title).toBe("Welcome Dinner");
    expect(result.location).toBe("Main Hall");
    expect(result.startTime).toBeInstanceOf(Date);
    expect(result.endTime).toBeInstanceOf(Date);
  });

  it("should fail with EventNotFoundError when event not found", async () => {
    const mockGateway = createMockEventGateway([]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: GetEventInput = { eventId: "non-existent" };
    const program = getEventUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(EventNotFoundError);
      if (either.left instanceof EventNotFoundError) {
        expect(either.left.eventId).toBe("non-existent");
      }
    }
  });

  it("should fail with EventRepositoryError when database error occurs", async () => {
    const mockGateway = createMockEventGateway([], { shouldFailFind: true });
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: GetEventInput = { eventId: "event-123" };
    const program = getEventUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(EventRepositoryError);
      expect(either.left.message).toContain("Failed to fetch event");
    }
  });

  it("should return event with files array", async () => {
    const mockEvent = createMockEventDTO({
      id: "event-files",
      title: "File Event",
    });
    const mockGateway = createMockEventGateway([mockEvent]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: GetEventInput = { eventId: "event-files" };
    const program = getEventUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(Array.isArray(result.files)).toBe(true);
  });

  it("should return event without groupId", async () => {
    const mockEvent = createMockEventDTO({
      id: "event-no-group",
      groupId: null,
    });
    const mockGateway = createMockEventGateway([mockEvent]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: GetEventInput = { eventId: "event-no-group" };
    const program = getEventUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.organizerGroupId).toBeNull();
  });

  it("should return all event properties", async () => {
    const mockEvent = createMockEventDTO({
      id: "event-full",
      title: "Full Event",
      description: "Detailed description",
      location: "Event Location",
    });
    const mockGateway = createMockEventGateway([mockEvent]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: GetEventInput = { eventId: "event-full" };
    const program = getEventUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("creatorId");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("startTime");
    expect(result).toHaveProperty("endTime");
    expect(result).toHaveProperty("location");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("files");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("updatedAt");
  });
});
