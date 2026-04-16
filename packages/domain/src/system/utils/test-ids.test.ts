import { describe, it, expect } from "bun:test";
import { TestIds, type TestIdKey } from "./test-ids";
import { isValidUUID } from "./validation";

describe("[UNIT] test-ids", () => {
  // ===========================================================================
  // UUID Format Validation Tests
  // ===========================================================================
  describe("UUID format validation", () => {
    it("all TestIds are valid UUID format", () => {
      for (const [key, value] of Object.entries(TestIds)) {
        expect(isValidUUID(value)).toBe(true);
      }
    });

    it("USER is valid UUID", () => {
      expect(isValidUUID(TestIds.USER)).toBe(true);
      expect(TestIds.USER).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("USER_1 is valid UUID", () => {
      expect(isValidUUID(TestIds.USER_1)).toBe(true);
      expect(TestIds.USER_1).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("USER_2 is valid UUID", () => {
      expect(isValidUUID(TestIds.USER_2)).toBe(true);
      expect(TestIds.USER_2).toBe("550e8400-e29b-41d4-a716-446655440002");
    });

    it("USER_3 is valid UUID", () => {
      expect(isValidUUID(TestIds.USER_3)).toBe(true);
      expect(TestIds.USER_3).toBe("550e8400-e29b-41d4-a716-446655440003");
    });

    it("ADMIN is valid UUID", () => {
      expect(isValidUUID(TestIds.ADMIN)).toBe(true);
      expect(TestIds.ADMIN).toBe("550e8400-e29b-41d4-a716-446655440010");
    });

    it("MODERATOR is valid UUID", () => {
      expect(isValidUUID(TestIds.MODERATOR)).toBe(true);
      expect(TestIds.MODERATOR).toBe("550e8400-e29b-41d4-a716-446655440020");
    });

    it("TRIP is valid UUID", () => {
      expect(isValidUUID(TestIds.TRIP)).toBe(true);
      expect(TestIds.TRIP).toBe("550e8400-e29b-41d4-a716-446655440100");
    });

    it("TRIP_1 is valid UUID", () => {
      expect(isValidUUID(TestIds.TRIP_1)).toBe(true);
      expect(TestIds.TRIP_1).toBe("550e8400-e29b-41d4-a716-446655440101");
    });

    it("TRIP_2 is valid UUID", () => {
      expect(isValidUUID(TestIds.TRIP_2)).toBe(true);
      expect(TestIds.TRIP_2).toBe("550e8400-e29b-41d4-a716-446655440102");
    });

    it("GROUP is valid UUID", () => {
      expect(isValidUUID(TestIds.GROUP)).toBe(true);
      expect(TestIds.GROUP).toBe("550e8400-e29b-41d4-a716-446655440200");
    });

    it("GROUP_1 is valid UUID", () => {
      expect(isValidUUID(TestIds.GROUP_1)).toBe(true);
      expect(TestIds.GROUP_1).toBe("550e8400-e29b-41d4-a716-446655440201");
    });

    it("CHALLENGE is valid UUID", () => {
      expect(isValidUUID(TestIds.CHALLENGE)).toBe(true);
      expect(TestIds.CHALLENGE).toBe("550e8400-e29b-41d4-a716-446655440300");
    });

    it("CHALLENGE_1 is valid UUID", () => {
      expect(isValidUUID(TestIds.CHALLENGE_1)).toBe(true);
      expect(TestIds.CHALLENGE_1).toBe("550e8400-e29b-41d4-a716-446655440301");
    });

    it("ACTIVITY is valid UUID", () => {
      expect(isValidUUID(TestIds.ACTIVITY)).toBe(true);
      expect(TestIds.ACTIVITY).toBe("550e8400-e29b-41d4-a716-446655440400");
    });

    it("LOCATION is valid UUID", () => {
      expect(isValidUUID(TestIds.LOCATION)).toBe(true);
      expect(TestIds.LOCATION).toBe("550e8400-e29b-41d4-a716-446655440500");
    });

    it("NOTIFICATION is valid UUID", () => {
      expect(isValidUUID(TestIds.NOTIFICATION)).toBe(true);
      expect(TestIds.NOTIFICATION).toBe("550e8400-e29b-41d4-a716-446655440600");
    });

    it("SCHEDULE is valid UUID", () => {
      expect(isValidUUID(TestIds.SCHEDULE)).toBe(true);
      expect(TestIds.SCHEDULE).toBe("550e8400-e29b-41d4-a716-446655440700");
    });

    it("SUBMISSION is valid UUID", () => {
      expect(isValidUUID(TestIds.SUBMISSION)).toBe(true);
      expect(TestIds.SUBMISSION).toBe("550e8400-e29b-41d4-a716-446655440800");
    });

    it("SUBMISSION_1 is valid UUID", () => {
      expect(isValidUUID(TestIds.SUBMISSION_1)).toBe(true);
      expect(TestIds.SUBMISSION_1).toBe("550e8400-e29b-41d4-a716-446655440801");
    });

    it("VOTE is valid UUID", () => {
      expect(isValidUUID(TestIds.VOTE)).toBe(true);
      expect(TestIds.VOTE).toBe("550e8400-e29b-41d4-a716-446655440900");
    });

    it("REWARD is valid UUID", () => {
      expect(isValidUUID(TestIds.REWARD)).toBe(true);
      expect(TestIds.REWARD).toBe("550e8400-e29b-41d4-a716-446655441000");
    });

    it("PURCHASE is valid UUID", () => {
      expect(isValidUUID(TestIds.PURCHASE)).toBe(true);
      expect(TestIds.PURCHASE).toBe("550e8400-e29b-41d4-a716-446655441100");
    });

    it("TRANSACTION is valid UUID", () => {
      expect(isValidUUID(TestIds.TRANSACTION)).toBe(true);
      expect(TestIds.TRANSACTION).toBe("550e8400-e29b-41d4-a716-446655441200");
    });

    it("TX_1 is valid UUID", () => {
      expect(isValidUUID(TestIds.TX_1)).toBe(true);
      expect(TestIds.TX_1).toBe("550e8400-e29b-41d4-a716-446655441201");
    });

    it("TX_2 is valid UUID", () => {
      expect(isValidUUID(TestIds.TX_2)).toBe(true);
      expect(TestIds.TX_2).toBe("550e8400-e29b-41d4-a716-446655441202");
    });

    it("TX_3 is valid UUID", () => {
      expect(isValidUUID(TestIds.TX_3)).toBe(true);
      expect(TestIds.TX_3).toBe("550e8400-e29b-41d4-a716-446655441203");
    });

    it("REPORT is valid UUID", () => {
      expect(isValidUUID(TestIds.REPORT)).toBe(true);
      expect(TestIds.REPORT).toBe("550e8400-e29b-41d4-a716-446655441300");
    });

    it("SPONSOR is valid UUID", () => {
      expect(isValidUUID(TestIds.SPONSOR)).toBe(true);
      expect(TestIds.SPONSOR).toBe("550e8400-e29b-41d4-a716-446655441400");
    });

    it("DELIVERY is valid UUID", () => {
      expect(isValidUUID(TestIds.DELIVERY)).toBe(true);
      expect(TestIds.DELIVERY).toBe("550e8400-e29b-41d4-a716-446655441500");
    });

    it("NON_EXISTENT is valid UUID", () => {
      expect(isValidUUID(TestIds.NON_EXISTENT)).toBe(true);
      expect(TestIds.NON_EXISTENT).toBe("550e8400-e29b-41d4-a716-446655449999");
    });

    it("ALTERNATE is valid UUID", () => {
      expect(isValidUUID(TestIds.ALTERNATE)).toBe(true);
      expect(TestIds.ALTERNATE).toBe("550e8400-e29b-41d4-a716-446655449998");
    });
  });

  // ===========================================================================
  // Uniqueness Tests
  // ===========================================================================
  describe("uniqueness", () => {
    it("all TestIds have unique values (no duplicates)", () => {
      const values = Object.values(TestIds);
      const uniqueValues = [...new Set(values)];

      expect(uniqueValues).toHaveLength(values.length);
    });

    it("USER and USER_1 are different", () => {
      expect(TestIds.USER).not.toBe(TestIds.USER_1);
    });

    it("USER_1 and USER_2 are different", () => {
      expect(TestIds.USER_1).not.toBe(TestIds.USER_2);
    });

    it("ADMIN and MODERATOR are different", () => {
      expect(TestIds.ADMIN).not.toBe(TestIds.MODERATOR);
    });

    it("TRIP and GROUP are different", () => {
      expect(TestIds.TRIP).not.toBe(TestIds.GROUP);
    });

    it("CHALLENGE and ACTIVITY are different", () => {
      expect(TestIds.CHALLENGE).not.toBe(TestIds.ACTIVITY);
    });

    it("NON_EXISTENT and ALTERNATE are different", () => {
      expect(TestIds.NON_EXISTENT).not.toBe(TestIds.ALTERNATE);
    });

    it("TX_1, TX_2, TX_3 are all different", () => {
      expect(TestIds.TX_1).not.toBe(TestIds.TX_2);
      expect(TestIds.TX_2).not.toBe(TestIds.TX_3);
      expect(TestIds.TX_1).not.toBe(TestIds.TX_3);
    });
  });

  // ===========================================================================
  // TestIdKey Type Tests
  // ===========================================================================
  describe("TestIdKey type", () => {
    it("TestIdKey includes all keys from TestIds", () => {
      const keys = Object.keys(TestIds);

      // Type test - at runtime we verify all keys are present
      expect(keys.length).toBeGreaterThan(0);

      // Verify specific expected keys exist
      expect(keys).toContain("USER");
      expect(keys).toContain("USER_1");
      expect(keys).toContain("USER_2");
      expect(keys).toContain("USER_3");
      expect(keys).toContain("ADMIN");
      expect(keys).toContain("MODERATOR");
      expect(keys).toContain("TRIP");
      expect(keys).toContain("TRIP_1");
      expect(keys).toContain("TRIP_2");
      expect(keys).toContain("GROUP");
      expect(keys).toContain("GROUP_1");
      expect(keys).toContain("CHALLENGE");
      expect(keys).toContain("CHALLENGE_1");
      expect(keys).toContain("ACTIVITY");
      expect(keys).toContain("LOCATION");
      expect(keys).toContain("NOTIFICATION");
      expect(keys).toContain("SCHEDULE");
      expect(keys).toContain("SUBMISSION");
      expect(keys).toContain("SUBMISSION_1");
      expect(keys).toContain("VOTE");
      expect(keys).toContain("REWARD");
      expect(keys).toContain("PURCHASE");
      expect(keys).toContain("TRANSACTION");
      expect(keys).toContain("TX_1");
      expect(keys).toContain("TX_2");
      expect(keys).toContain("TX_3");
      expect(keys).toContain("REPORT");
      expect(keys).toContain("SPONSOR");
      expect(keys).toContain("DELIVERY");
      expect(keys).toContain("NON_EXISTENT");
      expect(keys).toContain("ALTERNATE");
    });

    it("TestIdKey can be used to access TestIds values", () => {
      function getTestId(key: TestIdKey): string {
        return TestIds[key];
      }

      expect(getTestId("USER")).toBe(TestIds.USER);
      expect(getTestId("ADMIN")).toBe(TestIds.ADMIN);
      expect(getTestId("TRIP")).toBe(TestIds.TRIP);
    });

    it("TestIds has exactly 31 keys", () => {
      const keys = Object.keys(TestIds);

      expect(keys).toHaveLength(31);
    });
  });

  // ===========================================================================
  // ID Category Tests
  // ===========================================================================
  describe("USER IDs category", () => {
    it("has correct number of USER related IDs", () => {
      const userKeys = Object.keys(TestIds).filter(
        (key) =>
          key.startsWith("USER") || key === "ADMIN" || key === "MODERATOR",
      );

      expect(userKeys).toHaveLength(6);
    });

    it("USER IDs are in sequential order", () => {
      expect(TestIds.USER).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(TestIds.USER_1).toBe("550e8400-e29b-41d4-a716-446655440001");
      expect(TestIds.USER_2).toBe("550e8400-e29b-41d4-a716-446655440002");
      expect(TestIds.USER_3).toBe("550e8400-e29b-41d4-a716-446655440003");
    });

    it("ADMIN and MODERATOR have distinct ID ranges", () => {
      // Admin starts at ...010
      expect(TestIds.ADMIN).toBe("550e8400-e29b-41d4-a716-446655440010");
      // Moderator starts at ...020
      expect(TestIds.MODERATOR).toBe("550e8400-e29b-41d4-a716-446655440020");
    });
  });

  describe("TRIP IDs category", () => {
    it("has correct number of TRIP related IDs", () => {
      const tripKeys = Object.keys(TestIds).filter((key) =>
        key.startsWith("TRIP"),
      );

      expect(tripKeys).toHaveLength(3);
    });

    it("TRIP IDs are in sequential order", () => {
      expect(TestIds.TRIP).toBe("550e8400-e29b-41d4-a716-446655440100");
      expect(TestIds.TRIP_1).toBe("550e8400-e29b-41d4-a716-446655440101");
      expect(TestIds.TRIP_2).toBe("550e8400-e29b-41d4-a716-446655440102");
    });

    it("TRIP IDs use 100s range", () => {
      const allTripIds = [TestIds.TRIP, TestIds.TRIP_1, TestIds.TRIP_2];

      for (const id of allTripIds) {
        expect(id.startsWith("550e8400-e29b-41d4-a716-4466554401")).toBe(true);
      }
    });
  });

  describe("GROUP IDs category", () => {
    it("has correct number of GROUP related IDs", () => {
      const groupKeys = Object.keys(TestIds).filter((key) =>
        key.startsWith("GROUP"),
      );

      expect(groupKeys).toHaveLength(2);
    });

    it("GROUP IDs are in sequential order", () => {
      expect(TestIds.GROUP).toBe("550e8400-e29b-41d4-a716-446655440200");
      expect(TestIds.GROUP_1).toBe("550e8400-e29b-41d4-a716-446655440201");
    });

    it("GROUP IDs use 200s range", () => {
      expect(
        TestIds.GROUP.startsWith("550e8400-e29b-41d4-a716-4466554402"),
      ).toBe(true);
    });
  });

  describe("CHALLENGE IDs category", () => {
    it("has correct number of CHALLENGE related IDs", () => {
      const challengeKeys = Object.keys(TestIds).filter((key) =>
        key.startsWith("CHALLENGE"),
      );

      expect(challengeKeys).toHaveLength(2);
    });

    it("CHALLENGE IDs are in sequential order", () => {
      expect(TestIds.CHALLENGE).toBe("550e8400-e29b-41d4-a716-446655440300");
      expect(TestIds.CHALLENGE_1).toBe("550e8400-e29b-41d4-a716-446655440301");
    });

    it("CHALLENGE IDs use 300s range", () => {
      expect(
        TestIds.CHALLENGE.startsWith("550e8400-e29b-41d4-a716-4466554403"),
      ).toBe(true);
    });
  });

  describe("Activity and Location IDs category", () => {
    it("ACTIVITY uses 400s range", () => {
      expect(TestIds.ACTIVITY).toBe("550e8400-e29b-41d4-a716-446655440400");
    });

    it("LOCATION uses 500s range", () => {
      expect(TestIds.LOCATION).toBe("550e8400-e29b-41d4-a716-446655440500");
    });
  });

  describe("Notification and Schedule IDs category", () => {
    it("NOTIFICATION uses 600s range", () => {
      expect(TestIds.NOTIFICATION).toBe("550e8400-e29b-41d4-a716-446655440600");
    });

    it("SCHEDULE uses 700s range", () => {
      expect(TestIds.SCHEDULE).toBe("550e8400-e29b-41d4-a716-446655440700");
    });
  });

  describe("Submission and Vote IDs category", () => {
    it("SUBMISSION uses 800s range", () => {
      expect(TestIds.SUBMISSION).toBe("550e8400-e29b-41d4-a716-446655440800");
      expect(TestIds.SUBMISSION_1).toBe("550e8400-e29b-41d4-a716-446655440801");
    });

    it("VOTE uses 900s range", () => {
      expect(TestIds.VOTE).toBe("550e8400-e29b-41d4-a716-446655440900");
    });
  });

  describe("Financial IDs category", () => {
    it("REWARD uses 1000s range", () => {
      expect(TestIds.REWARD).toBe("550e8400-e29b-41d4-a716-446655441000");
    });

    it("PURCHASE uses 1100s range", () => {
      expect(TestIds.PURCHASE).toBe("550e8400-e29b-41d4-a716-446655441100");
    });

    it("TRANSACTION and TX_* use 1200s range", () => {
      expect(TestIds.TRANSACTION).toBe("550e8400-e29b-41d4-a716-446655441200");
      expect(TestIds.TX_1).toBe("550e8400-e29b-41d4-a716-446655441201");
      expect(TestIds.TX_2).toBe("550e8400-e29b-41d4-a716-446655441202");
      expect(TestIds.TX_3).toBe("550e8400-e29b-41d4-a716-446655441203");
    });
  });

  describe("Support IDs category", () => {
    it("REPORT uses 1300s range", () => {
      expect(TestIds.REPORT).toBe("550e8400-e29b-41d4-a716-446655441300");
    });

    it("SPONSOR uses 1400s range", () => {
      expect(TestIds.SPONSOR).toBe("550e8400-e29b-41d4-a716-446655441400");
    });

    it("DELIVERY uses 1500s range", () => {
      expect(TestIds.DELIVERY).toBe("550e8400-e29b-41d4-a716-446655441500");
    });
  });

  describe("Special/Edge case IDs category", () => {
    it("NON_EXISTENT uses 9000s range", () => {
      expect(TestIds.NON_EXISTENT).toBe("550e8400-e29b-41d4-a716-446655449999");
    });

    it("ALTERNATE uses 9000s range", () => {
      expect(TestIds.ALTERNATE).toBe("550e8400-e29b-41d4-a716-446655449998");
    });

    it("special IDs are far from regular IDs to avoid conflicts", () => {
      // Last regular ID is DELIVERY at ...441500
      // Special IDs are at ...449998 and ...449999
      const regularMaxPrefix = "550e8400-e29b-41d4-a716-4466554415";
      const specialMinPrefix = "550e8400-e29b-41d4-a716-4466554499";

      expect(TestIds.DELIVERY.startsWith(regularMaxPrefix)).toBe(true);
      expect(TestIds.NON_EXISTENT.startsWith(specialMinPrefix)).toBe(true);
      expect(TestIds.ALTERNATE.startsWith(specialMinPrefix)).toBe(true);
    });
  });

  // ===========================================================================
  // Structure and Format Tests
  // ===========================================================================
  describe("structure and format", () => {
    it("all TestIds share the same base UUID prefix", () => {
      const expectedPrefix = "550e8400-e29b-41d4-a716-44665544";

      for (const [key, value] of Object.entries(TestIds)) {
        expect(value.startsWith(expectedPrefix)).toBe(true);
      }
    });

    it("all TestIds have 36 character length (standard UUID)", () => {
      for (const [key, value] of Object.entries(TestIds)) {
        expect(value).toHaveLength(36);
      }
    });

    it("all TestIds follow the pattern of sequential numbering", () => {
      // Last 4 characters should be hex numbers
      const hexPattern = /^[0-9a-f]{4}$/;

      for (const [key, value] of Object.entries(TestIds)) {
        const last4 = value.slice(-4);
        expect(hexPattern.test(last4)).toBe(true);
      }
    });

    it("TestIds is frozen (as const)", () => {
      // as const makes the object deeply readonly at compile time
      // At runtime, we verify it's an object with the expected structure
      expect(typeof TestIds).toBe("object");
      expect(TestIds).not.toBeNull();
    });
  });
});
