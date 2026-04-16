import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateSubmissionUseCase,
  type UpdateSubmissionInput,
  SubmissionUpdateNotFoundError,
  SubmissionUpdateValidationError,
  InvalidReviewActionError,
  UpdateSubmissionRepositoryError,
} from "./update";
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
    shouldFailUpdate?: boolean;
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

    update: (submission: ChallengeSubmissionDTO) => {
      if (options.shouldFailUpdate) {
        return Effect.fail(
          new DatabaseError({
            operation: "update",
            message: "Database error",
          }),
        );
      }
      submissionMap.set(submission.id, submission);
      return Effect.succeed(submission);
    },

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

describe("[UNIT] updateSubmissionUseCase", () => {
  it("should update content for pending submission", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-456",
      status: "PENDING",
      content: "Original content",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "submission-456" as SubmissionId,
      content: "Updated content",
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.content).toBe("Updated content");
    expect(result.status).toBe("PENDING");
  });

  it("should update mediaUrls for pending submission", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-456",
      status: "PENDING",
      mediaUrls: ["https://example.com/old.jpg"],
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "submission-456" as SubmissionId,
      mediaUrls: [
        "https://example.com/new1.jpg",
        "https://example.com/new2.jpg",
      ],
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.mediaUrls).toEqual([
      "https://example.com/new1.jpg",
      "https://example.com/new2.jpg",
    ]);
  });

  it("should fail with SubmissionUpdateNotFoundError when submission not found", async () => {
    const mockGateway = createMockSubmissionGateway([]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "non-existent" as SubmissionId,
      content: "Updated content",
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmissionUpdateNotFoundError);
      expect(either.left.message).toBe("Submission not found");
    }
  });

  it("should fail with SubmissionUpdateValidationError when updating content of approved submission", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-approved",
      status: "APPROVED",
      content: "Approved content",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "submission-approved" as SubmissionId,
      content: "New content",
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmissionUpdateValidationError);
      expect(either.left.message).toBe(
        "Cannot update content for non-pending submission",
      );
    }
  });

  it("should fail with SubmissionUpdateValidationError when updating mediaUrls of rejected submission", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-rejected",
      status: "REJECTED",
      mediaUrls: [],
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "submission-rejected" as SubmissionId,
      mediaUrls: ["https://example.com/photo.jpg"],
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmissionUpdateValidationError);
    }
  });

  it("should approve a pending submission", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-pending",
      status: "PENDING",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "submission-pending" as SubmissionId,
      reviewAction: "APPROVE",
      reviewedById: "reviewer-123",
      reviewNotes: "Great work!",
      score: 95,
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.status).toBe("APPROVED");
    expect(result.score).toBe(95);
    expect(result.reviewedById).toBe("reviewer-123");
    expect(result.reviewNotes).toBe("Great work!");
    expect(result.reviewedAt).toBeInstanceOf(Date);
  });

  it("should reject a pending submission", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-pending",
      status: "PENDING",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "submission-pending" as SubmissionId,
      reviewAction: "REJECT",
      reviewedById: "reviewer-123",
      reviewNotes: "Does not meet requirements",
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.status).toBe("REJECTED");
    expect(result.reviewedById).toBe("reviewer-123");
    expect(result.reviewNotes).toBe("Does not meet requirements");
    expect(result.reviewedAt).toBeInstanceOf(Date);
  });

  it("should fail with InvalidReviewActionError for invalid review action", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-pending",
      status: "PENDING",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "submission-pending" as SubmissionId,
      reviewAction: "INVALID" as "APPROVE" | "REJECT",
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(InvalidReviewActionError);
      expect(either.left.message).toBe("Invalid review action");
    }
  });

  it("should fail with UpdateSubmissionRepositoryError when database error occurs", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-123",
      status: "PENDING",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "submission-123" as SubmissionId,
      content: "Updated",
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateSubmissionRepositoryError);
      expect(either.left.message).toBe("Failed to find submission");
    }
  });

  it("should update multiple fields at once for pending submission", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-multi",
      status: "PENDING",
      content: "Original",
      mediaUrls: ["old.jpg"],
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "submission-multi" as SubmissionId,
      content: "New content",
      mediaUrls: ["new1.jpg", "new2.jpg"],
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.content).toBe("New content");
    expect(result.mediaUrls).toEqual(["new1.jpg", "new2.jpg"]);
  });

  it("should include updatedAt timestamp in output", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-ts",
      status: "PENDING",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: UpdateSubmissionInput = {
      submissionId: "submission-ts" as SubmissionId,
      content: "Updated",
    };

    const program = updateSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});
