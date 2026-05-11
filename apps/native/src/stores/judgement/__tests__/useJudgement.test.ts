import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useJudgement } from "../useJudgement";
import { judgementStore } from "../judgementStores";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockGetByChallengeQueryOptions = jest.fn((options: { input: { tripId: string; challengeId: string }; enabled?: boolean }) => ({
  queryKey: ["submissions"],
  enabled: options.enabled,
}));
const mockGetByIdQueryOptions = jest.fn((options: { input: { id: string; tripId: string }; enabled?: boolean }) => ({
  queryKey: ["challenge"],
  enabled: options.enabled,
}));
const mockReviewMutationOptions = jest.fn((options: { onError?: (error: unknown) => void }) => ({
  mutationKey: ["review"],
  onError: options.onError,
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    challengeSubmission: {
      getByChallenge: { queryOptions: (...args: unknown[]) => mockGetByChallengeQueryOptions(args[0] as { input: { tripId: string; challengeId: string }; enabled?: boolean }) },
      review: { mutationOptions: (...args: unknown[]) => mockReviewMutationOptions(args[0] as { onError?: (error: unknown) => void }) },
    },
    challenge: {
      getById: { queryOptions: (...args: unknown[]) => mockGetByIdQueryOptions(args[0] as { input: { id: string; tripId: string }; enabled?: boolean }) },
    },
  },
}));

describe("useJudgement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    judgementStore.setState({ tripId: "", challengeId: "", dismissedIds: [] });
    mockUseQuery.mockReturnValue({ data: null, isLoading: false });
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  describe("with explicit params", () => {
    it("should use explicit tripId and challengeId", () => {
      renderHook(() => useJudgement("trip-123", "challenge-456"));

      expect(mockGetByChallengeQueryOptions).toHaveBeenCalledWith({ input: { tripId: "trip-123", challengeId: "challenge-456" }, enabled: true });
    });

    it("should return explicit ids in result", () => {
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.tripId).toBe("trip-123");
      expect(result.current.challengeId).toBe("challenge-456");
    });
  });

  describe("with store params", () => {
    it("should use store tripId and challengeId", () => {
      judgementStore.setState({ tripId: "store-trip", challengeId: "store-challenge" });
      renderHook(() => useJudgement());
      expect(mockGetByChallengeQueryOptions).toHaveBeenCalledWith({ input: { tripId: "store-trip", challengeId: "store-challenge" }, enabled: true });
    });

    it("should prefer explicit params over store", () => {
      judgementStore.setState({ tripId: "store-trip", challengeId: "store-challenge" });
      renderHook(() => useJudgement("explicit-trip", "explicit-challenge"));
      expect(mockGetByChallengeQueryOptions).toHaveBeenCalledWith({ input: { tripId: "explicit-trip", challengeId: "explicit-challenge" }, enabled: true });
    });
  });

  describe("query states", () => {
    it("should return loading state when queries are loading", () => {
      mockUseQuery.mockReturnValueOnce({ data: null, isLoading: true }).mockReturnValueOnce({ data: null, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.isLoading).toBe(true);
    });

    it("should return not loading when both queries complete", () => {
      mockUseQuery.mockReturnValueOnce({ data: [], isLoading: false }).mockReturnValueOnce({ data: { name: "Test Challenge" }, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.isLoading).toBe(false);
    });

    it("should return challenge name from query", () => {
      mockUseQuery.mockReturnValueOnce({ data: [], isLoading: false }).mockReturnValueOnce({ data: { name: "My Challenge", scoringCategory: "CREATIVITY" }, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.challengeName).toBe("My Challenge");
      expect(result.current.challengeScoringCategory).toBe("CREATIVITY");
    });

    it("should return default challenge name when no data", () => {
      mockUseQuery.mockReturnValueOnce({ data: [], isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.challengeName).toBe("Challenge Review");
      expect(result.current.challengeScoringCategory).toBeNull();
    });
  });

  describe("submissions processing", () => {
    it("should filter pending submissions", () => {
      const mockSubmissions = [
        { id: "sub-1", status: "PENDING" },
        { id: "sub-2", status: "APPROVED" },
        { id: "sub-3", status: "PENDING" },
        { id: "sub-4", status: "REJECTED" },
      ];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.pendingCount).toBe(2);
      expect(result.current.currentSubmission).toEqual({ id: "sub-1", status: "PENDING" });
      expect(result.current.nextSubmission).toEqual({ id: "sub-3", status: "PENDING" });
    });

    it("should filter out dismissed pending submissions", () => {
      judgementStore.setState({ dismissedIds: ["sub-1"] });
      const mockSubmissions = [
        { id: "sub-1", status: "PENDING" },
        { id: "sub-2", status: "PENDING" },
      ];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.currentSubmission).toEqual({ id: "sub-2", status: "PENDING" });
    });

    it("should calculate stats correctly", () => {
      const mockSubmissions = [
        { id: "sub-1", status: "APPROVED" },
        { id: "sub-2", status: "APPROVED" },
        { id: "sub-3", status: "REJECTED" },
        { id: "sub-4", status: "PENDING" },
      ];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.stats).toEqual({ approved: 2, rejected: 1 });
    });

    it("should handle empty submissions", () => {
      mockUseQuery.mockReturnValueOnce({ data: [], isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.currentSubmission).toBeNull();
      expect(result.current.nextSubmission).toBeNull();
      expect(result.current.stats).toEqual({ approved: 0, rejected: 0 });
    });

    it("should handle null submissions", () => {
      mockUseQuery.mockReturnValueOnce({ data: null, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.currentSubmission).toBeNull();
    });
  });

  describe("reviewCurrent", () => {
    it("should not review if no current submission", () => {
      mockUseQuery.mockReturnValueOnce({ data: [], isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      result.current.reviewCurrent("APPROVED");
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should not review if mutation is pending", () => {
      const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: true });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      result.current.reviewCurrent("APPROVED");
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should approve current submission", () => {
      const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      result.current.reviewCurrent("APPROVED", undefined, 1);
      expect(mockMutate).toHaveBeenCalledWith({ id: "sub-1", status: "APPROVED", ranking: 1 });
    });

    it("should reject current submission with reason", () => {
      const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      result.current.reviewCurrent("REJECTED", "Invalid submission");
      expect(mockMutate).toHaveBeenCalledWith({ id: "sub-1", status: "REJECTED", rejectionReason: "Invalid submission" });
    });

    it("should not reject without reason", () => {
      const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      result.current.reviewCurrent("REJECTED", "");
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should trim rejection reason", () => {
      const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      result.current.reviewCurrent("REJECTED", "  Invalid submission  ");
      expect(mockMutate).toHaveBeenCalledWith({ id: "sub-1", status: "REJECTED", rejectionReason: "Invalid submission" });
    });

    it("should add dismissed id when reviewing", () => {
      const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      result.current.reviewCurrent("APPROVED");
      expect(judgementStore.getState().dismissedIds).toContain("sub-1");
    });
  });

  describe("isReviewing", () => {
    it("should return isReviewing from mutation state", () => {
      mockUseQuery.mockReturnValueOnce({ data: [], isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: true });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.isReviewing).toBe(true);
    });

    it("should return false when not reviewing", () => {
      mockUseQuery.mockReturnValueOnce({ data: [], isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.isReviewing).toBe(false);
    });
  });

  describe("dismissedIds filtering", () => {
    it("should filter dismissed ids that are no longer pending", () => {
      judgementStore.setState({ dismissedIds: ["sub-1", "sub-2"] });
      const mockSubmissions = [
        { id: "sub-1", status: "APPROVED" },
        { id: "sub-2", status: "REJECTED" },
        { id: "sub-3", status: "PENDING" },
      ];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.currentSubmission?.id).toBe("sub-3");
    });

    it("should keep dismissed ids that are still pending", () => {
      judgementStore.setState({ dismissedIds: ["sub-1"] });
      const mockSubmissions = [
        { id: "sub-1", status: "PENDING" },
        { id: "sub-2", status: "PENDING" },
      ];
      mockUseQuery.mockReturnValueOnce({ data: mockSubmissions, isLoading: false }).mockReturnValueOnce({ data: null, isLoading: false });
      const { result } = renderHook(() => useJudgement("trip-123", "challenge-456"));
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.currentSubmission?.id).toBe("sub-2");
    });
  });
});
