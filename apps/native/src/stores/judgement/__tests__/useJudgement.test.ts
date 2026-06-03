import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler } from "../../../test-utils/msw/server";
import { waitFor, act } from "@testing-library/react-native";
import { useJudgement } from "../useJudgement";
import { judgementStore } from "../judgementStores";

describe("useJudgement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
    judgementStore.setState({ tripId: "", challengeId: "", dismissedIds: [] });
  });

  it("should return explicit ids in result", () => {
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    expect(result.current.tripId).toBe("trip-123");
    expect(result.current.challengeId).toBe("challenge-456");
  });

  it("should use store params when not provided", () => {
    judgementStore.setState({ tripId: "store-trip", challengeId: "store-challenge" });
    const { result } = renderHookWithMSW(() => useJudgement());
    expect(result.current.tripId).toBe("store-trip");
    expect(result.current.challengeId).toBe("store-challenge");
  });

  it("should prefer explicit params over store", () => {
    judgementStore.setState({ tripId: "store-trip", challengeId: "store-challenge" });
    const { result } = renderHookWithMSW(() => useJudgement("explicit-trip", "explicit-challenge"));
    expect(result.current.tripId).toBe("explicit-trip");
    expect(result.current.challengeId).toBe("explicit-challenge");
  });

  it("should return loading state when queries are loading", async () => {
    server.use(
      createORPCHandler(
        ["challengeSubmission", "getByChallenge"],
        () =>
          new Promise(() => {
            /* intentionally never resolves */
          }),
      ),
      createORPCHandler(
        ["challenge", "getById"],
        () =>
          new Promise(() => {
            /* intentionally never resolves */
          }),
      ),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.isLoading).toBe(true));
  });

  it("should return not loading when both queries complete", async () => {
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => []),
      createORPCHandler(["challenge", "getById"], () => ({
        name: "Test Challenge",
        scoringCategory: "CREATIVITY",
      })),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return challenge name from query", async () => {
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => []),
      createORPCHandler(["challenge", "getById"], () => ({
        name: "My Challenge",
        scoringCategory: "CREATIVITY",
      })),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.challengeName).toBe("My Challenge"));
    expect(result.current.challengeScoringCategory).toBe("CREATIVITY");
  });

  it("should return default challenge name when no data", async () => {
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => []),
      createORPCHandler(["challenge", "getById"], () => null),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.challengeName).toBe("Challenge Review"));
    expect(result.current.challengeScoringCategory).toBeNull();
  });

  it("should filter pending submissions", async () => {
    const mockSubmissions = [
      { id: "sub-1", status: "PENDING" },
      { id: "sub-2", status: "APPROVED" },
      { id: "sub-3", status: "PENDING" },
      { id: "sub-4", status: "REJECTED" },
    ];
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.pendingCount).toBe(2));
    expect(result.current.currentSubmission).toEqual({ id: "sub-1", status: "PENDING" });
    expect(result.current.nextSubmission).toEqual({ id: "sub-3", status: "PENDING" });
  });

  it("should filter out dismissed pending submissions", async () => {
    judgementStore.setState({ dismissedIds: ["sub-1"] });
    const mockSubmissions = [
      { id: "sub-1", status: "PENDING" },
      { id: "sub-2", status: "PENDING" },
    ];
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.pendingCount).toBe(1));
    expect(result.current.currentSubmission).toEqual({ id: "sub-2", status: "PENDING" });
  });

  it("should calculate stats correctly", async () => {
    const mockSubmissions = [
      { id: "sub-1", status: "APPROVED" },
      { id: "sub-2", status: "APPROVED" },
      { id: "sub-3", status: "REJECTED" },
      { id: "sub-4", status: "PENDING" },
    ];
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.stats).toEqual({ approved: 2, rejected: 1 }));
  });

  it("should handle empty submissions", async () => {
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => []),
      createORPCHandler(["challenge", "getById"], () => null),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.pendingCount).toBe(0));
    expect(result.current.currentSubmission).toBeNull();
    expect(result.current.nextSubmission).toBeNull();
    expect(result.current.stats).toEqual({ approved: 0, rejected: 0 });
  });

  it("should handle null submissions", async () => {
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => null),
      createORPCHandler(["challenge", "getById"], () => null),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.pendingCount).toBe(0));
    expect(result.current.currentSubmission).toBeNull();
  });

  it("should not review if no current submission", async () => {
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => []),
      createORPCHandler(["challenge", "getById"], () => null),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.reviewCurrent("APPROVED");
    });
    await waitFor(() => expect(result.current.isReviewing).toBe(false));
  });

  it("should not review if mutation is pending", async () => {
    const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
    // Use a slow mutation handler so isPending stays true
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
      createORPCHandler(
        ["challengeSubmission", "review"],
        () =>
          new Promise(() => {
            /* intentionally never resolves */
          }),
      ),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() =>
      expect(result.current.currentSubmission).toEqual({ id: "sub-1", status: "PENDING" }),
    );
    act(() => {
      result.current.reviewCurrent("APPROVED");
    });
    await waitFor(() => expect(result.current.isReviewing).toBe(true));
    act(() => {
      result.current.reviewCurrent("APPROVED");
    }); // second call should be no-op
    // isReviewing should still be true (mutation still pending)
    await waitFor(() => expect(result.current.isReviewing).toBe(true));
  });

  it("should approve current submission", async () => {
    const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
      createORPCHandler(["challengeSubmission", "review"], (input) => ({ ...input, id: "sub-1" })),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() =>
      expect(result.current.currentSubmission).toEqual({ id: "sub-1", status: "PENDING" }),
    );
    act(() => {
      result.current.reviewCurrent("APPROVED", undefined, 1);
    });
    await waitFor(() => expect(judgementStore.getState().dismissedIds).toContain("sub-1"));
    await waitFor(() => expect(result.current.isReviewing).toBe(false));
  });

  it("should reject current submission with reason", async () => {
    const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
      createORPCHandler(["challengeSubmission", "review"], (input) => ({ ...input, id: "sub-1" })),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() =>
      expect(result.current.currentSubmission).toEqual({ id: "sub-1", status: "PENDING" }),
    );
    act(() => {
      result.current.reviewCurrent("REJECTED", "Invalid submission");
    });
    await waitFor(() => expect(judgementStore.getState().dismissedIds).toContain("sub-1"));
    await waitFor(() => expect(result.current.isReviewing).toBe(false));
  });

  it("should not reject without reason", async () => {
    const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
      createORPCHandler(["challengeSubmission", "review"], (input) => ({ ...input, id: "sub-1" })),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() =>
      expect(result.current.currentSubmission).toEqual({ id: "sub-1", status: "PENDING" }),
    );
    act(() => {
      result.current.reviewCurrent("REJECTED", "");
    });
    await waitFor(() => expect(result.current.isReviewing).toBe(false));
    expect(judgementStore.getState().dismissedIds).not.toContain("sub-1");
  });

  it("should trim rejection reason", async () => {
    const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
    const reviewHandler = jest.fn((input) => ({ ...input, id: "sub-1" }));
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
      createORPCHandler(["challengeSubmission", "review"], reviewHandler),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() =>
      expect(result.current.currentSubmission).toEqual({ id: "sub-1", status: "PENDING" }),
    );
    act(() => {
      result.current.reviewCurrent("REJECTED", "  Invalid submission  ");
    });
    await waitFor(() =>
      expect(reviewHandler).toHaveBeenCalledWith(
        expect.objectContaining({ rejectionReason: "Invalid submission" }),
      ),
    );
  });

  it("should add dismissed id when reviewing", async () => {
    const mockSubmissions = [{ id: "sub-1", status: "PENDING" }];
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
      createORPCHandler(["challengeSubmission", "review"], (input) => ({ ...input, id: "sub-1" })),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() =>
      expect(result.current.currentSubmission).toEqual({ id: "sub-1", status: "PENDING" }),
    );
    act(() => {
      result.current.reviewCurrent("APPROVED");
    });
    await waitFor(() => expect(judgementStore.getState().dismissedIds).toContain("sub-1"));
  });

  it("should return isReviewing from mutation state", async () => {
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => []),
      createORPCHandler(["challenge", "getById"], () => null),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.isReviewing).toBe(false));
  });

  it("should filter dismissed ids that are no longer pending", async () => {
    judgementStore.setState({ dismissedIds: ["sub-1", "sub-2"] });
    const mockSubmissions = [
      { id: "sub-1", status: "APPROVED" },
      { id: "sub-2", status: "REJECTED" },
      { id: "sub-3", status: "PENDING" },
    ];
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.pendingCount).toBe(1));
    expect(result.current.currentSubmission?.id).toBe("sub-3");
  });

  it("should keep dismissed ids that are still pending", async () => {
    judgementStore.setState({ dismissedIds: ["sub-1"] });
    const mockSubmissions = [
      { id: "sub-1", status: "PENDING" },
      { id: "sub-2", status: "PENDING" },
    ];
    server.use(
      createORPCHandler(["challengeSubmission", "getByChallenge"], () => mockSubmissions),
      createORPCHandler(["challenge", "getById"], () => null),
    );
    const { result } = renderHookWithMSW(() => useJudgement("trip-123", "challenge-456"));
    await waitFor(() => expect(result.current.pendingCount).toBe(1));
    expect(result.current.currentSubmission?.id).toBe("sub-2");
  });
});
