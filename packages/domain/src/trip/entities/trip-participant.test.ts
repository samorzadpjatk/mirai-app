import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { TripParticipant } from "./trip-participant";
import { ValidationError } from "../../system/errors";
import { TripParticipantRole } from "../../trip/enums";

const validUserId = "user-123";
const validTripId = "trip-456";
const validGroupId = "group-789";

const createMinimalProps = () => ({
  userId: validUserId,
  tripId: validTripId,
});

const createValidParticipant = async (
  overrides: Partial<Parameters<typeof TripParticipant.create>[0]> = {},
): Promise<TripParticipant> => {
  const props = { ...createMinimalProps(), ...overrides };
  return Effect.runPromise(TripParticipant.create(props));
};

describe("[UNIT] TripParticipant", () => {
  describe("[UNIT] TripParticipant.create", () => {
    describe("creates entity with minimal props", () => {
      it("creates with userId and tripId", async () => {
        const participant = await createValidParticipant();
        expect(participant.userId).toBe(validUserId);
        expect(participant.tripId).toBe(validTripId);
      });

      it("generates UUID when id not provided", async () => {
        const participant = await createValidParticipant();
        expect(participant.id).toBeDefined();
        expect(participant.id.length).toBeGreaterThan(0);
        expect(participant.id).toContain("-");
      });

      it("uses provided id when specified", async () => {
        const customId = "custom-participant-id";
        const participant = await createValidParticipant({ id: customId });
        expect(participant.id).toBe(customId);
      });

      it("defaults role to MEMBER", async () => {
        const participant = await createValidParticipant();
        expect(participant.role).toBe(TripParticipantRole.MEMBER);
      });

      it("sets groupId to null when not provided", async () => {
        const participant = await createValidParticipant();
        expect(participant.groupId).toBeNull();
      });

      it("sets wristNumber to null when not provided", async () => {
        const participant = await createValidParticipant();
        expect(participant.wristNumber).toBeNull();
      });

      it("sets houseNumber to null when not provided", async () => {
        const participant = await createValidParticipant();
        expect(participant.houseNumber).toBeNull();
      });

      it("sets createdAt to current date when not provided", async () => {
        const before = new Date();
        const participant = await createValidParticipant();
        const after = new Date();
        expect(participant.createdAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(participant.createdAt.getTime()).toBeLessThanOrEqual(
          after.getTime(),
        );
      });

      it("sets updatedAt to current date when not provided", async () => {
        const before = new Date();
        const participant = await createValidParticipant();
        const after = new Date();
        expect(participant.updatedAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(participant.updatedAt.getTime()).toBeLessThanOrEqual(
          after.getTime(),
        );
      });

      it("uses provided createdAt when specified", async () => {
        const customDate = new Date("2024-01-15");
        const participant = await createValidParticipant({
          createdAt: customDate,
        });
        expect(participant.createdAt).toEqual(customDate);
      });

      it("uses provided updatedAt when specified", async () => {
        const customDate = new Date("2024-01-15");
        const participant = await createValidParticipant({
          updatedAt: customDate,
        });
        expect(participant.updatedAt).toEqual(customDate);
      });
    });

    describe("role assignment", () => {
      it("creates with MEMBER role when specified", async () => {
        const participant = await createValidParticipant({
          role: TripParticipantRole.MEMBER,
        });
        expect(participant.role).toBe(TripParticipantRole.MEMBER);
      });

      it("creates with LEADER role when specified", async () => {
        const participant = await createValidParticipant({
          role: TripParticipantRole.LEADER,
        });
        expect(participant.role).toBe(TripParticipantRole.LEADER);
      });

      it("fails with ValidationError for invalid role", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            TripParticipant.create({
              ...createMinimalProps(),
              role: "INVALID_ROLE" as TripParticipantRole,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("role");
        }
      });
    });

    describe("group assignment", () => {
      it("creates with groupId when specified", async () => {
        const participant = await createValidParticipant({
          groupId: validGroupId,
        });
        expect(participant.groupId).toBe(validGroupId);
      });
    });

    describe("wrist number assignment", () => {
      it("creates with wristNumber when specified", async () => {
        const participant = await createValidParticipant({
          wristNumber: "W123",
        });
        expect(participant.wristNumber).toBe("W123");
      });

      it("fails with ValidationError for wristNumber > 50 chars", async () => {
        const longWristNumber = "W".repeat(51);
        const result = await Effect.runPromise(
          Effect.either(
            TripParticipant.create({
              ...createMinimalProps(),
              wristNumber: longWristNumber,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("wristNumber");
        }
      });

      it("allows wristNumber with exactly 50 chars", async () => {
        const wristNumber50 = "W".repeat(50);
        const participant = await createValidParticipant({
          wristNumber: wristNumber50,
        });
        expect(participant.wristNumber).toBe(wristNumber50);
      });
    });

    describe("house number assignment", () => {
      it("creates with houseNumber when specified", async () => {
        const participant = await createValidParticipant({
          houseNumber: "H456",
        });
        expect(participant.houseNumber).toBe("H456");
      });

      it("fails with ValidationError for houseNumber > 50 chars", async () => {
        const longHouseNumber = "H".repeat(51);
        const result = await Effect.runPromise(
          Effect.either(
            TripParticipant.create({
              ...createMinimalProps(),
              houseNumber: longHouseNumber,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("houseNumber");
        }
      });

      it("allows houseNumber with exactly 50 chars", async () => {
        const houseNumber50 = "H".repeat(50);
        const participant = await createValidParticipant({
          houseNumber: houseNumber50,
        });
        expect(participant.houseNumber).toBe(houseNumber50);
      });
    });

    describe("validation errors", () => {
      it("fails with ValidationError for empty userId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            TripParticipant.create({
              ...createMinimalProps(),
              userId: "",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("general");
          expect(result.left.message).toContain("userId");
        }
      });

      it("fails with ValidationError for whitespace-only userId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            TripParticipant.create({
              ...createMinimalProps(),
              userId: "   ",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("general");
        }
      });

      it("fails with ValidationError for empty tripId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            TripParticipant.create({
              ...createMinimalProps(),
              tripId: "",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("general");
          expect(result.left.message).toContain("tripId");
        }
      });

      it("fails with ValidationError for whitespace-only tripId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            TripParticipant.create({
              ...createMinimalProps(),
              tripId: "   ",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("general");
        }
      });

      it("trims userId when provided with whitespace", async () => {
        const participant = await createValidParticipant({
          userId: "  user-123  ",
        });
        expect(participant.userId).toBe("user-123");
      });

      it("trims tripId when provided with whitespace", async () => {
        const participant = await createValidParticipant({
          tripId: "  trip-456  ",
        });
        expect(participant.tripId).toBe("trip-456");
      });
    });
  });

  describe("[UNIT] TripParticipant.assignToGroup", () => {
    it("assigns participant to a group", async () => {
      const participant = await createValidParticipant();
      const updated = await Effect.runPromise(
        participant.assignToGroup(validGroupId),
      );
      expect(updated.groupId).toBe(validGroupId);
    });

    it("trims whitespace from groupId", async () => {
      const participant = await createValidParticipant();
      const updated = await Effect.runPromise(
        participant.assignToGroup("  group-789  "),
      );
      expect(updated.groupId).toBe("group-789");
    });

    it("updates updatedAt timestamp", async () => {
      const participant = await createValidParticipant();
      const beforeUpdate = new Date();
      const updated = await Effect.runPromise(
        participant.assignToGroup(validGroupId),
      );
      const afterUpdate = new Date();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("preserves other properties", async () => {
      const participant = await createValidParticipant({
        id: "test-id",
        wristNumber: "W123",
        houseNumber: "H456",
        role: TripParticipantRole.LEADER,
      });
      const updated = await Effect.runPromise(
        participant.assignToGroup(validGroupId),
      );
      expect(updated.id).toBe(participant.id);
      expect(updated.userId).toBe(participant.userId);
      expect(updated.tripId).toBe(participant.tripId);
      expect(updated.wristNumber).toBe(participant.wristNumber);
      expect(updated.houseNumber).toBe(participant.houseNumber);
      expect(updated.role).toBe(participant.role);
      expect(updated.createdAt).toEqual(participant.createdAt);
    });

    it("fails with ValidationError for empty groupId", async () => {
      const participant = await createValidParticipant();
      const result = await Effect.runPromise(
        Effect.either(participant.assignToGroup("")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("general");
      }
    });

    it("fails with ValidationError for whitespace-only groupId", async () => {
      const participant = await createValidParticipant();
      const result = await Effect.runPromise(
        Effect.either(participant.assignToGroup("   ")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("general");
      }
    });
  });

  describe("[UNIT] TripParticipant.removeFromGroup", () => {
    it("removes participant from group", async () => {
      const participant = await createValidParticipant({
        groupId: validGroupId,
      });
      const updated = participant.removeFromGroup();
      expect(updated.groupId).toBeNull();
    });

    it("updates updatedAt timestamp", async () => {
      const participant = await createValidParticipant({
        groupId: validGroupId,
      });
      const beforeUpdate = new Date();
      const updated = participant.removeFromGroup();
      const afterUpdate = new Date();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("preserves other properties", async () => {
      const participant = await createValidParticipant({
        groupId: validGroupId,
        wristNumber: "W123",
        houseNumber: "H456",
        role: TripParticipantRole.LEADER,
      });
      const updated = participant.removeFromGroup();
      expect(updated.id).toBe(participant.id);
      expect(updated.userId).toBe(participant.userId);
      expect(updated.tripId).toBe(participant.tripId);
      expect(updated.wristNumber).toBe(participant.wristNumber);
      expect(updated.houseNumber).toBe(participant.houseNumber);
      expect(updated.role).toBe(participant.role);
      expect(updated.createdAt).toEqual(participant.createdAt);
    });

    it("is idempotent when already not in a group", async () => {
      const participant = await createValidParticipant();
      expect(participant.groupId).toBeNull();
      const updated = participant.removeFromGroup();
      expect(updated.groupId).toBeNull();
    });
  });

  describe("[UNIT] TripParticipant.updateRole", () => {
    it("updates role to LEADER", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.MEMBER,
      });
      const updated = participant.updateRole(TripParticipantRole.LEADER);
      expect(updated.role).toBe(TripParticipantRole.LEADER);
    });

    it("updates role to MEMBER", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.LEADER,
      });
      const updated = participant.updateRole(TripParticipantRole.MEMBER);
      expect(updated.role).toBe(TripParticipantRole.MEMBER);
    });

    it("updates updatedAt timestamp", async () => {
      const participant = await createValidParticipant();
      const beforeUpdate = new Date();
      const updated = participant.updateRole(TripParticipantRole.LEADER);
      const afterUpdate = new Date();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("preserves other properties", async () => {
      const participant = await createValidParticipant({
        groupId: validGroupId,
        wristNumber: "W123",
        houseNumber: "H456",
      });
      const updated = participant.updateRole(TripParticipantRole.LEADER);
      expect(updated.id).toBe(participant.id);
      expect(updated.userId).toBe(participant.userId);
      expect(updated.tripId).toBe(participant.tripId);
      expect(updated.groupId).toBe(participant.groupId);
      expect(updated.wristNumber).toBe(participant.wristNumber);
      expect(updated.houseNumber).toBe(participant.houseNumber);
      expect(updated.createdAt).toEqual(participant.createdAt);
    });
  });

  describe("[UNIT] TripParticipant.assignWristNumber", () => {
    it("assigns wrist number", async () => {
      const participant = await createValidParticipant();
      const updated = await Effect.runPromise(
        participant.assignWristNumber("W789"),
      );
      expect(updated.wristNumber).toBe("W789");
    });

    it("assigns null to clear wrist number", async () => {
      const participant = await createValidParticipant({
        wristNumber: "W123",
      });
      const updated = await Effect.runPromise(
        participant.assignWristNumber(null),
      );
      expect(updated.wristNumber).toBeNull();
    });

    it("updates updatedAt timestamp", async () => {
      const participant = await createValidParticipant();
      const beforeUpdate = new Date();
      const updated = await Effect.runPromise(
        participant.assignWristNumber("W789"),
      );
      const afterUpdate = new Date();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("preserves other properties", async () => {
      const participant = await createValidParticipant({
        groupId: validGroupId,
        houseNumber: "H456",
        role: TripParticipantRole.LEADER,
      });
      const updated = await Effect.runPromise(
        participant.assignWristNumber("W789"),
      );
      expect(updated.id).toBe(participant.id);
      expect(updated.userId).toBe(participant.userId);
      expect(updated.tripId).toBe(participant.tripId);
      expect(updated.groupId).toBe(participant.groupId);
      expect(updated.houseNumber).toBe(participant.houseNumber);
      expect(updated.role).toBe(participant.role);
      expect(updated.createdAt).toEqual(participant.createdAt);
    });

    it("fails with ValidationError for wristNumber > 50 chars", async () => {
      const participant = await createValidParticipant();
      const longWristNumber = "W".repeat(51);
      const result = await Effect.runPromise(
        Effect.either(participant.assignWristNumber(longWristNumber)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("wristNumber");
      }
    });

    it("allows wristNumber with exactly 50 chars", async () => {
      const participant = await createValidParticipant();
      const wristNumber50 = "W".repeat(50);
      const updated = await Effect.runPromise(
        participant.assignWristNumber(wristNumber50),
      );
      expect(updated.wristNumber).toBe(wristNumber50);
    });

    it("allows empty string wristNumber", async () => {
      const participant = await createValidParticipant();
      const updated = await Effect.runPromise(
        participant.assignWristNumber(""),
      );
      expect(updated.wristNumber).toBe("");
    });
  });

  describe("[UNIT] TripParticipant.assignHouseNumber", () => {
    it("assigns house number", async () => {
      const participant = await createValidParticipant();
      const updated = await Effect.runPromise(
        participant.assignHouseNumber("H789"),
      );
      expect(updated.houseNumber).toBe("H789");
    });

    it("assigns null to clear house number", async () => {
      const participant = await createValidParticipant({
        houseNumber: "H123",
      });
      const updated = await Effect.runPromise(
        participant.assignHouseNumber(null),
      );
      expect(updated.houseNumber).toBeNull();
    });

    it("updates updatedAt timestamp", async () => {
      const participant = await createValidParticipant();
      const beforeUpdate = new Date();
      const updated = await Effect.runPromise(
        participant.assignHouseNumber("H789"),
      );
      const afterUpdate = new Date();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("preserves other properties", async () => {
      const participant = await createValidParticipant({
        groupId: validGroupId,
        wristNumber: "W456",
        role: TripParticipantRole.LEADER,
      });
      const updated = await Effect.runPromise(
        participant.assignHouseNumber("H789"),
      );
      expect(updated.id).toBe(participant.id);
      expect(updated.userId).toBe(participant.userId);
      expect(updated.tripId).toBe(participant.tripId);
      expect(updated.groupId).toBe(participant.groupId);
      expect(updated.wristNumber).toBe(participant.wristNumber);
      expect(updated.role).toBe(participant.role);
      expect(updated.createdAt).toEqual(participant.createdAt);
    });

    it("fails with ValidationError for houseNumber > 50 chars", async () => {
      const participant = await createValidParticipant();
      const longHouseNumber = "H".repeat(51);
      const result = await Effect.runPromise(
        Effect.either(participant.assignHouseNumber(longHouseNumber)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("houseNumber");
      }
    });

    it("allows houseNumber with exactly 50 chars", async () => {
      const participant = await createValidParticipant();
      const houseNumber50 = "H".repeat(50);
      const updated = await Effect.runPromise(
        participant.assignHouseNumber(houseNumber50),
      );
      expect(updated.houseNumber).toBe(houseNumber50);
    });

    it("allows empty string houseNumber", async () => {
      const participant = await createValidParticipant();
      const updated = await Effect.runPromise(
        participant.assignHouseNumber(""),
      );
      expect(updated.houseNumber).toBe("");
    });
  });

  describe("[UNIT] TripParticipant.isAssignedToGroup", () => {
    it("returns true when participant has a group", async () => {
      const participant = await createValidParticipant({
        groupId: validGroupId,
      });
      expect(participant.isAssignedToGroup()).toBe(true);
    });

    it("returns false when participant has no group", async () => {
      const participant = await createValidParticipant();
      expect(participant.isAssignedToGroup()).toBe(false);
    });
  });

  describe("[UNIT] TripParticipant.hasWristNumber", () => {
    it("returns true when participant has a wrist number", async () => {
      const participant = await createValidParticipant({
        wristNumber: "W123",
      });
      expect(participant.hasWristNumber()).toBe(true);
    });

    it("returns false when wrist number is null", async () => {
      const participant = await createValidParticipant();
      expect(participant.hasWristNumber()).toBe(false);
    });

    it("returns false when wrist number is empty string", async () => {
      const participant = await createValidParticipant({
        wristNumber: "",
      });
      expect(participant.hasWristNumber()).toBe(false);
    });
  });

  describe("[UNIT] TripParticipant.hasHouseNumber", () => {
    it("returns true when participant has a house number", async () => {
      const participant = await createValidParticipant({
        houseNumber: "H123",
      });
      expect(participant.hasHouseNumber()).toBe(true);
    });

    it("returns false when house number is null", async () => {
      const participant = await createValidParticipant();
      expect(participant.hasHouseNumber()).toBe(false);
    });

    it("returns false when house number is empty string", async () => {
      const participant = await createValidParticipant({
        houseNumber: "",
      });
      expect(participant.hasHouseNumber()).toBe(false);
    });
  });

  describe("[UNIT] TripParticipant.isLeader", () => {
    it("returns true when role is LEADER", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.LEADER,
      });
      expect(participant.isLeader()).toBe(true);
    });

    it("returns false when role is MEMBER", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.MEMBER,
      });
      expect(participant.isLeader()).toBe(false);
    });
  });

  describe("[UNIT] TripParticipant.isMember", () => {
    it("returns true when role is MEMBER", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.MEMBER,
      });
      expect(participant.isMember()).toBe(true);
    });

    it("returns false when role is LEADER", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.LEADER,
      });
      expect(participant.isMember()).toBe(false);
    });
  });

  describe("[UNIT] TripParticipant.promoteToLeader", () => {
    it("promotes MEMBER to LEADER", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.MEMBER,
      });
      const updated = participant.promoteToLeader();
      expect(updated.role).toBe(TripParticipantRole.LEADER);
      expect(updated.isLeader()).toBe(true);
    });

    it("keeps LEADER as LEADER when already leader", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.LEADER,
      });
      const updated = participant.promoteToLeader();
      expect(updated.role).toBe(TripParticipantRole.LEADER);
    });

    it("updates updatedAt timestamp", async () => {
      const participant = await createValidParticipant();
      const beforeUpdate = new Date();
      const updated = participant.promoteToLeader();
      const afterUpdate = new Date();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("is immutable - original participant unchanged", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.MEMBER,
      });
      participant.promoteToLeader();
      expect(participant.role).toBe(TripParticipantRole.MEMBER);
    });
  });

  describe("[UNIT] TripParticipant.demoteToMember", () => {
    it("demotes LEADER to MEMBER", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.LEADER,
      });
      const updated = participant.demoteToMember();
      expect(updated.role).toBe(TripParticipantRole.MEMBER);
      expect(updated.isMember()).toBe(true);
    });

    it("keeps MEMBER as MEMBER when already member", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.MEMBER,
      });
      const updated = participant.demoteToMember();
      expect(updated.role).toBe(TripParticipantRole.MEMBER);
    });

    it("updates updatedAt timestamp", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.LEADER,
      });
      const beforeUpdate = new Date();
      const updated = participant.demoteToMember();
      const afterUpdate = new Date();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("is immutable - original participant unchanged", async () => {
      const participant = await createValidParticipant({
        role: TripParticipantRole.LEADER,
      });
      participant.demoteToMember();
      expect(participant.role).toBe(TripParticipantRole.LEADER);
    });
  });

  describe("immutability", () => {
    it("all mutation methods return new instances", async () => {
      const participant = await createValidParticipant({
        id: "test-id",
        userId: "user-123",
        tripId: "trip-456",
        groupId: null,
        wristNumber: null,
        houseNumber: null,
        role: TripParticipantRole.MEMBER,
      });

      const promoted = participant.promoteToLeader();
      expect(promoted).not.toBe(participant);

      const demoted = participant.demoteToMember();
      expect(demoted).not.toBe(participant);

      const roleUpdated = participant.updateRole(TripParticipantRole.LEADER);
      expect(roleUpdated).not.toBe(participant);

      const removedFromGroup = participant.removeFromGroup();
      expect(removedFromGroup).not.toBe(participant);

      const assignedToGroup = await Effect.runPromise(
        participant.assignToGroup(validGroupId),
      );
      expect(assignedToGroup).not.toBe(participant);

      const wristAssigned = await Effect.runPromise(
        participant.assignWristNumber("W123"),
      );
      expect(wristAssigned).not.toBe(participant);

      const houseAssigned = await Effect.runPromise(
        participant.assignHouseNumber("H456"),
      );
      expect(houseAssigned).not.toBe(participant);
    });
  });
});
