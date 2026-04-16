import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteSubmissionUseCase,
  type DeleteSubmissionInput,
  SubmissionDeleteNotFoundError,
  SubmissionDeleteNotAllowedError,
  DeleteSubmissionRepositoryError,
} from "./delete";
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
    shouldFailDelete?: boolean;
  } = {},
): ChallengeSubmissionGateway {
  const submissionList = [...submissions];

  return {
    create: (submission: ChallengeSubmissionDTO) => {
      submissionList.push(submission);
      return Effect.succeed(submission);
    },

    findById: (id: string) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database error",
          }),
        );
      }
      const submission = submissionList.find((s) => s.id === id);
      return Effect.succeed(submission ?? null);
    },

    findByChallengeAndGroup: () => Effect.succeed(null),

    update: (submission: ChallengeSubmissionDTO) => Effect.succeed(submission),

    delete: (id: string) => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new DatabaseError({
            operation: "delete",
            message: "Database error",
          }),
        );
      }
      const index = submissionList.findIndex((s) => s.id === id);
      if (index >= 0) {
        submissionList.splice(index, 1);
      }
      return Effect.succeed(void 0);
    },

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

describe("[UNIT] deleteSubmissionUseCase", () => {
  it("should delete a pending submission successfully", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-456",
      status: "PENDING",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: DeleteSubmissionInput = {
      submissionId:
        "submission-456" as unknown as import("@mirai-app/domain").SubmissionId,
    };

    const program = deleteSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });

  it("should fail with SubmissionDeleteNotFoundError when submission not found", async () => {
    const mockGateway = createMockSubmissionGateway([]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: DeleteSubmissionInput = {
      submissionId:
        "non-existent" as unknown as import("@mirai-app/domain").SubmissionId,
    };

    const program = deleteSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmissionDeleteNotFoundError);
      expect(either.left.message).toBe("Submission not found");
    }
  });

  it("should fail with SubmissionDeleteNotAllowedError when submission is approved", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-approved",
      status: "APPROVED",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: DeleteSubmissionInput = {
      submissionId:
        "submission-approved" as unknown as import("@mirai-app/domain").SubmissionId,
    };

    const program = deleteSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmissionDeleteNotAllowedError);
      expect(either.left.message).toBe(
        "Cannot delete an approved or rejected submission",
      );
    }
  });

  it("should fail with SubmissionDeleteNotAllowedError when submission is rejected", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-rejected",
      status: "REJECTED",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: DeleteSubmissionInput = {
      submissionId:
        "submission-rejected" as unknown as import("@mirai-app/domain").SubmissionId,
    };

    const program = deleteSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmissionDeleteNotAllowedError);
    }
  });

  it("should fail with DeleteSubmissionRepositoryError when database error occurs during find", async () => {
    const mockGateway = createMockSubmissionGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: DeleteSubmissionInput = {
      submissionId:
        "submission-123" as unknown as import("@mirai-app/domain").SubmissionId,
    };

    const program = deleteSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeleteSubmissionRepositoryError);
      expect(either.left.message).toBe("Failed to find submission");
    }
  });

  it("should fail with DeleteSubmissionRepositoryError when database error occurs during delete", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-delete-fail",
      status: "PENDING",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission], {
      shouldFailDelete: true,
    });
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: DeleteSubmissionInput = {
      submissionId:
        "submission-delete-fail" as unknown as import("@mirai-app/domain").SubmissionId,
    };

    const program = deleteSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeleteSubmissionRepositoryError);
      expect(either.left.message).toBe("Failed to delete submission");
    }
  });

  it("should allow deletion of pending submissions", async () => {
    const mockSubmission = createMockSubmissionDTO({
      id: "submission-pending",
      status: "PENDING",
    });
    const mockGateway = createMockSubmissionGateway([mockSubmission]);
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: DeleteSubmissionInput = {
      submissionId:
        "submission-pending" as unknown as import("@mirai-app/domain").SubmissionId,
    };

    const program = deleteSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });
});
