import { describe, it, expect, mock } from "bun:test";
import { GetSubmissionUseCase, type GetSubmissionInput } from "./GetSubmission";
import { SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

describe("[UNIT] GetSubmissionUseCase", () => {
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
    group: null,
    reviewedBy: null,
  });

  const createMockRepo = (
    overrides?: Partial<ChallengeSubmissionRepository>,
  ): ChallengeSubmissionRepository => ({
    create: mock(() => Promise.resolve(createMockSubmission() as any)),
    findById: mock(() => Promise.resolve(null)),
    findByChallengeAndGroup: mock(() => Promise.resolve(null)),
    findByChallengeId: mock(() => Promise.resolve([])),
    findByGroupId: mock(() => Promise.resolve([])),
    findByStatus: mock(() => Promise.resolve([])),
    findMany: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve(createMockSubmission() as any)),
    delete: mock(() => Promise.resolve()),
    existsForChallengeAndGroup: mock(() => Promise.resolve(false)),
    countByChallengeId: mock(() => Promise.resolve(0)),
    countByChallengeAndStatus: mock(() => Promise.resolve(0)),
    ...overrides,
  });

  describe("execute", () => {
    it("should return submission when found", async () => {
      const mockSubmission = createMockSubmission({
        id: "submission-456",
        challengeId: "challenge-456",
        groupId: "group-456",
        status: "APPROVED",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSubmission as any)),
      });

      const useCase = new GetSubmissionUseCase(mockRepo);
      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("submission-456");
        expect(result.value.challengeId).toBe("challenge-456");
        expect(result.value.groupId).toBe("group-456");
        expect(result.value.status).toBe("APPROVED");
        expect(result.value.awardedPoints).toBe(0);
        expect(result.value.voteCount).toBe(0);
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("submission-456");
    });

    it("should return error when submission not found", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new GetSubmissionUseCase(mockRepo);
      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("non-existent"),
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Submission not found");
      }
    });

    it("should return submission with group info when available", async () => {
      const mockSubmission = {
        ...createMockSubmission({ id: "submission-with-group" }),
        group: {
          id: "group-123",
          name: "Test Group",
          image: "/group/image.png",
          coins: 500,
        },
      };
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSubmission as any)),
      });

      const useCase = new GetSubmissionUseCase(mockRepo);
      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-with-group"),
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.group).not.toBeNull();
        expect(result.value.group?.name).toBe("Test Group");
        expect(result.value.group?.coins).toBe(500);
      }
    });

    it("should return submission with reviewer info when available", async () => {
      const mockSubmission = {
        ...createMockSubmission({
          id: "submission-reviewed",
          status: "APPROVED",
        }),
        reviewedById: "user-123",
        reviewedAt: new Date(),
        reviewedBy: {
          id: "user-123",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSubmission as any)),
      });

      const useCase = new GetSubmissionUseCase(mockRepo);
      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-reviewed"),
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.reviewedBy).not.toBeNull();
        expect(result.value.reviewedBy?.firstName).toBe("John");
        expect(result.value.reviewedBy?.email).toBe("john@example.com");
        expect(result.value.reviewedAt).toBeInstanceOf(Date);
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new GetSubmissionUseCase(mockRepo);
      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-123"),
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
