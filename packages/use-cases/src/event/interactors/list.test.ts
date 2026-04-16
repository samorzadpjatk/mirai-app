import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  listEventsUseCase,
  type ListEventsInput,
  ListEventsRepositoryError,
} from "./list";
import { EventGatewayTag, type EventGateway } from "../ports/gateway";
import type { EventDTO, EventType, EventStatus } from "../dto";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Extended EventGateway interface with methods available in implementations
 */
interface ExtendedEventGateway extends EventGateway {
  findByTripId(tripId: string): Effect.Effect<EventDTO[], DatabaseError, never>;
  findUpcomingByTripId(
    tripId: string,
  ): Effect.Effect<EventDTO[], DatabaseError, never>;
  findOngoingByTripId(
    tripId: string,
  ): Effect.Effect<EventDTO[], DatabaseError, never>;
  findPastByTripId(
    tripId: string,
  ): Effect.Effect<EventDTO[], DatabaseError, never>;
}

/**
 * Mock EventGateway for testing
 */
function createMockEventGateway(
  events: EventDTO[] = [],
  options: {
    shouldFailFindByTripId?: boolean;
    shouldFailFindUpcoming?: boolean;
    shouldFailFindOngoing?: boolean;
    shouldFailFindPast?: boolean;
  } = {},
): ExtendedEventGateway {
  const eventMap = new Map(events.map((e) => [e.id, e]));

  return {
    create: (event: EventDTO) => {
      eventMap.set(event.id, event);
      return Effect.succeed(event);
    },

    findById: (id: string) => {
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

    findByTripId: (tripId: string) => {
      if (options.shouldFailFindByTripId) {
        return Effect.fail(
          new DatabaseError({
            operation: "findByTripId",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(
        Array.from(eventMap.values()).filter((e) => e.tripId === tripId),
      );
    },

    findUpcomingByTripId: (tripId: string) => {
      if (options.shouldFailFindUpcoming) {
        return Effect.fail(
          new DatabaseError({
            operation: "findUpcomingByTripId",
            message: "Database error",
          }),
        );
      }
      const now = new Date();
      return Effect.succeed(
        Array.from(eventMap.values()).filter(
          (e) => e.tripId === tripId && e.startTime > now,
        ),
      );
    },

    findOngoingByTripId: (tripId: string) => {
      if (options.shouldFailFindOngoing) {
        return Effect.fail(
          new DatabaseError({
            operation: "findOngoingByTripId",
            message: "Database error",
          }),
        );
      }
      const now = new Date();
      return Effect.succeed(
        Array.from(eventMap.values()).filter(
          (e) =>
            e.tripId === tripId &&
            e.startTime <= now &&
            (e.endTime ?? now) >= now,
        ),
      );
    },

    findPastByTripId: (tripId: string) => {
      if (options.shouldFailFindPast) {
        return Effect.fail(
          new DatabaseError({
            operation: "findPastByTripId",
            message: "Database error",
          }),
        );
      }
      const now = new Date();
      return Effect.succeed(
        Array.from(eventMap.values()).filter(
          (e) => e.tripId === tripId && (e.endTime ?? e.startTime) < now,
        ),
      );
    },

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

describe("[UNIT] listEventsUseCase", () => {
  it("should return events with default 'all' filter", async () => {
    const futureDate = new Date(Date.now() + 86400000); // Tomorrow
    const mockEvent1 = createMockEventDTO({
      id: "event-1",
      tripId: "trip-abc",
      title: "Event 1",
      startTime: futureDate,
    });
    const mockEvent2 = createMockEventDTO({
      id: "event-2",
      tripId: "trip-abc",
      title: "Event 2",
      startTime: new Date(futureDate.getTime() + 3600000),
    });

    const mockGateway = createMockEventGateway([mockEvent1, mockEvent2]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-abc" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.events[0]?.title).toBe("Event 1");
    expect(result.events[1]?.title).toBe("Event 2");
  });

  it("should filter events by 'upcoming'", async () => {
    const futureDate = new Date(Date.now() + 86400000); // Tomorrow
    const pastDate = new Date(Date.now() - 86400000); // Yesterday

    const upcomingEvent = createMockEventDTO({
      id: "event-upcoming",
      tripId: "trip-xyz",
      title: "Upcoming Event",
      startTime: futureDate,
    });
    const pastEvent = createMockEventDTO({
      id: "event-past",
      tripId: "trip-xyz",
      title: "Past Event",
      startTime: pastDate,
      endTime: new Date(pastDate.getTime() + 3600000),
    });

    const mockGateway = createMockEventGateway([upcomingEvent, pastEvent]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-xyz", filter: "upcoming" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.title).toBe("Upcoming Event");
    expect(result.total).toBe(1);
  });

  it("should filter events by 'ongoing'", async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneHourLater = new Date(now.getTime() + 3600000);

    const ongoingEvent = createMockEventDTO({
      id: "event-ongoing",
      tripId: "trip-def",
      title: "Ongoing Event",
      startTime: oneHourAgo,
      endTime: oneHourLater,
    });
    const futureEvent = createMockEventDTO({
      id: "event-future",
      tripId: "trip-def",
      title: "Future Event",
      startTime: oneHourLater,
    });

    const mockGateway = createMockEventGateway([ongoingEvent, futureEvent]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-def", filter: "ongoing" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.title).toBe("Ongoing Event");
    expect(result.events[0]?.isOngoing).toBe(true);
  });

  it("should filter events by 'past'", async () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 7200000);
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const pastEvent = createMockEventDTO({
      id: "event-past",
      tripId: "trip-ghi",
      title: "Past Event",
      startTime: twoHoursAgo,
      endTime: oneHourAgo,
    });
    const ongoingEvent = createMockEventDTO({
      id: "event-ongoing",
      tripId: "trip-ghi",
      title: "Ongoing Event",
      startTime: oneHourAgo,
      endTime: new Date(now.getTime() + 3600000),
    });

    const mockGateway = createMockEventGateway([pastEvent, ongoingEvent]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-ghi", filter: "past" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.title).toBe("Past Event");
    expect(result.events[0]?.hasEnded).toBe(true);
  });

  it("should apply limit when specified", async () => {
    const futureDate = new Date(Date.now() + 86400000);
    const mockEvents = Array.from({ length: 5 }, (_, i) =>
      createMockEventDTO({
        id: `event-${i + 1}`,
        tripId: "trip-limit",
        title: `Event ${i + 1}`,
        startTime: new Date(futureDate.getTime() + i * 3600000),
      }),
    );

    const mockGateway = createMockEventGateway(mockEvents);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-limit", limit: 3 };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.events).toHaveLength(3);
    expect(result.total).toBe(5); // Total is before limit
  });

  it("should return empty array when no events exist for trip", async () => {
    const mockGateway = createMockEventGateway([]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-empty" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.events).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("should fail with ListEventsRepositoryError when database error occurs for 'all' filter", async () => {
    const mockGateway = createMockEventGateway([], {
      shouldFailFindByTripId: true,
    });
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-error", filter: "all" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ListEventsRepositoryError);
      expect(either.left.message).toContain("Failed to fetch events");
    }
  });

  it("should fail with ListEventsRepositoryError when database error occurs for 'upcoming' filter", async () => {
    const mockGateway = createMockEventGateway([], {
      shouldFailFindUpcoming: true,
    });
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-error", filter: "upcoming" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ListEventsRepositoryError);
    }
  });

  it("should fail with ListEventsRepositoryError when database error occurs for 'ongoing' filter", async () => {
    const mockGateway = createMockEventGateway([], {
      shouldFailFindOngoing: true,
    });
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-error", filter: "ongoing" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ListEventsRepositoryError);
    }
  });

  it("should fail with ListEventsRepositoryError when database error occurs for 'past' filter", async () => {
    const mockGateway = createMockEventGateway([], {
      shouldFailFindPast: true,
    });
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-error", filter: "past" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ListEventsRepositoryError);
    }
  });

  it("should return events with computed properties (isOngoing, hasStarted, hasEnded)", async () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 7200000);
    const oneHourLater = new Date(now.getTime() + 3600000);

    const ongoingEvent = createMockEventDTO({
      id: "event-computed",
      tripId: "trip-computed",
      title: "Computed Event",
      startTime: twoHoursAgo,
      endTime: oneHourLater,
    });

    const mockGateway = createMockEventGateway([ongoingEvent]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-computed", filter: "all" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toHaveProperty("isOngoing");
    expect(result.events[0]).toHaveProperty("hasStarted");
    expect(result.events[0]).toHaveProperty("hasEnded");
    expect(result.events[0]?.isOngoing).toBe(true);
    expect(result.events[0]?.hasStarted).toBe(true);
    expect(result.events[0]?.hasEnded).toBe(false);
  });

  it("should return all event properties in list items", async () => {
    const futureDate = new Date(Date.now() + 86400000);
    const mockEvent = createMockEventDTO({
      id: "event-full",
      tripId: "trip-full",
      title: "Full Event",
      description: "Detailed description",
      location: "Event Location",
      startTime: futureDate,
      endTime: new Date(futureDate.getTime() + 3600000),
    });

    const mockGateway = createMockEventGateway([mockEvent]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const input: ListEventsInput = { tripId: "trip-full" };
    const program = listEventsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.events).toHaveLength(1);
    const item = result.events[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("creatorId");
    expect(item).toHaveProperty("organizerGroupId");
    expect(item).toHaveProperty("title");
    expect(item).toHaveProperty("startTime");
    expect(item).toHaveProperty("endTime");
    expect(item).toHaveProperty("location");
    expect(item).toHaveProperty("description");
    expect(item).toHaveProperty("files");
    expect(item).toHaveProperty("createdAt");
    expect(item).toHaveProperty("updatedAt");
    expect(item).toHaveProperty("isOngoing");
    expect(item).toHaveProperty("hasStarted");
    expect(item).toHaveProperty("hasEnded");
  });
});
