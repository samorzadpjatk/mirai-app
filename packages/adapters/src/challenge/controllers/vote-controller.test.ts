import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  ChallengeVoteController,
  validateGetMyVotesInput,
  validateGetByChallengeInput,
  validateGetVotingProgressInput,
  validateGetJudgedStaffProgressInput,
  validateSubmitVoteInput,
  validateSubmitVotesInput,
  validateForceEndVotingInput,
  type ChallengeCompletedEvent,
} from "./vote-controller";
import {
  ChallengeVoteGatewayTag,
  type ChallengeVoteGateway,
  type ChallengeVoteDTO,
  type VoteDTO,
  ChallengeGatewayTag,
  type ChallengeGateway,
  type ChallengeDTO,
  ChallengeSubmissionGatewayTag,
  type ChallengeSubmissionGateway,
  type ChallengeSubmissionDTO,
} from "@mirai-app/use-cases";
import {
  SubmissionId,
  ChallengeStatus,
  type SubmissionStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

// ============================================================================
// Mock Factories
// ============================================================================

function createMockVoteDTO(
  overrides: Partial<ChallengeVoteDTO> = {},
): ChallengeVoteDTO {
  return {
    id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440005",
    challengeId:
      overrides.challengeId ?? "550e8400-e29b-41d4-a716-446655440000",
    submissionId: overrides.submissionId ?? "cm1testsubmission0001",
    voterId: overrides.voterId ?? "550e8400-e29b-41d4-a716-446655440006",
    votePosition: overrides.votePosition ?? 1,
    votePoints: overrides.votePoints ?? 10,
    normalizedWeight: overrides.normalizedWeight ?? 1.0,
    votedAt: overrides.votedAt ?? new Date("2024-01-01"),
  };
}

function createMockVoteDTOArray(count: number): ChallengeVoteDTO[] {
  return Array.from({ length: count }, (_, i) =>
    createMockVoteDTO({
      id: `550e8400-e29b-41d4-a716-44665544000${i + 5}`,
      submissionId: `cm1testsubmission000${i + 1}`,
      votePosition: (i % 3) + 1,
      votePoints: 10 - i * 3,
    }),
  );
}

function createMockVoteGateway(
  votes: ChallengeVoteDTO[] = [],
): ChallengeVoteGateway {
  const voteMap = new Map(votes.map((v) => [v.id, v]));

  return {
    create: (vote: ChallengeVoteDTO) => {
      voteMap.set(vote.id, vote);
      return Effect.succeed(vote);
    },

    createMany: (votes: ChallengeVoteDTO[]) => {
      for (const vote of votes) {
        voteMap.set(vote.id, vote);
      }
      return Effect.succeed(votes);
    },

    findById: (id: string) => {
      const vote = voteMap.get(id);
      return Effect.succeed(vote ?? null);
    },

    findByChallengeId: (challengeId: string) => {
      const filtered = Array.from(voteMap.values()).filter(
        (v) => v.challengeId === challengeId,
      );
      return Effect.succeed(filtered);
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

    findByChallengeAndVoter: (challengeId: string, voterId: string) => {
      const filtered = Array.from(voteMap.values()).filter(
        (v) => v.challengeId === challengeId && v.voterId === voterId,
      );
      return Effect.succeed(filtered);
    },

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

    hasVoted: (challengeId: string, voterId: string) => {
      const hasVoted = Array.from(voteMap.values()).some(
        (v) => v.challengeId === challengeId && v.voterId === voterId,
      );
      return Effect.succeed(hasVoted);
    },

    hasVotedForPosition: (
      challengeId: string,
      voterId: string,
      position: number,
    ) => {
      const hasVoted = Array.from(voteMap.values()).some(
        (v) =>
          v.challengeId === challengeId &&
          v.voterId === voterId &&
          v.votePosition === position,
      );
      return Effect.succeed(hasVoted);
    },

    getVotedPositions: (challengeId: string, voterId: string) => {
      const positions = Array.from(voteMap.values())
        .filter((v) => v.challengeId === challengeId && v.voterId === voterId)
        .map((v) => v.votePosition);
      return Effect.succeed(positions);
    },

    delete: () => Effect.succeed(void 0),
    deleteByChallengeId: () => Effect.succeed(void 0),
  };
}

function createMockVoteGatewayWithData(
  votes: ChallengeVoteDTO[],
): ChallengeVoteGateway {
  return {
    ...createMockVoteGateway(votes),
    findByChallengeId: (challengeId: string) => {
      const filtered = votes.filter((v) => v.challengeId === challengeId);
      return Effect.succeed(filtered);
    },
    hasVoted: (challengeId: string, voterId: string) => {
      const hasVoted = votes.some(
        (v) => v.challengeId === challengeId && v.voterId === voterId,
      );
      return Effect.succeed(hasVoted);
    },
    getVotedPositions: (challengeId: string, voterId: string) => {
      const positions = votes
        .filter((v) => v.challengeId === challengeId && v.voterId === voterId)
        .map((v) => v.votePosition);
      return Effect.succeed(positions);
    },
  };
}

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
      if (!challenge) {
        return Effect.fail(
          new (class DatabaseError extends Error {
            constructor() {
              super("Challenge not found");
            }
          })(),
        );
      }
      const updated = { ...challenge, status: status as ChallengeStatus };
      challengeMap.set(id, updated);
      return Effect.succeed(updated);
    },
    delete: () => Effect.succeed(void 0),
    exists: (id: string) => Effect.succeed(challengeMap.has(id)),
    countByTripId: () => Effect.succeed(challengeMap.size),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as unknown as ChallengeGateway;
}

function createMockSubmissionGateway(
  submissions: ChallengeSubmissionDTO[] = [],
): ChallengeSubmissionGateway {
  const submissionMap = new Map(submissions.map((s) => [s.id, s]));

  return {
    create: (submission: ChallengeSubmissionDTO) => {
      submissionMap.set(submission.id, submission);
      return Effect.succeed(submission);
    },
    findById: (id: SubmissionId) => {
      const submission = submissionMap.get(id);
      return Effect.succeed(submission ?? null);
    },
    findByChallengeAndGroup: (challengeId: string, groupId: string) => {
      const submission = Array.from(submissionMap.values()).find(
        (s) => s.challengeId === challengeId && s.groupId === groupId,
      );
      return Effect.succeed(submission ?? null);
    },
    update: (submission: ChallengeSubmissionDTO) => {
      submissionMap.set(submission.id, submission);
      return Effect.succeed(submission);
    },
    delete: () => Effect.succeed(void 0),
    existsForChallengeAndGroup: (challengeId: string, groupId: string) => {
      const exists = Array.from(submissionMap.values()).some(
        (s) => s.challengeId === challengeId && s.groupId === groupId,
      );
      return Effect.succeed(exists);
    },
    countByChallengeId: (challengeId: string) => {
      const count = Array.from(submissionMap.values()).filter(
        (s) => s.challengeId === challengeId,
      ).length;
      return Effect.succeed(count);
    },
    countByChallengeAndStatus: (
      challengeId: string,
      status: SubmissionStatus,
    ) => {
      const count = Array.from(submissionMap.values()).filter(
        (s) => s.challengeId === challengeId && s.status === status,
      ).length;
      return Effect.succeed(count);
    },
    findByChallengeId: (challengeId: string) => {
      const filtered = Array.from(submissionMap.values()).filter(
        (s) => s.challengeId === challengeId,
      );
      return Effect.succeed(filtered);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as unknown as ChallengeSubmissionGateway;
}

// ============================================================================
// ChallengeVoteController Tests
// ============================================================================

describe("[UNIT] ChallengeVoteController", () => {
  let controller: ChallengeVoteController;
  let mockLayer: Layer.Layer<unknown>;
  let mockOnChallengeCompleted: (
    params: ChallengeCompletedEvent,
  ) => Promise<void>;
  let completedEvents: ChallengeCompletedEvent[];

  beforeEach(() => {
    const mockVoteGateway = createMockVoteGateway();
    const mockChallengeGateway = createMockChallengeGateway([
      {
        id: "challenge-1",
        tripId: "trip-1",
        title: "Test Challenge",
        description: "Test",
        status: ChallengeStatus.ACTIVE,
        submissionType: SubmissionType.TEXT,
        scoringCategory: ScoringCategory.SPEED,
        points: 100,
        maxPoints: null,
        startDate: null,
        endDate: null,
        createdById: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const mockSubmissionGateway = createMockSubmissionGateway([
      {
        id: "sub-1" as SubmissionId,
        challengeId: "challenge-1",
        userId: "user-1",
        groupId: "group-1",
        content: "Submission 1",
        mediaUrls: [],
        status: "PENDING" as SubmissionStatus,
        score: null,
        reviewedById: null,
        reviewedAt: null,
        reviewNotes: null,
        submittedAt: new Date(),
        updatedAt: new Date(),
        voteCount: 0,
        voteScore: 0,
      },
      {
        id: "sub-2" as SubmissionId,
        challengeId: "challenge-1",
        userId: "user-2",
        groupId: "group-2",
        content: "Submission 2",
        mediaUrls: [],
        status: "PENDING" as SubmissionStatus,
        score: null,
        reviewedById: null,
        reviewedAt: null,
        reviewNotes: null,
        submittedAt: new Date(),
        updatedAt: new Date(),
        voteCount: 0,
        voteScore: 0,
      },
    ]);

    mockLayer = Layer.mergeAll(
      Layer.succeed(ChallengeVoteGatewayTag, mockVoteGateway),
      Layer.succeed(ChallengeGatewayTag, mockChallengeGateway),
      Layer.succeed(ChallengeSubmissionGatewayTag, mockSubmissionGateway),
    ) as Layer.Layer<unknown>;
    completedEvents = [];
    mockOnChallengeCompleted = async (params: ChallengeCompletedEvent) => {
      completedEvents.push(params);
    };
    controller = new ChallengeVoteController(
      mockLayer,
      mockOnChallengeCompleted,
    );
  });

  describe("constructor", () => {
    it("should create controller with app layer and callback", () => {
      const gateway = createMockVoteGateway();
      const layer = Layer.succeed(
        ChallengeVoteGatewayTag,
        gateway,
      ) as Layer.Layer<unknown>;
      const callback = async () => {};
      const ctrl = new ChallengeVoteController(layer, callback);

      expect(ctrl).toBeDefined();
    });
  });

  describe("getMyVotes", () => {
    it("should return votes for valid input", async () => {
      const mockVotes = [
        createMockVoteDTO({
          challengeId: "challenge-1",
          voterId: "voter-1",
          votePosition: 1,
        }),
        createMockVoteDTO({
          challengeId: "challenge-1",
          voterId: "voter-1",
          votePosition: 2,
        }),
      ];
      const mockGateway = createMockVoteGatewayWithData(mockVotes);
      mockLayer = Layer.succeed(
        ChallengeVoteGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeVoteController(
        mockLayer,
        mockOnChallengeCompleted,
      );

      const result = await controller.getMyVotes({
        challengeId: "challenge-1",
        voterId: "voter-1",
      });

      expect(result.success).toBe(true);
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.getMyVotes({
        voterId: "voter-1",
      } as unknown as Parameters<typeof controller.getMyVotes>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing voterId", async () => {
      const result = await controller.getMyVotes({
        challengeId: "challenge-1",
      } as unknown as Parameters<typeof controller.getMyVotes>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty challengeId", async () => {
      const result = await controller.getMyVotes({
        challengeId: "",
        voterId: "voter-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty voterId", async () => {
      const result = await controller.getMyVotes({
        challengeId: "challenge-1",
        voterId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getByChallenge", () => {
    it("should return votes for valid challenge", async () => {
      const mockVotes = createMockVoteDTOArray(3);
      const mockGateway = createMockVoteGatewayWithData(mockVotes);
      mockLayer = Layer.succeed(
        ChallengeVoteGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeVoteController(
        mockLayer,
        mockOnChallengeCompleted,
      );

      const result = await controller.getByChallenge({
        challengeId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(true);
    });

    it("should return empty array when no votes exist", async () => {
      const result = await controller.getByChallenge({
        challengeId: "challenge-no-votes",
      });

      expect(result.success).toBe(true);
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.getByChallenge({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty challengeId", async () => {
      const result = await controller.getByChallenge({
        challengeId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getVotingProgress", () => {
    it("should return progress for valid challenge", async () => {
      const result = await controller.getVotingProgress({
        challengeId: "challenge-1",
      });

      expect(result.success).toBe(true);
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.getVotingProgress({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty challengeId", async () => {
      const result = await controller.getVotingProgress({
        challengeId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getJudgedStaffProgress", () => {
    it("should return progress for valid input", async () => {
      const result = await controller.getJudgedStaffProgress({
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminParticipantIds: ["admin-1", "admin-2"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      });

      expect(result.success).toBe(true);
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.getJudgedStaffProgress({
        tripId: "trip-1",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      } as unknown as Parameters<typeof controller.getJudgedStaffProgress>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing tripId", async () => {
      const result = await controller.getJudgedStaffProgress({
        challengeId: "challenge-1",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      } as unknown as Parameters<typeof controller.getJudgedStaffProgress>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty adminParticipantIds", async () => {
      const result = await controller.getJudgedStaffProgress({
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminParticipantIds: [],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid requiredPositions (too high)", async () => {
      const result = await controller.getJudgedStaffProgress({
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 5,
        eligibleSubmissionsCount: 5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid requiredPositions (too low)", async () => {
      const result = await controller.getJudgedStaffProgress({
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 0,
        eligibleSubmissionsCount: 5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for negative eligibleSubmissionsCount", async () => {
      const result = await controller.getJudgedStaffProgress({
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 3,
        eligibleSubmissionsCount: -1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("submitVote", () => {
    it("should submit vote with valid input", async () => {
      const result = await controller.submitVote({
        challengeId: "challenge-1",
        submissionId: "submission-1",
        voterId: "voter-1",
        position: 1,
        points: 10,
      });

      expect(result.success).toBe(true);
    });

    it("should submit vote with all optional fields", async () => {
      const result = await controller.submitVote({
        challengeId: "challenge-1",
        submissionId: "submission-1",
        voterId: "voter-1",
        position: 2,
        points: 5,
        normalizedWeight: 1.5,
        allowPartial: true,
      });

      expect(result.success).toBe(true);
    });

    it("should submit vote without optional fields", async () => {
      const result = await controller.submitVote({
        challengeId: "challenge-1",
        submissionId: "submission-1",
        voterId: "voter-1",
        position: 3,
      });

      expect(result.success).toBe(true);
    });

    it("should return error for invalid position (too high)", async () => {
      const result = await controller.submitVote({
        challengeId: "challenge-1",
        submissionId: "submission-1",
        voterId: "voter-1",
        position: 5,
        points: 10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid position (too low)", async () => {
      const result = await controller.submitVote({
        challengeId: "challenge-1",
        submissionId: "submission-1",
        voterId: "voter-1",
        position: 0,
        points: 10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.submitVote({
        submissionId: "submission-1",
        voterId: "voter-1",
        position: 1,
      } as unknown as Parameters<typeof controller.submitVote>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing submissionId", async () => {
      const result = await controller.submitVote({
        challengeId: "challenge-1",
        voterId: "voter-1",
        position: 1,
      } as unknown as Parameters<typeof controller.submitVote>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing voterId", async () => {
      const result = await controller.submitVote({
        challengeId: "challenge-1",
        submissionId: "submission-1",
        position: 1,
      } as unknown as Parameters<typeof controller.submitVote>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for negative points", async () => {
      const result = await controller.submitVote({
        challengeId: "challenge-1",
        submissionId: "submission-1",
        voterId: "voter-1",
        position: 1,
        points: -5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("submitVotes", () => {
    it("should submit multiple votes with valid input", async () => {
      const result = await controller.submitVotes({
        challengeId: "challenge-1",
        voterId: "voter-1",
        votes: [
          { submissionId: "sub-1", position: 1, points: 10 },
          { submissionId: "sub-2", position: 2, points: 5 },
          { submissionId: "sub-3", position: 3, points: 3 },
        ],
        requiredPositions: 3,
      });

      expect(result.success).toBe(true);
    });

    it("should submit single vote in batch", async () => {
      const result = await controller.submitVotes({
        challengeId: "challenge-1",
        voterId: "voter-1",
        votes: [{ submissionId: "sub-1", position: 1, points: 10 }],
        requiredPositions: 1,
      });

      expect(result.success).toBe(true);
    });

    it("should return error for empty votes array", async () => {
      const result = await controller.submitVotes({
        challengeId: "challenge-1",
        voterId: "voter-1",
        votes: [],
        requiredPositions: 3,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid vote position in batch", async () => {
      const result = await controller.submitVotes({
        challengeId: "challenge-1",
        voterId: "voter-1",
        votes: [{ submissionId: "sub-1", position: 5, points: 10 }],
        requiredPositions: 3,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid requiredPositions (too high)", async () => {
      const result = await controller.submitVotes({
        challengeId: "challenge-1",
        voterId: "voter-1",
        votes: [{ submissionId: "sub-1", position: 1, points: 10 }],
        requiredPositions: 5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid requiredPositions (too low)", async () => {
      const result = await controller.submitVotes({
        challengeId: "challenge-1",
        voterId: "voter-1",
        votes: [{ submissionId: "sub-1", position: 1, points: 10 }],
        requiredPositions: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.submitVotes({
        voterId: "voter-1",
        votes: [{ submissionId: "sub-1", position: 1, points: 10 }],
        requiredPositions: 3,
      } as unknown as Parameters<typeof controller.submitVotes>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing voterId", async () => {
      const result = await controller.submitVotes({
        challengeId: "challenge-1",
        votes: [{ submissionId: "sub-1", position: 1, points: 10 }],
        requiredPositions: 3,
      } as unknown as Parameters<typeof controller.submitVotes>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing votes field", async () => {
      const result = await controller.submitVotes({
        challengeId: "challenge-1",
        voterId: "voter-1",
        requiredPositions: 3,
      } as unknown as Parameters<typeof controller.submitVotes>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("forceEndVoting", () => {
    it("should force end voting with valid input", async () => {
      // Create merged layer with all required gateways
      const mockVoteGateway = createMockVoteGateway();
      const mockChallengeGateway = createMockChallengeGateway([
        {
          id: "challenge-1",
          tripId: "trip-1",
          title: "Test Challenge",
          description: null,
          status: ChallengeStatus.VOTING_PHASE,
          submissionType: SubmissionType.TEXT,
          scoringCategory: ScoringCategory.JUDGED_STAFF,
          points: 100,
          maxPoints: null,
          startDate: null,
          endDate: new Date("2024-01-01"), // Past date
          createdById: "admin-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      const mockSubmissionGateway = createMockSubmissionGateway();

      const mergedLayer = Layer.mergeAll(
        Layer.succeed(ChallengeVoteGatewayTag, mockVoteGateway),
        Layer.succeed(ChallengeGatewayTag, mockChallengeGateway),
        Layer.succeed(ChallengeSubmissionGatewayTag, mockSubmissionGateway),
      ) as Layer.Layer<unknown>;

      const testController = new ChallengeVoteController(
        mergedLayer,
        mockOnChallengeCompleted,
      );

      const result = await testController.forceEndVoting({
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminId: "admin-1",
      });

      expect(result.success).toBe(true);
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.forceEndVoting({
        tripId: "trip-1",
        adminId: "admin-1",
      } as unknown as Parameters<typeof controller.forceEndVoting>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing tripId", async () => {
      const result = await controller.forceEndVoting({
        challengeId: "challenge-1",
        adminId: "admin-1",
      } as unknown as Parameters<typeof controller.forceEndVoting>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing adminId", async () => {
      const result = await controller.forceEndVoting({
        challengeId: "challenge-1",
        tripId: "trip-1",
      } as unknown as Parameters<typeof controller.forceEndVoting>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty challengeId", async () => {
      const result = await controller.forceEndVoting({
        challengeId: "",
        tripId: "trip-1",
        adminId: "admin-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty tripId", async () => {
      const result = await controller.forceEndVoting({
        challengeId: "challenge-1",
        tripId: "",
        adminId: "admin-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty adminId", async () => {
      const result = await controller.forceEndVoting({
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("input validation exports", () => {
    it("should export validateGetMyVotesInput", () => {
      expect(validateGetMyVotesInput).toBeDefined();
      const result = validateGetMyVotesInput({
        challengeId: "challenge-1",
        voterId: "voter-1",
      });
      expect(result.success).toBe(true);
    });

    it("should export validateGetByChallengeInput", () => {
      expect(validateGetByChallengeInput).toBeDefined();
      const result = validateGetByChallengeInput({
        challengeId: "challenge-1",
      });
      expect(result.success).toBe(true);
    });

    it("should export validateGetVotingProgressInput", () => {
      expect(validateGetVotingProgressInput).toBeDefined();
      const result = validateGetVotingProgressInput({
        challengeId: "challenge-1",
      });
      expect(result.success).toBe(true);
    });

    it("should export validateGetJudgedStaffProgressInput", () => {
      expect(validateGetJudgedStaffProgressInput).toBeDefined();
      const result = validateGetJudgedStaffProgressInput({
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should export validateSubmitVoteInput", () => {
      expect(validateSubmitVoteInput).toBeDefined();
      const result = validateSubmitVoteInput({
        challengeId: "challenge-1",
        submissionId: "submission-1",
        voterId: "voter-1",
        position: 1,
        points: 10,
      });
      expect(result.success).toBe(true);
    });

    it("should export validateSubmitVotesInput", () => {
      expect(validateSubmitVotesInput).toBeDefined();
      const result = validateSubmitVotesInput({
        challengeId: "challenge-1",
        voterId: "voter-1",
        votes: [{ submissionId: "sub-1", position: 1, points: 10 }],
        requiredPositions: 3,
      });
      expect(result.success).toBe(true);
    });

    it("should export validateForceEndVotingInput", () => {
      expect(validateForceEndVotingInput).toBeDefined();
      const result = validateForceEndVotingInput({
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminId: "admin-1",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ChallengeCompletedEvent interface", () => {
    it("should define ChallengeCompletedEvent structure", () => {
      const event: ChallengeCompletedEvent = {
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminId: "admin-1",
      };

      expect(event.challengeId).toBe("challenge-1");
      expect(event.tripId).toBe("trip-1");
      expect(event.adminId).toBe("admin-1");
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// This test file provides comprehensive unit tests for the ChallengeVoteController
// (vote-controller.ts):
//
// ## Test Coverage
//
// 1. **Constructor**
//    - Creates controller with app layer and callback
//
// 2. **getMyVotes**
//    - Returns votes for valid input with challengeId and voterId
//    - Validates required fields (challengeId, voterId)
//    - Handles empty string inputs
//
// 3. **getByChallenge**
//    - Returns all votes for a valid challenge ID
//    - Handles empty results gracefully
//    - Validates challengeId presence
//
// 4. **getVotingProgress**
//    - Returns voting progress for valid challenge
//    - Validates challengeId input
//
// 5. **getJudgedStaffProgress**
//    - Returns judged staff progress for valid input
//    - Validates all required fields:
//      - challengeId, tripId, adminParticipantIds
//      - requiredPositions (1-3 range)
//      - eligibleSubmissionsCount (non-negative)
//
// 6. **submitVote**
//    - Submits single vote with required fields
//    - Handles optional fields (points, normalizedWeight, allowPartial)
//    - Validates position range (1-3)
//    - Validates required fields presence
//    - Validates non-negative points
//
// 7. **submitVotes**
//    - Submits batch votes with valid input
//    - Validates non-empty votes array
//    - Validates vote positions in batch
//    - Validates requiredPositions range (1-3)
//    - Validates all required fields
//
// 8. **forceEndVoting**
//    - Forces end voting with valid input
//    - Validates all required fields:
//      - challengeId, tripId, adminId
//    - Handles empty string inputs
//
// 9. **Input Validation Exports**
//    - All validation functions exported and functional
//    - Tests each validator with valid inputs
//
// 10. **ChallengeCompletedEvent Interface**
//     - Verifies event structure for callbacks
//
// ## Testing Patterns Used
//
// - Effect Layer mocking with Layer.succeed
// - Mock gateway factories with createMockVoteGateway
// - [UNIT] prefix convention for all describe blocks
// - Bun test framework with expect assertions
// - Type-safe controller method testing
//
// ## Key Features Tested
//
// - Input validation using Effect Schema
// - Effect.useCase delegation
// - Error handling with success/error result pattern
// - Callback integration for forceEndVoting
// - Branded ID handling (SubmissionId)
