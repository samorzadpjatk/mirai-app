import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import { GroupStatus } from "@mirai-app/domain";
import {
  getCoinQuickStatsUseCase,
  type GetCoinQuickStatsInput,
} from "./get-quick-stats";
import {
  CoinTransactionGatewayTag,
  type CoinTransactionGateway,
} from "../ports/gateway";
import { GroupGatewayTag, type GroupGateway } from "../../group/ports/gateway";
import type { CoinTransactionDTO } from "@mirai-app/domain";
import type { GroupDTO } from "../../group/dto";

function createMockCoinGateway(
  options: {
    sumAmount?: number | null;
    count?: number;
    totalCoinsByGroup?: Array<{
      groupId: string;
      _sum: { amount: number | null };
    }>;
  } = {},
): CoinTransactionGateway {
  return {
    count: () => Effect.succeed(options.count ?? 0),
    sumAmount: () => Effect.succeed(options.sumAmount ?? null),
    sumAddedCoins: () => Effect.succeed(0),
    sumRemovedCoins: () => Effect.succeed(0),
    getMostActiveAdmin: () => Effect.succeed([]),
    findManyConnection: () =>
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
    findRecent: () => Effect.succeed([]),
    getTotalCoinsByGroup: () => Effect.succeed(options.totalCoinsByGroup ?? []),
    groupByAdmin: () => Effect.succeed([]),
    create: () =>
      Effect.succeed({
        id: "tx-123",
        groupId: "group-123",
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CoinTransactionDTO),
    incrementGroupCoins: () => Effect.succeed(void 0),
    decrementGroupCoins: () =>
      Effect.succeed({ success: true, currentBalance: 900 }),
    getGroupCoins: () => Effect.succeed(1000),
    verifyGroupInTrip: () =>
      Effect.succeed({
        exists: true,
        tripId: "trip-123",
        isDeleted: false,
        coins: 1000,
      }),
  };
}

function createMockGroup(overrides: Partial<GroupDTO> = {}): GroupDTO {
  return {
    id: "group-richest",
    tripId: "trip-123",
    name: "Rich Group",
    code: "RG123",
    description: null,
    imageUrl: null,
    status: GroupStatus.ACTIVE,
    coins: 7000,
    maxMembers: null,
    createdById: "user-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedById: null,
    ...overrides,
  };
}

function createMockGroupGateway(
  options: {
    group?: GroupDTO | null;
  } = {},
): GroupGateway {
  const defaultGroup = createMockGroup();

  return {
    create: (group: GroupDTO) => Effect.succeed(group),
    findById: () =>
      Effect.succeed(
        options.group === undefined ? defaultGroup : options.group,
      ),
    findByTripIdConnection: () =>
      Effect.succeed({
        items: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      } as ReturnType<
        GroupGateway["findByTripIdConnection"]
      > extends Effect.Effect<infer R, never, never>
        ? R
        : never),
    findByStatusConnection: () =>
      Effect.succeed({
        items: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      } as ReturnType<
        GroupGateway["findByStatusConnection"]
      > extends Effect.Effect<infer R, never, never>
        ? R
        : never),
    findByTripIdAndStatusConnection: () =>
      Effect.succeed({
        items: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      } as ReturnType<
        GroupGateway["findByTripIdAndStatusConnection"]
      > extends Effect.Effect<infer R, never, never>
        ? R
        : never),
    findByOrganizerIdConnection: () =>
      Effect.succeed({
        items: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      } as ReturnType<
        GroupGateway["findByOrganizerIdConnection"]
      > extends Effect.Effect<infer R, never, never>
        ? R
        : never),
    findAll: () =>
      Effect.succeed({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    update: (group: GroupDTO) => Effect.succeed(group),
    delete: () => Effect.succeed(void 0),
    exists: () => Effect.succeed(true),
    existsByCode: () => Effect.succeed(false),
    findByCode: () => Effect.succeed(null),
    getCoins: () => Effect.succeed(1000),
    updateCoins: (id, amount) =>
      Effect.succeed(createMockGroup({ id, coins: amount })),
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
    findParticipantByUserIdAndTripId: () => Effect.succeed(null),
    assignUserToGroup: () =>
      Effect.succeed({
        id: "tp-123",
        userId: "user-123",
        groupId: "group-123",
        tripId: "trip-123",
        role: "member",
        status: "active",
        joinedAt: new Date(),
        leftAt: null,
        invitedById: null,
      } as ReturnType<GroupGateway["assignUserToGroup"]> extends Effect.Effect<
        infer R,
        never,
        never
      >
        ? R
        : never),
    removeUserFromGroup: () =>
      Effect.succeed({
        id: "tp-123",
        userId: "user-123",
        groupId: "group-123",
        tripId: "trip-123",
        role: "member",
        status: "inactive",
        joinedAt: new Date(),
        leftAt: new Date(),
        invitedById: null,
      } as ReturnType<
        GroupGateway["removeUserFromGroup"]
      > extends Effect.Effect<infer R, never, never>
        ? R
        : never),
  };
}

describe("[UNIT] getCoinQuickStatsUseCase", () => {
  it("should return quick stats successfully", async () => {
    const mockCoinGateway = createMockCoinGateway({
      sumAmount: 10000,
      count: 5,
      totalCoinsByGroup: [
        { groupId: "group-1", _sum: { amount: 3000 } },
        { groupId: "group-2", _sum: { amount: 7000 } },
      ],
    });
    const mockGroupGateway = createMockGroupGateway({
      group: createMockGroup({
        id: "group-2",
        name: "Richest Group",
        coins: 7000,
      }),
    });

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const groupLayer = Layer.succeed(GroupGatewayTag, mockGroupGateway);
    const combinedLayer = Layer.merge(coinLayer, groupLayer);

    const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
    const program = getCoinQuickStatsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.totalCoins).toBe(10000);
    expect(result?.totalGroups).toBe(5);
    expect(result?.averageCoinsPerGroup).toBe(2000);
    expect(result?.richestGroupId).toBe("group-2");
    expect(result?.richestGroupName).toBe("Richest Group");
    expect(result?.time).toBeInstanceOf(Date);
  });

  it("should return null when no coin data exists", async () => {
    const mockCoinGateway = createMockCoinGateway({ sumAmount: null });
    const mockGroupGateway = createMockGroupGateway();

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const groupLayer = Layer.succeed(GroupGatewayTag, mockGroupGateway);
    const combinedLayer = Layer.merge(coinLayer, groupLayer);

    const input: GetCoinQuickStatsInput = { tripId: "trip-empty" };
    const program = getCoinQuickStatsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toBeNull();
  });

  it("should handle zero groups gracefully", async () => {
    const mockCoinGateway = createMockCoinGateway({
      sumAmount: 0,
      count: 0,
      totalCoinsByGroup: [],
    });
    const mockGroupGateway = createMockGroupGateway();

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const groupLayer = Layer.succeed(GroupGatewayTag, mockGroupGateway);
    const combinedLayer = Layer.merge(coinLayer, groupLayer);

    const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
    const program = getCoinQuickStatsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.totalCoins).toBe(0);
    expect(result?.totalGroups).toBe(0);
    expect(result?.averageCoinsPerGroup).toBe(0);
    expect(result?.richestGroupId).toBeUndefined();
    expect(result?.richestGroupName).toBeUndefined();
  });

  it("should calculate correct average for single group", async () => {
    const mockCoinGateway = createMockCoinGateway({
      sumAmount: 5000,
      count: 1,
      totalCoinsByGroup: [{ groupId: "group-1", _sum: { amount: 5000 } }],
    });
    const mockGroupGateway = createMockGroupGateway();

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const groupLayer = Layer.succeed(GroupGatewayTag, mockGroupGateway);
    const combinedLayer = Layer.merge(coinLayer, groupLayer);

    const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
    const program = getCoinQuickStatsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.totalCoins).toBe(5000);
    expect(result?.totalGroups).toBe(1);
    expect(result?.averageCoinsPerGroup).toBe(5000);
  });

  it("should handle null sum in group coins calculation", async () => {
    const mockCoinGateway = createMockCoinGateway({
      sumAmount: 3000,
      count: 3,
      totalCoinsByGroup: [
        { groupId: "group-1", _sum: { amount: 1000 } },
        { groupId: "group-2", _sum: { amount: null } },
        { groupId: "group-3", _sum: { amount: 2000 } },
      ],
    });
    const mockGroupGateway = createMockGroupGateway();

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const groupLayer = Layer.succeed(GroupGatewayTag, mockGroupGateway);
    const combinedLayer = Layer.merge(coinLayer, groupLayer);

    const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
    const program = getCoinQuickStatsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.richestGroupId).toBe("group-3");
  });

  it("should omit richest group info when group not found", async () => {
    const mockCoinGateway = createMockCoinGateway({
      sumAmount: 5000,
      count: 2,
      totalCoinsByGroup: [{ groupId: "group-1", _sum: { amount: 5000 } }],
    });
    const mockGroupGateway = createMockGroupGateway({ group: null });

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const groupLayer = Layer.succeed(GroupGatewayTag, mockGroupGateway);
    const combinedLayer = Layer.merge(coinLayer, groupLayer);

    const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
    const program = getCoinQuickStatsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.richestGroupId).toBe("group-1");
    expect(result?.richestGroupName).toBeUndefined();
  });

  it("should handle empty totalCoinsByGroup array", async () => {
    const mockCoinGateway = createMockCoinGateway({
      sumAmount: 1000,
      count: 1,
      totalCoinsByGroup: [],
    });
    const mockGroupGateway = createMockGroupGateway();

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const groupLayer = Layer.succeed(GroupGatewayTag, mockGroupGateway);
    const combinedLayer = Layer.merge(coinLayer, groupLayer);

    const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
    const program = getCoinQuickStatsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.totalCoins).toBe(1000);
    expect(result?.richestGroupId).toBeUndefined();
  });
});
