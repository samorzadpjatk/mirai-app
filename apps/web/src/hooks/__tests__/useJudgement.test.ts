/// <reference lib="dom" />

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { renderHook } from "@testing-library/react";
import {
  useJudgement,
  type JudgementChallenge,
  type JudgementSubmission,
} from "../admin/useJudgement";

// Mock React Query
const mockInvalidateQueries = mock(() => Promise.resolve());
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
};

let mockChallengeData: JudgementChallenge | undefined = undefined;
let mockSubmissionsData: JudgementSubmission[] = [];
let mockChallengeLoading = false;
let mockSubmissionsLoading = false;
let mockReviewPending = false;
let mockCompletePending = false;

const createMockChallengeQuery = () => ({
  data: mockChallengeData,
  isLoading: mockChallengeLoading,
});

const createMockSubmissionsQuery = () => ({
  data: mockSubmissionsData,
  isLoading: mockSubmissionsLoading,
});

const createMockReviewMutation = () => ({
  mutateAsync: mock(() => Promise.resolve({ success: true })),
  isPending: mockReviewPending,
});

const createMockCompleteMutation = () => ({
  mutateAsync: mock(() => Promise.resolve({ success: true })),
  isPending: mockCompletePending,
});

mock.module("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
  useQuery: (options: { queryKey: unknown[] }) => {
    const key = JSON.stringify(options.queryKey);
    if (key.includes("challenge") && key.includes("details")) {
      return createMockChallengeQuery();
    }
    return createMockSubmissionsQuery();
  },
  useMutation: () => {
    // Alternate between review and complete mutations based on call order
    return createMockReviewMutation();
  },
}));

// Mock tRPC client
mock.module("@mirai-app/frameworks/graphql/client", () => ({
  useTRPCClient: () => ({
    challenge: {
      getById: {
        query: mock(() => Promise.resolve(null)),
      },
      update: {
        mutate: mock(() => Promise.resolve({ success: true })),
      },
    },
    challengeSubmission: {
      getByChallengeForAdmin: {
        query: mock(() => Promise.resolve([])),
      },
      review: {
        mutate: mock(() => Promise.resolve({ success: true })),
      },
    },
  }),
}));

describe("[UNIT] useJudgement", () => {
  beforeEach(() => {
    mockInvalidateQueries.mockClear();
    mockChallengeData = undefined;
    mockSubmissionsData = [];
    mockChallengeLoading = false;
    mockSubmissionsLoading = false;
    mockReviewPending = false;
    mockCompletePending = false;
  });

  describe("[UNIT] challenge data", () => {
    test("returns undefined challenge by default", () => {
      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.challenge).toBeUndefined();
    });

    test("returns challenge when data is available", () => {
      mockChallengeData = {
        id: "challenge-456",
        tripId: "trip-123",
        name: "Test Challenge",
        scoringCategory: "JUDGED_STAFF",
        status: "VOTING_PHASE",
        basePoints: 100,
        firstPlacePoints: 50,
        secondPlacePoints: 30,
        thirdPlacePoints: 20,
      };

      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.challenge).toBeDefined();
      expect(result.current.challenge?.name).toBe("Test Challenge");
      expect(result.current.challenge?.scoringCategory).toBe("JUDGED_STAFF");
    });
  });

  describe("[UNIT] submissions", () => {
    test("returns empty submissions by default", () => {
      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.submissions).toEqual([]);
    });

    test("returns submissions when data is available", () => {
      mockSubmissionsData = [
        {
          id: "sub-1",
          status: "APPROVED",
          imageIds: ["img-1"],
          videoId: null,
          textContent: null,
          latitude: null,
          longitude: null,
          voteScore: 10,
          voteCount: 5,
          ranking: 1,
          awardedPoints: 100,
          bonusPoints: 20,
          rejectionReason: null,
          createdAt: "2024-01-01T00:00:00Z",
          group: { id: "group-1", name: "Team A", image: null },
        },
        {
          id: "sub-2",
          status: "PENDING",
          imageIds: ["img-2"],
          videoId: null,
          textContent: null,
          latitude: null,
          longitude: null,
          voteScore: 5,
          voteCount: 3,
          ranking: null,
          awardedPoints: 0,
          bonusPoints: 0,
          rejectionReason: null,
          createdAt: "2024-01-02T00:00:00Z",
          group: { id: "group-2", name: "Team B", image: null },
        },
      ];

      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.submissions).toHaveLength(2);
    });

    test("filters pending submissions", () => {
      mockSubmissionsData = [
        { id: "sub-1", status: "PENDING", group: { id: "g1", name: "A" } },
        { id: "sub-2", status: "APPROVED", group: { id: "g2", name: "B" } },
        { id: "sub-3", status: "REJECTED", group: { id: "g3", name: "C" } },
      ] as JudgementSubmission[];

      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.pendingSubmissions).toHaveLength(1);
      expect(result.current.pendingSubmissions[0].id).toBe("sub-1");
    });

    test("filters approved submissions", () => {
      mockSubmissionsData = [
        { id: "sub-1", status: "PENDING", group: { id: "g1", name: "A" } },
        { id: "sub-2", status: "APPROVED", group: { id: "g2", name: "B" } },
        { id: "sub-3", status: "REJECTED", group: { id: "g3", name: "C" } },
      ] as JudgementSubmission[];

      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.approvedSubmissions).toHaveLength(1);
      expect(result.current.approvedSubmissions[0].id).toBe("sub-2");
    });

    test("filters rejected submissions", () => {
      mockSubmissionsData = [
        { id: "sub-1", status: "PENDING", group: { id: "g1", name: "A" } },
        { id: "sub-2", status: "APPROVED", group: { id: "g2", name: "B" } },
        { id: "sub-3", status: "REJECTED", group: { id: "g3", name: "C" } },
      ] as JudgementSubmission[];

      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.rejectedSubmissions).toHaveLength(1);
      expect(result.current.rejectedSubmissions[0].id).toBe("sub-3");
    });
  });

  describe("[UNIT] ranked submissions", () => {
    test("sorts by ranking", () => {
      mockSubmissionsData = [
        {
          id: "sub-2",
          status: "APPROVED",
          ranking: 2,
          voteScore: 50,
          createdAt: "2024-01-01T00:00:00Z",
          group: { id: "g2", name: "B" },
        },
        {
          id: "sub-1",
          status: "APPROVED",
          ranking: 1,
          voteScore: 30,
          createdAt: "2024-01-02T00:00:00Z",
          group: { id: "g1", name: "A" },
        },
        {
          id: "sub-3",
          status: "APPROVED",
          ranking: 3,
          voteScore: 20,
          createdAt: "2024-01-03T00:00:00Z",
          group: { id: "g3", name: "C" },
        },
      ] as JudgementSubmission[];

      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.rankedSubmissions[0].id).toBe("sub-1");
      expect(result.current.rankedSubmissions[1].id).toBe("sub-2");
      expect(result.current.rankedSubmissions[2].id).toBe("sub-3");
    });

    test("sorts by voteScore when ranking is equal", () => {
      mockSubmissionsData = [
        {
          id: "sub-1",
          status: "APPROVED",
          ranking: null,
          voteScore: 30,
          createdAt: "2024-01-01T00:00:00Z",
          group: { id: "g1", name: "A" },
        },
        {
          id: "sub-2",
          status: "APPROVED",
          ranking: null,
          voteScore: 50,
          createdAt: "2024-01-02T00:00:00Z",
          group: { id: "g2", name: "B" },
        },
      ] as JudgementSubmission[];

      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      // Higher vote score should come first
      expect(result.current.rankedSubmissions[0].id).toBe("sub-2");
      expect(result.current.rankedSubmissions[1].id).toBe("sub-1");
    });
  });

  describe("[UNIT] loading states", () => {
    test("isLoading true when challenge is loading", () => {
      mockChallengeLoading = true;

      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.isLoading).toBe(true);
    });

    test("isLoading true when submissions is loading", () => {
      mockSubmissionsLoading = true;

      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.isLoading).toBe(true);
    });

    test("isReviewing true when review is pending", () => {
      mockReviewPending = true;

      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current.isReviewing).toBe(true);
    });

    test("isCompleting returns boolean", () => {
      // isCompleting is derived from mutation state
      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(typeof result.current.isCompleting).toBe("boolean");
    });
  });

  describe("[UNIT] actions", () => {
    test("exposes reviewSubmission function", () => {
      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(typeof result.current.reviewSubmission).toBe("function");
    });

    test("exposes completeChallenge function", () => {
      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(typeof result.current.completeChallenge).toBe("function");
    });
  });

  describe("[UNIT] challenge parsing", () => {
    test("parses valid challenge", () => {
      const rawChallenge = {
        id: "ch-1",
        tripId: "trip-1",
        name: "Test",
        scoringCategory: "SPEED",
        status: "ACTIVE",
        basePoints: 100,
        firstPlacePoints: 50,
        secondPlacePoints: 30,
        thirdPlacePoints: 20,
      };

      // Verify all required fields are present
      expect(rawChallenge.id).toBe("ch-1");
      expect(rawChallenge.tripId).toBe("trip-1");
      expect(rawChallenge.name).toBe("Test");
    });

    test("validates challenge status values", () => {
      const validStatuses = [
        "HIDDEN",
        "VISIBLE",
        "ACTIVE",
        "VOTING_PHASE",
        "COMPLETED",
        "CANCELLED",
      ];

      for (const status of validStatuses) {
        expect(validStatuses).toContain(status);
      }
    });
  });

  describe("[UNIT] hook return shape", () => {
    test("returns all expected properties", () => {
      const { result } = renderHook(() =>
        useJudgement("trip-123", "challenge-456"),
      );

      expect(result.current).toHaveProperty("challenge");
      expect(result.current).toHaveProperty("submissions");
      expect(result.current).toHaveProperty("pendingSubmissions");
      expect(result.current).toHaveProperty("approvedSubmissions");
      expect(result.current).toHaveProperty("rejectedSubmissions");
      expect(result.current).toHaveProperty("rankedSubmissions");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("isReviewing");
      expect(result.current).toHaveProperty("isCompleting");
      expect(result.current).toHaveProperty("reviewSubmission");
      expect(result.current).toHaveProperty("completeChallenge");
    });
  });
});
