import { describe, it, expect, mock } from "bun:test";
import { Effect } from "effect";
import {
  getSubmissionByChallengeAndGroupUseCase,
  type GetSubmissionByChallengeAndGroupInput,
} from "./GetSubmissionByChallengeAndGroup";
import { SubmissionId } from "@mirai-app/domain";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";

describe("[UNIT] getSubmissionByChallengeAndGroupUseCase (Effect)", () => {
  const createMockSubmission = (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      groupId: string;
      status: string;
    }>,
  ) => ({
    id: SubmissionId.unsafeCreate(overrides?.id ?? "submission-123"),
    challengeId: overrides?.challengeId ?? "challenge-123",
    groupId: overrides?.groupId ?? "group-123",
    imageIds: ["image-1"],
    videoId: null,
    textContent: "Test content",
    latitude: 52.52,
    longitude: 13.405,
    status: overrides?.status ?? "PENDING",
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    awardedPoints: 0,
    bonusPoints: 0,
    ranking: null,
    voteCount: 0,
    voteScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    group: {
      id: overrides?.groupId ?? "group-123",
      name: "Test Group",
      image: null,
      coins: 500,
    },
    reviewedBy: null,
  });

  const createMockRepo = (overrides?: {
    findByChallengeAndGroup?: () => Effect.Effect<
      {
        id: ReturnType<typeof SubmissionId.unsafeCreate>;
        challengeId: string;
        groupId: string;
        imageIds: string[];
        videoId: null;
        textContent: string;
        latitude: number;
        longitude: number;
        status: string;
        reviewedById: null;
        reviewedAt: null;
        rejectionReason: null;
        awardedPoints: number;
        bonusPoints: number;
        ranking: null;
        voteCount: number;
        voteScore: number;
        createdAt: Date;
        updatedAt: Date;
        group: { id: string; name: string; image: null; coins: number };
        reviewedBy: null;
      } | null,
      never,
      never
    >;
  }) => ({
    create: () => Effect.succeed(createMockSubmission()),
    findById: () => Effect.succeed(null),
    findByChallengeAndGroup:
      overrides?.findByChallengeAndGroup ?? (() => Effect.succeed(null)),
    findByChallengeId: () => Effect.succeed([]),
    findByGroupId: () => Effect.succeed([]),
    findByStatus: () => Effect.succeed([]),
    findMany: () => Effect.succeed([]),
    update: () => Effect.succeed(createMockSubmission()),
    delete: () => Effect.succeed(void 0),
    existsForChallengeAndGroup: () => Effect.succeed(false),
    countByChallengeId: () => Effect.succeed(0),
    countByChallengeAndStatus: () => Effect.succeed(0),
  });

  describe("[UNIT] execute", () => {
    it("should return submission when found", async () => {
      const mockSubmission = createMockSubmission({
        id: "submission-456",
        challengeId: "challenge-456",
        groupId: "group-456",
        status: "APPROVED",
      });
      const mockRepo = createMockRepo({
        findByChallengeAndGroup: () => Effect.succeed(mockSubmission),
      });

      const input: GetSubmissionByChallengeAndGroupInput = {
        challengeId: "challenge-456",
        groupId: "group-456",
      };

      const program = getSubmissionByChallengeAndGroupUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("submission-456");
      expect(result?.challengeId).toBe("challenge-456");
      expect(result?.groupId).toBe("group-456");
      expect(result?.status).toBe("APPROVED");
      expect(result?.group?.name).toBe("Test Group");
    });

    it("should return null when submission not found", async () => {
      const mockRepo = createMockRepo({
        findByChallengeAndGroup: () => Effect.succeed(null),
      });

      const input: GetSubmissionByChallengeAndGroupInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
      };

      const program = getSubmissionByChallengeAndGroupUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      expect(result).toBeNull();
    });

    it("should return submission with reviewer info when available", async () => {
      const mockSubmission = {
        ...createMockSubmission({
          id: "submission-reviewed",
          status: "REJECTED",
        }),
        reviewedById: "user-123",
        reviewedAt: new Date(),
        rejectionReason: "Invalid submission",
        reviewedBy: {
          id: "user-123",
          firstName: "Reviewer",
          lastName: "User",
          email: "reviewer@example.com",
        },
      };
      const mockRepo = createMockRepo({
        findByChallengeAndGroup: () => Effect.succeed(mockSubmission),
      });

      const input: GetSubmissionByChallengeAndGroupInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
      };

      const program = getSubmissionByChallengeAndGroupUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.status).toBe("REJECTED");
        expect(result.rejectionReason).toBe("Invalid submission");
        expect(result.reviewedBy?.firstName).toBe("Reviewer");
        expect(result.reviewedAt).toBeInstanceOf(Date);
      }
    });
  });
});
