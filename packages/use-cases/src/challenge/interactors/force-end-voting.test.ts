import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  forceEndVotingUseCase,
  type ForceEndVotingInput,
  ForceEndChallengeNotFoundError,
  ForceEndValidationError,
  ChallengeWrongTripError,
  ForceEndOperationError,
} from "./force-end-voting";
import { ChallengeGatewayTag, type ChallengeGateway } from "../ports/gateway";
import {
  ChallengeVoteGatewayTag,
  type ChallengeVoteGateway,
} from "../ports/vote/gateway";
import {
  ChallengeSubmissionGatewayTag,
  type ChallengeSubmissionGateway,
} from "../ports/submission/gateway";
import type { ChallengeDTO, ChallengeSubmissionDTO } from "../dto";
import type { ChallengeVoteDTO } from "../dto";
import {
  DatabaseError,
  ChallengeStatus,
  ScoringCategory,
  SubmissionType,
} from "@mirai-app/domain";

/**
 * Mock ChallengeGateway for testing
 */
function createMockChallengeGateway(
  challenges: ChallengeDTO[] = [],
): ChallengeGateway {
  const challengeMap = new Map(challenges.map((c) => [c.id, c]));

  return {
    create: (challenge: ChallengeDTO) => {
      challengeMap.set(challenge.id, challenge);
      return Effect.succeed(challenge);
    },

    findById: (id: string) => {
      const challenge = challengeMap.get(id);
      return Effect.succeed(challenge ?? null);
    },

    update: (challenge: ChallengeDTO) => {
      challengeMap.set(challenge.id, challenge);
      return Effect.succeed(challenge);
    },

    updateStatus: (id: string, status: string) => {
      const challenge = challengeMap.get(id);
      if (challenge) {
        const updated = {
          ...challenge,
          status: status as ChallengeStatus,
        };
        challengeMap.set(id, updated);
        return Effect.succeed(updated);
      }
      return Effect.fail(
        new DatabaseError({
          operation: "updateStatus",
          message: "Challenge not found",
        }),
      );
    },

    delete: () => Effect.succeed(void 0),

    exists: () => Effect.succeed(false),

    countByTripId: () => Effect.succeed(0),

    findByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByStatusConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByTripIdAndStatusConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findBySubmissionTypeConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByScoringCategoryConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findActiveConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findOpenForSubmissionConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findRecurringConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findAllConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),
  };
}

/**
 * Mock ChallengeVoteGateway for testing
 */
function createMockVoteGateway(
  votes: ChallengeVoteDTO[] = [],
): ChallengeVoteGateway {
  const voteMap = new Map(votes.map((v) => [v.id, v]));
  const challengeVotesMap = new Map<string, ChallengeVoteDTO[]>();
  for (const vote of votes) {
    const list = challengeVotesMap.get(vote.challengeId) ?? [];
    list.push(vote);
    challengeVotesMap.set(vote.challengeId, list);
  }

  return {
    create: (vote: ChallengeVoteDTO) => {
      voteMap.set(vote.id, vote);
      const list = challengeVotesMap.get(vote.challengeId) ?? [];
      list.push(vote);
      challengeVotesMap.set(vote.challengeId, list);
      return Effect.succeed(vote);
    },

    createMany: (votes: ChallengeVoteDTO[]) => {
      for (const vote of votes) {
        voteMap.set(vote.id, vote);
        const list = challengeVotesMap.get(vote.challengeId) ?? [];
        list.push(vote);
        challengeVotesMap.set(vote.challengeId, list);
      }
      return Effect.succeed(votes);
    },

    findById: (id: string) => {
      const vote = voteMap.get(id);
      return Effect.succeed(vote ?? null);
    },

    findByChallengeId: (challengeId: string) => {
      const list = challengeVotesMap.get(challengeId) ?? [];
      return Effect.succeed(list);
    },

    findByChallengeIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByChallengeAndVoterConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findBySubmissionIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    hasVoted: () => Effect.succeed(false),

    hasVotedForPosition: () => Effect.succeed(false),

    getVotedPositions: () => Effect.succeed([]),

    delete: () => Effect.succeed(void 0),

    deleteByChallengeId: () => Effect.succeed(void 0),
  };
}

/**
 * Mock ChallengeSubmissionGateway for testing
 */
function createMockSubmissionGateway(
  submissions: ChallengeSubmissionDTO[] = [],
): ChallengeSubmissionGateway {
  return {
    create: (submission: ChallengeSubmissionDTO) => Effect.succeed(submission),

    findById: () => Effect.succeed(null),

    findByChallengeAndGroup: () => Effect.succeed(null),

    update: (submission: ChallengeSubmissionDTO) => Effect.succeed(submission),

    delete: () => Effect.succeed(void 0),

    existsForChallengeAndGroup: () => Effect.succeed(false),

    countByChallengeId: () => Effect.succeed(0),

    countByChallengeAndStatus: () => Effect.succeed(0),

    findByChallengeId: () => Effect.succeed([]),

    findByChallengeIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByChallengeIdByCreatedAtConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByGroupIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByStatusConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findManyConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),
  };
}

function createMockChallengeDTO(
  overrides: Partial<ChallengeDTO> = {},
): ChallengeDTO {
  return {
    id: overrides.id ?? "challenge-123",
    tripId: overrides.tripId ?? "trip-123",
    title: overrides.title ?? "Test Challenge",
    description: overrides.description ?? null,
    status: overrides.status ?? ChallengeStatus.VOTING_PHASE,
    submissionType: overrides.submissionType ?? SubmissionType.IMAGE,
    scoringCategory: overrides.scoringCategory ?? ScoringCategory.JUDGED_STAFF,
    points: overrides.points ?? 100,
    maxPoints: overrides.maxPoints ?? null,
    startDate: overrides.startDate ?? new Date("2024-01-01"),
    endDate: overrides.endDate ?? new Date("2024-01-01"),
    createdById: overrides.createdById ?? "user-123",
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
  };
}

describe("[UNIT] forceEndVotingUseCase", () => {
  it("should force end voting successfully for judged staff challenge", async () => {
    const pastDate = new Date("2024-01-01");
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-456",
      tripId: "trip-456",
      status: ChallengeStatus.VOTING_PHASE,
      scoringCategory: ScoringCategory.JUDGED_STAFF,
    });
    // Set endDate in the past (for submission phase ended check)
    mockChallenge.endDate = pastDate;

    const challengeGateway = createMockChallengeGateway([mockChallenge]);
    const voteGateway = createMockVoteGateway();
    const submissionGateway = createMockSubmissionGateway();

    const mockLayer = Layer.mergeAll(
      Layer.succeed(ChallengeGatewayTag, challengeGateway),
      Layer.succeed(ChallengeVoteGatewayTag, voteGateway),
      Layer.succeed(ChallengeSubmissionGatewayTag, submissionGateway),
    );

    const input: ForceEndVotingInput = {
      challengeId: "challenge-456",
      tripId: "trip-456",
      adminId: "admin-123",
    };

    const program = forceEndVotingUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.finalized).toBe(true);
    expect(result.challengeStatus).toBe("COMPLETED");
  });

  it("should fail with ForceEndValidationError when challengeId is empty", async () => {
    const challengeGateway = createMockChallengeGateway();
    const voteGateway = createMockVoteGateway();
    const submissionGateway = createMockSubmissionGateway();

    const mockLayer = Layer.mergeAll(
      Layer.succeed(ChallengeGatewayTag, challengeGateway),
      Layer.succeed(ChallengeVoteGatewayTag, voteGateway),
      Layer.succeed(ChallengeSubmissionGatewayTag, submissionGateway),
    );

    const input: ForceEndVotingInput = {
      challengeId: "",
      tripId: "trip-123",
      adminId: "admin-123",
    };

    const program = forceEndVotingUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ForceEndValidationError);
      expect(either.left.message).toBe("Challenge ID is required");
    }
  });

  it("should fail with ForceEndValidationError when tripId is empty", async () => {
    const challengeGateway = createMockChallengeGateway();
    const voteGateway = createMockVoteGateway();
    const submissionGateway = createMockSubmissionGateway();

    const mockLayer = Layer.mergeAll(
      Layer.succeed(ChallengeGatewayTag, challengeGateway),
      Layer.succeed(ChallengeVoteGatewayTag, voteGateway),
      Layer.succeed(ChallengeSubmissionGatewayTag, submissionGateway),
    );

    const input: ForceEndVotingInput = {
      challengeId: "challenge-123",
      tripId: "",
      adminId: "admin-123",
    };

    const program = forceEndVotingUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ForceEndValidationError);
      expect(either.left.message).toBe("Trip ID is required");
    }
  });

  it("should fail with ForceEndValidationError when adminId is empty", async () => {
    const challengeGateway = createMockChallengeGateway();
    const voteGateway = createMockVoteGateway();
    const submissionGateway = createMockSubmissionGateway();

    const mockLayer = Layer.mergeAll(
      Layer.succeed(ChallengeGatewayTag, challengeGateway),
      Layer.succeed(ChallengeVoteGatewayTag, voteGateway),
      Layer.succeed(ChallengeSubmissionGatewayTag, submissionGateway),
    );

    const input: ForceEndVotingInput = {
      challengeId: "challenge-123",
      tripId: "trip-123",
      adminId: "",
    };

    const program = forceEndVotingUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ForceEndValidationError);
      expect(either.left.message).toBe("Admin ID is required");
    }
  });

  it("should fail with ForceEndChallengeNotFoundError when challenge not found", async () => {
    const challengeGateway = createMockChallengeGateway([]);
    const voteGateway = createMockVoteGateway();
    const submissionGateway = createMockSubmissionGateway();

    const mockLayer = Layer.mergeAll(
      Layer.succeed(ChallengeGatewayTag, challengeGateway),
      Layer.succeed(ChallengeVoteGatewayTag, voteGateway),
      Layer.succeed(ChallengeSubmissionGatewayTag, submissionGateway),
    );

    const input: ForceEndVotingInput = {
      challengeId: "non-existent",
      tripId: "trip-123",
      adminId: "admin-123",
    };

    const program = forceEndVotingUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ForceEndChallengeNotFoundError);
    }
  });

  it("should fail with ChallengeWrongTripError when challenge is in wrong trip", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-123",
      tripId: "different-trip",
      status: ChallengeStatus.VOTING_PHASE,
      scoringCategory: ScoringCategory.JUDGED_STAFF,
    });

    const challengeGateway = createMockChallengeGateway([mockChallenge]);
    const voteGateway = createMockVoteGateway();
    const submissionGateway = createMockSubmissionGateway();

    const mockLayer = Layer.mergeAll(
      Layer.succeed(ChallengeGatewayTag, challengeGateway),
      Layer.succeed(ChallengeVoteGatewayTag, voteGateway),
      Layer.succeed(ChallengeSubmissionGatewayTag, submissionGateway),
    );

    const input: ForceEndVotingInput = {
      challengeId: "challenge-123",
      tripId: "wrong-trip",
      adminId: "admin-123",
    };

    const program = forceEndVotingUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeWrongTripError);
    }
  });

  it("should fail with ForceEndValidationError when not a judged staff challenge", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-123",
      tripId: "trip-123",
      status: ChallengeStatus.VOTING_PHASE,
      scoringCategory: ScoringCategory.SPEED,
    });

    const challengeGateway = createMockChallengeGateway([mockChallenge]);
    const voteGateway = createMockVoteGateway();
    const submissionGateway = createMockSubmissionGateway();

    const mockLayer = Layer.mergeAll(
      Layer.succeed(ChallengeGatewayTag, challengeGateway),
      Layer.succeed(ChallengeVoteGatewayTag, voteGateway),
      Layer.succeed(ChallengeSubmissionGatewayTag, submissionGateway),
    );

    const input: ForceEndVotingInput = {
      challengeId: "challenge-123",
      tripId: "trip-123",
      adminId: "admin-123",
    };

    const program = forceEndVotingUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ForceEndValidationError);
      expect(either.left.message).toBe(
        "Force end is available only for judged staff challenges",
      );
    }
  });

  it("should fail with ForceEndValidationError when challenge is cancelled", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-123",
      tripId: "trip-123",
      status: ChallengeStatus.CANCELLED,
      scoringCategory: ScoringCategory.JUDGED_STAFF,
    });

    const challengeGateway = createMockChallengeGateway([mockChallenge]);
    const voteGateway = createMockVoteGateway();
    const submissionGateway = createMockSubmissionGateway();

    const mockLayer = Layer.mergeAll(
      Layer.succeed(ChallengeGatewayTag, challengeGateway),
      Layer.succeed(ChallengeVoteGatewayTag, voteGateway),
      Layer.succeed(ChallengeSubmissionGatewayTag, submissionGateway),
    );

    const input: ForceEndVotingInput = {
      challengeId: "challenge-123",
      tripId: "trip-123",
      adminId: "admin-123",
    };

    const program = forceEndVotingUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ForceEndValidationError);
      expect(either.left.message).toBe(
        "Cancelled challenge cannot be finalized",
      );
    }
  });

  it("should return success but not finalized when challenge already completed", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-completed",
      tripId: "trip-123",
      status: ChallengeStatus.COMPLETED,
      scoringCategory: ScoringCategory.JUDGED_STAFF,
    });

    const challengeGateway = createMockChallengeGateway([mockChallenge]);
    const voteGateway = createMockVoteGateway();
    const submissionGateway = createMockSubmissionGateway();

    const mockLayer = Layer.mergeAll(
      Layer.succeed(ChallengeGatewayTag, challengeGateway),
      Layer.succeed(ChallengeVoteGatewayTag, voteGateway),
      Layer.succeed(ChallengeSubmissionGatewayTag, submissionGateway),
    );

    const input: ForceEndVotingInput = {
      challengeId: "challenge-completed",
      tripId: "trip-123",
      adminId: "admin-123",
    };

    const program = forceEndVotingUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.finalized).toBe(false);
    expect(result.challengeStatus).toBe("COMPLETED");
  });
});
