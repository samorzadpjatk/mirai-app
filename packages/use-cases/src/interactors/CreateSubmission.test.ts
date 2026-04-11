import { describe, it, expect, mock } from "bun:test";
import {
  CreateSubmissionUseCase,
  type CreateSubmissionInput,
} from "./CreateSubmission";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

describe("[UNIT] CreateSubmissionUseCase", () => {
  const createValidSubmission = (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      groupId: string;
    }>,
  ): ChallengeSubmission => {
    const result = ChallengeSubmission.create({
      id: overrides?.id ?? "submission-123",
      challengeId: overrides?.challengeId ?? "challenge-123",
      groupId: overrides?.groupId ?? "group-123",
      imageIds: ["image-1", "image-2"],
      videoId: null,
      textContent: "Test submission content",
      latitude: 52.52,
      longitude: 13.405,
    });
    if (result.kind === "err") {
      throw new Error(
        `Failed to create test submission: ${result.error.message}`,
      );
    }
    return result.value;
  };

  const createMockRepo = (
    overrides?: Partial<ChallengeSubmissionRepository>,
  ): ChallengeSubmissionRepository => ({
    create: mock(() => Promise.resolve(createValidSubmission())),
    findById: mock(() => Promise.resolve(null)),
    findByChallengeAndGroup: mock(() => Promise.resolve(null)),
    findByChallengeId: mock(() => Promise.resolve([])),
    findByGroupId: mock(() => Promise.resolve([])),
    findByStatus: mock(() => Promise.resolve([])),
    findMany: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve(createValidSubmission())),
    delete: mock(() => Promise.resolve()),
    existsForChallengeAndGroup: mock(() => Promise.resolve(false)),
    countByChallengeId: mock(() => Promise.resolve(0)),
    countByChallengeAndStatus: mock(() => Promise.resolve(0)),
    ...overrides,
  });

  describe("execute", () => {
    it("should create submission successfully", async () => {
      const mockSubmission = createValidSubmission({
        id: "submission-456",
        challengeId: "challenge-456",
        groupId: "group-456",
      });
      const mockRepo = createMockRepo({
        existsForChallengeAndGroup: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockSubmission)),
      });

      const useCase = new CreateSubmissionUseCase(mockRepo);
      const input: CreateSubmissionInput = {
        challengeId: "challenge-456",
        groupId: "group-456",
        imageIds: ["image-1", "image-2"],
        textContent: "Test submission content",
        latitude: 52.52,
        longitude: 13.405,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.challengeId).toBe("challenge-456");
        expect(result.value.groupId).toBe("group-456");
        expect(result.value.imageIds).toHaveLength(2);
        expect(result.value.textContent).toBe("Test submission content");
        expect(result.value.latitude).toBe(52.52);
        expect(result.value.longitude).toBe(13.405);
        expect(result.value.status).toBe("PENDING");
        expect(result.value.awardedPoints).toBe(0);
        expect(result.value.bonusPoints).toBe(0);
        expect(result.value.voteCount).toBe(0);
        expect(result.value.voteScore).toBe(0);
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
      expect(mockRepo.existsForChallengeAndGroup).toHaveBeenCalledWith(
        "challenge-456",
        "group-456",
      );
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should return error when submission already exists", async () => {
      const mockRepo = createMockRepo({
        existsForChallengeAndGroup: mock(() => Promise.resolve(true)),
      });

      const useCase = new CreateSubmissionUseCase(mockRepo);
      const input: CreateSubmissionInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe(
          "Submission already exists for this challenge and group",
        );
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should create submission with video", async () => {
      const mockSubmission = createValidSubmission();
      const mockRepo = createMockRepo({
        existsForChallengeAndGroup: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockSubmission)),
      });

      const useCase = new CreateSubmissionUseCase(mockRepo);
      const input: CreateSubmissionInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
        videoId: "video-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should return error when validation fails", async () => {
      const mockRepo = createMockRepo();

      const useCase = new CreateSubmissionUseCase(mockRepo);
      const input: CreateSubmissionInput = {
        challengeId: "", // Invalid empty challengeId
        groupId: "group-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        existsForChallengeAndGroup: mock(() =>
          Promise.reject(new Error("DB error")),
        ),
      });

      const useCase = new CreateSubmissionUseCase(mockRepo);
      const input: CreateSubmissionInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });

    it("should create minimal submission with only required fields", async () => {
      const minimalResult = ChallengeSubmission.create({
        id: "submission-minimal",
        challengeId: "challenge-123",
        groupId: "group-123",
        imageIds: [],
        videoId: null,
        textContent: null,
        latitude: null,
        longitude: null,
      });
      if (minimalResult.kind === "err") {
        throw new Error("Failed to create test submission");
      }
      const mockSubmission = minimalResult.value;

      const mockRepo = createMockRepo({
        existsForChallengeAndGroup: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockSubmission)),
      });

      const useCase = new CreateSubmissionUseCase(mockRepo);
      const input: CreateSubmissionInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.videoId).toBeNull();
        expect(result.value.textContent).toBeNull();
        expect(result.value.latitude).toBeNull();
        expect(result.value.longitude).toBeNull();
      }
    });
  });
});
