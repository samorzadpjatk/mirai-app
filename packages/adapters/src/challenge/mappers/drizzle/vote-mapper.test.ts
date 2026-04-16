import { describe, it, expect } from "bun:test";
import { ChallengeVoteDrizzleMapper } from "./vote-mapper";
import { VotePosition } from "@mirai-app/domain";
import { challengeVotes } from "@mirai-app/frameworks/drizzle/schema";

describe("[UNIT] ChallengeVoteDrizzleMapper", () => {
  const mapper = ChallengeVoteDrizzleMapper.instance;

  // Factory for creating mock Drizzle ChallengeVote records
  const createMockChallengeVoteSelect = (
    overrides: Record<string, unknown> = {},
  ) => ({
    id: "vote-123",
    challengeId: "challenge-456",
    submissionId: "submission-789",
    voterId: "user-001",
    tripParticipantId: "user-001",
    position: "UPVOTE" as const,
    weight: 1.5,
    isStaffVote: false,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to ChallengeVoteDTO", () => {
      const record = createMockChallengeVoteSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("vote-123");
      expect(dto.challengeId).toBe("challenge-456");
      expect(dto.submissionId).toBe("submission-789");
      expect(dto.voterId).toBe("user-001");
      expect(dto.votePosition).toBe(1);
      expect(dto.votePoints).toBe(3);
      expect(dto.normalizedWeight).toBe(1.5);
      expect(dto.votedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("maps UPVOTE to votePosition 1", () => {
      const record = createMockChallengeVoteSelect({ position: "UPVOTE" });

      const dto = mapper.toDTO(record);

      expect(dto.votePosition).toBe(1);
      expect(dto.votePoints).toBe(3);
    });

    it("maps DOWNVOTE to votePosition -1", () => {
      const record = createMockChallengeVoteSelect({
        position: "DOWNVOTE" as const,
      });

      const dto = mapper.toDTO(record);

      expect(dto.votePosition).toBe(-1);
      expect(dto.votePoints).toBe(0);
    });

    it("maps NEUTRAL to votePosition 0", () => {
      const record = createMockChallengeVoteSelect({
        position: "NEUTRAL" as const,
      });

      const dto = mapper.toDTO(record);

      expect(dto.votePosition).toBe(0);
      expect(dto.votePoints).toBe(0);
    });

    it("defaults unknown position to 0", () => {
      const record = createMockChallengeVoteSelect({ position: "UNKNOWN" });

      const dto = mapper.toDTO(record);

      expect(dto.votePosition).toBe(0);
    });

    it("delegates to toDTO for toDomain method", () => {
      const record = createMockChallengeVoteSelect();

      const domainResult = mapper.toDomain(record);
      const dtoResult = mapper.toDTO(record);

      expect(domainResult).toEqual(dtoResult);
    });
  });

  describe("toEntity", () => {
    it("converts Drizzle record to domain ChallengeVote entity", () => {
      const record = createMockChallengeVoteSelect();

      const entity = mapper.toEntity(record);

      expect(entity.challengeId).toBe("challenge-456");
      expect(entity.submissionId).toBe("submission-789");
      expect(entity.voterId).toBe("user-001");
      // position is a VotePosition value object with value property
      expect(entity.position).toBeInstanceOf(VotePosition);
      expect(entity.position.value).toBe(1);
      expect(entity.votedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("creates entity with position 1 for UPVOTE", () => {
      const record = createMockChallengeVoteSelect({ position: "UPVOTE" });

      const entity = mapper.toEntity(record);

      expect(entity.position.value).toBe(1);
    });

    it("throws error for invalid position", () => {
      // Position 0 is not valid for VotePosition (must be 1-3)
      const record = createMockChallengeVoteSelect({
        position: "NEUTRAL" as const, // Maps to position 0, which is invalid
      });

      expect(() => mapper.toEntity(record)).toThrow();
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts ChallengeVoteDTO to Drizzle insert input", () => {
      const record = createMockChallengeVoteSelect();
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("vote-123");
      expect(insert.challengeId).toBe("challenge-456");
      expect(insert.submissionId).toBe("submission-789");
      expect(insert.voterId).toBe("user-001");
      expect(insert.tripParticipantId).toBe("user-001");
      expect(insert.position).toBe("UPVOTE");
      expect(insert.weight).toBe(1.5);
      expect(insert.isStaffVote).toBe(false);
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("maps votePosition 1 to UPVOTE", () => {
      const record = createMockChallengeVoteSelect();
      const dto = mapper.toDTO(record);
      dto.votePosition = 1;

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.position).toBe("UPVOTE");
    });

    it("maps non-1 votePosition to NEUTRAL", () => {
      const record = createMockChallengeVoteSelect();
      const dto = mapper.toDTO(record);
      dto.votePosition = -1;

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.position).toBe("NEUTRAL");
    });

    it("maps votePosition 0 to NEUTRAL", () => {
      const record = createMockChallengeVoteSelect();
      const dto = mapper.toDTO(record);
      dto.votePosition = 0;

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.position).toBe("NEUTRAL");
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts ChallengeVoteDTO to Drizzle update input", () => {
      const record = createMockChallengeVoteSelect();
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id or createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("createdAt");

      // Should include updatable fields
      expect(update.position).toBe("UPVOTE");
      expect(update.weight).toBe(1.5);
      expect(update.isStaffVote).toBe(false);
    });

    it("updates updatedAt to current time", () => {
      const record = createMockChallengeVoteSelect();
      const dto = mapper.toDTO(record);
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

    it("maps votePosition to position enum correctly in update", () => {
      const record = createMockChallengeVoteSelect();
      const dto = mapper.toDTO(record);
      dto.votePosition = 1;

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.position).toBe("UPVOTE");
    });
  });

  describe("vote points calculation", () => {
    it("calculates 3 points for position 1", () => {
      const record = createMockChallengeVoteSelect({ position: "UPVOTE" });

      const dto = mapper.toDTO(record);

      expect(dto.votePoints).toBe(3);
    });

    it("calculates 0 points for position 0 or -1", () => {
      const neutralRecord = createMockChallengeVoteSelect({
        position: "NEUTRAL" as const,
      });
      const downvoteRecord = createMockChallengeVoteSelect({
        position: "DOWNVOTE" as const,
      });

      expect(mapper.toDTO(neutralRecord).votePoints).toBe(0);
      expect(mapper.toDTO(downvoteRecord).votePoints).toBe(0);
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = ChallengeVoteDrizzleMapper.instance;
      const instance2 = ChallengeVoteDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
