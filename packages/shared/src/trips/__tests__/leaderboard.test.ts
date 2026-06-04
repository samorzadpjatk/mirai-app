import { describe, expect, it } from "vitest";
import { calculateLeaderboardInfo, findUserGroup } from "../leaderboard";

describe("calculateLeaderboardInfo", () => {
  const userGroup = { id: "g1", coins: 100, name: "Team A" };

  it("returns null when no user group", () => {
    expect(calculateLeaderboardInfo(null, [])).toBeNull();
  });

  it("returns null when no groups", () => {
    expect(calculateLeaderboardInfo(userGroup, undefined)).toBeNull();
  });

  it("calculates first place correctly", () => {
    const result = calculateLeaderboardInfo(userGroup, [
      { id: "g1", coins: 100, name: "Team A" },
      { id: "g2", coins: 80, name: "Team B" },
    ]);

    expect(result).toEqual({
      position: 1,
      pointsDifference: 20,
      totalGroups: 2,
      targetPosition: 2,
      targetGroupName: "Team B",
    });
  });

  it("calculates second place correctly", () => {
    const result = calculateLeaderboardInfo(userGroup, [
      { id: "g2", coins: 150, name: "Team B" },
      { id: "g1", coins: 100, name: "Team A" },
      { id: "g3", coins: 50, name: "Team C" },
    ]);

    expect(result).toEqual({
      position: 2,
      pointsDifference: 50,
      totalGroups: 3,
      targetPosition: 1,
      targetGroupName: "Team B",
    });
  });

  it("handles last place", () => {
    const result = calculateLeaderboardInfo(userGroup, [
      { id: "g2", coins: 150 },
      { id: "g3", coins: 120 },
      { id: "g1", coins: 100 },
    ]);

    expect(result?.position).toBe(3);
    expect(result?.pointsDifference).toBe(20);
    expect(result?.targetPosition).toBe(2);
  });

  it("handles single group", () => {
    const result = calculateLeaderboardInfo(userGroup, [{ id: "g1", coins: 100 }]);

    expect(result?.position).toBe(1);
    expect(result?.pointsDifference).toBe(0);
    expect(result?.targetPosition).toBeNull();
    expect(result?.targetGroupName).toBeNull();
  });

  it("handles null coins", () => {
    const result = calculateLeaderboardInfo({ id: "g1", coins: null }, [
      { id: "g1", coins: null },
      { id: "g2", coins: 10 },
    ]);

    expect(result?.position).toBe(2);
    expect(result?.pointsDifference).toBe(10);
  });
});

describe("findUserGroup", () => {
  it("finds participant by user id", () => {
    const participants = [
      { user: { id: "u1" }, group: { id: "g1" } },
      { user: { id: "u2" }, group: { id: "g2" } },
    ];

    const result = findUserGroup("u2", participants);
    expect(result).toEqual({ user: { id: "u2" }, group: { id: "g2" } });
  });

  it("returns null when not found", () => {
    const result = findUserGroup("u3", [{ user: { id: "u1" } }]);
    expect(result).toBeNull();
  });

  it("returns null for undefined participants", () => {
    expect(findUserGroup("u1", undefined)).toBeNull();
  });
});
