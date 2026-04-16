import { describe, it, expect } from "bun:test";
import { ChallengeDrizzleMapper } from "./mapper";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import type { ChallengeSelect } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] ChallengeDrizzleMapper", () => {
  const mapper = ChallengeDrizzleMapper.instance;

  // Factory for creating mock Drizzle Challenge records
  const createMockChallengeSelect = (
    overrides: Partial<ChallengeSelect> & Record<string, unknown> = {},
  ): ChallengeSelect => ({
    id: "challenge-123",
    tripId: "trip-456",
    name: "Test Challenge",
    description: "A test challenge description",
    image: "https://example.com/challenge.png",
    submissionType: "IMAGE",
    scoringCategory: "SPEED",
    isRecurring: false,
    dailyStartTime: null,
    dailyEndTime: null,
    basePoints: 100,
    firstPlacePoints: null,
    secondPlacePoints: null,
    thirdPlacePoints: null,
    status: "ACTIVE",
    startTime: new Date("2024-01-15T10:00:00Z"),
    endTime: new Date("2024-01-20T18:00:00Z"),
    votingStartTime: null,
    votingEndTime: null,
    targetLatitude: null,
    targetLongitude: null,
    expectedValue: null,
    autoApprove: false,
    createdAt: new Date("2024-01-10T08:00:00Z"),
    updatedAt: new Date("2024-01-10T08:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to ChallengeDTO", () => {
      const record = createMockChallengeSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("challenge-123");
      expect(dto.tripId).toBe("trip-456");
      expect(dto.title).toBe("Test Challenge");
      expect(dto.description).toBe("A test challenge description");
      expect(dto.status).toBe(ChallengeStatus.ACTIVE);
      expect(dto.scoringCategory).toBe(ScoringCategory.SPEED);
      expect(dto.points).toBe(100);
      expect(dto.maxPoints).toBeNull();
      expect(dto.startDate).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.endDate).toEqual(new Date("2024-01-20T18:00:00Z"));
      expect(dto.createdById).toBe("");
      expect(dto.createdAt).toEqual(new Date("2024-01-10T08:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-10T08:00:00Z"));
    });

    it("maps status correctly from Drizzle", () => {
      const hiddenRecord = createMockChallengeSelect({ status: "HIDDEN" });
      const visibleRecord = createMockChallengeSelect({ status: "VISIBLE" });
      const activeRecord = createMockChallengeSelect({ status: "ACTIVE" });
      const votingRecord = createMockChallengeSelect({
        status: "VOTING_PHASE",
      });
      const completedRecord = createMockChallengeSelect({
        status: "COMPLETED",
      });
      const cancelledRecord = createMockChallengeSelect({
        status: "CANCELLED",
      });

      expect(mapper.toDTO(hiddenRecord).status).toBe(ChallengeStatus.HIDDEN);
      expect(mapper.toDTO(visibleRecord).status).toBe(ChallengeStatus.VISIBLE);
      expect(mapper.toDTO(activeRecord).status).toBe(ChallengeStatus.ACTIVE);
      expect(mapper.toDTO(votingRecord).status).toBe(
        ChallengeStatus.VOTING_PHASE,
      );
      expect(mapper.toDTO(completedRecord).status).toBe(
        ChallengeStatus.COMPLETED,
      );
      expect(mapper.toDTO(cancelledRecord).status).toBe(
        ChallengeStatus.CANCELLED,
      );
    });

    it("defaults unknown status to HIDDEN", () => {
      const record = createMockChallengeSelect({
        status: "UNKNOWN" as ChallengeSelect["status"],
      });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe(ChallengeStatus.HIDDEN);
    });

    it("maps scoring category correctly from Drizzle", () => {
      const speedRecord = createMockChallengeSelect({
        scoringCategory: "SPEED",
      });
      const unlimitedRecord = createMockChallengeSelect({
        scoringCategory: "UNLIMITED",
      });
      const judgedStaffRecord = createMockChallengeSelect({
        scoringCategory: "JUDGED_STAFF",
      });
      const peerVotingRecord = createMockChallengeSelect({
        scoringCategory: "PEER_VOTING",
      });

      expect(mapper.toDTO(speedRecord).scoringCategory).toBe(
        ScoringCategory.SPEED,
      );
      expect(mapper.toDTO(unlimitedRecord).scoringCategory).toBe(
        ScoringCategory.UNLIMITED,
      );
      expect(mapper.toDTO(judgedStaffRecord).scoringCategory).toBe(
        ScoringCategory.JUDGED_STAFF,
      );
      expect(mapper.toDTO(peerVotingRecord).scoringCategory).toBe(
        ScoringCategory.PEER_VOTING,
      );
    });

    it("defaults unknown scoring category to SPEED", () => {
      const record = createMockChallengeSelect({
        scoringCategory: "UNKNOWN" as ChallengeSelect["scoringCategory"],
      });

      const dto = mapper.toDTO(record);

      expect(dto.scoringCategory).toBe(ScoringCategory.SPEED);
    });
  });

  describe("toDomain", () => {
    it("converts Drizzle record to domain Challenge entity", () => {
      const record = createMockChallengeSelect();

      const entity = mapper.toDomain(record);

      expect(entity.id).toBe("challenge-123");
      expect(entity.tripId).toBe("trip-456");
      expect(entity.name).toBe("Test Challenge");
      expect(entity.description).toBe("A test challenge description");
      expect(entity.image).toBe("https://example.com/challenge.png");
      expect(entity.submissionType).toBe(SubmissionType.IMAGE);
      expect(entity.scoringCategory).toBe(ScoringCategory.SPEED);
      expect(entity.isRecurring).toBe(false);
      expect(entity.basePoints).toBe(100);
      expect(entity.status).toBe(ChallengeStatus.ACTIVE);
    });

    it("maps submission type correctly to domain", () => {
      const imageRecord = createMockChallengeSelect({
        submissionType: "IMAGE",
      });
      const multiImageRecord = createMockChallengeSelect({
        submissionType: "MULTI_IMAGE",
      });
      const videoRecord = createMockChallengeSelect({
        submissionType: "VIDEO",
      });
      const textRecord = createMockChallengeSelect({
        submissionType: "TEXT",
      });

      expect(mapper.toDomain(imageRecord).submissionType).toBe(
        SubmissionType.IMAGE,
      );
      expect(mapper.toDomain(multiImageRecord).submissionType).toBe(
        SubmissionType.MULTI_IMAGE,
      );
      expect(mapper.toDomain(videoRecord).submissionType).toBe(
        SubmissionType.VIDEO,
      );
      expect(mapper.toDomain(textRecord).submissionType).toBe(
        SubmissionType.TEXT,
      );
    });

    it("defaults unknown submission type to IMAGE", () => {
      const record = createMockChallengeSelect({
        submissionType:
          "UNKNOWN" as unknown as ChallengeSelect["submissionType"],
      });

      const entity = mapper.toDomain(record);

      expect(entity.submissionType).toBe(SubmissionType.IMAGE);
    });

    it("handles optional fields in domain entity", () => {
      const record = createMockChallengeSelect({
        // dailyStartTime/dailyEndTime must be in HH:MM format or null
        dailyStartTime: null,
        dailyEndTime: null,
        firstPlacePoints: 50,
        secondPlacePoints: 30,
        thirdPlacePoints: 20,
        votingStartTime: new Date("2024-01-18T10:00:00Z"),
        votingEndTime: new Date("2024-01-19T18:00:00Z"),
        targetLatitude: 52.2297,
        targetLongitude: 21.0122,
        expectedValue: "test-value",
      });

      const entity = mapper.toDomain(record);

      expect(entity.dailyStartTime).toBeNull();
      expect(entity.dailyEndTime).toBeNull();
      expect(entity.firstPlacePoints).toBe(50);
      expect(entity.secondPlacePoints).toBe(30);
      expect(entity.thirdPlacePoints).toBe(20);
      expect(entity.votingStartTime).toEqual(new Date("2024-01-18T10:00:00Z"));
      expect(entity.votingEndTime).toEqual(new Date("2024-01-19T18:00:00Z"));
      expect(entity.targetLatitude).toBe(52.2297);
      expect(entity.targetLongitude).toBe(21.0122);
      expect(entity.expectedValue).toBe("test-value");
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts ChallengeDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockChallengeSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("challenge-123");
      expect(insert.tripId).toBe("trip-456");
      expect(insert.name).toBe("Test Challenge");
      expect(insert.description).toBe("A test challenge description");
      expect(insert.image).toBeNull();
      expect(insert.submissionType).toBe("IMAGE");
      expect(insert.scoringCategory).toBe(ScoringCategory.SPEED);
      expect(insert.isRecurring).toBe(false);
      expect(insert.dailyStartTime).toBeNull();
      expect(insert.dailyEndTime).toBeNull();
      expect(insert.basePoints).toBe(100);
      expect(insert.firstPlacePoints).toBeNull();
      expect(insert.secondPlacePoints).toBeNull();
      expect(insert.thirdPlacePoints).toBeNull();
      expect(insert.status).toBe(ChallengeStatus.ACTIVE);
      expect(insert.startTime).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.endTime).toEqual(new Date("2024-01-20T18:00:00Z"));
      expect(insert.votingStartTime).toBeNull();
      expect(insert.votingEndTime).toBeNull();
      expect(insert.targetLatitude).toBeNull();
      expect(insert.targetLongitude).toBeNull();
      expect(insert.expectedValue).toBeNull();
      expect(insert.autoApprove).toBe(false);
      expect(insert.createdAt).toEqual(new Date("2024-01-10T08:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-10T08:00:00Z"));
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts ChallengeDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockChallengeSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id or createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("createdAt");

      // Should include updatable fields
      expect(update.name).toBe("Test Challenge");
      expect(update.description).toBe("A test challenge description");
      expect(update.scoringCategory).toBe(ScoringCategory.SPEED);
      expect(update.basePoints).toBe(100);
      expect(update.status).toBe(ChallengeStatus.ACTIVE);
      expect(update.startTime).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(update.endTime).toEqual(new Date("2024-01-20T18:00:00Z"));
    });

    it("updates updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockChallengeSelect());
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt!.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = ChallengeDrizzleMapper.instance;
      const instance2 = ChallengeDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
