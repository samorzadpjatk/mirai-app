import { describe, it, expect } from "bun:test";
import { ChallengeMapper } from "../mappers/ChallengeMapper";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@repo/domain";

describe("[UNIT] ChallengeMapper", () => {
  // Sample Prisma challenge records
  const createPrismaChallenge = (
    overrides: Partial<{
      id: string;
      tripId: string;
      name: string;
      description: string | null;
      image: string | null;
      submissionType: string;
      scoringCategory: string;
      isRecurring: boolean;
      dailyStartTime: string | null;
      dailyEndTime: string | null;
      basePoints: number;
      firstPlacePoints: number | null;
      secondPlacePoints: number | null;
      thirdPlacePoints: number | null;
      status: string;
      startTime: Date | null;
      endTime: Date | null;
      votingStartTime: Date | null;
      votingEndTime: Date | null;
      targetLatitude: number | null;
      targetLongitude: number | null;
      expectedValue: string | null;
      autoApprove: boolean;
      createdAt: Date;
      updatedAt: Date;
    }> = {},
  ) => ({
    id: "challenge-123",
    tripId: "trip-456",
    name: "Test Challenge",
    description: "A test challenge description",
    image: "https://example.com/image.png",
    submissionType: "IMAGE",
    scoringCategory: "UNLIMITED",
    isRecurring: false,
    dailyStartTime: null,
    dailyEndTime: null,
    basePoints: 10,
    firstPlacePoints: null,
    secondPlacePoints: null,
    thirdPlacePoints: null,
    status: "HIDDEN",
    startTime: null,
    endTime: null,
    votingStartTime: null,
    votingEndTime: null,
    targetLatitude: null,
    targetLongitude: null,
    expectedValue: null,
    autoApprove: false,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDomain", () => {
    it("should map Prisma challenge to domain Challenge entity", () => {
      const prismaChallenge = createPrismaChallenge();
      const domainChallenge = ChallengeMapper.toDomain(prismaChallenge);

      expect(domainChallenge.id).toBe("challenge-123");
      expect(domainChallenge.tripId).toBe("trip-456");
      expect(domainChallenge.name).toBe("Test Challenge");
      expect(domainChallenge.description).toBe("A test challenge description");
      expect(domainChallenge.image).toBe("https://example.com/image.png");
      expect(domainChallenge.submissionType).toBe(SubmissionType.IMAGE);
      expect(domainChallenge.scoringCategory).toBe(ScoringCategory.UNLIMITED);
      expect(domainChallenge.isRecurring).toBe(false);
      expect(domainChallenge.basePoints).toBe(10);
      expect(domainChallenge.status).toBe(ChallengeStatus.HIDDEN);
    });

    describe("submission type mapping", () => {
      it("should map IMAGE submission type", () => {
        const prisma = createPrismaChallenge({ submissionType: "IMAGE" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.submissionType).toBe(SubmissionType.IMAGE);
      });

      it("should map MULTI_IMAGE submission type", () => {
        const prisma = createPrismaChallenge({ submissionType: "MULTI_IMAGE" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.submissionType).toBe(SubmissionType.MULTI_IMAGE);
      });

      it("should map VIDEO submission type", () => {
        const prisma = createPrismaChallenge({ submissionType: "VIDEO" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.submissionType).toBe(SubmissionType.VIDEO);
      });

      it("should map TEXT submission type", () => {
        const prisma = createPrismaChallenge({ submissionType: "TEXT" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.submissionType).toBe(SubmissionType.TEXT);
      });

      it("should map IMAGE_LOCATION submission type", () => {
        const prisma = createPrismaChallenge({
          submissionType: "IMAGE_LOCATION",
        });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.submissionType).toBe(SubmissionType.IMAGE_LOCATION);
      });

      it("should map LOCATION submission type", () => {
        const prisma = createPrismaChallenge({ submissionType: "LOCATION" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.submissionType).toBe(SubmissionType.LOCATION);
      });

      it("should map QR_CODE submission type", () => {
        const prisma = createPrismaChallenge({ submissionType: "QR_CODE" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.submissionType).toBe(SubmissionType.QR_CODE);
      });

      it("should default unknown submission type to IMAGE", () => {
        const prisma = createPrismaChallenge({ submissionType: "UNKNOWN" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.submissionType).toBe(SubmissionType.IMAGE);
      });
    });

    describe("scoring category mapping", () => {
      it("should map SPEED scoring category", () => {
        const prisma = createPrismaChallenge({ scoringCategory: "SPEED" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.scoringCategory).toBe(ScoringCategory.SPEED);
      });

      it("should map UNLIMITED scoring category", () => {
        const prisma = createPrismaChallenge({ scoringCategory: "UNLIMITED" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.scoringCategory).toBe(ScoringCategory.UNLIMITED);
      });

      it("should map JUDGED_STAFF scoring category", () => {
        const prisma = createPrismaChallenge({
          scoringCategory: "JUDGED_STAFF",
        });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.scoringCategory).toBe(ScoringCategory.JUDGED_STAFF);
      });

      it("should map PEER_VOTING scoring category", () => {
        const prisma = createPrismaChallenge({
          scoringCategory: "PEER_VOTING",
        });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.scoringCategory).toBe(ScoringCategory.PEER_VOTING);
      });

      it("should default unknown scoring category to UNLIMITED", () => {
        const prisma = createPrismaChallenge({ scoringCategory: "UNKNOWN" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.scoringCategory).toBe(ScoringCategory.UNLIMITED);
      });
    });

    describe("status mapping", () => {
      it("should map HIDDEN status", () => {
        const prisma = createPrismaChallenge({ status: "HIDDEN" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.status).toBe(ChallengeStatus.HIDDEN);
      });

      it("should map VISIBLE status", () => {
        const prisma = createPrismaChallenge({ status: "VISIBLE" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.status).toBe(ChallengeStatus.VISIBLE);
      });

      it("should map ACTIVE status", () => {
        const prisma = createPrismaChallenge({ status: "ACTIVE" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.status).toBe(ChallengeStatus.ACTIVE);
      });

      it("should map VOTING_PHASE status", () => {
        const prisma = createPrismaChallenge({ status: "VOTING_PHASE" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.status).toBe(ChallengeStatus.VOTING_PHASE);
      });

      it("should map COMPLETED status", () => {
        const prisma = createPrismaChallenge({ status: "COMPLETED" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.status).toBe(ChallengeStatus.COMPLETED);
      });

      it("should map CANCELLED status", () => {
        const prisma = createPrismaChallenge({ status: "CANCELLED" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.status).toBe(ChallengeStatus.CANCELLED);
      });

      it("should default unknown status to HIDDEN", () => {
        const prisma = createPrismaChallenge({ status: "UNKNOWN" });
        const domain = ChallengeMapper.toDomain(prisma);
        expect(domain.status).toBe(ChallengeStatus.HIDDEN);
      });
    });

    it("should map optional fields correctly", () => {
      const now = new Date();
      const prisma = createPrismaChallenge({
        description: null,
        image: null,
        startTime: now,
        endTime: new Date(now.getTime() + 86400000),
        dailyStartTime: "09:00",
        dailyEndTime: "17:00",
        targetLatitude: 52.2297,
        targetLongitude: 21.0122,
        expectedValue: "expected-result",
      });

      const domain = ChallengeMapper.toDomain(prisma);

      expect(domain.description).toBeNull();
      expect(domain.image).toBeNull();
      expect(domain.startTime).toEqual(now);
      expect(domain.endTime).toEqual(new Date(now.getTime() + 86400000));
      expect(domain.dailyStartTime).toBe("09:00");
      expect(domain.dailyEndTime).toBe("17:00");
      expect(domain.targetLatitude).toBe(52.2297);
      expect(domain.targetLongitude).toBe(21.0122);
      expect(domain.expectedValue).toBe("expected-result");
    });

    it("should map ranking points correctly", () => {
      const prisma = createPrismaChallenge({
        firstPlacePoints: 100,
        secondPlacePoints: 75,
        thirdPlacePoints: 50,
      });

      const domain = ChallengeMapper.toDomain(prisma);

      expect(domain.firstPlacePoints).toBe(100);
      expect(domain.secondPlacePoints).toBe(75);
      expect(domain.thirdPlacePoints).toBe(50);
    });

    it("should map boolean fields correctly", () => {
      const prisma = createPrismaChallenge({
        isRecurring: true,
        autoApprove: true,
      });

      const domain = ChallengeMapper.toDomain(prisma);

      expect(domain.isRecurring).toBe(true);
      expect(domain.autoApprove).toBe(true);
    });

    it("should throw error when mapping invalid database data", () => {
      const prisma = createPrismaChallenge({
        name: "", // Invalid: empty name
      });

      expect(() => ChallengeMapper.toDomain(prisma)).toThrow(
        "Failed to map Challenge from database",
      );
    });

    it("should throw error when basePoints exceeds maximum", () => {
      const prisma = createPrismaChallenge({
        basePoints: 10001, // Exceeds max
      });

      expect(() => ChallengeMapper.toDomain(prisma)).toThrow(
        "Failed to map Challenge from database",
      );
    });
  });

  describe("toPrismaCreate", () => {
    it("should map domain Challenge to Prisma create input", () => {
      const challenge = Challenge.create({
        id: "challenge-789",
        tripId: "trip-abc",
        name: "New Challenge",
        description: "Description here",
        image: "https://example.com/new.png",
        submissionType: SubmissionType.MULTI_IMAGE,
        scoringCategory: ScoringCategory.SPEED,
        isRecurring: true,
        dailyStartTime: "10:00",
        dailyEndTime: "18:00",
        basePoints: 50,
        firstPlacePoints: 200,
        secondPlacePoints: 150,
        thirdPlacePoints: 100,
        status: ChallengeStatus.ACTIVE,
        startTime: new Date("2024-02-01T10:00:00Z"),
        endTime: new Date("2024-02-10T18:00:00Z"),
        targetLatitude: 40.7128,
        targetLongitude: -74.006,
        expectedValue: "test-value",
        autoApprove: true,
      }).value;

      const prismaData = ChallengeMapper.toPrismaCreate(challenge);

      expect(prismaData.id).toBe("challenge-789");
      expect(prismaData.tripId).toBe("trip-abc");
      expect(prismaData.name).toBe("New Challenge");
      expect(prismaData.description).toBe("Description here");
      expect(prismaData.image).toBe("https://example.com/new.png");
      expect(prismaData.submissionType).toBe("MULTI_IMAGE");
      expect(prismaData.scoringCategory).toBe("SPEED");
      expect(prismaData.isRecurring).toBe(true);
      expect(prismaData.dailyStartTime).toBe("10:00");
      expect(prismaData.dailyEndTime).toBe("18:00");
      expect(prismaData.basePoints).toBe(50);
      expect(prismaData.firstPlacePoints).toBe(200);
      expect(prismaData.secondPlacePoints).toBe(150);
      expect(prismaData.thirdPlacePoints).toBe(100);
      expect(prismaData.status).toBe("ACTIVE");
      expect(prismaData.targetLatitude).toBe(40.7128);
      expect(prismaData.targetLongitude).toBe(-74.006);
      expect(prismaData.expectedValue).toBe("test-value");
      expect(prismaData.autoApprove).toBe(true);
    });

    it("should map all submission types to strings", () => {
      const types: { type: SubmissionType; expected: string }[] = [
        { type: SubmissionType.IMAGE, expected: "IMAGE" },
        { type: SubmissionType.MULTI_IMAGE, expected: "MULTI_IMAGE" },
        { type: SubmissionType.VIDEO, expected: "VIDEO" },
        { type: SubmissionType.TEXT, expected: "TEXT" },
        { type: SubmissionType.IMAGE_LOCATION, expected: "IMAGE_LOCATION" },
        { type: SubmissionType.LOCATION, expected: "LOCATION" },
        { type: SubmissionType.QR_CODE, expected: "QR_CODE" },
      ];

      for (const { type, expected } of types) {
        const challenge = Challenge.create({
          tripId: "trip-1",
          name: "Test",
          submissionType: type,
          scoringCategory: ScoringCategory.UNLIMITED,
        }).value;

        const prismaData = ChallengeMapper.toPrismaCreate(challenge);
        expect(prismaData.submissionType).toBe(expected);
      }
    });

    it("should map null values correctly", () => {
      const challenge = Challenge.create({
        tripId: "trip-1",
        name: "Test",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        description: null,
        image: null,
        dailyStartTime: null,
        dailyEndTime: null,
        firstPlacePoints: null,
        secondPlacePoints: null,
        thirdPlacePoints: null,
        startTime: null,
        endTime: null,
        votingStartTime: null,
        votingEndTime: null,
        targetLatitude: null,
        targetLongitude: null,
        expectedValue: null,
      }).value;

      const prismaData = ChallengeMapper.toPrismaCreate(challenge);

      expect(prismaData.description).toBeNull();
      expect(prismaData.image).toBeNull();
      expect(prismaData.dailyStartTime).toBeNull();
      expect(prismaData.dailyEndTime).toBeNull();
      expect(prismaData.firstPlacePoints).toBeNull();
      expect(prismaData.secondPlacePoints).toBeNull();
      expect(prismaData.thirdPlacePoints).toBeNull();
      expect(prismaData.startTime).toBeNull();
      expect(prismaData.endTime).toBeNull();
      expect(prismaData.targetLatitude).toBeNull();
      expect(prismaData.targetLongitude).toBeNull();
      expect(prismaData.expectedValue).toBeNull();
    });

    it("should preserve auto-generated ID", () => {
      const challenge = Challenge.create({
        tripId: "trip-1",
        name: "Test",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      }).value;

      const prismaData = ChallengeMapper.toPrismaCreate(challenge);
      expect(prismaData.id).toBeDefined();
      expect(typeof prismaData.id).toBe("string");
      expect(prismaData.id.length).toBeGreaterThan(0);
    });
  });

  describe("toPrismaUpdate", () => {
    it("should map domain Challenge to Prisma update input", () => {
      const challenge = Challenge.create({
        id: "challenge-xyz",
        tripId: "trip-def",
        name: "Updated Challenge",
        description: "Updated description",
        image: "https://example.com/updated.png",
        submissionType: SubmissionType.VIDEO,
        scoringCategory: ScoringCategory.JUDGED_STAFF,
        isRecurring: true,
        dailyStartTime: "08:00",
        dailyEndTime: "16:00",
        basePoints: 75,
        firstPlacePoints: 300,
        secondPlacePoints: 200,
        thirdPlacePoints: 100,
        status: ChallengeStatus.VISIBLE,
        autoApprove: true,
      }).value;

      const prismaData = ChallengeMapper.toPrismaUpdate(challenge);

      expect(prismaData.name).toBe("Updated Challenge");
      expect(prismaData.description).toBe("Updated description");
      expect(prismaData.image).toBe("https://example.com/updated.png");
      expect(prismaData.submissionType).toBe("VIDEO");
      expect(prismaData.scoringCategory).toBe("JUDGED_STAFF");
      expect(prismaData.isRecurring).toBe(true);
      expect(prismaData.dailyStartTime).toBe("08:00");
      expect(prismaData.dailyEndTime).toBe("16:00");
      expect(prismaData.basePoints).toBe(75);
      expect(prismaData.firstPlacePoints).toBe(300);
      expect(prismaData.secondPlacePoints).toBe(200);
      expect(prismaData.thirdPlacePoints).toBe(100);
      expect(prismaData.status).toBe("VISIBLE");
      expect(prismaData.autoApprove).toBe(true);
    });

    it("should not include id or tripId in update input", () => {
      const challenge = Challenge.create({
        id: "challenge-abc",
        tripId: "trip-xyz",
        name: "Test",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      }).value;

      const prismaData = ChallengeMapper.toPrismaUpdate(challenge);

      expect("id" in prismaData).toBe(false);
      expect("tripId" in prismaData).toBe(false);
    });

    it("should map all fields for update", () => {
      const challenge = Challenge.create({
        tripId: "trip-1",
        name: "Test",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        startTime: new Date("2024-01-01T10:00:00Z"),
        endTime: new Date("2024-01-31T20:00:00Z"),
        votingStartTime: new Date("2024-01-15T10:00:00Z"),
        votingEndTime: new Date("2024-01-20T20:00:00Z"),
        targetLatitude: 51.5074,
        targetLongitude: -0.1278,
        expectedValue: "expected",
      }).value;

      const prismaData = ChallengeMapper.toPrismaUpdate(challenge);

      expect(prismaData.startTime).toEqual(new Date("2024-01-01T10:00:00Z"));
      expect(prismaData.endTime).toEqual(new Date("2024-01-31T20:00:00Z"));
      expect(prismaData.votingStartTime).toEqual(
        new Date("2024-01-15T10:00:00Z"),
      );
      expect(prismaData.votingEndTime).toEqual(
        new Date("2024-01-20T20:00:00Z"),
      );
      expect(prismaData.targetLatitude).toBe(51.5074);
      expect(prismaData.targetLongitude).toBe(-0.1278);
      expect(prismaData.expectedValue).toBe("expected");
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve data through domain -> prisma -> domain conversion", () => {
      const originalChallenge = Challenge.create({
        id: "challenge-123",
        tripId: "trip-456",
        name: "Round Trip Challenge",
        description: "Testing round trip",
        image: "https://example.com/test.png",
        submissionType: SubmissionType.MULTI_IMAGE,
        scoringCategory: ScoringCategory.PEER_VOTING,
        isRecurring: true,
        dailyStartTime: "09:00",
        dailyEndTime: "17:00",
        basePoints: 25,
        firstPlacePoints: 100,
        secondPlacePoints: 75,
        thirdPlacePoints: 50,
        status: ChallengeStatus.ACTIVE,
        startTime: new Date("2024-02-01T09:00:00Z"),
        endTime: new Date("2024-02-28T17:00:00Z"),
        votingStartTime: new Date("2024-02-25T09:00:00Z"),
        votingEndTime: new Date("2024-02-27T17:00:00Z"),
        targetLatitude: 48.8566,
        targetLongitude: 2.3522,
        expectedValue: "round-trip-value",
        autoApprove: true,
        createdAt: new Date("2024-01-01T10:00:00Z"),
        updatedAt: new Date("2024-01-15T14:30:00Z"),
      }).value;

      // Convert to Prisma format
      const prismaData = ChallengeMapper.toPrismaCreate(originalChallenge);

      // Simulate database returning the data
      const prismaRecord = {
        ...prismaData,
        createdAt: originalChallenge.createdAt,
        updatedAt: originalChallenge.updatedAt,
      };

      // Convert back to domain
      const restoredChallenge = ChallengeMapper.toDomain(prismaRecord);

      expect(restoredChallenge.id).toBe(originalChallenge.id);
      expect(restoredChallenge.tripId).toBe(originalChallenge.tripId);
      expect(restoredChallenge.name).toBe(originalChallenge.name);
      expect(restoredChallenge.description).toBe(originalChallenge.description);
      expect(restoredChallenge.image).toBe(originalChallenge.image);
      expect(restoredChallenge.submissionType).toBe(
        originalChallenge.submissionType,
      );
      expect(restoredChallenge.scoringCategory).toBe(
        originalChallenge.scoringCategory,
      );
      expect(restoredChallenge.isRecurring).toBe(originalChallenge.isRecurring);
      expect(restoredChallenge.dailyStartTime).toBe(
        originalChallenge.dailyStartTime,
      );
      expect(restoredChallenge.dailyEndTime).toBe(
        originalChallenge.dailyEndTime,
      );
      expect(restoredChallenge.basePoints).toBe(originalChallenge.basePoints);
      expect(restoredChallenge.firstPlacePoints).toBe(
        originalChallenge.firstPlacePoints,
      );
      expect(restoredChallenge.secondPlacePoints).toBe(
        originalChallenge.secondPlacePoints,
      );
      expect(restoredChallenge.thirdPlacePoints).toBe(
        originalChallenge.thirdPlacePoints,
      );
      expect(restoredChallenge.status).toBe(originalChallenge.status);
      expect(restoredChallenge.startTime).toEqual(originalChallenge.startTime);
      expect(restoredChallenge.endTime).toEqual(originalChallenge.endTime);
      expect(restoredChallenge.votingStartTime).toEqual(
        originalChallenge.votingStartTime,
      );
      expect(restoredChallenge.votingEndTime).toEqual(
        originalChallenge.votingEndTime,
      );
      expect(restoredChallenge.targetLatitude).toBe(
        originalChallenge.targetLatitude,
      );
      expect(restoredChallenge.targetLongitude).toBe(
        originalChallenge.targetLongitude,
      );
      expect(restoredChallenge.expectedValue).toBe(
        originalChallenge.expectedValue,
      );
      expect(restoredChallenge.autoApprove).toBe(originalChallenge.autoApprove);
    });
  });
});
