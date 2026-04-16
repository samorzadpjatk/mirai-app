import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getSubmissionUseCase,
  type GetSubmissionInput,
  SubmissionNotFoundError,
  GetSubmissionRepositoryError,
} from "./get";
import {
  ChallengeSubmissionGatewayTag,
  type ChallengeSubmissionGateway,
} from "../../ports/submission/gateway";
import type { ChallengeSubmissionDTO } from "../../dto";
import { DatabaseError, type SubmissionId } from "@mirai-app/domain";

/**
 * Mock ChallengeSubmissionGateway for testing
 */
function createMockSubmissionGateway(
  submissions: ChallengeSubmissionDTO[] = [],
  options: {
    shouldFailFind?: boolean;
  } = {},
): ChallengeSubmissionGateway {
  const submissionMap = new Map(submissions.map((s) => [s.id, s]));

  return {
    create: (submission: ChallengeSubmissionDTO) => {
      submissionMap.set(submission.id, submission);
      return Effect.succeed(submission);
    },

    findById: (id: SubmissionId) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database error",
          }),
        );
      }
      const submission = submissionMap.get(id);
      return Effect.succeed(submission ?? null);
    },

    findByChallengeAndGroup: () => Effect.succeed(null),

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
    mediaUrls: overrides.mediaUrls ?? ["https://example.com/photo.jpg"],
    status: overrides.status ?? "PENDING",
    score: overrides.score ?? null,
    reviewedById: overrides.reviewedById ?? null,
    reviewedAt: overrides.reviewedAt ?? null,
    reviewNotes: overrides.reviewNotes ?? null,
    submittedAt: overrides.submittedAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
  };
}

describe("[UNIT] getSubmissionUseCase", () => {
  it("should return submission when found by ID", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-456",
      challengeId: "challenge-789",
      userId: "user-101",
      content: "Test content",
      status: "APPROVED",
      score: 100,
      reviewedById: "reviewer-123",
      reviewedAt: new Date("2024-02-01"),
      reviewNotes: "Great work!",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionInput = {
      submissionId: "submission-456" as SubmissionId,
    };

    const program = getSubmissionUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("submission-456");
    expect(result.challengeId).toBe("challenge-789");
    expect(result.userId).toBe("user-101");
    expect(result.content).toBe("Test content");
    expect(result.status).toBe("APPROVED");
    expect(result.score).toBe(100);
    expect(result.reviewedById).toBe("reviewer-123");
    expect(result.reviewNotes).toBe("Great work!");
  });

  it("should fail with SubmissionNotFoundError when submission not found", async () => {
    const mockGateway = createMockSubmissionGateway([]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionInput = {
      submissionId: "non-existent" as SubmissionId,
    };

    const program = getSubmissionUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmissionNotFoundError);
      expect(either.left.message).toBe("Submission not found");
    }
  });

  it("should fail with GetSubmissionRepositoryError when database error occurs", async () => {
    const mockGateway = createMockSubmissionGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionInput = {
      submissionId: "submission-123" as SubmissionId,
    };

    const program = getSubmissionUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetSubmissionRepositoryError);
      expect(either.left.message).toBe("Failed to get submission");
    }
  });

  it("should return submission with all null review fields when pending", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-pending",
      status: "PENDING",
      score: null,
      reviewedById: null,
      reviewedAt: null,
      reviewNotes: null,
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionInput = {
      submissionId: "submission-pending" as SubmissionId,
    };

    const program = getSubmissionUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.status).toBe("PENDING");
    expect(result.score).toBeNull();
    expect(result.reviewedById).toBeNull();
    expect(result.reviewedAt).toBeNull();
    expect(result.reviewNotes).toBeNull();
  });

  it("should return submission with groupId when applicable", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-group",
      groupId: "group-456",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionInput = {
      submissionId: "submission-group" as SubmissionId,
    };

    const program = getSubmissionUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.groupId).toBe("group-456");
  });

  it("should return submission with multiple mediaUrls", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-media",
      mediaUrls: [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
        "https://example.com/photo3.jpg",
      ],
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionInput = {
      submissionId: "submission-media" as SubmissionId,
    };

    const program = getSubmissionUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.mediaUrls).toHaveLength(3);
  });

  it("should include timestamps in output", async () => {
    const submittedAt = new Date("2024-01-15");
    const updatedAt = new Date("2024-01-20");

    const mockSubmission = createMockSubmissionDTO({
      id: "submission-timestamps",
      submittedAt,
      updatedAt,
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: GetSubmissionInput = {
      submissionId: "submission-timestamps" as SubmissionId,
    };

    const program = getSubmissionUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.submittedAt).toEqual(submittedAt);
    expect(result.updatedAt).toEqual(updatedAt);
  });
});
