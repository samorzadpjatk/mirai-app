import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { TripParticipant, TripParticipantRole } from "./TripParticipant";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] TripParticipant Entity", () => {
  describe("TripParticipant.create", () => {
    it("should create participant with valid data", () => {
      const effect = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
      });

      const entity = Effect.runSync(effect);
      expect(entity.id).toBeDefined();
      expect(entity.userId).toBe("user-123");
      expect(entity.tripId).toBe("trip-456");
      expect(entity.role).toBe(TripParticipantRole.MEMBER);
      expect(entity.isMember()).toBe(true);
      expect(entity.isLeader()).toBe(false);
      expect(entity.isAssignedToGroup()).toBe(false);
    });

    it("should create participant as leader", () => {
      const effect = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
        role: TripParticipantRole.LEADER,
      });

      const entity = Effect.runSync(effect);
      expect(entity.role).toBe(TripParticipantRole.LEADER);
      expect(entity.isLeader()).toBe(true);
    });

    it("should create participant with optional fields", () => {
      const effect = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
        groupId: "group-789",
        wristNumber: "W123",
        houseNumber: "H456",
      });

      const entity = Effect.runSync(effect);
      expect(entity.groupId).toBe("group-789");
      expect(entity.wristNumber).toBe("W123");
      expect(entity.houseNumber).toBe("H456");
      expect(entity.isAssignedToGroup()).toBe(true);
      expect(entity.hasWristNumber()).toBe(true);
      expect(entity.hasHouseNumber()).toBe(true);
    });

    it("should reject empty userId", () => {
      const effect = TripParticipant.create({
        userId: "",
        tripId: "trip-456",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty tripId", () => {
      const effect = TripParticipant.create({
        userId: "user-123",
        tripId: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject invalid role", () => {
      const effect = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
        role: "INVALID_ROLE" as TripParticipantRole,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("TripParticipant.assignToGroup", () => {
    it("should assign to group", () => {
      const participant = Effect.runSync(
        TripParticipant.create({
          userId: "user-123",
          tripId: "trip-456",
        }),
      );

      const assigned = Effect.runSync(participant.assignToGroup("group-789"));
      expect(assigned.groupId).toBe("group-789");
      expect(assigned.isAssignedToGroup()).toBe(true);
    });

    it("should reject empty groupId", () => {
      const participant = Effect.runSync(
        TripParticipant.create({
          userId: "user-123",
          tripId: "trip-456",
        }),
      );

      const effect = participant.assignToGroup("");
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("TripParticipant.removeFromGroup", () => {
    it("should remove from group", () => {
      const participant = Effect.runSync(
        TripParticipant.create({
          userId: "user-123",
          tripId: "trip-456",
          groupId: "group-789",
        }),
      );

      const removed = participant.removeFromGroup();
      expect(removed.groupId).toBeNull();
      expect(removed.isAssignedToGroup()).toBe(false);
    });
  });

  describe("TripParticipant.updateRole", () => {
    it("should update role to leader", () => {
      const participant = Effect.runSync(
        TripParticipant.create({
          userId: "user-123",
          tripId: "trip-456",
        }),
      );

      const updated = participant.updateRole(TripParticipantRole.LEADER);
      expect(updated.role).toBe(TripParticipantRole.LEADER);
      expect(updated.isLeader()).toBe(true);
    });

    it("should update role to member", () => {
      const participant = Effect.runSync(
        TripParticipant.create({
          userId: "user-123",
          tripId: "trip-456",
          role: TripParticipantRole.LEADER,
        }),
      );

      const updated = participant.updateRole(TripParticipantRole.MEMBER);
      expect(updated.role).toBe(TripParticipantRole.MEMBER);
      expect(updated.isMember()).toBe(true);
    });
  });

  describe("TripParticipant.assignWristNumber", () => {
    it("should assign wrist number", () => {
      const participant = Effect.runSync(
        TripParticipant.create({
          userId: "user-123",
          tripId: "trip-456",
        }),
      );

      const updated = Effect.runSync(participant.assignWristNumber("W123"));
      expect(updated.wristNumber).toBe("W123");
      expect(updated.hasWristNumber()).toBe(true);
    });

    it("should clear wrist number", () => {
      const participant = Effect.runSync(
        TripParticipant.create({
          userId: "user-123",
          tripId: "trip-456",
          wristNumber: "W123",
        }),
      );

      const updated = Effect.runSync(participant.assignWristNumber(null));
      expect(updated.wristNumber).toBeNull();
      expect(updated.hasWristNumber()).toBe(false);
    });
  });

  describe("TripParticipant.assignHouseNumber", () => {
    it("should assign house number", () => {
      const participant = Effect.runSync(
        TripParticipant.create({
          userId: "user-123",
          tripId: "trip-456",
        }),
      );

      const updated = Effect.runSync(participant.assignHouseNumber("H456"));
      expect(updated.houseNumber).toBe("H456");
    });
  });

  describe("TripParticipant.promoteToLeader / demoteToMember", () => {
    it("should promote member to leader", () => {
      const participant = Effect.runSync(
        TripParticipant.create({
          userId: "user-123",
          tripId: "trip-456",
        }),
      );

      const promoted = participant.promoteToLeader();
      expect(promoted.isLeader()).toBe(true);
    });

    it("should demote leader to member", () => {
      const participant = Effect.runSync(
        TripParticipant.create({
          userId: "user-123",
          tripId: "trip-456",
          role: TripParticipantRole.LEADER,
        }),
      );

      const demoted = participant.demoteToMember();
      expect(demoted.isMember()).toBe(true);
    });
  });
});
