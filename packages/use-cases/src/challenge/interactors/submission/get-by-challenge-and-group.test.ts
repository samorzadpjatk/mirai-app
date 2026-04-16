import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getSubmissionByChallengeAndGroupUseCase,
  type GetSubmissionByChallengeAndGroupInput,
} from "./get-by-challenge-and-group";
import {
  ChallengeSubmissionGatewayTag,
  type ChallengeSubmissionGateway,
} from "../../ports/submission/gateway";
import type { ChallengeSubmissionDTO } from "../../dto";
import type { SubmissionId } from "@mirai-app/domain";

/**
 * Mock ChallengeSubmissionGateway for testing
 */
function createMockSubmissionGateway(
  submissions: ChallengeSubmissionDTO[] = [],
): ChallengeSubmissionGateway {
  return {
    create: (submission: ChallengeSubmissionDTO) => Effect.succeed(submission),

    findById: () => Effect.succeed(null),

    findByChallengeAndGroup: (challengeId: string, groupId: string) => {
      const submission = submissions.find(
        (s) => s.challengeId === challengeId && s.groupId === groupId,
      );
      return Effect.succeed(submission ?? null);
    },

    update: (submission: ChallengeSubmissionDTO) => Effect.succeed(submission),

    delete: () => Effect.succeed(void 0),

    existsForChallengeAndGroup: () => Effect.succeed(false),

    countByChallengeId: () => Effect.succeed(0),

    countByChallengeAndStatus: () => Effect.succeed(0),

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

// Helper to create mock submission DTOs
function createMockSubmissionDTO(
  overrides: Partial<ChallengeSubmissionDTO> = {},
): ChallengeSubmissionDTO {
  return {
    id: overrides.id ?? "submission-123",
    challengeId: overrides.challengeId ?? "challenge-123",
    userId: overrides.userId ?? "user-123",
    groupId: overrides.groupId ?? null,
    content: overrides.content ?? "Test submission",
    mediaUrls: overrides.mediaUrls ?? [],
    status: overrides.status ?? "PENDING",
    score: overrides.score ?? null,
    reviewedById: overrides.reviewedById ?? null,
    reviewedAt: overrides.reviewedAt ?? null,
    reviewNotes: overrides.reviewNotes ?? null,
    submittedAt: overrides.submittedAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

describe("[UNIT] getSubmissionByChallengeAndGroupUseCase", () => {
  it("should return submission when found by challenge and group", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-456",
      challengeId: "challenge-789",
      groupId: "group-101",
      content: "Group submission",
      status: "APPROVED",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionByChallengeAndGroupInput = {
      challengeId: "challenge-789",
      groupId: "group-101",
    };

    const program = getSubmissionByChallengeAndGroupUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("submission-456");
    expect(result?.challengeId).toBe("challenge-789");
    expect(result?.groupId).toBe("group-101");
    expect(result?.content).toBe("Group submission");
    expect(result?.status).toBe("APPROVED");
  });

  it("should return null when submission not found", async () => {
    const mockGateway = createMockSubmissionGateway([]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionByChallengeAndGroupInput = {
      challengeId: "challenge-123",
      groupId: "group-456",
    };

    const program = getSubmissionByChallengeAndGroupUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toBeNull();
  });

  it("should return submission with all fields populated", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-full",
      challengeId: "challenge-1",
      groupId: "group-1",
      userId: "user-1",
      content: "Full content",
      mediaUrls: ["https://example.com/photo.jpg"],
      status: "APPROVED",
      score: 95,
      reviewedById: "reviewer-1",
      reviewedAt: new Date("2024-02-01"),
      reviewNotes: "Excellent work",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionByChallengeAndGroupInput = {
      challengeId: "challenge-1",
      groupId: "group-1",
    };

    const program = getSubmissionByChallengeAndGroupUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("submission-full");
    expect(result?.userId).toBe("user-1");
    expect(result?.content).toBe("Full content");
    expect(result?.mediaUrls).toEqual(["https://example.com/photo.jpg"]);
    expect(result?.score).toBe(95);
    expect(result?.reviewedById).toBe("reviewer-1");
    expect(result?.reviewNotes).toBe("Excellent work");
  });

  it("should handle multiple submissions and find correct one", async () => {
    const submissions = [
      createMockSubmissionDTO({
        id: "submission-1",
        challengeId: "challenge-a",
        groupId: "group-x",
      }),
      createMockSubmissionDTO({
        id: "submission-2",
        challengeId: "challenge-b",
        groupId: "group-y",
      }),
      createMockSubmissionDTO({
        id: "submission-3",
        challengeId: "challenge-b",
        groupId: "group-z",
      }),
    ];
    const mockGateway = createMockSubmissionGateway(submissions);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionByChallengeAndGroupInput = {
      challengeId: "challenge-b",
      groupId: "group-y",
    };

    const program = getSubmissionByChallengeAndGroupUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("submission-2");
  });

  it("should return submission with pending status", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-pending",
      challengeId: "challenge-2",
      groupId: "group-2",
      status: "PENDING",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionByChallengeAndGroupInput = {
      challengeId: "challenge-2",
      groupId: "group-2",
    };

    const program = getSubmissionByChallengeAndGroupUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.status).toBe("PENDING");
  });

  it("should return submission with rejected status", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-rejected",
      challengeId: "challenge-3",
      groupId: "group-3",
      status: "REJECTED",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionByChallengeAndGroupInput = {
      challengeId: "challenge-3",
      groupId: "group-3",
    };

    const program = getSubmissionByChallengeAndGroupUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.status).toBe("REJECTED");
  });
});
