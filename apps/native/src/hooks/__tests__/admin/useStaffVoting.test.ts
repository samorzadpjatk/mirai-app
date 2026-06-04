import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import {
  type VotingSubmission,
  pickNextPair,
  rankByRating,
  toPairKey,
  useStaffVoting,
} from "../../admin/useStaffVoting";

describe("useStaffVoting", () => {
  const mockSubmissions: VotingSubmission[] = [
    {
      id: "sub-1",
      groupId: "group-1",
      groupName: "Team Alpha",
      imagePath: "/images/1.jpg",
      createdAt: "2024-01-01T10:00:00Z",
    },
    {
      id: "sub-2",
      groupId: "group-2",
      groupName: "Team Beta",
      imagePath: "/images/2.jpg",
      createdAt: "2024-01-01T11:00:00Z",
    },
    {
      id: "sub-3",
      groupId: "group-3",
      groupName: "Team Gamma",
      imagePath: "/images/3.jpg",
      createdAt: "2024-01-01T12:00:00Z",
    },
    {
      id: "sub-4",
      groupId: "group-4",
      groupName: "Team Delta",
      imagePath: "/images/4.jpg",
      createdAt: "2024-01-01T13:00:00Z",
    },
  ];

  const defaultProps = {
    votingSubmissions: mockSubmissions,
    hasMyCompleteVote: false,
    requiredVotePositions: 4,
    judgedStaffProgress: { eligibleSubmissionsCount: 4 },
    myVotesError: undefined,
    judgedStaffProgressError: undefined,
    challenge: {
      scoringCategory: "JUDGED_STAFF" as const,
      endTime: new Date(Date.now() - 1000).toISOString(),
      status: "ACTIVE" as const,
    },
    onPhaseChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return correct initial state", () => {
    const { result } = renderHook(() => useStaffVoting(defaultProps));

    expect(result.current.phase).toBe("comparing");
    expect(result.current.comparisonCount).toBe(0);
    expect(result.current.stableTop3Count).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.hardCap).toBe(mockSubmissions.length * 2);
    expect(result.current.MIN_SUBMISSIONS_TO_VOTE).toBe(2);
    expect(result.current.TOP3_STABILITY_REQUIRED).toBe(3);
  });

  it("should handle picking a winner and update ratings", () => {
    const { result } = renderHook(() => useStaffVoting(defaultProps));

    act(() => {
      result.current.startComparing();
    });

    const initialPair = result.current.currentPair;
    expect(initialPair).not.toBeNull();

    act(() => {
      result.current.handlePickWinner(initialPair![0]);
    });

    expect(result.current.comparisonCount).toBe(1);
  });

  it("should transition to confirming phase after enough comparisons", () => {
    const onPhaseChange = jest.fn();
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        onPhaseChange,
        votingSubmissions: mockSubmissions.slice(0, 2),
      }),
    );

    act(() => {
      result.current.startComparing();
    });

    for (let i = 0; i < 5; i++) {
      const pair = result.current.currentPair;
      if (!pair) break;

      act(() => {
        result.current.handlePickWinner(pair[0]);
      });
    }

    expect(result.current.phase).toBe("confirming");
    expect(onPhaseChange).toHaveBeenCalledWith("confirming");
  });

  it("should calculate final top three correctly", () => {
    const { result } = renderHook(() => useStaffVoting(defaultProps));

    act(() => {
      result.current.startComparing();
    });

    for (let i = 0; i < 3; i++) {
      const pair = result.current.currentPair;
      if (!pair) break;

      act(() => {
        result.current.handlePickWinner(pair[0]);
      });
    }

    expect(result.current.finalTopThree).toHaveLength(3);
    expect(result.current.calculatedTopThree).toHaveLength(3);
  });

  it("should block voting when challenge is not JUDGED_STAFF", () => {
    const onPhaseChange = jest.fn();
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        challenge: {
          ...defaultProps.challenge,
          scoringCategory: "SPEED" as const,
        },
        onPhaseChange,
      }),
    );

    act(() => {
      result.current.bootstrapVoting();
    });

    expect(result.current.phase).toBe("blocked");
    expect(result.current.blockedReason).toBe(
      "This screen is available only for Judged Staff challenges.",
    );
  });

  it("should block voting when submission phase has not ended", () => {
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        challenge: {
          ...defaultProps.challenge,
          endTime: new Date(Date.now() + 86400000).toISOString(),
        },
      }),
    );

    act(() => {
      result.current.bootstrapVoting();
    });

    expect(result.current.phase).toBe("blocked");
    expect(result.current.blockedReason).toContain(
      "Staff voting will be available only after submission phase ends",
    );
  });

  it("should block voting when challenge is cancelled", () => {
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        challenge: {
          ...defaultProps.challenge,
          status: "CANCELLED" as const,
        },
      }),
    );

    act(() => {
      result.current.bootstrapVoting();
    });

    expect(result.current.phase).toBe("blocked");
    expect(result.current.blockedReason).toBe("Challenge is cancelled.");
  });

  it("should handle myVotesError", () => {
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        myVotesError: new Error("Failed to load votes"),
      }),
    );

    act(() => {
      result.current.bootstrapVoting();
    });

    expect(result.current.phase).toBe("blocked");
    expect(result.current.blockedReason).toBe("Failed to load votes");
  });

  it("should handle judgedStaffProgressError", () => {
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        judgedStaffProgressError: new Error("Progress load failed"),
      }),
    );

    act(() => {
      result.current.bootstrapVoting();
    });

    expect(result.current.phase).toBe("blocked");
    expect(result.current.blockedReason).toBe("Progress load failed");
  });

  it("should reset voting state", () => {
    const onPhaseChange = jest.fn();
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        onPhaseChange,
      }),
    );

    act(() => {
      result.current.startComparing();
    });

    const pair = result.current.currentPair;
    if (pair) {
      act(() => {
        result.current.handlePickWinner(pair[0]);
      });
    }

    act(() => {
      result.current.resetVoting();
    });

    expect(result.current.phase).toBe("comparing");
    expect(result.current.comparisonCount).toBe(0);
    expect(onPhaseChange).toHaveBeenCalledWith("comparing");
  });

  it("should provide correct current left and right submissions", () => {
    const { result } = renderHook(() => useStaffVoting(defaultProps));

    act(() => {
      result.current.startComparing();
    });

    const pair = result.current.currentPair;
    expect(pair).not.toBeNull();

    const left = result.current.currentLeft;
    const right = result.current.currentRight;

    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    expect(left?.id).toBe(pair![0]);
    expect(right?.id).toBe(pair![1]);
  });

  it("should calculate progress correctly", () => {
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        votingSubmissions: mockSubmissions.slice(0, 2),
      }),
    );

    act(() => {
      result.current.startComparing();
    });

    const hardCap = result.current.hardCap;
    expect(hardCap).toBe(4);

    const pair = result.current.currentPair;
    if (pair) {
      act(() => {
        result.current.handlePickWinner(pair[0]);
      });
    }

    expect(result.current.progress).toBe(0.25);
    expect(result.current.comparisonCount).toBe(1);
  });

  it("should not allow picking winner when not in comparing phase", () => {
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        hasMyCompleteVote: true,
      }),
    );

    act(() => {
      result.current.bootstrapVoting();
    });

    const initialPhase = result.current.phase;

    act(() => {
      result.current.handlePickWinner("sub-1");
    });

    expect(result.current.phase).toBe(initialPhase);
  });

  it("should require minimum 2 submissions to start comparing", () => {
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        votingSubmissions: [],
        requiredVotePositions: 0,
      }),
    );

    act(() => {
      result.current.startComparing();
    });

    expect(result.current.currentPair).toBeNull();
  });

  it("should handle missing challenge endTime", () => {
    const { result } = renderHook(() =>
      useStaffVoting({
        ...defaultProps,
        challenge: {
          ...defaultProps.challenge,
          endTime: null,
        },
      }),
    );

    act(() => {
      result.current.bootstrapVoting();
    });

    expect(result.current.phase).toBe("blocked");
    expect(result.current.blockedReason).toContain("Set submission end time first");
  });

  it("should provide ranking of all submissions", () => {
    const { result } = renderHook(() => useStaffVoting(defaultProps));

    act(() => {
      result.current.startComparing();
    });

    for (let i = 0; i < 5; i++) {
      const pair = result.current.currentPair;
      if (!pair) break;

      act(() => {
        result.current.handlePickWinner(pair[0]);
      });
    }

    const ranking = result.current.ranking;
    expect(ranking.length).toBe(mockSubmissions.length);
  });

  it("should provide submission by id lookup", () => {
    const { result } = renderHook(() => useStaffVoting(defaultProps));

    act(() => {
      result.current.startComparing();
    });

    const left = result.current.currentLeft;
    expect(left).not.toBeNull();
    expect(left?.groupName).toBeDefined();
  });

  it("should handle stable top 3 tracking", () => {
    const { result } = renderHook(() => useStaffVoting(defaultProps));

    act(() => {
      result.current.startComparing();
    });

    expect(result.current.stableTop3Count).toBe(0);

    for (let i = 0; i < 3; i++) {
      const pair = result.current.currentPair;
      if (!pair) break;

      act(() => {
        result.current.handlePickWinner(pair[0]);
      });
    }

    expect(result.current.comparisonCount).toBe(3);
  });
});

describe("toPairKey", () => {
  it("should create consistent key regardless of order", () => {
    expect(toPairKey("a", "b")).toBe("a|b");
    expect(toPairKey("b", "a")).toBe("a|b");
  });

  it("should handle same ids", () => {
    expect(toPairKey("a", "a")).toBe("a|a");
  });
});

describe("rankByRating", () => {
  it("should sort by rating descending", () => {
    const submissions: VotingSubmission[] = [
      { id: "1", groupId: "g1", groupName: "A", imagePath: "", createdAt: "2024-01-01T10:00:00Z" },
      { id: "2", groupId: "g2", groupName: "B", imagePath: "", createdAt: "2024-01-01T10:00:00Z" },
    ];
    const ratings = { "1": 1600, "2": 1500 };
    const result = rankByRating(submissions, ratings);
    expect(result[0]!.id).toBe("1");
    expect(result[1]!.id).toBe("2");
  });

  it("should use base rating when not found", () => {
    const submissions: VotingSubmission[] = [
      { id: "1", groupId: "g1", groupName: "A", imagePath: "", createdAt: "2024-01-01T10:00:00Z" },
    ];
    const result = rankByRating(submissions, {});
    expect(result[0]!.id).toBe("1");
  });
});

describe("pickNextPair", () => {
  it("should return null when no candidates", () => {
    const submissions: VotingSubmission[] = [
      { id: "1", groupId: "g1", groupName: "A", imagePath: "", createdAt: "2024-01-01T10:00:00Z" },
    ];
    const result = pickNextPair(submissions, {}, new Set());
    expect(result).toBeNull();
  });

  it("should skip already compared pairs", () => {
    const submissions: VotingSubmission[] = [
      { id: "1", groupId: "g1", groupName: "A", imagePath: "", createdAt: "2024-01-01T10:00:00Z" },
      { id: "2", groupId: "g2", groupName: "B", imagePath: "", createdAt: "2024-01-01T10:00:00Z" },
    ];
    const comparedPairs = new Set(["1|2"]);
    const result = pickNextPair(submissions, {}, comparedPairs);
    expect(result).toBeNull();
  });

  it("should skip same group pairs", () => {
    const submissions: VotingSubmission[] = [
      { id: "1", groupId: "g1", groupName: "A", imagePath: "", createdAt: "2024-01-01T10:00:00Z" },
      { id: "2", groupId: "g1", groupName: "B", imagePath: "", createdAt: "2024-01-01T10:00:00Z" },
    ];
    const result = pickNextPair(submissions, {}, new Set());
    expect(result).toBeNull();
  });
});
