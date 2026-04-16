import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import { UserRole } from "@mirai-app/domain";
import {
  getCoinAdditionalInsightsUseCase,
  type GetCoinAdditionalInsightsInput,
} from "./get-additional-insights";
import {
  CoinTransactionGatewayTag,
  type CoinTransactionGateway,
} from "../ports/gateway";
import { UserGatewayTag, type UserGateway } from "../../user/ports/gateway";
import type { CoinTransactionDTO } from "@mirai-app/domain";
import type { UserDTO } from "../../user/dto";

function createMockCoinGateway(
  options: {
    recentTransactions?: CoinTransactionDTO[];
    mostActiveAdminStats?: Array<{ adminId: string; _count: { id: number } }>;
  } = {},
): CoinTransactionGateway {
  return {
    count: () => Effect.succeed(0),
    sumAmount: () => Effect.succeed(null),
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
    findRecent: () => Effect.succeed(options.recentTransactions ?? []),
    getTotalCoinsByGroup: () => Effect.succeed([]),
    groupByAdmin: () => Effect.succeed(options.mostActiveAdminStats ?? []),
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

function createMockUser(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: "admin-123",
    authUserId: "auth-123",
    firstName: "John",
    lastName: "Doe",
    nickname: null,
    email: "john@example.com",
    phone: null,
    avatarUrl: null,
    role: UserRole.ADMIN,
    status: {} as UserDTO["status"],
    groupId: null,
    bio: null,
    birthDate: null,
    shirtSize: null,
    dietaryRequirements: null,
    medicalInfo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockUserGateway(
  options: {
    user?: UserDTO | null;
  } = {},
): UserGateway {
  return {
    create: (user: UserDTO) => Effect.succeed(user),
    findById: () =>
      Effect.succeed(
        options.user === undefined ? createMockUser() : options.user,
      ),
    findByAuthUserId: () => Effect.succeed(null),
    findAllConnection: () =>
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
    findByRoleConnection: () =>
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
    update: (user: UserDTO) => Effect.succeed(user),
    delete: () => Effect.succeed(void 0),
    existsByAuthUserId: () => Effect.succeed(false),
  };
}

describe("[UNIT] getCoinAdditionalInsightsUseCase", () => {
  it("should return insights with most active admin and recent transactions", async () => {
    const recentTransactions: CoinTransactionDTO[] = [
      {
        id: "tx-1",
        groupId: "group-123",
        amount: 50,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mostActiveAdminStats = [{ adminId: "admin-123", _count: { id: 5 } }];

    const mockCoinGateway = createMockCoinGateway({
      recentTransactions,
      mostActiveAdminStats,
    });
    const mockUserGateway = createMockUserGateway();

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const userLayer = Layer.succeed(UserGatewayTag, mockUserGateway);
    const combinedLayer = Layer.merge(coinLayer, userLayer);

    const input: GetCoinAdditionalInsightsInput = {
      tripId: "trip-123",
      recentLimit: 5,
    };

    const program = getCoinAdditionalInsightsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.recentTransactions).toHaveLength(1);
    expect(result?.recentTransactions[0].id).toBe("tx-1");
    expect(result?.mostActiveAdmin).not.toBeNull();
    expect(result?.mostActiveAdmin?.name).toBe("John Doe");
    expect(result?.mostActiveAdmin?.transactionCount).toBe(5);
  });

  it("should return null when no data exists", async () => {
    const mockCoinGateway = createMockCoinGateway({
      recentTransactions: [],
      mostActiveAdminStats: [],
    });
    const mockUserGateway = createMockUserGateway();

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const userLayer = Layer.succeed(UserGatewayTag, mockUserGateway);
    const combinedLayer = Layer.merge(coinLayer, userLayer);

    const input: GetCoinAdditionalInsightsInput = {
      tripId: "trip-empty",
    };

    const program = getCoinAdditionalInsightsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toBeNull();
  });

  it("should use adminId as name fallback when user not found", async () => {
    const recentTransactions: CoinTransactionDTO[] = [
      {
        id: "tx-1",
        groupId: "group-123",
        amount: 50,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mostActiveAdminStats = [{ adminId: "admin-123", _count: { id: 3 } }];

    const mockCoinGateway = createMockCoinGateway({
      recentTransactions,
      mostActiveAdminStats,
    });
    const mockUserGateway = createMockUserGateway({ user: null });

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const userLayer = Layer.succeed(UserGatewayTag, mockUserGateway);
    const combinedLayer = Layer.merge(coinLayer, userLayer);

    const input: GetCoinAdditionalInsightsInput = {
      tripId: "trip-123",
    };

    const program = getCoinAdditionalInsightsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.mostActiveAdmin?.name).toBe("admin-123");
    expect(result?.mostActiveAdmin?.transactionCount).toBe(3);
  });

  it("should use default recentLimit when not provided", async () => {
    const recentTransactions: CoinTransactionDTO[] = [
      {
        id: "tx-1",
        groupId: "group-123",
        amount: 50,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockCoinGateway = createMockCoinGateway({ recentTransactions });
    const mockUserGateway = createMockUserGateway();

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const userLayer = Layer.succeed(UserGatewayTag, mockUserGateway);
    const combinedLayer = Layer.merge(coinLayer, userLayer);

    const input: GetCoinAdditionalInsightsInput = {
      tripId: "trip-123",
    };

    const program = getCoinAdditionalInsightsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.recentTransactions).toHaveLength(1);
  });

  it("should return only recent transactions when no admin stats", async () => {
    const recentTransactions: CoinTransactionDTO[] = [
      {
        id: "tx-1",
        groupId: "group-123",
        amount: 50,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockCoinGateway = createMockCoinGateway({
      recentTransactions,
      mostActiveAdminStats: [],
    });
    const mockUserGateway = createMockUserGateway();

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const userLayer = Layer.succeed(UserGatewayTag, mockUserGateway);
    const combinedLayer = Layer.merge(coinLayer, userLayer);

    const input: GetCoinAdditionalInsightsInput = {
      tripId: "trip-123",
    };

    const program = getCoinAdditionalInsightsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.recentTransactions).toHaveLength(1);
    expect(result?.mostActiveAdmin).toBeNull();
  });

  it("should handle user with only first name", async () => {
    const mostActiveAdminStats = [{ adminId: "admin-123", _count: { id: 2 } }];

    const mockCoinGateway = createMockCoinGateway({ mostActiveAdminStats });
    const mockUserGateway = createMockUserGateway({
      user: createMockUser({ firstName: "Jane", lastName: null }),
    });

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const userLayer = Layer.succeed(UserGatewayTag, mockUserGateway);
    const combinedLayer = Layer.merge(coinLayer, userLayer);

    const input: GetCoinAdditionalInsightsInput = {
      tripId: "trip-123",
    };

    const program = getCoinAdditionalInsightsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.mostActiveAdmin?.name).toBe("Jane");
  });

  it("should handle user with only last name", async () => {
    const mostActiveAdminStats = [{ adminId: "admin-123", _count: { id: 2 } }];

    const mockCoinGateway = createMockCoinGateway({ mostActiveAdminStats });
    const mockUserGateway = createMockUserGateway({
      user: createMockUser({ firstName: null, lastName: "Smith" }),
    });

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const userLayer = Layer.succeed(UserGatewayTag, mockUserGateway);
    const combinedLayer = Layer.merge(coinLayer, userLayer);

    const input: GetCoinAdditionalInsightsInput = {
      tripId: "trip-123",
    };

    const program = getCoinAdditionalInsightsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.mostActiveAdmin?.name).toBe("Smith");
  });

  it("should show 'Unknown user' when user has no name", async () => {
    const mostActiveAdminStats = [{ adminId: "admin-123", _count: { id: 2 } }];

    const mockCoinGateway = createMockCoinGateway({ mostActiveAdminStats });
    const mockUserGateway = createMockUserGateway({
      user: createMockUser({ firstName: null, lastName: null }),
    });

    const coinLayer = Layer.succeed(CoinTransactionGatewayTag, mockCoinGateway);
    const userLayer = Layer.succeed(UserGatewayTag, mockUserGateway);
    const combinedLayer = Layer.merge(coinLayer, userLayer);

    const input: GetCoinAdditionalInsightsInput = {
      tripId: "trip-123",
    };

    const program = getCoinAdditionalInsightsUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.mostActiveAdmin?.name).toBe("Unknown user");
  });
});
