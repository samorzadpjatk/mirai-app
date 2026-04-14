/// <reference lib="dom" />

import { describe, test, expect, beforeEach } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useStaffVoting, type VotingSubmission } from "../admin/useStaffVoting";

describe("[UNIT] useStaffVoting", () => {
  const createMockSubmission = (
    overrides: Partial<VotingSubmission> = {},
  ): VotingSubmission => ({
    id: `sub-${overrides.id ?? Math.random().toString(36).slice(2)}`,
    groupId: overrides.groupId ?? "group-1",
    groupName: overrides.groupName ?? "Group 1",
    imagePath: overrides.imagePath ?? "/path/to/image.jpg",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    ...overrides,
  });

  const defaultProps = {
    votingSubmissions: [] as VotingSubmission[],
    hasMyCompleteVote: false,
    requiredVotePositions: 3,
    judgedStaffProgress: { eligibleSubmissionsCount: 3 },
    myVotesError: undefined,
    judgedStaffProgressError: undefined,
    challenge: {
      scoringCategory: "JUDGED_STAFF" as const,
      endTime: new Date(Date.now() - 1000).toISOString(), // Ended 1 second ago
      status: "VOTING_PHASE" as const,
    },
  };

  beforeEach(() => {
    // Reset any mocks if needed
  });

  describe("[UNIT] constants", () => {
    test("returns MIN_SUBMISSIONS_TO_VOTE constant", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(result.current.MIN_SUBMISSIONS_TO_VOTE).toBe(2);
    });

    test("returns TOP3_STABILITY_REQUIRED constant", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(result.current.TOP3_STABILITY_REQUIRED).toBe(3);
    });
  });

  describe("[UNIT] phase and state", () => {
    test("returns phase as string", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(typeof result.current.phase).toBe("string");
      expect(["comparing", "confirming", "done", "blocked"]).toContain(
        result.current.phase,
      );
    });

    test("returns blockedReason as string or null", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(["string", "object"]).toContain(
        typeof result.current.blockedReason,
      );
    });

    test("returns bootstrapped boolean", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(typeof result.current.bootstrapped).toBe("boolean");
    });
  });

  describe("[UNIT] comparison state", () => {
    test("returns comparisonCount as number", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(typeof result.current.comparisonCount).toBe("number");
      expect(result.current.comparisonCount).toBeGreaterThanOrEqual(0);
    });

    test("returns hardCap as number", () => {
      const submissions = [
        createMockSubmission({ id: "sub-1", groupId: "group-1" }),
        createMockSubmission({ id: "sub-2", groupId: "group-2" }),
      ];

      const { result } = renderHook(() =>
        useStaffVoting({
          ...defaultProps,
          votingSubmissions: submissions,
        }),
      );

      expect(typeof result.current.hardCap).toBe("number");
      // hardCap = Math.max(submissions.length * 2, 1)
      expect(result.current.hardCap).toBeGreaterThanOrEqual(1);
    });

    test("returns progress as number between 0 and 1", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(typeof result.current.progress).toBe("number");
      expect(result.current.progress).toBeGreaterThanOrEqual(0);
      expect(result.current.progress).toBeLessThanOrEqual(1);
    });

    test("returns stableTop3Count as number", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(typeof result.current.stableTop3Count).toBe("number");
      expect(result.current.stableTop3Count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("[UNIT] current pair", () => {
    test("returns currentLeft as submission or null", () => {
      const submissions = [
        createMockSubmission({ id: "sub-1", groupId: "group-1" }),
        createMockSubmission({ id: "sub-2", groupId: "group-2" }),
      ];

      const { result } = renderHook(() =>
        useStaffVoting({
          ...defaultProps,
          votingSubmissions: submissions,
        }),
      );

      // currentLeft can be submission object or null
      expect(["object", "undefined"]).toContain(
        typeof result.current.currentLeft,
      );
    });

    test("returns currentRight as submission or null", () => {
      const submissions = [
        createMockSubmission({ id: "sub-1", groupId: "group-1" }),
        createMockSubmission({ id: "sub-2", groupId: "group-2" }),
      ];

      const { result } = renderHook(() =>
        useStaffVoting({
          ...defaultProps,
          votingSubmissions: submissions,
        }),
      );

      expect(["object", "undefined"]).toContain(
        typeof result.current.currentRight,
      );
    });
  });

  describe("[UNIT] ranking", () => {
    test("returns ranking array", () => {
      const submissions = [
        createMockSubmission({ id: "sub-1", groupId: "group-1" }),
        createMockSubmission({ id: "sub-2", groupId: "group-2" }),
      ];

      const { result } = renderHook(() =>
        useStaffVoting({
          ...defaultProps,
          votingSubmissions: submissions,
        }),
      );

      expect(Array.isArray(result.current.ranking)).toBe(true);
    });

    test("returns finalTopThree array", () => {
      const submissions = [
        createMockSubmission({ id: "sub-1", groupId: "group-1" }),
        createMockSubmission({ id: "sub-2", groupId: "group-2" }),
        createMockSubmission({ id: "sub-3", groupId: "group-3" }),
      ];

      const { result } = renderHook(() =>
        useStaffVoting({
          ...defaultProps,
          votingSubmissions: submissions,
        }),
      );

      expect(Array.isArray(result.current.finalTopThree)).toBe(true);
    });
  });

  describe("[UNIT] voting actions", () => {
    test("exposes handlePickWinner function", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(typeof result.current.handlePickWinner).toBe("function");
    });

    test("exposes startComparing function", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(typeof result.current.startComparing).toBe("function");
    });

    test("exposes resetVoting function", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(typeof result.current.resetVoting).toBe("function");
    });

    test("exposes bootstrapVoting function", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(typeof result.current.bootstrapVoting).toBe("function");
    });
  });

  describe("[UNIT] edge cases", () => {
    test("handles empty submissions", () => {
      const { result } = renderHook(() =>
        useStaffVoting({
          ...defaultProps,
          votingSubmissions: [],
        }),
      );

      expect(Array.isArray(result.current.ranking)).toBe(true);
      expect(result.current.ranking).toHaveLength(0);
    });

    test("handles single submission", () => {
      const { result } = renderHook(() =>
        useStaffVoting({
          ...defaultProps,
          votingSubmissions: [createMockSubmission({ id: "sub-1" })],
        }),
      );

      expect(Array.isArray(result.current.ranking)).toBe(true);
    });

    test("handles many submissions", () => {
      const submissions = Array.from({ length: 10 }, (_, i) =>
        createMockSubmission({ id: `sub-${i}`, groupId: `group-${i}` }),
      );

      const { result } = renderHook(() =>
        useStaffVoting({
          ...defaultProps,
          votingSubmissions: submissions,
        }),
      );

      expect(result.current.hardCap).toBeGreaterThanOrEqual(20); // 10 * 2
    });

    test("handles null challenge", () => {
      const { result } = renderHook(() =>
        useStaffVoting({
          ...defaultProps,
          challenge: undefined,
        }),
      );

      // Should not throw
      expect(result.current).toBeDefined();
    });
  });

  describe("[UNIT] hook return shape", () => {
    test("returns all expected properties", () => {
      const { result } = renderHook(() => useStaffVoting(defaultProps));

      expect(result.current).toHaveProperty("phase");
      expect(result.current).toHaveProperty("blockedReason");
      expect(result.current).toHaveProperty("currentLeft");
      expect(result.current).toHaveProperty("currentRight");
      expect(result.current).toHaveProperty("comparisonCount");
      expect(result.current).toHaveProperty("hardCap");
      expect(result.current).toHaveProperty("progress");
      expect(result.current).toHaveProperty("finalTopThree");
      expect(result.current).toHaveProperty("stableTop3Count");
      expect(result.current).toHaveProperty("bootstrapped");
      expect(result.current).toHaveProperty("ranking");
      expect(result.current).toHaveProperty("handlePickWinner");
      expect(result.current).toHaveProperty("startComparing");
      expect(result.current).toHaveProperty("resetVoting");
      expect(result.current).toHaveProperty("bootstrapVoting");
      expect(result.current).toHaveProperty("MIN_SUBMISSIONS_TO_VOTE");
      expect(result.current).toHaveProperty("TOP3_STABILITY_REQUIRED");
    });
  });
});
