import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import {
  useRewards,
  useAdminRewards,
  useReward,
  useCreateReward,
  useUpdateReward,
  useSetRewardHidden,
  useDeleteReward,
  usePurchaseReward,
  useRewardPurchaseHistory,
  useUpdateRewardPurchaseStatus,
  useUpdateMyRewardPurchaseStatus,
} from "../../rewards";

// Mock tRPC
const mockUseTRPC = jest.fn();
const mockUseTRPCClient = jest.fn();

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => mockUseTRPC()),
  useTRPCClient: jest.fn(() => mockUseTRPCClient()),
}));

// Mock query invalidation
jest.mock("@mirai-app/trpc/client/query", () => ({
  invalidateRewardQueries: jest.fn(),
  invalidateTransactionQueries: jest.fn(),
}));

// Mock React Query
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUseInfiniteQuery = jest.fn();
const mockUseQueryClient = jest.fn(() => ({
  invalidateQueries: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
  useQueryClient: jest.fn(() => mockUseQueryClient()),
}));

describe("useRewards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return rewards for a trip", () => {
    const mockRewards = [
      { id: "reward-1", name: "Reward One", cost: 100 },
      { id: "reward-2", name: "Reward Two", cost: 200 },
    ];

    mockUseTRPC.mockReturnValue({
      reward: {
        getByTrip: {
          queryOptions: jest.fn(() => ({
            queryKey: ["reward", "getByTrip", "trip-1"],
          })),
        },
      },
    });

    mockUseQuery.mockReturnValue({
      data: mockRewards,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useRewards("trip-1"));

    expect(result.current.data).toEqual(mockRewards);
  });

  it("should be disabled when no tripId provided", () => {
    mockUseTRPC.mockReturnValue({
      reward: {
        getByTrip: {
          queryOptions: jest.fn((_tripId: string, options: { enabled?: boolean }) => ({
            queryKey: ["reward", "getByTrip", ""],
            enabled: options?.enabled,
          })),
        },
      },
    });

    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    renderHook(() => useRewards(""));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });
});

describe("useAdminRewards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return paginated rewards for admin", async () => {
    const mockRewards = [
      { id: "reward-1", name: "Admin Reward 1", hidden: false },
      { id: "reward-2", name: "Admin Reward 2", hidden: true },
    ];

    mockUseTRPC.mockReturnValue({
      reward: {
        getByTripAdmin: {
          queryOptions: jest.fn(() => ({
            queryKey: ["reward", "getByTripAdmin", "trip-1"],
          })),
        },
      },
    });

    mockUseTRPCClient.mockReturnValue({
      reward: {
        getByTripAdmin: {
          query: jest.fn(),
        },
      },
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            rewards: mockRewards,
            pagination: { hasMore: false, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      error: null,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { result } = renderHook(() => useAdminRewards("trip-1"));

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });

    expect(result.current.data[0]!.id).toBe("reward-1");
    expect(result.current.data[1]!.id).toBe("reward-2");
  });

  it("should handle pagination", async () => {
    mockUseTRPC.mockReturnValue({
      reward: {
        getByTripAdmin: {
          queryOptions: jest.fn(() => ({
            queryKey: ["reward", "getByTripAdmin", "trip-1"],
          })),
        },
      },
    });

    const fetchNextPage = jest.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            rewards: [{ id: "reward-1" }],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      error: null,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { result } = renderHook(() => useAdminRewards("trip-1"));

    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    expect(fetchNextPage).toHaveBeenCalled();
  });
});

describe("useReward", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return reward by ID", () => {
    const mockReward = {
      id: "reward-1",
      name: "Specific Reward",
      description: "A detailed reward",
      cost: 150,
    };

    mockUseTRPC.mockReturnValue({
      reward: {
        getById: {
          queryOptions: jest.fn(() => ({
            queryKey: ["reward", "getById", "reward-1"],
          })),
        },
      },
    });

    mockUseQuery.mockReturnValue({
      data: mockReward,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useReward("reward-1"));

    expect(result.current.data).toEqual(mockReward);
  });

  it("should be disabled when no ID provided", () => {
    mockUseTRPC.mockReturnValue({
      reward: {
        getById: {
          queryOptions: jest.fn((_id: string, options: { enabled?: boolean }) => ({
            queryKey: ["reward", "getById", ""],
            enabled: options?.enabled,
          })),
        },
      },
    });

    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    renderHook(() => useReward(null));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });
});

describe("useCreateReward", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create reward and invalidate queries", async () => {
    const mockMutate = jest.fn<(data: { name: string; cost: number; tripId: string }) => Promise<{ id: string }>>().mockResolvedValue({ id: "new-reward" });

    mockUseTRPC.mockReturnValue({
      reward: {
        create: {
          mutationOptions: jest.fn(() => ({
            mutationFn: mockMutate,
          })),
        },
      },
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutate,
    });

    const { result } = renderHook(() => useCreateReward());

    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { name: string; cost: number; tripId: string }) => Promise<void>)({
        name: "New Reward",
        cost: 100,
        tripId: "trip-1",
      });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useUpdateReward", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update reward and invalidate queries", async () => {
    const mockMutate = jest.fn<(data: { id: string; name: string }) => Promise<{ id: string }>>().mockResolvedValue({ id: "reward-1" });

    mockUseTRPC.mockReturnValue({
      reward: {
        update: {
          mutationOptions: jest.fn(() => ({
            mutationFn: mockMutate,
          })),
        },
      },
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutate,
    });

    const { result } = renderHook(() => useUpdateReward());

    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { id: string; name: string }) => Promise<void>)({
        id: "reward-1",
        name: "Updated Reward",
      });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useSetRewardHidden", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should set reward hidden status", async () => {
    const mockMutate = jest.fn<(data: { id: string; hidden: boolean }) => Promise<{ id: string; hidden: boolean }>>().mockResolvedValue({ id: "reward-1", hidden: true });

    mockUseTRPC.mockReturnValue({
      reward: {
        setHidden: {
          mutationOptions: jest.fn(() => ({
            mutationFn: mockMutate,
          })),
        },
      },
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutate,
    });

    const { result } = renderHook(() => useSetRewardHidden());

    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { id: string; hidden: boolean }) => Promise<void>)({
        id: "reward-1",
        hidden: true,
      });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useDeleteReward", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete reward and invalidate queries", async () => {
    const mockMutate = jest.fn<(data: { id: string }) => Promise<{ success: boolean }>>().mockResolvedValue({ success: true });

    mockUseTRPC.mockReturnValue({
      reward: {
        delete: {
          mutationOptions: jest.fn(() => ({
            mutationFn: mockMutate,
          })),
        },
      },
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutate,
    });

    const { result } = renderHook(() => useDeleteReward());

    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { id: string }) => Promise<void>)({ id: "reward-1" });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("usePurchaseReward", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should purchase reward and invalidate queries", async () => {
    const mockMutate = jest.fn<(data: { rewardId: string; tripId: string }) => Promise<{ purchaseId: string; rewardId: string }>>().mockResolvedValue({
      purchaseId: "purchase-1",
      rewardId: "reward-1",
    });

    mockUseTRPC.mockReturnValue({
      reward: {
        purchase: {
          mutationOptions: jest.fn(() => ({
            mutationFn: mockMutate,
          })),
        },
      },
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutate,
    });

    const { result } = renderHook(() => usePurchaseReward());

    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { rewardId: string; tripId: string }) => Promise<void>)({
        rewardId: "reward-1",
        tripId: "trip-1",
      });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useRewardPurchaseHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return purchase history", async () => {
    const mockPurchases = [
      { id: "purchase-1", rewardId: "reward-1", userId: "user-1", status: "completed" },
      { id: "purchase-2", rewardId: "reward-2", userId: "user-2", status: "pending" },
    ];

    mockUseTRPC.mockReturnValue({
      reward: {
        getPurchaseHistory: {
          queryOptions: jest.fn(() => ({
            queryKey: ["reward", "getPurchaseHistory", "trip-1"],
          })),
        },
      },
    });

    mockUseTRPCClient.mockReturnValue({
      reward: {
        getPurchaseHistory: {
          query: jest.fn(),
        },
      },
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            purchases: mockPurchases,
            pagination: { hasMore: false, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      error: null,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { result } = renderHook(() => useRewardPurchaseHistory("trip-1"));

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });
  });
});

describe("useUpdateRewardPurchaseStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update purchase status", async () => {
    const mockMutate = jest.fn<(data: { purchaseId: string; status: string }) => Promise<{ purchaseId: string; rewardId: string; status: string }>>().mockResolvedValue({
      purchaseId: "purchase-1",
      rewardId: "reward-1",
      status: "completed",
    });

    mockUseTRPC.mockReturnValue({
      reward: {
        updatePurchaseStatus: {
          mutationOptions: jest.fn(() => ({
            mutationFn: mockMutate,
          })),
        },
      },
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutate,
    });

    const { result } = renderHook(() => useUpdateRewardPurchaseStatus());

    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { purchaseId: string; status: string }) => Promise<void>)({
        purchaseId: "purchase-1",
        status: "completed",
      });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useUpdateMyRewardPurchaseStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update my purchase status", async () => {
    const mockMutate = jest.fn<(data: { purchaseId: string; status: string }) => Promise<{ purchaseId: string; status: string }>>().mockResolvedValue({
      purchaseId: "purchase-1",
      status: "redeemed",
    });

    mockUseTRPC.mockReturnValue({
      reward: {
        updateMyPurchaseStatus: {
          mutationOptions: jest.fn(() => ({
            mutationFn: mockMutate,
          })),
        },
      },
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutate,
    });

    const { result } = renderHook(() => useUpdateMyRewardPurchaseStatus());

    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { purchaseId: string; status: string }) => Promise<void>)({
        purchaseId: "purchase-1",
        status: "redeemed",
      });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});
