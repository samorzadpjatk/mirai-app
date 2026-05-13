import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useAdminGroups } from "../../admin/useAdminGroups";

// Mock oRPC
const mockGetAllInfiniteOptions = jest.fn(
  (options: {
    input: (pageParam: number) => unknown;
    initialPageParam: number;
    getNextPageParam: (lastPage: {
      pagination: { hasMore: boolean; offset: number; limit: number };
    }) => number | undefined;
    enabled?: boolean;
  }) => ({
    ...options,
    queryKey: ["group", "getAll"],
  }),
);

const mockGetAllUsersQuery = jest.fn((options: { input: { tripId: string } }) => ({
  queryKey: ["user", "getAll", options.input.tripId],
}));

const mockCreateMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockUpdateMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockDeleteMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    group: {
      getAll: {
        infiniteOptions: (options: {
          input: (pageParam: number) => unknown;
          initialPageParam: number;
          getNextPageParam: (lastPage: {
            pagination: { hasMore: boolean; offset: number; limit: number };
          }) => number | undefined;
          enabled?: boolean;
        }) => mockGetAllInfiniteOptions(options),
      },
      create: {
        mutationOptions: () => mockCreateMutation(),
      },
      update: {
        mutationOptions: () => mockUpdateMutation(),
      },
      delete: {
        mutationOptions: () => mockDeleteMutation(),
      },
    },
    user: {
      getAll: {
        queryOptions: (options: { input: { tripId: string } }) => mockGetAllUsersQuery(options),
      },
    },
  },
}));

// Mock query invalidation
jest.mock("@mirai-app/orpc/client/query", () => ({
  invalidateGroupQueries: jest.fn(),
}));

// Mock React Query
interface InfiniteQueryOptions {
  enabled?: boolean;
}

interface InfiniteQueryResult {
  data: unknown;
  isLoading: boolean;
  isRefetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: jest.Mock;
  refetch: jest.Mock;
  enabled?: boolean;
}

const mockUseInfiniteQuery = jest.fn<(options: InfiniteQueryOptions) => InfiniteQueryResult>();
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockGetQueryClient = jest.fn(() => ({
  invalidateQueries: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (...args: [InfiniteQueryOptions]) => mockUseInfiniteQuery(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockGetQueryClient(),
}));

describe("useAdminGroups", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    expect(result.current.groupsLoading).toBe(true);
    expect(result.current.groups).toEqual([]);
  });

  it("should return groups from API", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Group A",
        description: "Description A",
        image: "image-a.jpg",
        code: "CODEA",
        coins: 1000,
        organizer: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        },
        participants: [
          { id: "p1", firstName: "Alice" },
          { id: "p2", firstName: "Bob" },
        ],
      },
      {
        id: "group-2",
        name: "Group B",
        description: null,
        image: null,
        code: "CODEB",
        coins: 500,
        organizer: null,
        participants: [],
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            groups: mockGroups,
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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0]!.id).toBe("group-1");
    expect(result.current.groups[0]!.name).toBe("Group A");
    expect(result.current.groups[0]!.organizer?.firstName).toBe("John");
    expect(result.current.groups[0]!._count.participants).toBe(2);
    expect(result.current.groups[1]!.organizer).toBeNull();
    expect(result.current.groups[1]!._count.participants).toBe(0);
  });

  it("should return users from API", async () => {
    const mockUsers = [
      {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "USER" as const,
        wristNumber: "W001",
        houseNumber: "H101",
        group: { id: "group-1", name: "Group A" },
        tripId: "trip-123",
      },
      {
        id: "user-2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        role: "ADMIN" as const,
        wristNumber: null,
        houseNumber: null,
        group: null,
        tripId: "trip-123",
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: mockUsers,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[0]!.id).toBe("user-1");
    expect(result.current.users[0]!.role).toBe("USER");
    expect(result.current.users[1]!.role).toBe("ADMIN");
  });

  it("should create group", async () => {
    const mockCreate = jest
      .fn<
        (data: {
          name: string;
          tripId: string;
        }) => Promise<{ id: string; name: string; tripId: string }>
      >()
      .mockResolvedValue({
        id: "group-new",
        name: "New Group",
        tripId: "trip-123",
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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreate,
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    await act(async () => {
      await result.current.createGroup("New Group");
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: "New Group",
      tripId: "trip-123",
    });
  });

  it("should update group with name only", async () => {
    const mockUpdate = jest
      .fn<
        (data: {
          id: string;
          tripId: string;
          name: string;
        }) => Promise<{ id: string; name: string }>
      >()
      .mockResolvedValue({
        id: "group-1",
        name: "Updated Group",
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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockUpdate,
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    await act(async () => {
      await result.current.updateGroup("group-1", "Updated Group");
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      id: "group-1",
      tripId: "trip-123",
      name: "Updated Group",
    });
  });

  it("should update group with organizer only", async () => {
    const mockUpdate = jest
      .fn<
        (data: {
          id: string;
          tripId: string;
          organizerId: string;
        }) => Promise<{ id: string; organizerId: string }>
      >()
      .mockResolvedValue({
        id: "group-1",
        organizerId: "user-2",
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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockUpdate,
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    await act(async () => {
      await result.current.updateGroup("group-1", undefined, "user-2");
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      id: "group-1",
      tripId: "trip-123",
      organizerId: "user-2",
    });
  });

  it("should update group with both name and organizer", async () => {
    const mockUpdate = jest
      .fn<
        (data: {
          id: string;
          tripId: string;
          name: string;
          organizerId: string;
        }) => Promise<{ id: string; name: string; organizerId: string }>
      >()
      .mockResolvedValue({
        id: "group-1",
        name: "Updated Group",
        organizerId: "user-2",
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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockUpdate,
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    await act(async () => {
      await result.current.updateGroup("group-1", "Updated Group", "user-2");
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      id: "group-1",
      tripId: "trip-123",
      name: "Updated Group",
      organizerId: "user-2",
    });
  });

  it("should delete group", async () => {
    const mockDelete = jest
      .fn<(data: { id: string }) => Promise<undefined>>()
      .mockResolvedValue(undefined);

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockDelete,
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    await act(async () => {
      await result.current.deleteGroup("group-1");
    });

    expect(mockDelete).toHaveBeenCalledWith({
      id: "group-1",
    });
  });

  it("should indicate loading states for mutations", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    expect(result.current.isCreatingGroup).toBe(true);
    expect(result.current.isUpdatingGroup).toBe(true);
    expect(result.current.isDeletingGroup).toBe(true);
  });

  it("should handle pagination", async () => {
    const mockFetchNextPage = jest.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            groups: [
              {
                id: "group-1",
                name: "Group A",
                description: null,
                image: null,
                code: "CODEA",
                coins: 100,
                organizer: null,
                participants: [],
              },
            ],
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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    expect(result.current.groupsHasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchMoreGroups();
    });

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it("should handle refetch", async () => {
    const mockRefetch = jest.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: mockRefetch,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    await act(async () => {
      await result.current.refetchGroups();
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("should handle refetching state", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    expect(result.current.groupsRefetching).toBe(true);
  });

  it("should handle fetching next page state", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    expect(result.current.groupsFetchingNextPage).toBe(true);
  });

  it("should flatten multiple pages", async () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            groups: [
              {
                id: "group-1",
                name: "Group A",
                description: null,
                image: null,
                code: "CODEA",
                coins: 100,
                organizer: null,
                participants: [],
              },
            ],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          },
          {
            groups: [
              {
                id: "group-2",
                name: "Group B",
                description: null,
                image: null,
                code: "CODEB",
                coins: 200,
                organizer: null,
                participants: [],
              },
            ],
            pagination: { hasMore: false, offset: 30, limit: 30 },
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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2);
    });

    expect(result.current.groups[0]!.id).toBe("group-1");
    expect(result.current.groups[1]!.id).toBe("group-2");
  });

  it("should return pagination info", async () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            groups: [],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groupsPagination).toEqual({
      hasMore: true,
      offset: 0,
      limit: 30,
    });
  });

  it("should be disabled when tripId is empty", () => {
    mockUseInfiniteQuery.mockImplementation((options) => {
      return {
        data: null,
        isLoading: false,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
        enabled: options.enabled,
      };
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderHook(() => useAdminGroups(""));

    const lastCall = mockUseInfiniteQuery.mock.calls[mockUseInfiniteQuery.mock.calls.length - 1];
    expect(lastCall![0].enabled).toBe(false);
  });
});
