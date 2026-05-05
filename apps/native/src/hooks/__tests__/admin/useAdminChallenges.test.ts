import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useAdminChallenges } from "../../admin/useAdminChallenges";

// Mock tRPC
const mockGetAllQuery = jest.fn(() => ({
  queryKey: ["challenge", "getAll"],
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

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    challenge: {
      getAll: {
        queryOptions: mockGetAllQuery,
      },
      create: {
        mutationOptions: mockCreateMutation,
      },
      update: {
        mutationOptions: mockUpdateMutation,
      },
      delete: {
        mutationOptions: mockDeleteMutation,
      },
    },
  })),
}));

// Mock React Query
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockGetQueryClient = jest.fn(() => ({
  invalidateQueries: mockInvalidateQueries,
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockGetQueryClient(),
}));

describe("useAdminChallenges", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: true,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallenges());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.challenges).toEqual([]);
  });

  it("should return challenges from API", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Photo Challenge",
        title: "Photo Challenge",
        description: "Take a great photo",
        points: 100,
        category: "standard",
        icon: "camera",
        status: "active",
        tripId: "trip-123",
      },
      {
        id: "challenge-2",
        name: "Wintegral Task",
        title: "Wintegral Task",
        description: "Complete the wintegral",
        points: 200,
        category: "wintegral",
        icon: "star",
        status: "active",
        tripId: "trip-123",
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockChallenges,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toHaveLength(2);
    expect(result.current.challenges[0].id).toBe("challenge-1");
    expect(result.current.challenges[0].title).toBe("Photo Challenge");
    expect(result.current.challenges[1].category).toBe("wintegral");
  });

  it("should handle challenges with null values", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: null,
        title: null,
        description: null,
        points: null,
        category: null,
        icon: null,
        status: null,
        tripId: "trip-123",
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockChallenges,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges[0].title).toBe("");
    expect(result.current.challenges[0].description).toBe("");
    expect(result.current.challenges[0].points).toBe(0);
    expect(result.current.challenges[0].category).toBe("standard");
    expect(result.current.challenges[0].icon).toBe("star");
    expect(result.current.challenges[0].status).toBe("active");
  });

  it("should calculate stats correctly", async () => {
    const mockChallenges = [
      { id: "1", name: "C1", status: "active", category: "standard" },
      { id: "2", name: "C2", status: "active", category: "wintegral" },
      { id: "3", name: "C3", status: "inactive", category: "wintegral" },
      { id: "4", name: "C4", status: "active", category: "special" },
    ];

    mockUseQuery.mockReturnValue({
      data: mockChallenges,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.activeChallenges).toBe(3);
    expect(result.current.stats.wintegralChallenges).toBe(2);
  });

  it("should create challenge", async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      id: "challenge-new",
      name: "New Challenge",
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockCreate,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminChallenges());

    await act(async () => {
      await result.current.createChallenge({
        tripId: "trip-123",
        title: "New Challenge",
        description: "Description",
        submissionType: "IMAGE",
        scoringCategory: "JUDGED_STAFF",
        targetLatitude: 52.2297,
        targetLongitude: 21.0122,
      });
    });

    expect(mockCreate).toHaveBeenCalledWith({
      tripId: "trip-123",
      name: "New Challenge",
      description: "Description",
      submissionType: "IMAGE",
      scoringCategory: "JUDGED_STAFF",
      targetLatitude: 52.2297,
      targetLongitude: 21.0122,
    });
  });

  it("should convert MULTI_IMAGE submission type to IMAGE", async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      id: "challenge-new",
      name: "New Challenge",
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockCreate,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminChallenges());

    await act(async () => {
      await result.current.createChallenge({
        tripId: "trip-123",
        title: "New Challenge",
        submissionType: "MULTI_IMAGE",
      });
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionType: "IMAGE",
      }),
    );
  });

  it("should update challenge", async () => {
    const mockUpdate = jest.fn().mockResolvedValue({
      id: "challenge-1",
      name: "Updated Challenge",
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockUpdate,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminChallenges());

    await act(async () => {
      await result.current.updateChallenge("challenge-1", {
        tripId: "trip-123",
        title: "Updated Challenge",
        description: "Updated Description",
      });
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      id: "challenge-1",
      tripId: "trip-123",
      name: "Updated Challenge",
      description: "Updated Description",
    });
  });

  it("should delete challenge", async () => {
    const mockDelete = jest.fn().mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockDelete,
        isPending: false,
      });

    const { result } = renderHook(() => useAdminChallenges());

    await act(async () => {
      await result.current.deleteChallenge("challenge-1", "trip-123");
    });

    expect(mockDelete).toHaveBeenCalledWith({
      id: "challenge-1",
      tripId: "trip-123",
    });
  });

  it("should indicate loading states for mutations", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: true,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: true,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: true,
      });

    const { result } = renderHook(() => useAdminChallenges());

    expect(result.current.isCreating).toBe(true);
    expect(result.current.isUpdating).toBe(true);
    expect(result.current.isDeleting).toBe(true);
  });

  it("should handle empty challenges array", async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toEqual([]);
    expect(result.current.stats.activeChallenges).toBe(0);
    expect(result.current.stats.wintegralChallenges).toBe(0);
  });

  it("should handle non-array data", async () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallenges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toEqual([]);
  });

  it("should use default submission type and scoring category", async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      id: "challenge-new",
      name: "New Challenge",
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockCreate,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminChallenges());

    await act(async () => {
      await result.current.createChallenge({
        tripId: "trip-123",
        title: "New Challenge",
      });
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionType: "IMAGE",
        scoringCategory: "JUDGED_STAFF",
      }),
    );
  });
});
