import { describe, it, expect } from "vitest";
import {
  mapApprovedSubmissions,
  buildParticipantCountMap,
  toGroupDetail,
  calculatePagination,
  calculateNextOrganizer,
  calculateCoinsAfterTransaction,
  buildLeaveResult,
} from "../transforms";

describe("groups/transforms", () => {
  describe("mapApprovedSubmissions", () => {
    it("maps submissions with images and handles dates", () => {
      const submissions = [
        {
          id: "sub1",
          imageIds: ["img-path-1"],
          challenge: { id: "ch1", name: "Challenge 1" },
          reviewedAt: new Date("2024-01-02"),
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "sub2",
          imageIds: ["img-path-2"],
          challenge: { id: "ch2", name: "Challenge 2" },
          reviewedAt: null,
          createdAt: new Date("2024-01-03"),
        },
        {
          id: "sub3",
          imageIds: [],
          challenge: { id: "ch3", name: "Challenge 3" },
          reviewedAt: new Date("2024-01-04"),
          createdAt: new Date("2024-01-03"),
        },
      ];

      const result = mapApprovedSubmissions(submissions);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        {
          submissionId: "sub1",
          challengeId: "ch1",
          challengeTitle: "Challenge 1",
          imageStoragePath: "img-path-1",
          approvedAt: new Date("2024-01-02"),
        },
        {
          submissionId: "sub2",
          challengeId: "ch2",
          challengeTitle: "Challenge 2",
          imageStoragePath: "img-path-2",
          approvedAt: new Date("2024-01-03"),
        },
      ]);
    });
  });

  describe("buildParticipantCountMap", () => {
    it("creates a map from array of count objects", () => {
      const countRows = [
        { groupId: "g1", count: 5 },
        { groupId: "g2", count: 0 },
      ];
      const result = buildParticipantCountMap(countRows);
      expect(result.get("g1")).toBe(5);
      expect(result.get("g2")).toBe(0);
      expect(result.get("g3")).toBeUndefined();
    });
  });

  describe("toGroupDetail", () => {
    it("assembles group detail correctly", () => {
      const emailMap = new Map([
        ["auth1", "org@example.com"],
        ["auth2", "user@example.com"],
      ]);
      const group = {
        id: "g1",
        name: "Test Group",
        image: "storage-path.jpg",
        organizer: { id: "u1", authUserId: "auth1", name: "Org" },
        participants: [
          { joinedAt: new Date("2024-01-01"), user: { id: "u2", authUserId: "auth2", name: "User" } },
        ],
      };
      const imageUrl = "https://example.com/storage-path.jpg";
      const approvedSubmissions = [
        {
          submissionId: "s1",
          challengeId: "c1",
          challengeTitle: "C1",
          imageStoragePath: "img1",
          approvedAt: new Date("2024-01-02"),
        },
      ];

      const result = toGroupDetail(group, emailMap, imageUrl, 42, approvedSubmissions);

      expect(result).toEqual({
        id: "g1",
        name: "Test Group",
        image: "https://example.com/storage-path.jpg",
        _count: { participants: 42 },
        organizer: { id: "u1", name: "Org", email: "org@example.com" },
        participants: [
          { joinedAt: new Date("2024-01-01"), user: { id: "u2", name: "User", email: "user@example.com" } },
        ],
        approvedSubmissions,
      });
    });

    it("handles missing organizer gracefully", () => {
      const emailMap = new Map();
      const group = {
        id: "g1",
        name: "Test Group",
        image: null,
        organizer: null,
        participants: [],
      };

      const result = toGroupDetail(group, emailMap, null, 0, []);

      expect(result.organizer).toBeNull();
      expect(result._count.participants).toBe(0);
    });
  });

  describe("calculatePagination", () => {
    it("returns correct pagination metadata", () => {
      expect(calculatePagination(10, 0, 25)).toEqual({ total: 25, limit: 10, offset: 0, hasMore: true });
      expect(calculatePagination(10, 20, 25)).toEqual({ total: 25, limit: 10, offset: 20, hasMore: false });
      expect(calculatePagination(10, 30, 25)).toEqual({ total: 25, limit: 10, offset: 30, hasMore: false });
    });
  });

  describe("calculateNextOrganizer", () => {
    it("returns first participant userId", () => {
      const participants = [{ userId: "u1" }, { userId: "u2" }];
      expect(calculateNextOrganizer(participants)).toBe("u1");
    });

    it("returns null for empty array", () => {
      expect(calculateNextOrganizer([])).toBeNull();
    });
  });

  describe("calculateCoinsAfterTransaction", () => {
    it("adds amount to current coins", () => {
      expect(calculateCoinsAfterTransaction(100, 50)).toBe(150);
      expect(calculateCoinsAfterTransaction(100, -20)).toBe(80);
      expect(calculateCoinsAfterTransaction(null, 50)).toBe(50);
      expect(calculateCoinsAfterTransaction(undefined, 50)).toBe(50);
    });
  });

  describe("buildLeaveResult", () => {
    it("returns correctly based on input", () => {
      expect(buildLeaveResult(true, "new-org", false)).toEqual({
        left: true,
        reassignedOrganizerId: "new-org",
        groupDeleted: false,
      });
    });
  });
});
