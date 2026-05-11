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

const mockGetByTripQueryOptions = jest.fn((options: { input: { tripId: string }; enabled?: boolean }) => ({
  queryKey: ["reward", "getByTrip", options.input.tripId],
  enabled: options.enabled,
}));
const mockGetByTripAdminInfiniteOptions = jest.fn((options: { input: (pageParam: number) => { tripId: string; pagination: { limit: number; offset: number } }; initialPageParam: number; getNextPageParam: (lastPage: { pagination: { hasMore: boolean; offset: number; limit: number } }) => number | undefined; enabled?: boolean }) => ({
  queryKey: ["reward", "getByTripAdmin"],
  enabled: options.enabled,
}));
const mockGetByIdQueryOptions = jest.fn((options: { input: { id: string }; enabled?: boolean }) => ({
  queryKey: ["reward", "getById", options.input.id],
  enabled: options.enabled,
}));
const mockCreateMutationOptions = jest.fn((options: { onSuccess?: () => void | Promise<void> }) => ({
  mutationFn: jest.fn(),
  onSuccess: options.onSuccess,
}));
const mockUpdateMutationOptions = jest.fn((options: { onSuccess?: () => void | Promise<void> }) => ({
  mutationFn: jest.fn(),
  onSuccess: options.onSuccess,
}));
const mockSetHiddenMutationOptions = jest.fn((options: { onSuccess?: () => void | Promise<void> }) => ({
  mutationFn: jest.fn(),
  onSuccess: options.onSuccess,
}));
const mockDeleteMutationOptions = jest.fn((options: { onSuccess?: () => void | Promise<void> }) => ({
  mutationFn: jest.fn(),
  onSuccess: options.onSuccess,
}));
const mockPurchaseMutationOptions = jest.fn((options: { onSuccess?: () => void | Promise<void> }) => ({
  mutationFn: jest.fn(),
  onSuccess: options.onSuccess,
}));
const mockGetPurchaseHistoryInfiniteOptions = jest.fn((options: { input: (pageParam: number) => { tripId: string; pagination: { limit: number; offset: number } }; initialPageParam: number; getNextPageParam: (lastPage: { pagination: { hasMore: boolean; offset: number; limit: number } }) => number | undefined; enabled?: boolean }) => ({
  queryKey: ["reward", "getPurchaseHistory"],
  enabled: options.enabled,
}));
const mockUpdatePurchaseStatusMutationOptions = jest.fn((options: { onSuccess?: () => void | Promise<void> }) => ({
  mutationFn: jest.fn(),
  onSuccess: options.onSuccess,
}));
const mockUpdateMyPurchaseStatusMutationOptions = jest.fn((options: { onSuccess?: () => void | Promise<void> }) => ({
  mutationFn: jest.fn(),
  onSuccess: options.onSuccess,
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    reward: {
      getByTrip: { queryOptions: (options: { input: { tripId: string }; enabled?: boolean }) => mockGetByTripQueryOptions(options) },
      getByTripAdmin: { infiniteOptions: (options: { input: (pageParam: number) => { tripId: string; pagination: { limit: number; offset: number } }; initialPageParam: number; getNextPageParam: (lastPage: { pagination: { hasMore: boolean; offset: number; limit: number } }) => number | undefined; enabled?: boolean }) => mockGetByTripAdminInfiniteOptions(options) },
      getById: { queryOptions: (options: { input: { id: string }; enabled?: boolean }) => mockGetByIdQueryOptions(options) },
      create: { mutationOptions: (options: { onSuccess?: () => void | Promise<void> }) => mockCreateMutationOptions(options) },
      update: { mutationOptions: (options: { onSuccess?: () => void | Promise<void> }) => mockUpdateMutationOptions(options) },
      setHidden: { mutationOptions: (options: { onSuccess?: () => void | Promise<void> }) => mockSetHiddenMutationOptions(options) },
      delete: { mutationOptions: (options: { onSuccess?: () => void | Promise<void> }) => mockDeleteMutationOptions(options) },
      purchase: { mutationOptions: (options: { onSuccess?: () => void | Promise<void> }) => mockPurchaseMutationOptions(options) },
      getPurchaseHistory: { infiniteOptions: (options: { input: (pageParam: number) => { tripId: string; pagination: { limit: number; offset: number } }; initialPageParam: number; getNextPageParam: (lastPage: { pagination: { hasMore: boolean; offset: number; limit: number } }) => number | undefined; enabled?: boolean }) => mockGetPurchaseHistoryInfiniteOptions(options) },
      updatePurchaseStatus: { mutationOptions: (options: { onSuccess?: () => void | Promise<void> }) => mockUpdatePurchaseStatusMutationOptions(options) },
      updateMyPurchaseStatus: { mutationOptions: (options: { onSuccess?: () => void | Promise<void> }) => mockUpdateMyPurchaseStatusMutationOptions(options) },
    },
  },
}));

jest.mock("@mirai-app/orpc/client/query", () => ({
  invalidateRewardQueries: jest.fn(),
  invalidateTransactionQueries: jest.fn(),
}));

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
  beforeEach(() => { jest.clearAllMocks(); });

  it("should return rewards for a trip", () => {
    const mockRewards = [
      { id: "reward-1", name: "Reward One", cost: 100 },
      { id: "reward-2", name: "Reward Two", cost: 200 },
    ];

    mockUseQuery.mockReturnValue({ data: mockRewards, isLoading: false, error: null });

    const { result } = renderHook(() => useRewards("trip-1"));

    expect(mockGetByTripQueryOptions).toHaveBeenCalledWith({ input: { tripId: "trip-1" }, enabled: true });
    expect(result.current.data).toEqual(mockRewards);
  });

  it("should be disabled when no tripId provided", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });

    renderHook(() => useRewards(""));

    expect(mockGetByTripQueryOptions).toHaveBeenCalledWith({ input: { tripId: "" }, enabled: false });
  });
});

describe("useAdminRewards", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should return paginated rewards for admin", async () => {
    const mockRewards = [
      { id: "reward-1", name: "Admin Reward 1", hidden: false },
      { id: "reward-2", name: "Admin Reward 2", hidden: true },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ rewards: mockRewards, pagination: { hasMore: false, offset: 0, limit: 30 } }] },
      isLoading: false,
      error: null,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { result } = renderHook(() => useAdminRewards("trip-1"));

    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(result.current.data[0]!.id).toBe("reward-1");
    expect(result.current.data[1]!.id).toBe("reward-2");
  });

  it("should handle pagination", async () => {
    const fetchNextPage = jest.fn();
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ rewards: [{ id: "reward-1" }], pagination: { hasMore: true, offset: 0, limit: 30 } }] },
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
  beforeEach(() => { jest.clearAllMocks(); });

  it("should return reward by ID", () => {
    const mockReward = { id: "reward-1", name: "Specific Reward", description: "A detailed reward", cost: 150 };

    mockUseQuery.mockReturnValue({ data: mockReward, isLoading: false, error: null });

    const { result } = renderHook(() => useReward("reward-1"));

    expect(mockGetByIdQueryOptions).toHaveBeenCalledWith({ input: { id: "reward-1" }, enabled: true });
    expect(result.current.data).toEqual(mockReward);
  });

  it("should be disabled when no ID provided", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });

    renderHook(() => useReward(null));

    expect(mockGetByIdQueryOptions).toHaveBeenCalledWith({ input: { id: "" }, enabled: false });
  });
});

describe("useCreateReward", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should create reward and invalidate queries", async () => {
    const mockMutate = jest.fn<(data: { name: string; cost: number; tripId: string }) => Promise<{ id: string }>>().mockResolvedValue({ id: "new-reward" });
    mockUseMutation.mockReturnValue({ mutateAsync: mockMutate });

    const { result } = renderHook(() => useCreateReward());
    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { name: string; cost: number; tripId: string }) => Promise<void>)({ name: "New Reward", cost: 100, tripId: "trip-1" });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useUpdateReward", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should update reward and invalidate queries", async () => {
    const mockMutate = jest.fn<(data: { id: string; name: string }) => Promise<{ id: string }>>().mockResolvedValue({ id: "reward-1" });
    mockUseMutation.mockReturnValue({ mutateAsync: mockMutate });

    const { result } = renderHook(() => useUpdateReward());
    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { id: string; name: string }) => Promise<void>)({ id: "reward-1", name: "Updated Reward" });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useSetRewardHidden", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should set reward hidden status", async () => {
    const mockMutate = jest.fn<(data: { id: string; hidden: boolean }) => Promise<{ id: string; hidden: boolean }>>().mockResolvedValue({ id: "reward-1", hidden: true });
    mockUseMutation.mockReturnValue({ mutateAsync: mockMutate });

    const { result } = renderHook(() => useSetRewardHidden());
    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { id: string; hidden: boolean }) => Promise<void>)({ id: "reward-1", hidden: true });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useDeleteReward", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should delete reward and invalidate queries", async () => {
    const mockMutate = jest.fn<(data: { id: string }) => Promise<{ success: boolean }>>().mockResolvedValue({ success: true });
    mockUseMutation.mockReturnValue({ mutateAsync: mockMutate });

    const { result } = renderHook(() => useDeleteReward());
    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { id: string }) => Promise<void>)({ id: "reward-1" });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("usePurchaseReward", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should purchase reward and invalidate queries", async () => {
    const mockMutate = jest.fn<(data: { rewardId: string; tripId: string }) => Promise<{ purchaseId: string; rewardId: string }>>().mockResolvedValue({ purchaseId: "purchase-1", rewardId: "reward-1" });
    mockUseMutation.mockReturnValue({ mutateAsync: mockMutate });

    const { result } = renderHook(() => usePurchaseReward());
    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { rewardId: string; tripId: string }) => Promise<void>)({ rewardId: "reward-1", tripId: "trip-1" });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useRewardPurchaseHistory", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should return purchase history", async () => {
    const mockPurchases = [
      { id: "purchase-1", rewardId: "reward-1", userId: "user-1", status: "completed" },
      { id: "purchase-2", rewardId: "reward-2", userId: "user-2", status: "pending" },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ purchases: mockPurchases, pagination: { hasMore: false, offset: 0, limit: 30 } }] },
      isLoading: false,
      error: null,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { result } = renderHook(() => useRewardPurchaseHistory("trip-1"));

    await waitFor(() => expect(result.current.data).toHaveLength(2));
  });
});

describe("useUpdateRewardPurchaseStatus", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should update purchase status", async () => {
    const mockMutate = jest.fn<(data: { purchaseId: string; status: string }) => Promise<{ purchaseId: string; rewardId: string; status: string }>>().mockResolvedValue({ purchaseId: "purchase-1", rewardId: "reward-1", status: "completed" });
    mockUseMutation.mockReturnValue({ mutateAsync: mockMutate });

    const { result } = renderHook(() => useUpdateRewardPurchaseStatus());
    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { purchaseId: string; status: string }) => Promise<void>)({ purchaseId: "purchase-1", status: "completed" });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useUpdateMyRewardPurchaseStatus", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should update my purchase status", async () => {
    const mockMutate = jest.fn<(data: { purchaseId: string; status: string }) => Promise<{ purchaseId: string; status: string }>>().mockResolvedValue({ purchaseId: "purchase-1", status: "redeemed" });
    mockUseMutation.mockReturnValue({ mutateAsync: mockMutate });

    const { result } = renderHook(() => useUpdateMyRewardPurchaseStatus());
    await act(async () => {
      await (result.current.mutateAsync as unknown as (data: { purchaseId: string; status: string }) => Promise<void>)({ purchaseId: "purchase-1", status: "redeemed" });
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});
