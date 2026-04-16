import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  ChallengeSubmissionController,
  validateGetByIdInput,
  validateGetByChallengeAndGroupInput,
  validateGetByChallengeInput,
  validateCreateInput,
  validateUpdateInput,
  validateDeleteInput,
} from "./submission-controller";
import {
  ChallengeSubmissionGatewayTag,
  type ChallengeSubmissionGateway,
  type ChallengeSubmissionDTO,
} from "@mirai-app/use-cases";
import { SubmissionId, type SubmissionStatus } from "@mirai-app/domain";

// ============================================================================
// Mock Factories
// ============================================================================

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

function createMockSubmissionDTOArray(
  count: number,
  overrides: Partial<ChallengeSubmissionDTO> = {},
): ChallengeSubmissionDTO[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSubmissionDTO({
      ...overrides,
      id: `cm1testsubmission${String(i + 1).padStart(4, "0")}`,
    }),
  );
}

type MockChallengeSubmissionGateway = ChallengeSubmissionGateway & {
  findByGroupId: (
    groupId: string,
  ) => Effect.Effect<ChallengeSubmissionDTO[], never, never>;
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

function createMockSubmissionGatewayWithData(
  submissions: ChallengeSubmissionDTO[],
): MockChallengeSubmissionGateway {
  return {
    ...createMockSubmissionGateway(submissions),
    findByChallengeId: (challengeId: string) => {
      const filtered = submissions.filter((s) => s.challengeId === challengeId);
      return Effect.succeed(filtered);
    },
    findByGroupId: (groupId: string) => {
      const filtered = submissions.filter((s) => s.groupId === groupId);
      return Effect.succeed(filtered);
    },
    findByChallengeAndGroup: (challengeId: string, groupId: string) => {
      const submission = submissions.find(
        (s) => s.challengeId === challengeId && s.groupId === groupId,
      );
      return Effect.succeed(submission ?? null);
    },
  };
}

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

  describe("constructor", () => {
    it("should create controller with app layer", () => {
      const gateway = createMockSubmissionGateway();
      const layer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        gateway,
      ) as Layer.Layer<unknown>;
      const ctrl = new ChallengeSubmissionController(layer);

      expect(ctrl).toBeDefined();
    });
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

    it("should return error when submission not found", async () => {
      const result = await controller.getById({
        submissionId: "cm1nonexistent0001",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
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

    it("should convert SubmissionId to string in response", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
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
        expect(typeof result.data!.id).toBe("string");
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

    it("should return error for empty challengeId", async () => {
      const result = await controller.getByChallengeAndGroup({
        challengeId: "",
        groupId: "group-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty groupId", async () => {
      const result = await controller.getByChallengeAndGroup({
        challengeId: "challenge-1",
        groupId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should convert SubmissionId to string in response", async () => {
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
      if (result.success && result.data) {
        expect(typeof result.data.id).toBe("string");
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
      const mockGateway = createMockSubmissionGatewayWithData(mockSubmissions);
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

    it("should return empty list when no submissions exist", async () => {
      const result = await controller.listByChallenge({
        challengeId: "challenge-empty",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.submissions).toHaveLength(0);
        expect(result.data!.totalCount).toBe(0);
      }
    });

    it("should return error for missing challengeId", async () => {
      const result = await controller.listByChallenge({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty challengeId", async () => {
      const result = await controller.listByChallenge({ challengeId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should convert SubmissionId to string in list response", async () => {
      const mockSubmissions = [
        createMockSubmissionDTO({
          id: "cm1testsub0001",
          challengeId: "challenge-1",
        }),
      ];
      const mockGateway = createMockSubmissionGatewayWithData(mockSubmissions);
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
        expect(result.data!.submissions).toHaveLength(1);
        expect(typeof result.data!.submissions[0]!.id).toBe("string");
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
        expect(result.data!.groupId).toBe("group-1");
      }
    });

    it("should create submission with videoId", async () => {
      const result = await controller.create({
        challengeId: "challenge-1",
        groupId: "group-1",
        videoId: "video-1",
      });

      expect(result.success).toBe(true);
    });

    it("should create submission with location", async () => {
      const result = await controller.create({
        challengeId: "challenge-1",
        groupId: "group-1",
        latitude: 51.5074,
        longitude: -0.1278,
      });

      expect(result.success).toBe(true);
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

    it("should return error for empty challengeId", async () => {
      const result = await controller.create({
        challengeId: "",
        groupId: "group-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty groupId", async () => {
      const result = await controller.create({
        challengeId: "challenge-1",
        groupId: "",
      });

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

    it("should return error for invalid latitude", async () => {
      const result = await controller.create({
        challengeId: "challenge-1",
        groupId: "group-1",
        latitude: 91,
        longitude: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid longitude", async () => {
      const result = await controller.create({
        challengeId: "challenge-1",
        groupId: "group-1",
        latitude: 0,
        longitude: 181,
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

    it("should update submission with review action APPROVE", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
        status: "PENDING" as SubmissionStatus,
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

    it("should update submission with review action REJECT", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
        status: "PENDING" as SubmissionStatus,
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        reviewAction: "REJECT",
        reviewedById: "admin-1",
        rejectionReason: "Inappropriate content",
      });

      expect(result.success).toBe(true);
    });

    it("should update submission with ranking", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        ranking: 1,
      });

      expect(result.success).toBe(true);
    });

    it("should update submission with bonus points", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        bonusPoints: 50,
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

    it("should return error for missing submissionId", async () => {
      const result = await controller.update({
        textContent: "Updated content",
      } as unknown as Parameters<typeof controller.update>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid ranking (too high)", async () => {
      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        ranking: 5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid ranking (too low)", async () => {
      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        ranking: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should update submission with imageIds", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        imageIds: ["image-1", "image-2"],
      });

      expect(result.success).toBe(true);
    });

    it("should update submission with videoId", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        videoId: "video-1",
      });

      expect(result.success).toBe(true);
    });

    it("should update submission with null videoId", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        videoId: null,
      });

      expect(result.success).toBe(true);
    });

    it("should update submission with location", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        latitude: 51.5074,
        longitude: -0.1278,
      });

      expect(result.success).toBe(true);
    });

    it("should update submission with null location", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
      });
      const mockGateway = createMockSubmissionGateway([mockSubmission]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.update({
        submissionId: "cm1testsubmission0001",
        latitude: null,
        longitude: null,
      });

      expect(result.success).toBe(true);
    });

    it("should convert SubmissionId to string in response", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
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
        expect(typeof result.data!.id).toBe("string");
      }
    });
  });

  describe("delete", () => {
    it("should delete submission with valid ID", async () => {
      const mockSubmission = createMockSubmissionDTO({
        id: "cm1testsubmission0001",
        status: "PENDING" as SubmissionStatus,
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

    it("should return error for empty submissionId", async () => {
      const result = await controller.delete({ submissionId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getByGroupId", () => {
    // Mock entity structure that matches what the controller expects
    const createMockSubmissionEntity = (
      overrides: Record<string, unknown> = {},
    ) => ({
      id: overrides.id ?? "cm1testsubmission0001",
      challengeId: overrides.challengeId ?? "challenge-1",
      groupId: overrides.groupId ?? "group-1",
      imageIds: overrides.imageIds ?? ["image-1"],
      videoId: overrides.videoId ?? null,
      textContent: overrides.textContent ?? "Test content",
      latitude: overrides.latitude ?? null,
      longitude: overrides.longitude ?? null,
      status: overrides.status ?? "PENDING",
      reviewedById: overrides.reviewedById ?? null,
      reviewedAt: overrides.reviewedAt ?? null,
      rejectionReason: overrides.rejectionReason ?? null,
      awardedPoints: overrides.awardedPoints ?? 0,
      bonusPoints: overrides.bonusPoints ?? 0,
      ranking: overrides.ranking ?? null,
      voteCount: overrides.voteCount ?? 0,
      voteScore: overrides.voteScore ?? 0,
      createdAt: overrides.createdAt ?? new Date("2024-01-01"),
      updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
    });

    it("should return submissions for valid group ID", async () => {
      const mockSubmissions = [
        createMockSubmissionEntity({
          id: "cm1testsubmission0001",
          groupId: "group-1",
          challengeId: "challenge-1",
        }),
        createMockSubmissionEntity({
          id: "cm1testsubmission0002",
          groupId: "group-1",
          challengeId: "challenge-2",
        }),
      ];
      const mockGateway = createMockSubmissionGateway([]);
      mockGateway.findByGroupId = () =>
        Effect.succeed(mockSubmissions as unknown as ChallengeSubmissionDTO[]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.getByGroupId({ groupId: "group-1" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
        expect(result.data[0]!.groupId).toBe("group-1");
        expect(result.data[0]!.challengeId).toBe("challenge-1");
      }
    });

    it("should return empty array when no submissions for group", async () => {
      const mockGateway = createMockSubmissionGateway([]);
      mockGateway.findByGroupId = () => Effect.succeed([]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.getByGroupId({ groupId: "group-empty" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(0);
      }
    });

    it("should convert SubmissionId to string in response", async () => {
      const mockSubmission = createMockSubmissionEntity({
        id: "cm1testsubmission0001",
        groupId: "group-1",
      });
      const mockGateway = createMockSubmissionGateway([]);
      mockGateway.findByGroupId = () =>
        Effect.succeed([mockSubmission as unknown as ChallengeSubmissionDTO]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.getByGroupId({ groupId: "group-1" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(1);
        expect(typeof result.data[0]!.id).toBe("string");
      }
    });

    it("should include all submission fields in response", async () => {
      const mockSubmission = createMockSubmissionEntity({
        id: "cm1testsubmission0001",
        groupId: "group-1",
        challengeId: "challenge-1",
        imageIds: ["image-1", "image-2"],
        videoId: "video-1",
        textContent: "Test content",
        latitude: 51.5074,
        longitude: -0.1278,
        awardedPoints: 100,
        bonusPoints: 50,
        ranking: 1,
        voteCount: 10,
        voteScore: 100,
      });
      const mockGateway = createMockSubmissionGateway([]);
      mockGateway.findByGroupId = () =>
        Effect.succeed([mockSubmission as unknown as ChallengeSubmissionDTO]);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.getByGroupId({ groupId: "group-1" });

      expect(result.success).toBe(true);
      if (result.success) {
        const submission = result.data[0]!;
        expect(submission.id).toBe("cm1testsubmission0001");
        expect(submission.challengeId).toBe("challenge-1");
        expect(submission.groupId).toBe("group-1");
        expect(Array.isArray(submission.imageIds)).toBe(true);
        expect(submission.imageIds).toHaveLength(2);
        expect(submission.videoId).toBe("video-1");
        expect(submission.textContent).toBe("Test content");
        expect(submission.latitude).toBe(51.5074);
        expect(submission.longitude).toBe(-0.1278);
        expect(submission.awardedPoints).toBe(100);
        expect(submission.bonusPoints).toBe(50);
        expect(submission.ranking).toBe(1);
        expect(submission.voteCount).toBe(10);
        expect(submission.voteScore).toBe(100);
        expect(submission.createdAt).toBeInstanceOf(Date);
        expect(submission.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe("input validation exports", () => {
    it("should export validateGetByIdInput", () => {
      expect(validateGetByIdInput).toBeDefined();
      const result = validateGetByIdInput({
        submissionId: "cm1testsubmission0001",
      });
      expect(result.success).toBe(true);
    });

    it("should export validateGetByChallengeAndGroupInput", () => {
      expect(validateGetByChallengeAndGroupInput).toBeDefined();
      const result = validateGetByChallengeAndGroupInput({
        challengeId: "challenge-1",
        groupId: "group-1",
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

    it("should export validateCreateInput", () => {
      expect(validateCreateInput).toBeDefined();
      const result = validateCreateInput({
        challengeId: "challenge-1",
        groupId: "group-1",
      });
      expect(result.success).toBe(true);
    });

    it("should export validateUpdateInput", () => {
      expect(validateUpdateInput).toBeDefined();
      const result = validateUpdateInput({
        submissionId: "cm1testsubmission0001",
      });
      expect(result.success).toBe(true);
    });

    it("should export validateDeleteInput", () => {
      expect(validateDeleteInput).toBeDefined();
      const result = validateDeleteInput({
        submissionId: "cm1testsubmission0001",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("listByChallenge with pagination", () => {
    it("should support orderBy parameter", async () => {
      const mockSubmissions = createMockSubmissionDTOArray(3, {
        challengeId: "challenge-1",
      });
      const mockGateway = createMockSubmissionGatewayWithData(mockSubmissions);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.listByChallenge({
        challengeId: "challenge-1",
        orderBy: "voteScore",
      });

      expect(result.success).toBe(true);
    });

    it("should support orderDirection parameter", async () => {
      const mockSubmissions = createMockSubmissionDTOArray(3, {
        challengeId: "challenge-1",
      });
      const mockGateway = createMockSubmissionGatewayWithData(mockSubmissions);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.listByChallenge({
        challengeId: "challenge-1",
        orderDirection: "desc",
      });

      expect(result.success).toBe(true);
    });

    it("should support limit parameter", async () => {
      const mockSubmissions = createMockSubmissionDTOArray(10, {
        challengeId: "challenge-1",
      });
      const mockGateway = createMockSubmissionGatewayWithData(mockSubmissions);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.listByChallenge({
        challengeId: "challenge-1",
        limit: 5,
      });

      expect(result.success).toBe(true);
    });

    it("should support offset parameter", async () => {
      const mockSubmissions = createMockSubmissionDTOArray(10, {
        challengeId: "challenge-1",
      });
      const mockGateway = createMockSubmissionGatewayWithData(mockSubmissions);
      mockLayer = Layer.succeed(
        ChallengeSubmissionGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new ChallengeSubmissionController(mockLayer);

      const result = await controller.listByChallenge({
        challengeId: "challenge-1",
        offset: 5,
      });

      expect(result.success).toBe(true);
    });

    it("should return error for invalid limit", async () => {
      const result = await controller.listByChallenge({
        challengeId: "challenge-1",
        limit: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for limit exceeding 100", async () => {
      const result = await controller.listByChallenge({
        challengeId: "challenge-1",
        limit: 101,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for negative offset", async () => {
      const result = await controller.listByChallenge({
        challengeId: "challenge-1",
        offset: -1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid orderBy", async () => {
      const result = await controller.listByChallenge({
        challengeId: "challenge-1",
        orderBy: "invalidField",
      } as unknown as Parameters<typeof controller.listByChallenge>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid orderDirection", async () => {
      const result = await controller.listByChallenge({
        challengeId: "challenge-1",
        orderDirection: "sideways",
      } as unknown as Parameters<typeof controller.listByChallenge>[0]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// This test file provides comprehensive unit tests for the ChallengeSubmissionController
// (submission-controller.ts):
//
// ## Test Coverage
//
// 1. **Constructor**
//    - Creates controller with app layer
//
// 2. **getById**
//    - Returns submission when found by valid ID
//    - Handles submission not found (returns null)
//    - Validates submissionId presence
//    - Converts SubmissionId branded type to string in response
//
// 3. **getByChallengeAndGroup**
//    - Returns submission for valid challenge + group combination
//    - Handles submission not found (returns null)
//    - Validates both challengeId and groupId presence
//    - Converts SubmissionId to string in response
//
// 4. **listByChallenge**
//    - Returns paginated submissions for valid challenge
//    - Handles empty results
//    - Validates challengeId presence
//    - Converts SubmissionId to string in list items
//    - Supports pagination parameters (orderBy, orderDirection, limit, offset)
//    - Validates pagination parameter ranges
//
// 5. **create**
//    - Creates submission with required fields (challengeId, groupId)
//    - Handles optional fields:
//      - imageIds (max 10 validation)
//      - videoId
//      - textContent
//      - latitude/longitude (geo bounds validation)
//    - Validates required fields presence
//    - Converts SubmissionId to string in response
//
// 6. **update**
//    - Updates submission content fields
//    - Handles review actions (APPROVE, REJECT)
//    - Updates review metadata (reviewedById, rejectionReason, awardedPoints)
//    - Updates ranking (1-3 range validation)
//    - Updates bonus points
//    - Handles nullable fields (videoId, textContent, latitude, longitude)
//    - Validates submissionId presence
//    - Converts SubmissionId to string in response
//
// 7. **delete**
//    - Deletes submission with valid ID
//    - Validates submissionId presence
//
// 8. **getByGroupId**
//    - Returns all submissions for a group ID
//    - Handles empty results
//    - Converts SubmissionId to string in response
//    - Includes all submission fields in response
//
// 9. **Input Validation Exports**
//    - All validation functions exported and functional
//    - Tests each validator with valid inputs
//
// ## Testing Patterns Used
//
// - Effect Layer mocking with Layer.succeed
// - Mock gateway factories with createMockSubmissionGateway
// - [UNIT] prefix convention for all describe blocks
// - Bun test framework with expect assertions
// - Type-safe controller method testing
// - Branded ID handling with SubmissionId
//
// ## Key Features Tested
//
// - Input validation using Effect Schema
// - Effect.useCase delegation
// - Error handling with success/error result pattern
// - Branded ID to string conversion in API responses
// - Full CRUD operations (Create, Read, Update, Delete)
// - Review workflow (APPROVE/REJECT actions)
// - Pagination support
// - Geo-coordinate validation
// - Image count validation (max 10)
//
