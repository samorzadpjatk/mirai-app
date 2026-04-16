import { describe, it, expect } from "bun:test";
import { Effect, Context } from "effect";
import type { GroupGateway } from "./gateway";
import { GroupGatewayTag } from "./gateway";
import type { GroupDTO } from "../dto";
import { DatabaseError, GroupStatus } from "@mirai-app/domain";

describe("[UNIT] GroupGatewayTag", () => {
  it("should be a valid Context.Tag", () => {
    expect(GroupGatewayTag).toBeDefined();
    expect(GroupGatewayTag.key).toBe("GroupGateway");
  });

  it("should have correct key", () => {
    expect(GroupGatewayTag.key).toBe("GroupGateway");
  });
});

describe("[UNIT] GroupGateway Interface Contract", () => {
  const mockGroupDTO: GroupDTO = {
    id: "group-123",
    tripId: "trip-123",
    name: "Test Group",
    code: "TEST123",
    description: "A test group",
    imageUrl: null,
    status: GroupStatus.ACTIVE,
    coins: 100,
    maxMembers: null,
    createdById: "user-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedById: null,
  };

  it("create method should return Effect<GroupDTO, DatabaseError>", async () => {
    const mockGateway: GroupGateway = {
      create: () => Effect.succeed(mockGroupDTO),
      findById: () => Effect.succeed(null),
      findByTripIdConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByStatusConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByTripIdAndStatusConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByOrganizerIdConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findAll: () =>
        Effect.succeed({
          items: [],
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        }),
      update: () => Effect.succeed(mockGroupDTO),
      delete: () => Effect.succeed(void 0),
      exists: () => Effect.succeed(false),
      existsByCode: () => Effect.succeed(false),
      findByCode: () => Effect.succeed(null),
      getCoins: () => Effect.succeed(0),
      updateCoins: () => Effect.succeed(mockGroupDTO),
      findTripParticipantsConnection: () =>
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

    const result = await Effect.runPromise(mockGateway.create(mockGroupDTO));
    expect(result.id).toBe("group-123");
  });

  it("findById should return null when group not found", async () => {
    const mockGateway: GroupGateway = {
      create: () => Effect.succeed(mockGroupDTO),
      findById: () => Effect.succeed(null),
      findByTripIdConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByStatusConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByTripIdAndStatusConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByOrganizerIdConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findAll: () =>
        Effect.succeed({
          items: [],
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        }),
      update: () => Effect.succeed(mockGroupDTO),
      delete: () => Effect.succeed(void 0),
      exists: () => Effect.succeed(false),
      existsByCode: () => Effect.succeed(false),
      findByCode: () => Effect.succeed(null),
      getCoins: () => Effect.succeed(0),
      updateCoins: () => Effect.succeed(mockGroupDTO),
      findTripParticipantsConnection: () =>
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

    const result = await Effect.runPromise(
      mockGateway.findById("non-existent"),
    );
    expect(result).toBeNull();
  });

  it("should handle DatabaseError from findById", async () => {
    const failingGateway: GroupGateway = {
      create: () => Effect.succeed(mockGroupDTO),
      findById: () =>
        Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database connection failed",
          }),
        ),
      findByTripIdConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByStatusConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByTripIdAndStatusConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByOrganizerIdConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findAll: () =>
        Effect.succeed({
          items: [],
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        }),
      update: () => Effect.succeed(mockGroupDTO),
      delete: () => Effect.succeed(void 0),
      exists: () => Effect.succeed(false),
      existsByCode: () => Effect.succeed(false),
      findByCode: () => Effect.succeed(null),
      getCoins: () => Effect.succeed(0),
      updateCoins: () => Effect.succeed(mockGroupDTO),
      findTripParticipantsConnection: () =>
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

    const effect = failingGateway.findById("group-123");
    const either = await Effect.runPromise(Effect.either(effect));

    expect(either._tag).toBe("Left");
  });

  it("existsByCode should return boolean", async () => {
    const mockGateway: GroupGateway = {
      create: () => Effect.succeed(mockGroupDTO),
      findById: () => Effect.succeed(null),
      findByTripIdConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByStatusConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByTripIdAndStatusConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findByOrganizerIdConnection: () =>
        Effect.succeed({
          items: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        }),
      findAll: () =>
        Effect.succeed({
          items: [],
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        }),
      update: () => Effect.succeed(mockGroupDTO),
      delete: () => Effect.succeed(void 0),
      exists: () => Effect.succeed(false),
      existsByCode: () => Effect.succeed(true),
      findByCode: () => Effect.succeed(null),
      getCoins: () => Effect.succeed(100),
      updateCoins: () => Effect.succeed(mockGroupDTO),
      findTripParticipantsConnection: () =>
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

    const result = await Effect.runPromise(mockGateway.existsByCode("TEST123"));
    expect(result).toBe(true);
  });
});
