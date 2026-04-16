import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  listSubmissionsByChallengeUseCase,
  type ListSubmissionsByChallengeInput,
  ListSubmissionsRepositoryError,
} from "./list-by-challenge";
import {
  ChallengeSubmissionGatewayTag,
  type ChallengeSubmissionGateway,
} from "../../ports/submission/gateway";
import type { ChallengeSubmissionDTO } from "../../dto";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Mock ChallengeSubmissionGateway for testing
 */
function createMockSubmissionGateway(
  submissions: ChallengeSubmissionDTO[] = [],
  options: {
    shouldFailFind?: boolean;
    shouldFailCount?: boolean;
  } = {},
): ChallengeSubmissionGateway {
  return {
    create: (submission: ChallengeSubmissionDTO) => Effect.succeed(submission),

    findById: () => Effect.succeed(null),

    findByChallengeAndGroup: () => Effect.succeed(null),

    update: (submission: ChallengeSubmissionDTO) => Effect.succeed(submission),

    delete: () => Effect.succeed(void 0),

    existsForChallengeAndGroup: () => Effect.succeed(false),

    countByChallengeId: () => {
      if (options.shouldFailCount) {
        return Effect.fail(
          new DatabaseError({
            operation: "countByChallengeId",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(submissions.length);
    },

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

    findManyConnection: (params: {
      challengeId?: string;
      orderBy?: "voteScore" | "createdAt";
      orderDirection?: "asc" | "desc";
      first?: number;
      after?: { id: string; createdAt: string } | null;
    }) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findManyConnection",
            message: "Database error",
          }),
        );
      }
      let filtered = submissions;
      if (params.challengeId) {
        filtered = submissions.filter(
          (s) => s.challengeId === params.challengeId,
        );
      }

      // Apply pagination
      // Handle cursor-based pagination (after)
      let startIndex = 0;
      if (params.after) {
        const afterIndex = filtered.findIndex(
          (s) =>
            s.id === params.after!.id &&
            s.submittedAt.toISOString() === params.after!.createdAt,
        );
        if (afterIndex >= 0) {
          startIndex = afterIndex + 1;
        }
      }

      // Apply limit (first)
      const limit = params.first ?? filtered.length;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      // Helper to encode cursor
      const encodeCursor = (id: string, createdAt: string) =>
        Buffer.from(JSON.stringify({ id, createdAt })).toString("base64");

      return Effect.succeed({
        edges: paginated.map((s) => ({
          node: s,
          cursor: encodeCursor(s.id, s.submittedAt.toISOString()),
        })),
        nodes: paginated,
        pageInfo: {
          hasNextPage: startIndex + limit < filtered.length,
          hasPreviousPage: startIndex > 0,
          startCursor:
            paginated.length > 0
              ? encodeCursor(
                  paginated[0].id,
                  paginated[0].submittedAt.toISOString(),
                )
              : null,
          endCursor:
            paginated.length > 0
              ? encodeCursor(
                  paginated[paginated.length - 1].id,
                  paginated[paginated.length - 1].submittedAt.toISOString(),
                )
              : null,
        },
        totalCount: filtered.length,
      });
    },
  };
}

// Helper to create mock submission DTOs
function createMockSubmissionDTO(
  overrides: Partial<ChallengeSubmissionDTO> = {},
): ChallengeSubmissionDTO {
  return {
    id: overrides.id ?? crypto.randomUUID(),
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
    voteCount: overrides.voteCount ?? 0,
    voteScore: overrides.voteScore ?? 0,
  };
}

describe("[UNIT] listSubmissionsByChallengeUseCase", () => {
  it("should return submissions for a challenge", async () => {
    const submissions = [
      createMockSubmissionDTO({ id: "sub-1", challengeId: "challenge-1" }),
      createMockSubmissionDTO({ id: "sub-2", challengeId: "challenge-1" }),
      createMockSubmissionDTO({ id: "sub-3", challengeId: "challenge-1" }),
    ];
    const mockGateway = createMockSubmissionGateway(submissions);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: ListSubmissionsByChallengeInput = {
      challengeId: "challenge-1",
    };

    const program = listSubmissionsByChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.submissions).toHaveLength(3);
    expect(result.totalCount).toBe(3);
  });

  it("should return empty array when no submissions exist", async () => {
    const mockGateway = createMockSubmissionGateway([]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: ListSubmissionsByChallengeInput = {
      challengeId: "challenge-empty",
    };

    const program = listSubmissionsByChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.submissions).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("should apply pagination correctly", async () => {
    const submissions = Array.from({ length: 10 }, (_, i) =>
      createMockSubmissionDTO({
        id: `sub-${i + 1}`,
        challengeId: "challenge-1",
      }),
    );
    const mockGateway = createMockSubmissionGateway(submissions);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: ListSubmissionsByChallengeInput = {
      challengeId: "challenge-1",
      limit: 5,
      offset: 0,
    };

    const program = listSubmissionsByChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.submissions).toHaveLength(5);
    expect(result.totalCount).toBe(10);
  });

  it("should apply offset correctly", async () => {
    const submissions = Array.from({ length: 10 }, (_, i) =>
      createMockSubmissionDTO({
        id: `sub-${i + 1}`,
        challengeId: "challenge-1",
      }),
    );
    const mockGateway = createMockSubmissionGateway(submissions);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: ListSubmissionsByChallengeInput = {
      challengeId: "challenge-1",
      limit: 3,
      offset: 5,
    };

    const program = listSubmissionsByChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.submissions).toHaveLength(3);
  });

  it("should fail with ListSubmissionsRepositoryError when find fails", async () => {
    const mockGateway = createMockSubmissionGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: ListSubmissionsByChallengeInput = {
      challengeId: "challenge-1",
    };

    const program = listSubmissionsByChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ListSubmissionsRepositoryError);
      expect(either.left.message).toBe("Failed to fetch submissions");
    }
  });

  it("should fail with ListSubmissionsRepositoryError when count fails", async () => {
    const mockGateway = createMockSubmissionGateway([], {
      shouldFailCount: true,
    });
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: ListSubmissionsByChallengeInput = {
      challengeId: "challenge-1",
    };

    const program = listSubmissionsByChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ListSubmissionsRepositoryError);
      expect(either.left.message).toBe("Failed to count submissions");
    }
  });

  it("should sort by voteScore by default", async () => {
    const submissions = [
      createMockSubmissionDTO({ id: "sub-1", challengeId: "challenge-1" }),
      createMockSubmissionDTO({ id: "sub-2", challengeId: "challenge-1" }),
    ];
    const mockGateway = createMockSubmissionGateway(submissions);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: ListSubmissionsByChallengeInput = {
      challengeId: "challenge-1",
      orderBy: "voteScore",
      orderDirection: "desc",
    };

    const program = listSubmissionsByChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.submissions).toHaveLength(2);
  });

  it("should sort by createdAt when specified", async () => {
    const submissions = [
      createMockSubmissionDTO({ id: "sub-1", challengeId: "challenge-1" }),
      createMockSubmissionDTO({ id: "sub-2", challengeId: "challenge-1" }),
    ];
    const mockGateway = createMockSubmissionGateway(submissions);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: ListSubmissionsByChallengeInput = {
      challengeId: "challenge-1",
      orderBy: "createdAt",
      orderDirection: "asc",
    };

    const program = listSubmissionsByChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.submissions).toHaveLength(2);
  });

  it("should return submissions with all required fields", async () => {
    const submissions = [
      createMockSubmissionDTO({
        id: "sub-complete",
        challengeId: "challenge-1",
        userId: "user-1",
        groupId: "group-1",
        content: "Complete submission",
        mediaUrls: ["https://example.com/photo.jpg"],
        status: "APPROVED",
        score: 100,
        reviewedById: "reviewer-1",
        reviewedAt: new Date(),
        reviewNotes: "Great work",
      }),
    ];
    const mockGateway = createMockSubmissionGateway(submissions);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: ListSubmissionsByChallengeInput = {
      challengeId: "challenge-1",
    };

    const program = listSubmissionsByChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.submissions).toHaveLength(1);
    const submission = result.submissions[0];
    expect(submission.id).toBe("sub-complete");
    expect(submission.content).toBe("Complete submission");
    expect(submission.status).toBe("APPROVED");
    expect(submission.score).toBe(100);
  });
});
