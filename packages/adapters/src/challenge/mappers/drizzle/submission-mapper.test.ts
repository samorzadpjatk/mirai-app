import { describe, it, expect } from "bun:test";
import { ChallengeSubmissionDrizzleMapper } from "./submission-mapper";
import type { ChallengeSubmissionSelect } from "@mirai-app/frameworks/drizzle/schema";

describe("[UNIT] ChallengeSubmissionDrizzleMapper", () => {
  const mapper = ChallengeSubmissionDrizzleMapper.instance;

  // Factory for creating mock Drizzle ChallengeSubmission records
  const createMockChallengeSubmissionSelect = (
    overrides: Partial<ChallengeSubmissionSelect> = {},
  ): ChallengeSubmissionSelect => ({
    id: "submission-123",
    challengeId: "challenge-456",
    groupId: "group-789",
    imageIds: ["image-1", "image-2"],
    videoId: null,
    textContent: "Test submission content",
    latitude: null,
    longitude: null,
    status: "PENDING",
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    awardedPoints: null,
    bonusPoints: null,
    ranking: null,
    voteCount: 5,
    voteScore: 15,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to ChallengeSubmissionDTO", () => {
      const record = createMockChallengeSubmissionSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("submission-123");
      expect(dto.challengeId).toBe("challenge-456");
      expect(dto.userId).toBe("group-789");
      expect(dto.groupId).toBe("group-789");
      expect(dto.content).toBe("Test submission content");
      expect(dto.mediaUrls).toEqual(["image-1", "image-2"]);
      expect(dto.status).toBe("PENDING");
      expect(dto.score).toBeNull();
      expect(dto.reviewedById).toBeNull();
      expect(dto.reviewedAt).toBeNull();
      expect(dto.reviewNotes).toBeNull();
      expect(dto.submittedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.voteCount).toBe(5);
      expect(dto.voteScore).toBe(15);
    });

    it("handles empty imageIds", () => {
      const record = createMockChallengeSubmissionSelect({
        imageIds: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.mediaUrls).toEqual([]);
    });

    it("handles approved status", () => {
      const record = createMockChallengeSubmissionSelect({
        status: "APPROVED",
        awardedPoints: 100,
        reviewedById: "admin-001",
        reviewedAt: new Date("2024-01-16T12:00:00Z"),
      });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe("APPROVED");
      expect(dto.score).toBe(100);
      expect(dto.reviewedById).toBe("admin-001");
      expect(dto.reviewedAt).toEqual(new Date("2024-01-16T12:00:00Z"));
    });

    it("handles rejected status with rejection reason", () => {
      const record = createMockChallengeSubmissionSelect({
        status: "REJECTED",
        rejectionReason: "Does not meet requirements",
        reviewedById: "admin-002",
        reviewedAt: new Date("2024-01-16T14:00:00Z"),
      });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe("REJECTED");
      expect(dto.reviewNotes).toBe("Does not meet requirements");
      expect(dto.reviewedById).toBe("admin-002");
    });
  });

  describe("toDomain", () => {
    it("converts Drizzle record to domain ChallengeSubmission entity", () => {
      const record = createMockChallengeSubmissionSelect();

      const entity = mapper.toDomain(record);

      expect(entity.id).toBe("submission-123");
      expect(entity.challengeId).toBe("challenge-456");
      expect(entity.groupId).toBe("group-789");
      expect(entity.imageIds).toEqual(["image-1", "image-2"]);
      expect(entity.videoId).toBeNull();
      expect(entity.textContent).toBe("Test submission content");
      expect(entity.latitude).toBeNull();
      expect(entity.longitude).toBeNull();
      expect(entity.status).toBe("PENDING");
      expect(entity.reviewedById).toBeNull();
      expect(entity.reviewedAt).toBeNull();
      expect(entity.rejectionReason).toBeNull();
      expect(entity.awardedPoints).toBeNull();
      expect(entity.bonusPoints).toBeNull();
      expect(entity.ranking).toBeNull();
      expect(entity.voteCount).toBe(5);
      expect(entity.voteScore).toBe(15);
      expect(entity.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(entity.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles all optional fields in domain entity", () => {
      const record = createMockChallengeSubmissionSelect({
        videoId: "video-123",
        latitude: 52.2297,
        longitude: 21.0122,
        awardedPoints: 100,
        bonusPoints: 20,
        ranking: 1,
      });

      const entity = mapper.toDomain(record);

      expect(entity.videoId).toBe("video-123");
      expect(entity.latitude).toBe(52.2297);
      expect(entity.longitude).toBe(21.0122);
      expect(entity.awardedPoints).toBe(100);
      expect(entity.bonusPoints).toBe(20);
      expect(entity.ranking).toBe(1);
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts ChallengeSubmissionDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockChallengeSubmissionSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("submission-123");
      expect(insert.challengeId).toBe("challenge-456");
      expect(insert.groupId).toBe("group-789");
      expect(insert.imageIds).toEqual(["image-1", "image-2"]);
      expect(insert.videoId).toBeNull();
      expect(insert.textContent).toBe("Test submission content");
      expect(insert.latitude).toBeNull();
      expect(insert.longitude).toBeNull();
      expect(insert.status).toBe("PENDING");
      expect(insert.reviewedById).toBeNull();
      expect(insert.reviewedAt).toBeNull();
      expect(insert.rejectionReason).toBeNull();
      expect(insert.awardedPoints).toBeNull();
      expect(insert.bonusPoints).toBeNull();
      expect(insert.ranking).toBeNull();
      expect(insert.voteCount).toBe(0);
      expect(insert.voteScore).toBe(0);
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("falls back to userId when groupId is null", () => {
      const record = createMockChallengeSubmissionSelect({
        groupId: null,
      });
      const dto = mapper.toDTO(record);
      dto.userId = "fallback-user";

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.groupId).toBe("fallback-user");
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts ChallengeSubmissionDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockChallengeSubmissionSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id or createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("createdAt");

      // Should include updatable fields
      expect(update.challengeId).toBe("challenge-456");
      expect(update.groupId).toBe("group-789");
      expect(update.imageIds).toEqual(["image-1", "image-2"]);
      expect(update.videoId).toBeNull();
      expect(update.textContent).toBe("Test submission content");
      expect(update.status).toBe("PENDING");
      expect(update.reviewedById).toBeNull();
      expect(update.reviewedAt).toBeNull();
      expect(update.rejectionReason).toBeNull();
      expect(update.awardedPoints).toBeNull();
    });

    it("updates updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockChallengeSubmissionSelect());
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("preserves vote count and score in update", () => {
      const record = createMockChallengeSubmissionSelect({
        voteCount: 10,
        voteScore: 25,
      });
      const dto = mapper.toDTO(record);

      // Note: toDrizzleUpdate doesn't include voteCount or voteScore
      // because they're computed/aggregate fields
      const update = mapper.toDrizzleUpdate(dto);
      expect(update).not.toHaveProperty("voteCount");
      expect(update).not.toHaveProperty("voteScore");
    });
  });

  describe("fromPartial", () => {
    it("creates partial entity with all fields present", () => {
      const record = {
        id: "submission-123",
        challengeId: "challenge-456",
        groupId: "group-789",
        imageIds: ["image-1"],
        videoId: "video-123",
        textContent: "Updated content",
        latitude: 52.2297,
        longitude: 21.0122,
        status: "APPROVED",
        reviewedById: "admin-001",
        reviewedAt: new Date("2024-01-16T12:00:00Z"),
        rejectionReason: "Updated reason",
        awardedPoints: 100,
        bonusPoints: 20,
        ranking: 1,
        voteCount: 10,
        voteScore: 30,
      };

      const partial = mapper.fromPartial(record);

      expect(partial.id).toBe("submission-123");
      expect(partial.challengeId).toBe("challenge-456");
      expect(partial.groupId).toBe("group-789");
      expect(partial.imageIds).toEqual(["image-1"]);
      expect(partial.videoId).toBe("video-123");
      expect(partial.textContent).toBe("Updated content");
      expect(partial.latitude).toBe(52.2297);
      expect(partial.longitude).toBe(21.0122);
      expect(partial.status).toBe("APPROVED");
      expect(partial.reviewedById).toBe("admin-001");
      expect(partial.reviewedAt).toEqual(new Date("2024-01-16T12:00:00Z"));
      expect(partial.rejectionReason).toBe("Updated reason");
      expect(partial.awardedPoints).toBe(100);
      expect(partial.bonusPoints).toBe(20);
      expect(partial.ranking).toBe(1);
      expect(partial.voteCount).toBe(10);
      expect(partial.voteScore).toBe(30);
    });

    it("creates partial entity with only some fields present", () => {
      const record = {
        id: "submission-123",
        status: "APPROVED",
      };

      const partial = mapper.fromPartial(record);

      expect(partial.id).toBe("submission-123");
      expect(partial.status).toBe("APPROVED");
      expect(partial.challengeId).toBeUndefined();
      expect(partial.groupId).toBeUndefined();
    });

    it("handles null values correctly", () => {
      const record = {
        videoId: null,
        reviewedById: null,
        rejectionReason: null,
      };

      const partial = mapper.fromPartial(record);

      expect(partial.videoId).toBeNull();
      expect(partial.reviewedById).toBeNull();
      expect(partial.rejectionReason).toBeNull();
    });

    it("handles zero values correctly", () => {
      const record = {
        awardedPoints: 0,
        bonusPoints: 0,
        voteCount: 0,
        voteScore: 0,
      };

      const partial = mapper.fromPartial(record);

      expect(partial.awardedPoints).toBe(0);
      expect(partial.bonusPoints).toBe(0);
      expect(partial.voteCount).toBe(0);
      expect(partial.voteScore).toBe(0);
    });

    it("returns empty object when no fields match", () => {
      const record = {};

      const partial = mapper.fromPartial(record);

      expect(partial).toEqual({});
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = ChallengeSubmissionDrizzleMapper.instance;
      const instance2 = ChallengeSubmissionDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
