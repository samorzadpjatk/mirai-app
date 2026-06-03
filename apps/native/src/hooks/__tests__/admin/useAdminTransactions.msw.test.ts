import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { waitFor, act } from "@testing-library/react-native";
import {
  useAdminTransactions,
  buildTransactionQueryInput,
  getNextTransactionPageParam,
} from "../../admin/useAdminTransactions";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler, resetHandlers } from "../../../test-utils/msw/server";

describe("useAdminTransactions (MSW)", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return loading state initially", async () => {
    server.use(
      createORPCHandler(
        ["coinTransaction", "getAll"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["group", "getAllNames"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.groupsLoading).toBe(true);
    expect(result.current.transactions).toEqual([]);
    expect(result.current.groups).toEqual([]);
  });

  it("should return transactions and groups from API", async () => {
    const mockTransactions = [
      {
        id: "tx-1",
        amount: 100,
        reason: "Bonus",
        createdAt: "2024-01-01T00:00:00Z",
        group: { id: "group-1", name: "Group A" },
        admin: { id: "user-1", firstName: "John", lastName: "Doe" },
      },
    ];

    const mockGroups = [{ id: "group-1", name: "Group A" }];

    server.use(
      createORPCHandler(["coinTransaction", "getAll"], () => ({
        transactions: mockTransactions,
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
      createORPCHandler(["group", "getAllNames"], () => mockGroups),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0]!.id).toBe("tx-1");
    expect(result.current.transactions[0]!.amount).toBe(100);
    expect(result.current.transactions[0]!.group.name).toBe("Group A");
    expect(result.current.groups).toEqual(mockGroups);
  });

  it("should handle empty transactions and groups", async () => {
    server.use(
      createORPCHandler(["coinTransaction", "getAll"], () => ({
        transactions: [],
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
      createORPCHandler(["group", "getAllNames"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toEqual([]);
    expect(result.current.groups).toEqual([]);
  });

  it("should handle error state", async () => {
    server.use(
      createORPCHandler(["coinTransaction", "getAll"], () => {
        throw new Error("Failed to fetch transactions");
      }),
      createORPCHandler(["group", "getAllNames"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toEqual([]);
  });

  it("should fetch next page", async () => {
    let callCount = 0;
    const mockTransactions = [
      {
        id: "tx-1",
        amount: 100,
        reason: "Bonus",
        createdAt: "2024-01-01T00:00:00Z",
        group: { id: "group-1", name: "Group A" },
        admin: { id: "user-1", firstName: "John", lastName: "Doe" },
      },
    ];

    server.use(
      createORPCHandler(["coinTransaction", "getAll"], () => {
        callCount++;
        return {
          transactions:
            callCount === 1
              ? mockTransactions
              : [
                  {
                    id: "tx-2",
                    amount: 200,
                    reason: "Penalty",
                    createdAt: "2024-01-02T00:00:00Z",
                    group: { id: "group-2", name: "Group B" },
                    admin: { id: "user-2", firstName: "Jane", lastName: "Doe" },
                  },
                ],
          pagination: { hasMore: callCount === 1, offset: (callCount - 1) * 50, limit: 50 },
        };
      }),
      createORPCHandler(["group", "getAllNames"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });
  });

  it("should indicate hasNextPage", async () => {
    server.use(
      createORPCHandler(["coinTransaction", "getAll"], () => ({
        transactions: [],
        pagination: { hasMore: true, offset: 0, limit: 50 },
      })),
      createORPCHandler(["group", "getAllNames"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasNextPage).toBe(true);
  });

  it("should indicate fetching next page", async () => {
    let callCount = 0;
    server.use(
      createORPCHandler(["coinTransaction", "getAll"], () => {
        callCount++;
        if (callCount === 1) {
          return {
            transactions: [],
            pagination: { hasMore: true, offset: 0, limit: 50 },
          };
        }
        return new Promise(() => {
          /* no-op */
        });
      }),
      createORPCHandler(["group", "getAllNames"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFetchingNextPage).toBe(false);

    result.current.fetchNextPage().catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(true);
    });
  });

  it("should indicate refetching", async () => {
    let callCount = 0;
    server.use(
      createORPCHandler(["coinTransaction", "getAll"], () => {
        callCount++;
        if (callCount === 1) {
          return {
            transactions: [],
            pagination: { hasMore: false, offset: 0, limit: 50 },
          };
        }
        return new Promise(() => {
          /* no-op */
        });
      }),
      createORPCHandler(["group", "getAllNames"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isRefetching).toBe(false);

    result.current.refetch().catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(true);
    });
  });

  it("should refetch transactions", async () => {
    let callCount = 0;
    server.use(
      createORPCHandler(["coinTransaction", "getAll"], () => {
        callCount++;
        return {
          transactions:
            callCount === 1
              ? []
              : [
                  {
                    id: "tx-1",
                    amount: 100,
                    reason: "Bonus",
                    createdAt: "2024-01-01T00:00:00Z",
                    group: { id: "group-1", name: "Group A" },
                    admin: { id: "user-1", firstName: "John", lastName: "Doe" },
                  },
                ],
          pagination: { hasMore: false, offset: 0, limit: 50 },
        };
      }),
      createORPCHandler(["group", "getAllNames"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toEqual([]);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(1);
    });
  });

  it("should handle Date createdAt", async () => {
    const mockTransactions = [
      {
        id: "tx-1",
        amount: 100,
        reason: "Bonus",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        group: { id: "group-1", name: "Group A" },
        admin: { id: "user-1", firstName: "John", lastName: "Doe" },
      },
    ];

    server.use(
      createORPCHandler(["coinTransaction", "getAll"], () => ({
        transactions: mockTransactions,
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
      createORPCHandler(["group", "getAllNames"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions[0]!.createdAt).toBe("2024-01-01T00:00:00.000Z");
  });

  it("should handle null reason", async () => {
    const mockTransactions = [
      {
        id: "tx-1",
        amount: 100,
        reason: null,
        createdAt: "2024-01-01T00:00:00Z",
        group: { id: "group-1", name: "Group A" },
        admin: { id: "user-1", firstName: "John", lastName: "Doe" },
      },
    ];

    server.use(
      createORPCHandler(["coinTransaction", "getAll"], () => ({
        transactions: mockTransactions,
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
      createORPCHandler(["group", "getAllNames"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions[0]!.reason).toBe("");
  });
});

describe("getNextTransactionPageParam", () => {
  it("should return undefined when no more pages", () => {
    expect(
      getNextTransactionPageParam({ pagination: { hasMore: false, offset: 0, limit: 50 } }),
    ).toBeUndefined();
  });

  it("should return next offset when more pages", () => {
    expect(
      getNextTransactionPageParam({ pagination: { hasMore: true, offset: 0, limit: 50 } }),
    ).toBe(50);
  });
});

describe("buildTransactionQueryInput", () => {
  it("should build query input with tripId", () => {
    expect(buildTransactionQueryInput("trip-123", 0)).toEqual({
      tripId: "trip-123",
      pagination: { limit: 50, offset: 0 },
    });
  });

  it("should handle non-zero page param", () => {
    expect(buildTransactionQueryInput("trip-123", 50)).toEqual({
      tripId: "trip-123",
      pagination: { limit: 50, offset: 50 },
    });
  });
});
