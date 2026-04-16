import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createSubmissionUseCase,
  type CreateSubmissionInput,
  SubmissionCreationError,
  DuplicateSubmissionError,
  SubmissionRepositoryError,
} from "./create";
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
    shouldFailCreate?: boolean;
    shouldFailExists?: boolean;
  } = {},
): ChallengeSubmissionGateway {
  const submissionList = [...submissions];

  return {
    create: (submission: ChallengeSubmissionDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
      submissionList.push(submission);
      return Effect.succeed(submission);
    },

    findById: (id: string) => {
      const submission = submissionList.find((s) => s.id === id);
      return Effect.succeed(submission ?? null);
    },

    findByChallengeAndGroup: () => Effect.succeed(null),

    update: (submission: ChallengeSubmissionDTO) => Effect.succeed(submission),

    delete: () => Effect.succeed(void 0),

    existsForChallengeAndGroup: () => {
      if (options.shouldFailExists) {
        return Effect.fail(
          new DatabaseError({
            operation: "existsForChallengeAndGroup",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(false);
    },

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

describe("[UNIT] createSubmissionUseCase", () => {
  it("should create a submission successfully", async () => {
    const mockGateway = createMockSubmissionGateway();
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: CreateSubmissionInput = {
      challengeId: "challenge-123",
      userId: "user-123",
      content: "My submission content",
      mediaUrls: ["https://example.com/photo.jpg"],
    };

    const program = createSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.challengeId).toBe("challenge-123");
    expect(result.userId).toBe("user-123");
    expect(result.content).toBe("My submission content");
    expect(result.mediaUrls).toEqual(["https://example.com/photo.jpg"]);
    expect(result.status).toBe("PENDING");
    expect(result.score).toBeNull();
  });

  it("should create a submission with groupId", async () => {
    const mockGateway = createMockSubmissionGateway();
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: CreateSubmissionInput = {
      challengeId: "challenge-123",
      userId: "user-123",
      groupId: "group-456",
      content: "Group submission",
    };

    const program = createSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.groupId).toBe("group-456");
  });

  it("should fail with DuplicateSubmissionError when submission exists for challenge and group", async () => {
    const existingSubmission: ChallengeSubmissionDTO = {
      id: "existing-submission",
      challengeId: "challenge-123",
      userId: "user-123",
      groupId: "group-456",
      content: "Existing submission",
      mediaUrls: [],
      status: "PENDING",
      score: null,
      reviewedById: null,
      reviewedAt: null,
      reviewNotes: null,
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    const mockGateway = createMockSubmissionGateway([existingSubmission]);
    // Override the exists check to return true for this specific case
    const gatewayWithExists = {
      ...mockGateway,
      existsForChallengeAndGroup: () => Effect.succeed(true),
    };
    const mockLayer = Layer.succeed(
      ChallengeSubmissionGatewayTag,
      gatewayWithExists,
    );

    const input: CreateSubmissionInput = {
      challengeId: "challenge-123",
      userId: "user-123",
      groupId: "group-456",
      content: "New submission",
    };

    const program = createSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DuplicateSubmissionError);
      expect(either.left.message).toBe(
        "Submission already exists for this challenge and group",
      );
    }
  });

  it("should fail with SubmissionRepositoryError when database error occurs", async () => {
    const mockGateway = createMockSubmissionGateway([], {
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: CreateSubmissionInput = {
      challengeId: "challenge-123",
      userId: "user-123",
      content: "My submission",
    };

    const program = createSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmissionRepositoryError);
      expect(either.left.message).toBe("Failed to create submission");
    }
  });

  it("should allow submission without groupId", async () => {
    const mockGateway = createMockSubmissionGateway();
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: CreateSubmissionInput = {
      challengeId: "challenge-123",
      userId: "user-123",
      content: "Individual submission",
    };

    const program = createSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.groupId).toBeNull();
    expect(result.userId).toBe("user-123");
  });

  it("should create submission with empty mediaUrls array", async () => {
    const mockGateway = createMockSubmissionGateway();
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: CreateSubmissionInput = {
      challengeId: "challenge-123",
      userId: "user-123",
      content: "Text only submission",
      mediaUrls: [],
    };

    const program = createSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.mediaUrls).toEqual([]);
  });

  it("should create submission with multiple mediaUrls", async () => {
    const mockGateway = createMockSubmissionGateway();
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: CreateSubmissionInput = {
      challengeId: "challenge-123",
      userId: "user-123",
      content: "Multi photo submission",
      mediaUrls: [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
        "https://example.com/photo3.jpg",
      ],
    };

    const program = createSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.mediaUrls).toHaveLength(3);
  });

  it("should include submittedAt timestamp", async () => {
    const mockGateway = createMockSubmissionGateway();
    const mockLayer = Layer.succeed(ChallengeSubmissionGatewayTag, mockGateway);

    const input: CreateSubmissionInput = {
      challengeId: "challenge-123",
      userId: "user-123",
    };

    const program = createSubmissionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.submittedAt).toBeInstanceOf(Date);
  });
});
