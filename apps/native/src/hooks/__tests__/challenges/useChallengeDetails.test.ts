import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useChallengeDetails } from "../../challenges/useChallengeDetails";

// Mock oRPC
const mockChallengeGetByIdQueryOptions = jest.fn((params: { input: { id: string; tripId: string }; enabled?: boolean }) => ({
  queryKey: ["challenge", "getById", params.input.id],
  enabled: params.enabled,
}));

const mockUserGetMyQueryOptions = jest.fn((params: { input: Record<string, never> }) => ({
  queryKey: ["user", "getMy"],
  input: params.input,
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    challenge: {
      getById: {
        queryOptions: (params: { input: { id: string; tripId: string }; enabled?: boolean }) => mockChallengeGetByIdQueryOptions(params),
      },
    },
    user: {
      getMy: {
        queryOptions: (params: { input: Record<string, never> }) => mockUserGetMyQueryOptions(params),
      },
    },
  },
}));

// Mock React Query
const mockUseQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

describe("useChallengeDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: null,
        isLoading: true,
      })
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.challenge).toBeNull();
    expect(result.current.isAssignedToUser).toBe(false);
  });

  it("should return challenge details when loaded", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "Test Challenge",
      description: "A test challenge description",
      submissionType: "IMAGE",
      basePoints: 10,
      firstPlacePoints: 20,
      status: "ACTIVE",
      tripId: "trip-123",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1", name: "John" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenge).toEqual(mockChallenge);
    expect(result.current.challenge?.name).toBe("Test Challenge");
  });

  it("should handle missing challengeId", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1", name: "John" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails(null, "trip-123"));

    expect(result.current.challenge).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle missing tripId", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1", name: "John" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", null));

    expect(result.current.challenge).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle both ids missing", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1", name: "John" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails(null, null));

    expect(result.current.challenge).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should return isAssignedToUser as false when no user", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "Test Challenge",
      description: "A test challenge",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAssignedToUser).toBe(false);
  });

  it("should return isAssignedToUser as false when no challenge", async () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1", name: "John" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAssignedToUser).toBe(false);
  });

  it("should pass correct parameters to challenge query", () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "Test Challenge",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
      });

    renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    expect(mockChallengeGetByIdQueryOptions).toHaveBeenCalledWith({ input: { id: "challenge-123", tripId: "trip-123" }, enabled: true });
  });

  it("should disable query when challengeId is missing", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
      });

    renderHook(() => useChallengeDetails(null, "trip-123"));

    expect(mockChallengeGetByIdQueryOptions).toHaveBeenCalledWith({ input: { id: "", tripId: "trip-123" }, enabled: false });
  });

  it("should disable query when tripId is missing", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
      });

    renderHook(() => useChallengeDetails("challenge-123", null));

    expect(mockChallengeGetByIdQueryOptions).toHaveBeenCalledWith({ input: { id: "challenge-123", tripId: "" }, enabled: false });
  });

  it("should handle challenge with all properties", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "Complete Challenge",
      description: "Full description",
      submissionType: "MULTI_IMAGE",
      basePoints: 15,
      firstPlacePoints: 30,
      scoringCategory: "JUDGED_STAFF",
      status: "VOTING_PHASE",
      image: "https://example.com/challenge.jpg",
      tripId: "trip-123",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1", name: "John", email: "john@example.com" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.challenge).toEqual(mockChallenge);
    });

    expect(result.current.challenge?.submissionType).toBe("MULTI_IMAGE");
    expect(result.current.challenge?.scoringCategory).toBe("JUDGED_STAFF");
    expect(result.current.challenge?.status).toBe("VOTING_PHASE");
  });

  it("should handle loading state for user query", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: null,
        isLoading: true,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.challenge).toBeNull();
  });

  it("should handle challenge with QR_CODE submission type", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "QR Challenge",
      submissionType: "QR_CODE",
      basePoints: 5,
      status: "ACTIVE",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.challenge?.submissionType).toBe("QR_CODE");
    });
  });

  it("should handle challenge with LOCATION submission type", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "Location Challenge",
      submissionType: "LOCATION",
      basePoints: 10,
      status: "ACTIVE",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.challenge?.submissionType).toBe("LOCATION");
    });
  });

  it("should handle challenge with VIDEO submission type", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "Video Challenge",
      submissionType: "VIDEO",
      basePoints: 20,
      status: "ACTIVE",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.challenge?.submissionType).toBe("VIDEO");
    });
  });

  it("should handle challenge with TEXT submission type", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "Text Challenge",
      submissionType: "TEXT",
      basePoints: 5,
      status: "ACTIVE",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.challenge?.submissionType).toBe("TEXT");
    });
  });

  it("should handle challenge with IMAGE_LOCATION submission type", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "Image Location Challenge",
      submissionType: "IMAGE_LOCATION",
      basePoints: 15,
      status: "ACTIVE",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.challenge?.submissionType).toBe("IMAGE_LOCATION");
    });
  });

  it("should handle challenge with null description", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "No Description Challenge",
      description: null,
      submissionType: "IMAGE",
      basePoints: 10,
      status: "ACTIVE",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.challenge?.description).toBeNull();
    });
  });

  it("should handle challenge with null image", async () => {
    const mockChallenge = {
      id: "challenge-123",
      name: "No Image Challenge",
      image: null,
      submissionType: "IMAGE",
      basePoints: 10,
      status: "ACTIVE",
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockChallenge,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
      });

    const { result } = renderHook(() => useChallengeDetails("challenge-123", "trip-123"));

    await waitFor(() => {
      expect(result.current.challenge?.image).toBeNull();
    });
  });
});
