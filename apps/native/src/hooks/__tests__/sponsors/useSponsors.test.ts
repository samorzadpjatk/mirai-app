import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import {
  useSponsors,
  useSponsorById,
  useTripSponsors,
} from "../../sponsors/useSponsors";

// Mock tRPC
const mockGetAllQuery = jest.fn(() => ({
  queryKey: ["sponsor", "getAll"],
}));

const mockGetByIdQuery = jest.fn((params: { id: string }) => ({
  queryKey: ["sponsor", "getById", params.id],
}));

const mockGetByTripIdQuery = jest.fn((params: { tripId: string }) => ({
  queryKey: ["sponsor", "getByTripId", params.tripId],
}));

const mockUseQuery = jest.fn();

jest.mock("@mirai-app/orpc/client", () => {
  const mockGetAllQuery = jest.fn(() => ({
    queryKey: ["sponsor", "getAll"],
  }));

  const mockGetByIdQuery = jest.fn((params: { id: string }) => ({
    queryKey: ["sponsor", "getById", params.id],
  }));

  const mockGetByTripIdQuery = jest.fn((params: { tripId: string }) => ({
    queryKey: ["sponsor", "getByTripId", params.tripId],
  }));

  const trpc = {
    sponsor: {
      getAll: {
        queryOptions: mockGetAllQuery,
      },
      getById: {
        queryOptions: mockGetByIdQuery,
      },
      getByTripId: {
        queryOptions: mockGetByTripIdQuery,
      },
    },
  };

  return {
    useTRPC: jest.fn(() => trpc),
    orpc: trpc,
  };
});

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

describe("useSponsors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return all sponsors", () => {
    const mockSponsors = [
      { id: "sponsor-1", name: "Sponsor One", logoUrl: "https://example.com/logo1.png" },
      { id: "sponsor-2", name: "Sponsor Two", logoUrl: "https://example.com/logo2.png" },
    ];

    mockUseQuery.mockReturnValue({
      data: mockSponsors,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSponsors());

    expect(result.current.data).toEqual(mockSponsors);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useSponsors());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle error state", () => {
    const error = new Error("Failed to fetch sponsors");
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    });

    const { result } = renderHook(() => useSponsors());

    expect(result.current.error).toBe(error);
  });
});

describe("useSponsorById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return sponsor by ID", () => {
    const mockSponsor = {
      id: "sponsor-1",
      name: "Sponsor One",
      description: "A great sponsor",
      logoUrl: "https://example.com/logo.png",
    };

    mockUseQuery.mockReturnValue({
      data: mockSponsor,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSponsorById("sponsor-1"));

    expect(result.current.data).toEqual(mockSponsor);
  });

  it("should be disabled when no ID provided", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    renderHook(() => useSponsorById(""));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it("should be enabled when ID provided", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderHook(() => useSponsorById("sponsor-1"));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
      })
    );
  });
});

describe("useTripSponsors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return sponsors for a trip", () => {
    const mockSponsors = [
      { id: "sponsor-1", name: "Trip Sponsor", tier: "gold" },
    ];

    mockUseQuery.mockReturnValue({
      data: mockSponsors,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useTripSponsors("trip-1"));

    expect(result.current.data).toEqual(mockSponsors);
  });

  it("should be disabled when no tripId provided", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    renderHook(() => useTripSponsors(""));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it("should be enabled when tripId provided", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderHook(() => useTripSponsors("trip-1"));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
      })
    );
  });
});
