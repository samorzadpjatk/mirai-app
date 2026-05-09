import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useAdminUsers } from "../../admin/useAdminUsers";

// Mock tRPC
const mockSearchWithPaginationQuery = jest.fn(() => ({
  queryKey: ["user", "searchWithPagination"],
}));

const mockSearchWithPaginationQueryClient = jest.fn();

const mockGroupGetAllQuery = jest.fn(() => ({
  queryKey: ["group", "getAll"],
}));

const mockAssignUserToGroupMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockRemoveUserFromGroupMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockCreateUserMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockBanUserMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockDeleteUserMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockUpdateNameMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockUpdateWristNumberMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockRemoveWristNumberMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockUpdateHouseNumberMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockRemoveHouseNumberMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    user: {
      searchWithPagination: {
        queryOptions: mockSearchWithPaginationQuery,
      },
      createUser: {
        mutationOptions: mockCreateUserMutation,
      },
      banUserUntil: {
        mutationOptions: mockBanUserMutation,
      },
      deleteUser: {
        mutationOptions: mockDeleteUserMutation,
      },
      updateName: {
        mutationOptions: mockUpdateNameMutation,
      },
      updateWristNumber: {
        mutationOptions: mockUpdateWristNumberMutation,
      },
      removeWristNumber: {
        mutationOptions: mockRemoveWristNumberMutation,
      },
      updateHouseNumber: {
        mutationOptions: mockUpdateHouseNumberMutation,
      },
      removeHouseNumber: {
        mutationOptions: mockRemoveHouseNumberMutation,
      },
    },
    group: {
      getAll: {
        queryOptions: mockGroupGetAllQuery,
      },
      assignUserToGroup: {
        mutationOptions: mockAssignUserToGroupMutation,
      },
      removeUserFromGroup: {
        mutationOptions: mockRemoveUserFromGroupMutation,
      },
    },
  })),
  useTRPCClient: jest.fn(() => ({
    user: {
      searchWithPagination: {
        query: mockSearchWithPaginationQueryClient,
      },
    },
  })),
}));

// Mock query invalidation
jest.mock("@mirai-app/trpc/client/query", () => ({
  invalidateUserQueries: jest.fn(),
}));

// Mock React Query
const mockUseInfiniteQuery = jest.fn();
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockGetQueryClient = jest.fn(() => ({
  invalidateQueries: mockInvalidateQueries,
}));

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockGetQueryClient(),
}));

describe("useAdminUsers", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    expect(result.current.usersLoading).toBe(true);
    expect(result.current.users).toEqual([]);
  });

  it("should return users from API", async () => {
    const mockUsers = [
      {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "USER" as const,
        tripId: "trip-123",
      },
      {
        id: "user-2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        role: "ADMIN" as const,
        tripId: "trip-123",
        group: { id: "group-1", name: "Group A" },
      },
    ];

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            users: mockUsers,
            pagination: { hasMore: false, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[0].id).toBe("user-1");
    expect(result.current.users[1].role).toBe("ADMIN");
  });

  it("should return groups from API", async () => {
    const mockGroups = [
      { id: "group-1", name: "Group A" },
      { id: "group-2", name: "Group B" },
    ];

    mockUseQuery.mockReturnValue({
      data: mockGroups,
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            users: [],
            pagination: { hasMore: false, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0].name).toBe("Group A");
  });

  it("should assign user to group", async () => {
    const mockAssign = jest.fn<(data: { userId: string; groupId: string; tripId: string }) => Promise<{ id: string; userId: string; groupId: string; tripId: string }>>().mockResolvedValue({
      id: "assignment-1",
      userId: "user-1",
      groupId: "group-1",
      tripId: "trip-123",
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockAssign,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.assignToGroup("user-1", "group-1");
    });

    expect(mockAssign).toHaveBeenCalledWith({
      userId: "user-1",
      tripId: "trip-123",
      groupId: "group-1",
    });
  });

  it("should remove user from group", async () => {
    const mockRemove = jest.fn<(data: { userId: string; tripId: string }) => Promise<undefined>>().mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockRemove,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.removeFromGroup("user-1");
    });

    expect(mockRemove).toHaveBeenCalledWith({
      userId: "user-1",
      tripId: "trip-123",
    });
  });

  it("should create user", async () => {
    const mockCreate = jest.fn<(data: { tripId: string; firstName: string; lastName: string; email: string }) => Promise<{ id: string; firstName: string; lastName: string; email: string }>>().mockResolvedValue({
      id: "user-new",
      firstName: "New",
      lastName: "User",
      email: "new@example.com",
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    // Skip first 2 mutations (assign, remove)
    mockUseMutation
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({
        mutateAsync: mockCreate,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.createUser({
        tripId: "trip-123",
        firstName: "New",
        lastName: "User",
        email: "new@example.com",
      });
    });

    expect(mockCreate).toHaveBeenCalledWith({
      tripId: "trip-123",
      firstName: "New",
      lastName: "User",
      email: "new@example.com",
    });
  });

  it("should ban user", async () => {
    const mockBan = jest.fn<(data: { userId: string; bannedUntilMs: number; reason: string }) => Promise<undefined>>().mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    // Skip first 3 mutations
    mockUseMutation
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({
        mutateAsync: mockBan,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.banUserUntil({
        userId: "user-1",
        bannedUntilMs: Date.now() + 86400000,
        reason: "Violation",
      });
    });

    expect(mockBan).toHaveBeenCalledWith({
      userId: "user-1",
      bannedUntilMs: expect.any(Number),
      reason: "Violation",
    });
  });

  it("should delete user", async () => {
    const mockDelete = jest.fn<(data: { userId: string; tripId: string }) => Promise<undefined>>().mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    // Skip first 4 mutations
    mockUseMutation
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({
        mutateAsync: mockDelete,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.deleteUser({
        userId: "user-1",
        tripId: "trip-123",
      });
    });

    expect(mockDelete).toHaveBeenCalledWith({
      userId: "user-1",
      tripId: "trip-123",
    });
  });

  it("should update user name with trimmed values", async () => {
    const mockUpdateName = jest.fn<(data: { userId: string; firstName: string; lastName: string }) => Promise<undefined>>().mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    // Skip first 5 mutations
    mockUseMutation
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({
        mutateAsync: mockUpdateName,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.updateName({
        userId: "user-1",
        firstName: "  John  ",
        lastName: "  Doe  ",
      });
    });

    expect(mockUpdateName).toHaveBeenCalledWith({
      userId: "user-1",
      firstName: "John",
      lastName: "Doe",
    });
  });

  it("should update wrist number", async () => {
    const mockUpdateWrist = jest.fn<(data: { userId: string; tripId: string; wristNumber: string }) => Promise<undefined>>().mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    // Skip first 6 mutations
    mockUseMutation
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({
        mutateAsync: mockUpdateWrist,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.updateWristNumber("user-1", "W123");
    });

    expect(mockUpdateWrist).toHaveBeenCalledWith({
      userId: "user-1",
      tripId: "trip-123",
      wristNumber: "W123",
    });
  });

  it("should remove wrist number when empty string provided", async () => {
    const mockRemoveWrist = jest.fn<(data: { userId: string; tripId: string }) => Promise<undefined>>().mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    // Skip first 7 mutations
    mockUseMutation
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({
        mutateAsync: mockRemoveWrist,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.updateWristNumber("user-1", "   ");
    });

    expect(mockRemoveWrist).toHaveBeenCalledWith({
      userId: "user-1",
      tripId: "trip-123",
    });
  });

  it("should update house number", async () => {
    const mockUpdateHouse = jest.fn<(data: { userId: string; tripId: string; houseNumber: string }) => Promise<undefined>>().mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    // Skip first 8 mutations
    mockUseMutation
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({
        mutateAsync: mockUpdateHouse,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.updateHouseNumber("user-1", "H456");
    });

    expect(mockUpdateHouse).toHaveBeenCalledWith({
      userId: "user-1",
      tripId: "trip-123",
      houseNumber: "H456",
    });
  });

  it("should remove house number when empty string provided", async () => {
    const mockRemoveHouse = jest.fn<(data: { userId: string; tripId: string }) => Promise<undefined>>().mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    // Skip first 9 mutations
    mockUseMutation
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({ mutateAsync: jest.fn(), isPending: false })
      .mockReturnValueOnce({
        mutateAsync: mockRemoveHouse,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.updateHouseNumber("user-1", "   ");
    });

    expect(mockRemoveHouse).toHaveBeenCalledWith({
      userId: "user-1",
      tripId: "trip-123",
    });
  });

  it("should indicate loading states for mutations", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    expect(result.current.isAssigningToGroup).toBe(true);
    expect(result.current.isRemovingFromGroup).toBe(true);
    expect(result.current.isCreatingUser).toBe(true);
    expect(result.current.isBanningUser).toBe(true);
    expect(result.current.isDeletingUser).toBe(true);
    expect(result.current.isUpdatingName).toBe(true);
    expect(result.current.isUpdatingWristNumber).toBe(true);
    expect(result.current.isRemovingWristNumber).toBe(true);
    expect(result.current.isUpdatingHouseNumber).toBe(true);
    expect(result.current.isRemovingHouseNumber).toBe(true);
  });

  it("should handle pagination", async () => {
    const mockFetchNextPage = jest.fn();

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            users: [{ id: "user-1", firstName: "John", lastName: "Doe", email: "john@example.com", role: "USER", tripId: "trip-123" }],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    expect(result.current.usersHasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchMoreUsers();
    });

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it("should handle refetch", async () => {
    const mockRefetch = jest.fn();

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: mockRefetch,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    await act(async () => {
      await result.current.refetchUsers();
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("should handle refetching state", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminUsers(tripId, "", "firstName"));

    expect(result.current.usersRefetching).toBe(true);
  });
});
