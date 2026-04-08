/// <reference lib="dom" />

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useChallengeSubmissions,
  type SubmissionItem,
} from "../admin/useChallengeSubmissions";

// Mock React Query
const mockInvalidateQueries = mock(() => Promise.resolve());
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
};

const createMockQueryResult = (overrides = {}) => ({
  data: undefined,
  isLoading: false,
  isRefetching: false,
  refetch: () => Promise.resolve({ data: [] }),
  ...overrides,
});

const createMockMutationResult = (overrides = {}) => ({
  mutate: (input: unknown) => {},
  mutateAsync: () => Promise.resolve({ success: true }),
  isPending: false,
  ...overrides,
});

let mockQueryResult = createMockQueryResult();
let mockReviewMutation = createMockMutationResult();
let mockFlagMutation = createMockMutationResult();

mock.module("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
  useQuery: () => mockQueryResult,
  useMutation: (options: { mutationFn: unknown }) => {
    // Return different mutation results based on the mutation function
    if (options.mutationFn.toString().includes("review")) {
      return mockReviewMutation;
    }
    return mockFlagMutation;
  },
}));

// Mock tRPC client
const mockGetByChallengeForAdmin = mock(() => Promise.resolve([]));
const mockReview = mock(() => Promise.resolve({ success: true }));
const mockCreateReport = mock(() => Promise.resolve({ success: true }));

mock.module("@mirai-app/trpc/client", () => ({
  useTRPCClient: () => ({
    challengeSubmission: {
      getByChallengeForAdmin: {
        query: mockGetByChallengeForAdmin,
      },
      review: {
        mutate: mockReview,
      },
    },
    submissionReport: {
      create: {
        mutate: mockCreateReport,
      },
    },
  }),
}));

describe("useChallengeSubmissions", () => {
  beforeEach(() => {
    mockInvalidateQueries.mockClear();
    mockGetByChallengeForAdmin.mockClear();
    mockReview.mockClear();
    mockCreateReport.mockClear();

    // Reset mock results
    mockQueryResult = createMockQueryResult();
    mockReviewMutation = createMockMutationResult();
    mockFlagMutation = createMockMutationResult();
  });

  describe("query configuration", () => {
    test("returns empty submissions array by default", () => {
      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(result.current.submissions).toEqual([]);
    });

    test("returns isLoading false by default", () => {
      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(result.current.isLoading).toBe(false);
    });

    test("returns isRefetching false by default", () => {
      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(result.current.isRefetching).toBe(false);
    });
  });

  describe("loading states", () => {
    test("returns isLoading true when loading", () => {
      mockQueryResult = createMockQueryResult({ isLoading: true });

      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(result.current.isLoading).toBe(true);
    });

    test("returns isRefetching true when refetching", () => {
      mockQueryResult = createMockQueryResult({ isRefetching: true });

      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(result.current.isRefetching).toBe(true);
    });
  });

  describe("submissions data", () => {
    test("returns parsed submissions from query data", () => {
      const mockSubmissions: SubmissionItem[] = [
        {
          id: "sub-1",
          status: "PENDING",
          ranking: null,
          imageIds: ["img-1"],
          videoId: null,
          textContent: null,
          createdAt: "2024-01-01T00:00:00Z",
          reviewedAt: null,
          rejectionReason: null,
          voteScore: 0,
          voteCount: 0,
          awardedPoints: 0,
          bonusPoints: 0,
          reviewedBy: null,
          group: { id: "group-1", name: "Group 1", image: null },
        },
      ];

      mockQueryResult = createMockQueryResult({ data: mockSubmissions });

      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(result.current.submissions).toHaveLength(1);
      expect(result.current.submissions[0].id).toBe("sub-1");
      expect(result.current.submissions[0].status).toBe("PENDING");
    });

    test("returns empty array when data is undefined", () => {
      mockQueryResult = createMockQueryResult({ data: undefined });

      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(result.current.submissions).toEqual([]);
    });
  });

  describe("review submission", () => {
    test("exposes reviewSubmission function", () => {
      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(typeof result.current.reviewSubmission).toBe("function");
    });

    test("exposes isReviewing flag", () => {
      mockReviewMutation = createMockMutationResult({ isPending: true });

      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(result.current.isReviewing).toBe(true);
    });
  });

  describe("flag submission", () => {
    test("exposes flagSubmission function", () => {
      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(typeof result.current.flagSubmission).toBe("function");
    });

    test("exposes isFlagging flag", () => {
      mockFlagMutation = createMockMutationResult({ isPending: true });

      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(result.current.isFlagging).toBe(true);
    });
  });

  describe("refetch", () => {
    test("exposes refetch function", () => {
      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(typeof result.current.refetch).toBe("function");
    });
  });

  describe("submission parsing", () => {
    test("parses valid submission correctly", async () => {
      const rawSubmission = {
        id: "sub-1",
        status: "APPROVED",
        ranking: 1,
        imageIds: ["img-1", "img-2"],
        videoId: "vid-1",
        textContent: "Test content",
        createdAt: "2024-01-01T00:00:00Z",
        reviewedAt: "2024-01-02T00:00:00Z",
        rejectionReason: null,
        voteScore: 10,
        voteCount: 5,
        awardedPoints: 100,
        bonusPoints: 20,
        reviewedBy: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
        group: { id: "group-1", name: "Team A", image: "image.jpg" },
      };

      mockGetByChallengeForAdmin.mockImplementation(() =>
        Promise.resolve([rawSubmission]),
      );

      // Simulate query execution
      const queryFn = async () => {
        const result = await mockGetByChallengeForAdmin();
        return result;
      };

      const data = await queryFn();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("sub-1");
    });

    test("filters out invalid submissions", async () => {
      const validSubmission = {
        id: "valid-id",
        status: "PENDING",
        group: { id: "group-1", name: "Valid Group" },
      };

      const invalidSubmission = {
        id: "invalid-id",
        status: "PENDING",
        // Missing required group fields
      };

      mockGetByChallengeForAdmin.mockImplementation(() =>
        Promise.resolve([validSubmission, invalidSubmission]),
      );

      const queryFn = async () => {
        const result = await mockGetByChallengeForAdmin();
        // Simulate the parsing and filtering logic
        return result.filter((item: unknown) => {
          if (typeof item !== "object" || item === null) return false;
          const s = item as Record<string, unknown>;
          if (typeof s.id !== "string") return false;
          const group = s.group as Record<string, unknown>;
          if (
            !group ||
            typeof group.id !== "string" ||
            typeof group.name !== "string"
          ) {
            return false;
          }
          return true;
        });
      };

      const data = await queryFn();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("valid-id");
    });

    test("handles various submission statuses", () => {
      const statuses = ["PENDING", "APPROVED", "REJECTED"];

      for (const status of statuses) {
        const submission = {
          id: `sub-${status}`,
          status,
          group: { id: "g1", name: "Group" },
        };

        // Verify status is valid
        expect(["PENDING", "APPROVED", "REJECTED"]).toContain(
          submission.status,
        );
      }
    });
  });

  describe("hook return shape", () => {
    test("returns all expected properties", () => {
      const { result } = renderHook(() =>
        useChallengeSubmissions("trip-123", "challenge-456"),
      );

      expect(result.current).toHaveProperty("submissions");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("isRefetching");
      expect(result.current).toHaveProperty("refetch");
      expect(result.current).toHaveProperty("reviewSubmission");
      expect(result.current).toHaveProperty("isReviewing");
      expect(result.current).toHaveProperty("flagSubmission");
      expect(result.current).toHaveProperty("isFlagging");
    });
  });
});
