import { describe, it, expect, vi, afterEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { hasAllRequiredPositions, ensureChallengeVoting } from "../utils";
import type { ChallengeForVoting } from "../types";

describe("challengeVote/utils pure functions", () => {
  describe("hasAllRequiredPositions", () => {
    it("should return false when requiredPositions is 0", () => {
      expect(hasAllRequiredPositions(new Set([1]), 0)).toBe(false);
    });

    it("should return false when requiredPositions is negative", () => {
      expect(hasAllRequiredPositions(new Set([1, 2, 3]), -1)).toBe(false);
    });

    it("should return true for exact match of 1 position", () => {
      expect(hasAllRequiredPositions(new Set([1]), 1)).toBe(true);
    });

    it("should return true for exact match of 3 positions", () => {
      expect(hasAllRequiredPositions(new Set([1, 2, 3]), 3)).toBe(true);
    });

    it("should return false when position 1 is missing", () => {
      expect(hasAllRequiredPositions(new Set([2, 3]), 3)).toBe(false);
    });

    it("should return false when position 2 is missing", () => {
      expect(hasAllRequiredPositions(new Set([1, 3]), 3)).toBe(false);
    });

    it("should return false when position 3 is missing", () => {
      expect(hasAllRequiredPositions(new Set([1, 2]), 3)).toBe(false);
    });

    it("should return true when positions are a superset", () => {
      expect(hasAllRequiredPositions(new Set([1, 2, 3, 4]), 3)).toBe(true);
    });

    it("should return false for empty set with requiredPositions > 0", () => {
      expect(hasAllRequiredPositions(new Set(), 1)).toBe(false);
    });

    it("should return true for empty set with requiredPositions <= 0", () => {
      expect(hasAllRequiredPositions(new Set(), 0)).toBe(false);
    });
  });

  describe("ensureChallengeVoting", () => {
    const now = new Date("2024-06-15T12:00:00Z");

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const makeChallenge = (overrides: Partial<ChallengeForVoting> = {}): ChallengeForVoting => ({
      id: "challenge-1",
      tripId: "trip-1",
      status: "ACTIVE",
      scoringCategory: "JUDGED_STAFF",
      endTime: new Date("2024-06-15T10:00:00Z"),
      ...overrides,
    });

    it("should throw BAD_REQUEST for PEER_VOTING not in VOTING_PHASE", () => {
      const challenge = makeChallenge({
        scoringCategory: "PEER_VOTING",
        status: "ACTIVE",
      });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(ORPCError);
      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(
        "Glosowanie nie jest aktywne",
      );
    });

    it("should not throw for PEER_VOTING in VOTING_PHASE", () => {
      const challenge = makeChallenge({
        scoringCategory: "PEER_VOTING",
        status: "VOTING_PHASE",
      });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).not.toThrow();
    });

    it("should throw BAD_REQUEST for non-JUDGED_STAFF and non-PEER_VOTING challenges", () => {
      const challenge = makeChallenge({ scoringCategory: "SPEED" });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(ORPCError);
      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(
        "Voting is available only for peer voting and judged staff challenges",
      );
    });

    it("should throw FORBIDDEN for non-ADMIN actor on JUDGED_STAFF challenge", () => {
      const challenge = makeChallenge({ scoringCategory: "JUDGED_STAFF" });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "USER" })).toThrow(ORPCError);
      expect(() => ensureChallengeVoting({ challenge, actorRole: "USER" })).toThrow(
        "Only admins can vote in judged staff challenges",
      );
    });

    it("should throw BAD_REQUEST for CANCELLED status", () => {
      const challenge = makeChallenge({ status: "CANCELLED" });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(ORPCError);
      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(
        "Glosowanie zostalo zakonczone",
      );
    });

    it("should throw BAD_REQUEST for COMPLETED status", () => {
      const challenge = makeChallenge({ status: "COMPLETED" });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(ORPCError);
      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(
        "Glosowanie zostalo zakonczone",
      );
    });

    it("should throw BAD_REQUEST for HIDDEN status", () => {
      const challenge = makeChallenge({ status: "HIDDEN" });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(ORPCError);
      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(
        "Challenge nie jest gotowy do glosowania",
      );
    });

    it("should throw BAD_REQUEST when endTime is null", () => {
      const challenge = makeChallenge({ endTime: null });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(ORPCError);
      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(
        "Staff voting requires submission end time",
      );
    });

    it("should throw BAD_REQUEST when endTime is in the future", () => {
      const challenge = makeChallenge({
        endTime: new Date("2024-06-15T14:00:00Z"),
      });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(ORPCError);
      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).toThrow(
        "Staff voting starts after submission phase ends",
      );
    });

    it("should not throw for JUDGED_STAFF with ACTIVE status and past endTime", () => {
      const challenge = makeChallenge({
        status: "ACTIVE",
        endTime: new Date("2024-06-15T10:00:00Z"),
      });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).not.toThrow();
    });

    it("should not throw for JUDGED_STAFF with VOTING_PHASE status and past endTime", () => {
      const challenge = makeChallenge({
        status: "VOTING_PHASE",
        endTime: new Date("2024-06-15T10:00:00Z"),
      });

      expect(() => ensureChallengeVoting({ challenge, actorRole: "ADMIN" })).not.toThrow();
    });

    it("should extract error code from thrown ORPCError", () => {
      const challenge = makeChallenge({ status: "HIDDEN" });

      try {
        ensureChallengeVoting({ challenge, actorRole: "ADMIN" });
        expect.fail("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        expect((error as ORPCError).code).toBe("BAD_REQUEST");
      }
    });
  });
});
