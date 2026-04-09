import { describe, it, expect } from "bun:test";
import { TripParticipant, TripParticipantRole } from "./TripParticipant";

describe("[UNIT] TripParticipant Entity", () => {
  describe("TripParticipant.create", () => {
    it("should create participant with valid data", () => {
      const result = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.userId).toBe("user-123");
        expect(result.value.tripId).toBe("trip-456");
        expect(result.value.role).toBe(TripParticipantRole.MEMBER);
        expect(result.value.isMember()).toBe(true);
        expect(result.value.isLeader()).toBe(false);
        expect(result.value.isAssignedToGroup()).toBe(false);
      }
    });

    it("should create participant as leader", () => {
      const result = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
        role: TripParticipantRole.LEADER,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.role).toBe(TripParticipantRole.LEADER);
        expect(result.value.isLeader()).toBe(true);
      }
    });

    it("should create participant with optional fields", () => {
      const result = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
        groupId: "group-789",
        wristNumber: "W123",
        houseNumber: "H456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.groupId).toBe("group-789");
        expect(result.value.wristNumber).toBe("W123");
        expect(result.value.houseNumber).toBe("H456");
        expect(result.value.isAssignedToGroup()).toBe(true);
        expect(result.value.hasWristNumber()).toBe(true);
        expect(result.value.hasHouseNumber()).toBe(true);
      }
    });

    it("should reject empty userId", () => {
      const result = TripParticipant.create({
        userId: "",
        tripId: "trip-456",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("userId");
      }
    });

    it("should reject empty tripId", () => {
      const result = TripParticipant.create({
        userId: "user-123",
        tripId: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("tripId");
      }
    });

    it("should reject invalid role", () => {
      const result = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
        role: "INVALID_ROLE" as TripParticipantRole,
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("TripParticipant.assignToGroup", () => {
    it("should assign to group", () => {
      const participantResult = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
      });

      expect(participantResult.kind).toBe("ok");
      if (participantResult.kind !== "ok") return;

      const participant = participantResult.value;
      const assigned = participant.assignToGroup("group-789");

      expect(assigned.kind).toBe("ok");
      if (assigned.kind === "ok") {
        expect(assigned.value.groupId).toBe("group-789");
        expect(assigned.value.isAssignedToGroup()).toBe(true);
      }
    });

    it("should reject empty groupId", () => {
      const participantResult = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
      });

      expect(participantResult.kind).toBe("ok");
      if (participantResult.kind !== "ok") return;

      const participant = participantResult.value;
      const assigned = participant.assignToGroup("");

      expect(assigned.kind).toBe("err");
    });
  });

  describe("TripParticipant.removeFromGroup", () => {
    it("should remove from group", () => {
      const participantResult = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
        groupId: "group-789",
      });

      expect(participantResult.kind).toBe("ok");
      if (participantResult.kind !== "ok") return;

      const participant = participantResult.value;
      const removed = participant.removeFromGroup();

      expect(removed.groupId).toBeNull();
      expect(removed.isAssignedToGroup()).toBe(false);
    });
  });

  describe("TripParticipant.updateRole", () => {
    it("should update role to leader", () => {
      const participantResult = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
      });

      expect(participantResult.kind).toBe("ok");
      if (participantResult.kind !== "ok") return;

      const participant = participantResult.value;
      const updated = participant.updateRole(TripParticipantRole.LEADER);

      expect(updated.role).toBe(TripParticipantRole.LEADER);
      expect(updated.isLeader()).toBe(true);
    });

    it("should update role to member", () => {
      const participantResult = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
        role: TripParticipantRole.LEADER,
      });

      expect(participantResult.kind).toBe("ok");
      if (participantResult.kind !== "ok") return;

      const participant = participantResult.value;
      const updated = participant.updateRole(TripParticipantRole.MEMBER);

      expect(updated.role).toBe(TripParticipantRole.MEMBER);
      expect(updated.isMember()).toBe(true);
    });
  });

  describe("TripParticipant.assignWristNumber", () => {
    it("should assign wrist number", () => {
      const participantResult = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
      });

      expect(participantResult.kind).toBe("ok");
      if (participantResult.kind !== "ok") return;

      const participant = participantResult.value;
      const updated = participant.assignWristNumber("W123");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.wristNumber).toBe("W123");
        expect(updated.value.hasWristNumber()).toBe(true);
      }
    });

    it("should clear wrist number", () => {
      const participantResult = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
        wristNumber: "W123",
      });

      expect(participantResult.kind).toBe("ok");
      if (participantResult.kind !== "ok") return;

      const participant = participantResult.value;
      const updated = participant.assignWristNumber(null);

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.wristNumber).toBeNull();
        expect(updated.value.hasWristNumber()).toBe(false);
      }
    });
  });

  describe("TripParticipant.assignHouseNumber", () => {
    it("should assign house number", () => {
      const participantResult = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
      });

      expect(participantResult.kind).toBe("ok");
      if (participantResult.kind !== "ok") return;

      const participant = participantResult.value;
      const updated = participant.assignHouseNumber("H456");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.houseNumber).toBe("H456");
      }
    });
  });

  describe("TripParticipant.promoteToLeader / demoteToMember", () => {
    it("should promote member to leader", () => {
      const participantResult = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
      });

      expect(participantResult.kind).toBe("ok");
      if (participantResult.kind !== "ok") return;

      const participant = participantResult.value;
      const promoted = participant.promoteToLeader();

      expect(promoted.isLeader()).toBe(true);
    });

    it("should demote leader to member", () => {
      const participantResult = TripParticipant.create({
        userId: "user-123",
        tripId: "trip-456",
        role: TripParticipantRole.LEADER,
      });

      expect(participantResult.kind).toBe("ok");
      if (participantResult.kind !== "ok") return;

      const participant = participantResult.value;
      const demoted = participant.demoteToMember();

      expect(demoted.isMember()).toBe(true);
    });
  });
});
