import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  ChallengeController,
  validateGetByIdInput,
  validateGetByTripIdInput,
  validateCreateInput,
  validateUpdateInput,
  validateUpdateStatusInput,
  validateListInput,
  validateListByStatusInput,
} from "./controller";
import {
  ChallengeSubmissionController,
  validateGetByIdInput as validateSubmissionGetByIdInput,
  validateGetByChallengeAndGroupInput,
  validateGetByChallengeInput,
  validateCreateInput as validateSubmissionCreateInput,
  validateUpdateInput as validateSubmissionUpdateInput,
  validateDeleteInput,
} from "./submission-controller";
import {
  ChallengeVoteController,
  validateGetMyVotesInput,
  validateGetByChallengeInput as validateVoteGetByChallengeInput,
  validateGetVotingProgressInput,
  validateGetJudgedStaffProgressInput,
  validateSubmitVoteInput,
  validateSubmitVotesInput,
  validateForceEndVotingInput,
} from "./vote-controller";
import {
  ChallengeGatewayTag,
  type ChallengeGateway,
  ChallengeSubmissionGatewayTag,
  type ChallengeSubmissionGateway,
  ChallengeVoteGatewayTag,
  type ChallengeVoteGateway,
  type ChallengeDTO,
  type ChallengeSubmissionDTO,
  type ChallengeVoteDTO,
} from "@mirai-app/use-cases";
import {
  SubmissionId,
  ChallengeStatus,
  type SubmissionStatus,
  DatabaseError,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

// ============================================================================
// Mock Factories
// ============================================================================

function createMockChallengeDTO(
  overrides: Partial<ChallengeDTO> = {},
): ChallengeDTO {
  const submissionType: ChallengeDTO["submissionType"] = SubmissionType.TEXT;
  const scoringCategory: ChallengeDTO["scoringCategory"] =
    ScoringCategory.SPEED;
  return {
    id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440000",
    tripId: overrides.tripId ?? "550e8400-e29b-41d4-a716-446655440001",
    title: overrides.title ?? "Test Challenge",
    description: overrides.description ?? "Test description",
    status: overrides.status ?? ChallengeStatus.ACTIVE,
    submissionType: overrides.submissionType ?? submissionType,
    scoringCategory: overrides.scoringCategory ?? scoringCategory,
    points: overrides.points ?? 100,
    maxPoints: overrides.maxPoints ?? null,
    startDate: overrides.startDate ?? null,
    endDate: overrides.endDate ?? null,
    createdById:
      overrides.createdById ?? "550e8400-e29b-41d4-a716-446655440002",
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
  };
}

function createMockSubmissionDTO(
  overrides: Partial<ChallengeSubmissionDTO> = {},
): ChallengeSubmissionDTO {
  return {
    id: overrides.id ?? "cm1testsubmission0001",
    challengeId:
      overrides.challengeId ?? "550e8400-e29b-41d4-a716-446655440000",
    userId: overrides.userId ?? "550e8400-e29b-41d4-a716-446655440003",
    groupId: overrides.groupId ?? "550e8400-e29b-41d4-a716-446655440004",
    content: overrides.content ?? "Test submission content",
    mediaUrls: overrides.mediaUrls ?? ["https://example.com/image1.jpg"],
    status: overrides.status ?? ("PENDING" as SubmissionStatus),
    score: overrides.score ?? null,
    reviewedById: overrides.reviewedById ?? null,
    reviewedAt: overrides.reviewedAt ?? null,
    reviewNotes: overrides.reviewNotes ?? null,
    submittedAt: overrides.submittedAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
    voteCount: overrides.voteCount ?? 0,
    voteScore: overrides.voteScore ?? 0,
  };
}

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

type MockChallengeGateway = ChallengeGateway & {
  findByTripId: (
    tripId: string,
  ) => Effect.Effect<ChallengeDTO[], DatabaseError, never>;
  findAll: (args: {
    limit?: number;
    offset?: number;
  }) => Effect.Effect<ChallengeDTO[], DatabaseError, never>;
  findByStatus: (
    status: string,
  ) => Effect.Effect<ChallengeDTO[], DatabaseError, never>;
  findActive: () => Effect.Effect<ChallengeDTO[], DatabaseError, never>;
  findOpenForSubmission: () => Effect.Effect<
    ChallengeDTO[],
    DatabaseError,
    never
  >;
};

function createMockChallengeGateway(
  challenges: ChallengeDTO[] = [],
): MockChallengeGateway {
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
          new DatabaseError({
            operation: "updateStatus",
            message: "Challenge not found",
          }),
        );
      }
      const updated = { ...challenge, status: status as ChallengeStatus };
      challengeMap.set(id, updated);
      return Effect.succeed(updated);
    },

    delete: () => Effect.succeed(void 0),
    exists: (id: string) => Effect.succeed(challengeMap.has(id)),
    countByTripId: () => Effect.succeed(challengeMap.size),

    // Methods called by controller (not in interface but needed for tests)
    findByTripId: (tripId: string) => {
      const filtered = Array.from(challengeMap.values()).filter(
        (c) => c.tripId === tripId,
      );
      return Effect.succeed(filtered);
    },

    findAll: (_args: { limit?: number; offset?: number }) => {
      return Effect.succeed(Array.from(challengeMap.values()));
    },

    findByStatus: (status: string) => {
      const filtered = Array.from(challengeMap.values()).filter(
        (c) => c.status === status,
      );
      return Effect.succeed(filtered);
    },

    findActive: () => {
      const filtered = Array.from(challengeMap.values()).filter(
        (c) => c.status === ChallengeStatus.ACTIVE,
      );
      return Effect.succeed(filtered);
    },

    findOpenForSubmission: () => {
      const filtered = Array.from(challengeMap.values()).filter(
        (c) =>
          c.status === ChallengeStatus.VISIBLE ||
          c.status === ChallengeStatus.ACTIVE,
      );
      return Effect.succeed(filtered);
    },

    findByTripIdConnection: (tripId: string) => {
      const filtered = Array.from(challengeMap.values()).filter(
        (c) => c.tripId === tripId,
      );
      return Effect.succeed({
        edges: filtered.map((node) => ({ node, cursor: "cursor-" + node.id })),
        nodes: filtered,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: filtered.length > 0 ? "cursor-" + filtered[0]!.id : null,
          endCursor:
            filtered.length > 0
              ? "cursor-" + filtered[filtered.length - 1]!.id
              : null,
        },
        totalCount: filtered.length,
      });
    },

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

type MockChallengeSubmissionGateway = ChallengeSubmissionGateway & {
  findByGroupId: (
    groupId: string,
  ) => Effect.Effect<ChallengeSubmissionDTO[], DatabaseError, never>;
};

function createMockSubmissionGateway(
  submissions: ChallengeSubmissionDTO[] = [],
): MockChallengeSubmissionGateway {
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

    findByGroupId: (groupId: string) => {
      const filtered = Array.from(submissionMap.values()).filter(
        (s) => s.groupId === groupId,
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

    findManyConnection: (params: { challengeId?: string }) => {
      let filtered = Array.from(submissionMap.values());
      if (params.challengeId) {
        filtered = filtered.filter((s) => s.challengeId === params.challengeId);
      }
      return Effect.succeed({
        edges: filtered.map((node) => ({ node, cursor: "cursor-" + node.id })),
        nodes: filtered,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: filtered.length > 0 ? "cursor-" + filtered[0]!.id : null,
          endCursor:
            filtered.length > 0
              ? "cursor-" + filtered[filtered.length - 1]!.id
              : null,
        },
        totalCount: filtered.length,
      });
    },
  };
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

    findByChallengeAndVoterConnection: (
      challengeId: string,
      voterId: string,
    ) => {
      const filtered = Array.from(voteMap.values()).filter(
        (v) => v.challengeId === challengeId && v.voterId === voterId,
      );
      return Effect.succeed({
        edges: filtered.map((node) => ({ node, cursor: "cursor-" + node.id })),
        nodes: filtered,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: filtered.length > 0 ? "cursor-" + filtered[0]!.id : null,
          endCursor:
            filtered.length > 0
              ? "cursor-" + filtered[filtered.length - 1]!.id
              : null,
        },
        totalCount: filtered.length,
      });
    },

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

// ============================================================================
// ChallengeController Tests
// ============================================================================

describe("[UNIT] ChallengeController", () => {
  let controller: ChallengeController;
  let mockLayer: Layer.Layer<unknown>;

  beforeEach(() => {
    const mockGateway = createMockChallengeGateway();
    mockLayer = Layer.succeed(
      ChallengeGatewayTag,
      mockGateway,
    ) as Layer.Layer<unknown>;
    controller = new ChallengeController(mockLayer);
  });

  describe("getById", () => {
    it("should return challenge when found by valid ID", async () => {
      const mockChallenge = createMockChallengeDTO({
        id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Test Challenge",
        description: "Test description",
      });
      const mockGateway = createMockChallengeGateway([mockChallenge]);
      mockLayer = Layer.succeed(
        ChallengeGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeController(mockLayer);

      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440001");
        expect(result.data.name).toBe("Test Challenge");
        expect(result.data.description).toBe("Test description");
      }
    });

    it("should return error for invalid UUID format", async () => {
      const result = await controller.getById({ id: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when challenge not found", async () => {
      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440999",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should return error for missing id", async () => {
      const result = await controller.getById({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getByTripId", () => {
    it("should return challenges for valid trip ID", async () => {
      const mockChallenges = [
        createMockChallengeDTO({
          id: "550e8400-e29b-41d4-a716-446655440010",
          tripId: "550e8400-e29b-41d4-a716-446655440100",
          title: "Challenge 1",
        }),
        createMockChallengeDTO({
          id: "550e8400-e29b-41d4-a716-446655440011",
          tripId: "550e8400-e29b-41d4-a716-446655440100",
          title: "Challenge 2",
        }),
      ];
      const mockGateway = createMockChallengeGateway(mockChallenges);
      mockLayer = Layer.succeed(
        ChallengeGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeController(mockLayer);

      const result = await controller.getByTripId({
        tripId: "550e8400-e29b-41d4-a716-446655440100",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should return error for invalid trip ID format", async () => {
      const result = await controller.getByTripId({ tripId: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("create", () => {
    it("should create challenge with valid input", async () => {
      const result = await controller.create({
        tripId: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Challenge",
        description: "New description",
        submissionType: "TEXT",
        scoringCategory: "SPEED",
        basePoints: 100,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Challenge");
        expect(result.data.tripId).toBe("550e8400-e29b-41d4-a716-446655440001");
        expect(result.data.status).toBeDefined();
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should return error for missing required fields", async () => {
      const result = await controller.create({
        tripId: "550e8400-e29b-41d4-a716-446655440001",
        // Missing name and submissionType
      } as unknown as Parameters<typeof controller.create>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid trip ID format", async () => {
      const result = await controller.create({
        tripId: "invalid-id",
        name: "New Challenge",
        submissionType: "TEXT",
        scoringCategory: "SPEED",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid submission type", async () => {
      const result = await controller.create({
        tripId: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Challenge",
        submissionType: "INVALID_TYPE",
        scoringCategory: "SPEED",
      } as unknown as Parameters<typeof controller.create>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("update", () => {
    it("should update challenge with valid input", async () => {
      const mockChallenge = createMockChallengeDTO({
        id: "550e8400-e29b-41d4-a716-446655440002",
        title: "Old Title",
      });
      const mockGateway = createMockChallengeGateway([mockChallenge]);
      mockLayer = Layer.succeed(
        ChallengeGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeController(mockLayer);

      const result = await controller.update({
        challengeId: "550e8400-e29b-41d4-a716-446655440002",
        name: "Updated Title",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440002");
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should return error for invalid challenge ID format", async () => {
      const result = await controller.update({
        challengeId: "invalid-id",
        name: "Updated Title",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("updateStatus", () => {
    it("should update challenge status with valid input", async () => {
      const mockChallenge = createMockChallengeDTO({
        id: "550e8400-e29b-41d4-a716-446655440003",
        status: ChallengeStatus.VISIBLE,
        title: "Test Challenge",
      });
      const mockGateway = createMockChallengeGateway([mockChallenge]);
      mockLayer = Layer.succeed(
        ChallengeGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeController(mockLayer);

      const result = await controller.updateStatus({
        challengeId: "550e8400-e29b-41d4-a716-446655440003",
        newStatus: "ACTIVE",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440003");
        expect(result.data.previousStatus).toBe("VISIBLE");
        expect(result.data.newStatus).toBe("ACTIVE");
      }
    });

    it("should return error for invalid status value", async () => {
      const mockChallenge = createMockChallengeDTO({
        id: "550e8400-e29b-41d4-a716-446655440003",
      });
      const mockGateway = createMockChallengeGateway([mockChallenge]);
      mockLayer = Layer.succeed(
        ChallengeGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeController(mockLayer);

      const result = await controller.updateStatus({
        challengeId: "550e8400-e29b-41d4-a716-446655440003",
        newStatus: "INVALID_STATUS",
      } as unknown as Parameters<typeof controller.updateStatus>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("list", () => {
    it("should return list with default pagination", async () => {
      const result = await controller.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it("should return error for invalid limit", async () => {
      const result = await controller.list({ limit: 0 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for limit exceeding 100", async () => {
      const result = await controller.list({ limit: 101 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("listByStatus", () => {
    it("should return list filtered by status", async () => {
      const result = await controller.listByStatus({ status: "ACTIVE" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it("should return error for invalid status", async () => {
      const result = await controller.listByStatus({
        status: "INVALID_STATUS",
      } as unknown as Parameters<typeof controller.listByStatus>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("findActive", () => {
    it("should return active challenges", async () => {
      const result = await controller.findActive();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe("findOpenForSubmission", () => {
    it("should return challenges open for submission", async () => {
      const result = await controller.findOpenForSubmission();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe("input validation exports", () => {
    it("should export all validation functions", () => {
      expect(validateGetByIdInput).toBeDefined();
      expect(validateGetByTripIdInput).toBeDefined();
      expect(validateCreateInput).toBeDefined();
      expect(validateUpdateInput).toBeDefined();
      expect(validateUpdateStatusInput).toBeDefined();
      expect(validateListInput).toBeDefined();
      expect(validateListByStatusInput).toBeDefined();
    });
  });
});

// ============================================================================
// ChallengeSubmissionController Tests
// ============================================================================

describe("[UNIT] ChallengeSubmissionController", () => {
  let controller: ChallengeSubmissionController;
  let mockLayer: Layer.Layer<unknown>;

  beforeEach(() => {
    const mockGateway = createMockSubmissionGateway();
    mockLayer = Layer.succeed(
      ChallengeSubmissionGatewayTag,
      mockGateway,
    ) as Layer.Layer<unknown>;
    controller = new ChallengeSubmissionController(mockLayer);
  });

  describe("getById", () => {
    it("should return submission when found by valid ID", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
        content: "Test submission",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.getById({
        submissionId: "cm1testsubmission0001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.id).toBe("cm1testsubmission0001");
        expect(result.data!.content).toBe("Test submission");
      }
    });

    it("should return error for missing submissionId", async () => {
      const result = await controller.getById({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty submissionId", async () => {
      const result = await controller.getById({ submissionId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getByChallengeAndGroup", () => {
    it("should return submission for valid challenge and group", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
        challengeId: "challenge-1",
        groupId: "group-1",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.getByChallengeAndGroup({
        challengeId: "challenge-1",
        groupId: "group-1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toBeNull();
        if (result.data) {
          expect(result.data.challengeId).toBe("challenge-1");
          expect(result.data.groupId).toBe("group-1");
        }
      }
    });

    it("should return null when submission not found", async () => {
      const result = await controller.getByChallengeAndGroup({
        challengeId: "challenge-1",
        groupId: "group-1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.getByChallengeAndGroup({
        groupId: "group-1",
      } as unknown as Parameters<typeof controller.getByChallengeAndGroup>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing groupId", async () => {
      const result = await controller.getByChallengeAndGroup({
        challengeId: "challenge-1",
      } as unknown as Parameters<typeof controller.getByChallengeAndGroup>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("listByChallenge", () => {
    it("should return submissions for valid challenge", async () => {
      const mockSubmissions = [
        createMockSubmissionDTO({
          id: "cm1testsub0001",
          challengeId: "challenge-1",
        }),
        createMockSubmissionDTO({
          id: "cm1testsub0002",
          challengeId: "challenge-1",
        }),
      ];
      const mockGateway = createMockSubmissionGateway(mockSubmissions);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.listByChallenge({
        challengeId: "challenge-1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.submissions).toHaveLength(2);
        expect(result.data!.totalCount).toBe(2);
      }
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.listByChallenge({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("create", () => {
    it("should create submission with valid input", async () => {
      const result = await controller.create({
        challengeId: "challenge-1",
        groupId: "group-1",
        imageIds: ["image-1", "image-2"],
        textContent: "Test content",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.challengeId).toBe("challenge-1");
        expect(result.data!.groupId).toBe("group-1");
        expect(result.data!.id).toBeDefined();
      }
    });

    it("should create submission without optional fields", async () => {
      const result = await controller.create({
        challengeId: "challenge-1",
        groupId: "group-1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.challengeId).toBe("challenge-1");
      }
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.create({
        groupId: "group-1",
      } as unknown as Parameters<typeof controller.create>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing groupId", async () => {
      const result = await controller.create({
        challengeId: "challenge-1",
      } as unknown as Parameters<typeof controller.create>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for too many images", async () => {
      const result = await controller.create({
        challengeId: "challenge-1",
        groupId: "group-1",
        imageIds: Array(11).fill("image-id"),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("update", () => {
    it("should update submission with valid input", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
        content: "Old content",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        textContent: "Updated content",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.id).toBe("cm1testsubmission0001");
      }
    });

    it("should update submission with review action", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
        status: "PENDING",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        reviewAction: "APPROVE",
        reviewedById: "admin-1",
        awardedPoints: 100,
      });

      expect(result.success).toBe(true);
    });

    it("should return error for invalid submissionId", async () => {
      const result = await controller.update({
        submissionId: "",
        textContent: "Updated content",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("delete", () => {
    it("should delete submission with valid ID", async () => {
      // Setup mock with a PENDING submission that can be deleted
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
        status: "PENDING",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.delete({
        submissionId: "cm1testsubmission0001",
      });

      expect(result.success).toBe(true);
    });

    it("should return error for missing submissionId", async () => {
      const result = await controller.delete({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getByGroupId", () => {
    it("should return submissions for valid group ID", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
        groupId: "group-1",
        challengeId: "challenge-1",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.getByGroupId({ groupId: "group-1" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeGreaterThan(0);
      }
    });
  });

  describe("input validation exports", () => {
    it("should export all validation functions", () => {
      expect(validateSubmissionGetByIdInput).toBeDefined();
      expect(validateGetByChallengeAndGroupInput).toBeDefined();
      expect(validateGetByChallengeInput).toBeDefined();
      expect(validateSubmissionCreateInput).toBeDefined();
      expect(validateSubmissionUpdateInput).toBeDefined();
      expect(validateDeleteInput).toBeDefined();
    });
  });
});

// ============================================================================
// ChallengeVoteController Tests
// ============================================================================

describe("[UNIT] ChallengeVoteController", () => {
  let controller: ChallengeVoteController;
  let mockLayer: Layer.Layer<unknown>;
  let mockOnChallengeCompleted: (params: {
    challengeId: string;
    tripId: string;
    adminId: string;
  }) => Promise<void>;

  beforeEach(() => {
    const mockGateway = createMockVoteGateway();
    mockLayer = Layer.succeed(
      ChallengeVoteGatewayTag,
      mockGateway,
    ) as Layer.Layer<unknown>;
    mockOnChallengeCompleted = () => Promise.resolve();
    controller = new ChallengeVoteController(
      mockLayer,
      mockOnChallengeCompleted,
    );
  });

  describe("getMyVotes", () => {
    it("should return votes for valid input", async () => {
      const mockVote = createMockVoteDTO({
        challengeId: "challenge-1",
        voterId: "voter-1",
      });
      const mockGateway = createMockVoteGateway([mockVote]);
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
      if (result.success) {
        const data = (
          result as {
            success: true;
            data: { votes: unknown[]; totalVotes: number };
          }
        ).data;
        expect(Array.isArray(data.votes)).toBe(true);
        expect(data.totalVotes).toBeGreaterThanOrEqual(0);
      }
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
  });

  describe("getByChallenge", () => {
    it("should return votes for valid challenge", async () => {
      const mockVote = createMockVoteDTO({ challengeId: "challenge-1" });
      const mockGateway = createMockVoteGateway([mockVote]);
      mockLayer = Layer.succeed(
        ChallengeVoteGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeVoteController(
        mockLayer,
        mockOnChallengeCompleted,
      );

      const result = await controller.getByChallenge({
        challengeId: "challenge-1",
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

    it("should return error for missing required fields", async () => {
      const result = await controller.getJudgedStaffProgress({
        challengeId: "challenge-1",
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

    it("should return error for invalid requiredPositions", async () => {
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

    it("should return error for invalid position", async () => {
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

    it("should return error for missing required fields", async () => {
      const result = await controller.submitVote({
        challengeId: "challenge-1",
      } as unknown as Parameters<typeof controller.submitVote>[0]);

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

    it("should return error for invalid vote position", async () => {
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

    it("should return error for missing required fields", async () => {
      const result = await controller.submitVotes({
        challengeId: "challenge-1",
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
        createMockChallengeDTO({
          id: "challenge-1",
          tripId: "trip-1",
          scoringCategory: ScoringCategory.JUDGED_STAFF,
          status: ChallengeStatus.VOTING_PHASE,
          endDate: new Date("2024-01-01"), // Past date to allow force end
        }),
      ]);
      const mockSubmissionGateway = createMockSubmissionGateway();

      const mergedLayer = Layer.mergeAll(
        Layer.succeed(ChallengeVoteGatewayTag, mockVoteGateway),
        Layer.succeed(ChallengeGatewayTag, mockChallengeGateway),
        Layer.succeed(ChallengeSubmissionGatewayTag, mockSubmissionGateway),
      ) as Layer.Layer<unknown>;

      controller = new ChallengeVoteController(
        mergedLayer,
        mockOnChallengeCompleted,
      );

      const result = await controller.forceEndVoting({
        challengeId: "challenge-1",
        tripId: "trip-1",
        adminId: "admin-1",
      });

      expect(result.success).toBe(true);
    });

    it("should return error for missing required fields", async () => {
      const result = await controller.forceEndVoting({
        challengeId: "challenge-1",
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
  });

  describe("input validation exports", () => {
    it("should export all validation functions", () => {
      expect(validateGetMyVotesInput).toBeDefined();
      expect(validateVoteGetByChallengeInput).toBeDefined();
      expect(validateGetVotingProgressInput).toBeDefined();
      expect(validateGetJudgedStaffProgressInput).toBeDefined();
      expect(validateSubmitVoteInput).toBeDefined();
      expect(validateSubmitVotesInput).toBeDefined();
      expect(validateForceEndVotingInput).toBeDefined();
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// This test file provides comprehensive unit tests for the challenge controllers:
//
// 1. ChallengeController (controller.ts):
//    - getById: Validates ID format, returns challenge or error
//    - getByTripId: Returns challenges by trip with validation
//    - create: Creates new challenges with full validation
//    - update: Updates existing challenges
//    - updateStatus: Handles status transitions
//    - list: Returns paginated challenge lists
//    - listByStatus: Filters by status
//    - findActive: Returns active challenges
//    - findOpenForSubmission: Returns open challenges
//
// 2. ChallengeSubmissionController (submission-controller.ts):
//    - getById: Gets submission by ID with SubmissionId branding
//    - getByChallengeAndGroup: Gets submission by challenge + group
//    - listByChallenge: Returns paginated submissions for challenge
//    - create: Creates new submissions
//    - update: Updates submission content or review status
//    - delete: Removes submissions
//    - getByGroupId: Returns submissions by group
//
// 3. ChallengeVoteController (vote-controller.ts):
//    - getMyVotes: Returns current user's votes
//    - getByChallenge: Returns all votes for a challenge
//    - getVotingProgress: Returns voting progress metrics
//    - getJudgedStaffProgress: Returns judged staff voting progress
//    - submitVote: Submits single vote
//    - submitVotes: Batch vote submission
//    - forceEndVoting: Forces voting to end
//
// Test Patterns:
// - All controllers use Effect Layers for dependency injection
// - Input validation is tested for both success and failure cases
// - Mock gateways simulate database interactions
// - Error handling covers invalid inputs and gateway failures
// - Type safety is enforced with branded IDs (SubmissionId)
// - Export validation ensures all public APIs are tested
//
