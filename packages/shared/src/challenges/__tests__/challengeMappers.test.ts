import { describe, expect, it } from "vitest";
import { countCompletedChallenges, mapChallengeToListItem } from "../challengeMappers";

describe("mapChallengeToListItem", () => {
  it("maps basic challenge", () => {
    const result = mapChallengeToListItem({ id: "1", name: "Test" }, "#000");
    expect(result).toMatchObject({
      id: "1",
      title: "Test",
      points: 0,
      status: "locked",
      submissionType: "IMAGE",
      participantGroupsCount: 0,
    });
  });

  it("maps solved challenge", () => {
    const result = mapChallengeToListItem(
      {
        id: "1",
        name: "Test",
        status: "ACTIVE",
        myGroupSubmissionStatus: "APPROVED",
        basePoints: 10,
      },
      "#000",
    );
    expect(result.status).toBe("solved");
    expect(result.points).toBe(10);
  });

  it("maps pending challenge", () => {
    const result = mapChallengeToListItem(
      {
        id: "1",
        name: "Test",
        status: "ACTIVE",
        myGroupSubmissionStatus: "PENDING",
      },
      "#000",
    );
    expect(result.status).toBe("submitted");
  });

  it("maps rejected challenge", () => {
    const result = mapChallengeToListItem(
      {
        id: "1",
        name: "Test",
        status: "ACTIVE",
        myGroupSubmissionStatus: "REJECTED",
      },
      "#000",
    );
    expect(result.status).toBe("rejected");
  });

  it("maps visible challenge", () => {
    const result = mapChallengeToListItem(
      { id: "1", name: "Test", status: "VISIBLE", basePoints: 5 },
      "#000",
    );
    expect(result.status).toBe("visible");
    expect(result.points).toBe(5);
  });

  it("maps completed challenge", () => {
    const result = mapChallengeToListItem({ id: "1", name: "Test", status: "COMPLETED" }, "#000");
    expect(result.status).toBe("completed");
  });

  it("maps cancelled to locked", () => {
    const result = mapChallengeToListItem({ id: "1", name: "Test", status: "CANCELLED" }, "#000");
    expect(result.status).toBe("locked");
  });

  it("maps voting phase to locked", () => {
    const result = mapChallengeToListItem(
      { id: "1", name: "Test", status: "VOTING_PHASE" },
      "#000",
    );
    expect(result.status).toBe("locked");
  });

  it("calculates UNLIMITED points correctly", () => {
    const result = mapChallengeToListItem(
      {
        id: "1",
        name: "Test",
        status: "VISIBLE",
        scoringCategory: "UNLIMITED",
        basePoints: 50,
        firstPlacePoints: 100,
      },
      "#000",
    );
    expect(result.points).toBe(50);
  });

  it("uses firstPlacePoints when not unlimited", () => {
    const result = mapChallengeToListItem(
      {
        id: "1",
        name: "Test",
        status: "VISIBLE",
        scoringCategory: "SPEED",
        basePoints: 10,
        firstPlacePoints: 25,
      },
      "#000",
    );
    expect(result.points).toBe(25);
  });
});

describe("countCompletedChallenges", () => {
  it("counts solved and submitted", () => {
    const challenges = [
      { status: "solved" },
      { status: "submitted" },
      { status: "locked" },
      { status: "to_solve" },
    ] as Parameters<typeof countCompletedChallenges>[0];

    expect(countCompletedChallenges(challenges)).toBe(2);
  });

  it("returns 0 for empty array", () => {
    expect(countCompletedChallenges([])).toBe(0);
  });
});
