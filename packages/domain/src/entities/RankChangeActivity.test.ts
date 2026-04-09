import { describe, it, expect } from "bun:test";
import { RankChangeActivity } from "./RankChangeActivity";

describe("[UNIT] RankChangeActivity Entity", () => {
  describe("RankChangeActivity.create", () => {
    it("should create with valid data", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 3,
        totalCoins: 500,
        coinsGained: 50,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.activityId).toBe("activity-123");
        expect(result.value.groupId).toBe("group-456");
        expect(result.value.newRank).toBe(3);
        expect(result.value.totalCoins).toBe(500);
        expect(result.value.coinsGained).toBe(50);
      }
    });

    it("should reject empty activityId", () => {
      const result = RankChangeActivity.create({
        activityId: "",
        groupId: "group-456",
        newRank: 3,
        totalCoins: 500,
        coinsGained: 50,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject rank less than 1", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 0,
        totalCoins: 500,
        coinsGained: 50,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject negative total coins", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 3,
        totalCoins: -100,
        coinsGained: 50,
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("RankChangeActivity rank status checks", () => {
    it("should identify improvement", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 2,
        totalCoins: 500,
        coinsGained: 50,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isImprovement()).toBe(true);
        expect(result.value.isDecline()).toBe(false);
        expect(result.value.isNoChange()).toBe(false);
      }
    });

    it("should identify decline", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 5,
        totalCoins: 400,
        coinsGained: -30,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isDecline()).toBe(true);
        expect(result.value.isImprovement()).toBe(false);
      }
    });

    it("should identify no change", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 3,
        totalCoins: 500,
        coinsGained: 0,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isNoChange()).toBe(true);
      }
    });
  });

  describe("RankChangeActivity rank position checks", () => {
    it("should identify first place", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 1,
        totalCoins: 1000,
        coinsGained: 100,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isFirstPlace()).toBe(true);
        expect(result.value.isTopThree()).toBe(true);
      }
    });

    it("should identify top three", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 3,
        totalCoins: 800,
        coinsGained: 50,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isTopThree()).toBe(true);
        expect(result.value.isFirstPlace()).toBe(false);
      }
    });

    it("should identify outside top three", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 4,
        totalCoins: 500,
        coinsGained: 10,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isTopThree()).toBe(false);
      }
    });
  });

  describe("RankChangeActivity.getRankWithSuffix", () => {
    it("should format rank with correct suffix", () => {
      const tests = [
        { rank: 1, suffix: "1st" },
        { rank: 2, suffix: "2nd" },
        { rank: 3, suffix: "3rd" },
        { rank: 4, suffix: "4th" },
        { rank: 11, suffix: "11th" },
        { rank: 21, suffix: "21st" },
        { rank: 22, suffix: "22nd" },
        { rank: 23, suffix: "23rd" },
      ];

      for (const test of tests) {
        const result = RankChangeActivity.create({
          activityId: "activity-123",
          groupId: "group-456",
          newRank: test.rank,
          totalCoins: 500,
          coinsGained: 50,
        });

        expect(result.kind).toBe("ok");
        if (result.kind === "ok") {
          expect(result.value.getRankWithSuffix()).toBe(`${test.suffix}`);
        }
      }
    });
  });

  describe("RankChangeActivity.getRankChangeDisplay", () => {
    it("should show positive change", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 2,
        totalCoins: 500,
        coinsGained: 50,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getRankChangeDisplay()).toBe("+50 coins");
      }
    });

    it("should show negative change", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 5,
        totalCoins: 400,
        coinsGained: -30,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getRankChangeDisplay()).toBe("-30 coins");
      }
    });

    it("should show no change", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 3,
        totalCoins: 500,
        coinsGained: 0,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getRankChangeDisplay()).toBe("No change");
      }
    });
  });

  describe("RankChangeActivity.getSummary", () => {
    it("should return summary text", () => {
      const result = RankChangeActivity.create({
        activityId: "activity-123",
        groupId: "group-456",
        newRank: 2,
        totalCoins: 500,
        coinsGained: 50,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const summary = result.value.getSummary();
        expect(summary).toContain("2nd place");
        expect(summary).toContain("+50 coins");
      }
    });
  });
});
