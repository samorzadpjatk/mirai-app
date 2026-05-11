import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useAdminCoins } from "../../admin/useAdminCoins";

// Mock oRPC
const mockGetGroupListQuery = jest.fn((options: { input: { tripId: string } }) => ({
  queryKey: ["group", "getGroupList", options.input.tripId],
}));

const mockAddCoinsMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    group: {
      getGroupList: {
        queryOptions: (options: { input: { tripId: string } }) => mockGetGroupListQuery(options),
      },
      addCoins: {
        mutationOptions: () => mockAddCoinsMutation(),
      },
    },
  },
}));

// Mock query invalidation
jest.mock("@mirai-app/orpc/client/query", () => ({
  invalidateGroupQueries: jest.fn(),
}));

// Mock React Query
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockGetQueryClient = jest.fn(() => ({
  invalidateQueries: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockGetQueryClient(),
}));

describe("useAdminCoins", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    expect(result.current.groupsLoading).toBe(true);
    expect(result.current.groups).toEqual([]);
  });

  it("should return groups from API", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Group A",
        coins: 1000,
        organizer: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        },
        _count: { participants: 10 },
      },
      {
        id: "group-2",
        name: "Group B",
        coins: 500,
        organizer: null,
        _count: { participants: 5 },
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockGroups,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0]!.id).toBe("group-1");
    expect(result.current.groups[0]!.name).toBe("Group A");
    expect(result.current.groups[0]!.coins).toBe(1000);
    expect(result.current.groups[0]!.organizer?.firstName).toBe("John");
    expect(result.current.groups[0]!._count.participants).toBe(10);
  });

  it("should add coins to group", async () => {
    const mockAddCoins = jest.fn<(data: { groupId: string; amount: number; tripId: string }) => Promise<{ id: string; groupId: string; amount: number }>>().mockResolvedValue({
      id: "transaction-1",
      groupId: "group-1",
      amount: 100,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockAddCoins,
      isPending: false,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    await act(async () => {
      await result.current.addCoins("group-1", 100, "Bonus for winning");
    });

    expect(mockAddCoins).toHaveBeenCalledWith({
      groupId: "group-1",
      amount: 100,
      tripId: "trip-123",
    });
  });

  it("should remove coins from group", async () => {
    const mockAddCoins = jest.fn<(data: { groupId: string; amount: number; tripId: string }) => Promise<{ id: string; groupId: string; amount: number }>>().mockResolvedValue({
      id: "transaction-1",
      groupId: "group-1",
      amount: -50,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockAddCoins,
      isPending: false,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    await act(async () => {
      await result.current.removeCoins("group-1", 50, "Penalty");
    });

    expect(mockAddCoins).toHaveBeenCalledWith({
      groupId: "group-1",
      amount: -50,
      tripId: "trip-123",
    });
  });

  it("should throw error when adding non-positive amount", async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    await expect(
      act(async () => {
        await result.current.addCoins("group-1", 0, "Invalid");
      }),
    ).rejects.toThrow("Amount must be positive for adding coins");

    await expect(
      act(async () => {
        await result.current.addCoins("group-1", -10, "Invalid");
      }),
    ).rejects.toThrow("Amount must be positive for adding coins");
  });

  it("should throw error when removing non-positive amount", async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    await expect(
      act(async () => {
        await result.current.removeCoins("group-1", 0, "Invalid");
      }),
    ).rejects.toThrow("Amount must be positive for removing coins");

    await expect(
      act(async () => {
        await result.current.removeCoins("group-1", -10, "Invalid");
      }),
    ).rejects.toThrow("Amount must be positive for removing coins");
  });

  it("should indicate loading state for mutations", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    expect(result.current.isAddingCoins).toBe(true);
    expect(result.current.isRemovingCoins).toBe(true);
  });

  it("should handle empty groups list", async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toEqual([]);
  });

  it("should handle null data from query", async () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toEqual([]);
  });

  it("should handle group without organizer", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Group A",
        coins: 1000,
        organizer: null,
        _count: { participants: 10 },
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockGroups,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups[0]!.organizer).toBeNull();
  });

  it("should pass reason parameter (unused but in interface)", async () => {
    const mockAddCoins = jest.fn<(data: { groupId: string; amount: number; tripId: string }) => Promise<{ id: string; groupId: string; amount: number }>>().mockResolvedValue({
      id: "transaction-1",
      groupId: "group-1",
      amount: 100,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockAddCoins,
      isPending: false,
    });

    const { result } = renderHook(() => useAdminCoins(tripId));

    // The reason parameter is accepted but not used in the current implementation
    await act(async () => {
      await result.current.addCoins("group-1", 100, "This is the reason");
    });

    // Verify the call was made (reason is not passed to API in current implementation)
    expect(mockAddCoins).toHaveBeenCalledWith({
      groupId: "group-1",
      amount: 100,
      tripId: "trip-123",
    });
  });
});
