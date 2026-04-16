import { describe, it, expect, beforeEach } from "bun:test";
import {
  createSubmissionUseCase,
  type CreateSubmissionInput,
  SubmissionCreationError,
  DuplicateSubmissionError,
} from "./create";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeSubmissionGatewayTag } from "../../ports/submission/gateway";

describe("[UNIT] createSubmissionUseCase (Effect)", () => {
  const createMockSubmission = async (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      groupId: string;
      imageIds: string[];
      videoId: string | null;
      textContent: string | null;
      latitude: number | null;
      longitude: number | null;
      status: string;
    }>,
  ): Promise<ChallengeSubmission> => {
    return await Effect.runPromise(
      ChallengeSubmission.create({
        id: (overrides?.id ?? "submission-123") as SubmissionId,
        challengeId: overrides?.challengeId ?? "challenge-123",
        groupId: overrides?.groupId ?? "group-123",
        imageIds: overrides?.imageIds ?? ["image-1", "image-2"],
        videoId: overrides?.videoId ?? null,
        textContent: overrides?.textContent ?? "Test submission content",
        latitude: overrides?.latitude ?? 52.52,
        longitude: overrides?.longitude ?? 13.405,
      }).pipe(Effect.orDie),
    );
  };

  const createMockRepo = (overrides?: {
    create?: (
      submission: ChallengeSubmission,
    ) => Effect.Effect<ChallengeSubmission, never, never>;
    findByChallengeAndGroup?: (
      challengeId: string,
      groupId: string,
    ) => Effect.Effect<ChallengeSubmission | null, never, never>;
    existsForChallengeAndGroup?: (
      challengeId: string,
      groupId: string,
    ) => Effect.Effect<boolean, never, never>;
  }) => ({
    create:
      overrides?.create ?? (() => Effect.promise(() => createMockSubmission())),
    findById: () => Effect.succeed(null),
    findByChallengeAndGroup:
      overrides?.findByChallengeAndGroup ?? (() => Effect.succeed(null)),
    findByChallengeId: () => Effect.succeed([]),
    findByGroupId: () => Effect.succeed([]),
    findByStatus: () => Effect.succeed([]),
    findMany: () => Effect.succeed([]),
    update: () => Effect.promise(() => createMockSubmission()),
    delete: () => Effect.succeed(void 0),
    existsForChallengeAndGroup:
      overrides?.existsForChallengeAndGroup ?? (() => Effect.succeed(false)),
    countByChallengeId: () => Effect.succeed(0),
    countByChallengeAndStatus: () => Effect.succeed(0),
  });

  describe("[UNIT] execute", () => {
    it("should create submission successfully", async () => {
      const mockSubmission = await createMockSubmission({
        id: "submission-new",
        challengeId: "challenge-123",
        groupId: "group-123",
      });
      const mockRepo = createMockRepo({
        create: () => Effect.succeed(mockSubmission),
        existsForChallengeAndGroup: () => Effect.succeed(false),
      });

      const input: CreateSubmissionInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
        imageIds: ["image-1", "image-2"],
        textContent: "Test submission content",
        latitude: 52.52,
        longitude: 13.405,
      };

      const result = await Effect.runPromise(
        createSubmissionUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
        ),
      );

      expect(result.challengeId).toBe("challenge-123");
      expect(result.groupId).toBe("group-123");
      expect(result.status).toBe("PENDING");
      expect(result.awardedPoints).toBe(0);
    });

    it("should return error when submission already exists", async () => {
      const existingSubmission = await createMockSubmission({
        id: "existing-submission",
        challengeId: "challenge-123",
        groupId: "group-123",
      });
      const mockRepo = createMockRepo({
        existsForChallengeAndGroup: () => Effect.succeed(true),
        findByChallengeAndGroup: () => Effect.succeed(existingSubmission),
      });

      const input: CreateSubmissionInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
        imageIds: ["image-1", "image-2"],
        textContent: "Test submission content",
        latitude: 52.52,
        longitude: 13.405,
      };

      const program = createSubmissionUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DuplicateSubmissionError);
      }
    });

    it("should create submission with video", async () => {
      const mockSubmission = await createMockSubmission({
        id: "submission-video",
        videoId: "video-123",
        imageIds: [],
      });
      const mockRepo = createMockRepo({
        create: () => Effect.succeed(mockSubmission),
        existsForChallengeAndGroup: () => Effect.succeed(false),
      });

      const input: CreateSubmissionInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
        videoId: "video-123",
      };

      const result = await Effect.runPromise(
        createSubmissionUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
        ),
      );

      expect(result.videoId).toBe("video-123");
      expect(result.status).toBe("PENDING");
    });

    it("should return error when validation fails", async () => {
      const mockRepo = createMockRepo({
        existsForChallengeAndGroup: () => Effect.succeed(false),
      });

      const input: CreateSubmissionInput = {
        challengeId: "",
        groupId: "group-123",
      };

      const program = createSubmissionUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmissionCreationError);
      }
    });

    it("should create submission with provided fields", async () => {
      const mockSubmission = await createMockSubmission({
        id: "submission-test",
        imageIds: [],
        videoId: null,
        textContent: null,
        latitude: null,
        longitude: null,
      });
      const mockRepo = createMockRepo({
        create: () => Effect.succeed(mockSubmission),
        existsForChallengeAndGroup: () => Effect.succeed(false),
      });

      const input: CreateSubmissionInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
      };

      const result = await Effect.runPromise(
        createSubmissionUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
        ),
      );

      expect(result.challengeId).toBe("challenge-123");
    });
  });
});
