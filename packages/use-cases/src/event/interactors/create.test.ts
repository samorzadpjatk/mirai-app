import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createEventUseCase,
  type CreateEventInput,
  CreateEventValidationError,
  CreateEventRepositoryError,
} from "./create";
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
    shouldFailCreate?: boolean;
  } = {},
): ExtendedEventGateway {
  const eventMap = new Map(events.map((e) => [e.id, e]));

  return {
    create: (event: EventDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
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

    findByTripId: (tripId: string) =>
      Effect.succeed(
        Array.from(eventMap.values()).filter((e) => e.tripId === tripId),
      ),

    findUpcomingByTripId: () => Effect.succeed([]),
    findOngoingByTripId: () => Effect.succeed([]),
    findPastByTripId: () => Effect.succeed([]),

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

describe("[UNIT] createEventUseCase", () => {
  it("should create event successfully with valid input", async () => {
    const mockGateway = createMockEventGateway([]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const now = new Date();
    const input: CreateEventInput = {
      creatorId: "user-123",
      title: "New Event",
      startTime: now,
      endTime: new Date(now.getTime() + 3600000),
      location: "Conference Room",
      description: "Test event description",
    };

    const program = createEventUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.title).toBe("New Event");
    expect(result.creatorId).toBe("user-123");
    expect(result.location).toBe("Conference Room");
    expect(result.description).toBe("Test event description");
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should create event with optional groupId", async () => {
    const mockGateway = createMockEventGateway([]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const now = new Date();
    const input: CreateEventInput = {
      creatorId: "user-123",
      organizerGroupId: "group-456",
      title: "Group Event",
      startTime: now,
      endTime: new Date(now.getTime() + 3600000),
      location: "Main Hall",
      description: "Group event description",
    };

    const program = createEventUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.organizerGroupId).toBe("group-456");
  });

  it("should create event with optional files", async () => {
    const mockGateway = createMockEventGateway([]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const now = new Date();
    const input: CreateEventInput = {
      creatorId: "user-123",
      title: "Event with Files",
      startTime: now,
      endTime: new Date(now.getTime() + 3600000),
      location: "Room A",
      description: "Event with attachments",
      files: ["file-1.pdf", "file-2.jpg"],
    };

    const program = createEventUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.files).toEqual(["file-1.pdf", "file-2.jpg"]);
  });

  it("should fail with CreateEventValidationError when title is empty", async () => {
    const mockGateway = createMockEventGateway([]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const now = new Date();
    const input: CreateEventInput = {
      creatorId: "user-123",
      title: "",
      startTime: now,
      endTime: new Date(now.getTime() + 3600000),
      location: "Room",
      description: "Invalid event",
    };

    const program = createEventUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateEventValidationError);
      if (either.left instanceof CreateEventValidationError) {
        expect(either.left.message).toContain("title is required");
      }
    }
  });

  it("should fail with CreateEventValidationError when endTime is before startTime", async () => {
    const mockGateway = createMockEventGateway([]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const now = new Date();
    const input: CreateEventInput = {
      creatorId: "user-123",
      title: "Invalid Event",
      startTime: now,
      endTime: new Date(now.getTime() - 3600000), // 1 hour before start
      location: "Room",
      description: "Invalid event",
    };

    const program = createEventUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateEventValidationError);
    }
  });

  it("should fail with CreateEventRepositoryError when database error occurs", async () => {
    const mockGateway = createMockEventGateway([], { shouldFailCreate: true });
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const now = new Date();
    const input: CreateEventInput = {
      creatorId: "user-123",
      title: "New Event",
      startTime: now,
      endTime: new Date(now.getTime() + 3600000),
      location: "Room",
      description: "Test event",
    };

    const program = createEventUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateEventRepositoryError);
      expect(either.left.message).toContain("Failed to save event");
    }
  });

  it("should return all expected output properties", async () => {
    const mockGateway = createMockEventGateway([]);
    const mockLayer = Layer.succeed(EventGatewayTag, mockGateway);

    const now = new Date();
    const input: CreateEventInput = {
      creatorId: "user-456",
      organizerGroupId: "group-789",
      title: "Complete Event",
      startTime: now,
      endTime: new Date(now.getTime() + 7200000),
      location: "Grand Hall",
      description: "A complete test event",
    };

    const program = createEventUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("creatorId");
    expect(result).toHaveProperty("organizerGroupId");
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
