import { describe, it, expect } from "bun:test";
import { UserEvent } from "./UserEvent";

describe("[UNIT] UserEvent Entity", () => {
  describe("UserEvent.create", () => {
    it("should create user event with valid data", () => {
      const result = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.userId).toBe("user-123");
        expect(result.value.eventId).toBe("event-456");
        expect(result.value.interestedIn).toBe(false);
        expect(result.value.enlistedIn).toBe(false);
        expect(result.value.hasParticipation()).toBe(false);
      }
    });

    it("should create with interest", () => {
      const result = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
        interestedIn: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.interestedIn).toBe(true);
        expect(result.value.isInterested()).toBe(true);
        expect(result.value.hasParticipation()).toBe(true);
      }
    });

    it("should create with enlistment", () => {
      const result = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
        enlistedIn: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.enlistedIn).toBe(true);
        expect(result.value.isEnlisted()).toBe(true);
      }
    });

    it("should create with both interest and enlistment", () => {
      const result = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
        interestedIn: true,
        enlistedIn: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isInterested()).toBe(true);
        expect(result.value.isEnlisted()).toBe(true);
      }
    });

    it("should reject empty userId", () => {
      const result = UserEvent.create({
        userId: "",
        eventId: "event-456",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty eventId", () => {
      const result = UserEvent.create({
        userId: "user-123",
        eventId: "",
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("UserEvent.markInterested / removeInterest", () => {
    it("should mark as interested", () => {
      const userEventResult = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
      });

      expect(userEventResult.kind).toBe("ok");
      if (userEventResult.kind !== "ok") return;

      const userEvent = userEventResult.value;
      const updated = userEvent.markInterested();

      expect(updated.interestedIn).toBe(true);
      expect(updated.isInterested()).toBe(true);
    });

    it("should remove interest", () => {
      const userEventResult = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
        interestedIn: true,
      });

      expect(userEventResult.kind).toBe("ok");
      if (userEventResult.kind !== "ok") return;

      const userEvent = userEventResult.value;
      const updated = userEvent.removeInterest();

      expect(updated.interestedIn).toBe(false);
      expect(updated.isInterested()).toBe(false);
    });
  });

  describe("UserEvent.enlist / unenlist", () => {
    it("should enlist in event", () => {
      const userEventResult = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
      });

      expect(userEventResult.kind).toBe("ok");
      if (userEventResult.kind !== "ok") return;

      const userEvent = userEventResult.value;
      const updated = userEvent.enlist();

      expect(updated.enlistedIn).toBe(true);
      expect(updated.isEnlisted()).toBe(true);
    });

    it("should unenlist from event", () => {
      const userEventResult = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
        enlistedIn: true,
      });

      expect(userEventResult.kind).toBe("ok");
      if (userEventResult.kind !== "ok") return;

      const userEvent = userEventResult.value;
      const updated = userEvent.unenlist();

      expect(updated.enlistedIn).toBe(false);
      expect(updated.isEnlisted()).toBe(false);
    });
  });

  describe("UserEvent.updateParticipation", () => {
    it("should update both flags", () => {
      const userEventResult = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
      });

      expect(userEventResult.kind).toBe("ok");
      if (userEventResult.kind !== "ok") return;

      const userEvent = userEventResult.value;
      const updated = userEvent.updateParticipation({
        interestedIn: true,
        enlistedIn: true,
      });

      expect(updated.interestedIn).toBe(true);
      expect(updated.enlistedIn).toBe(true);
    });
  });

  describe("UserEvent.getStatus", () => {
    it("should return none for no participation", () => {
      const result = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getStatus()).toBe("none");
      }
    });

    it("should return interested", () => {
      const result = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
        interestedIn: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getStatus()).toBe("interested");
      }
    });

    it("should return enlisted", () => {
      const result = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
        enlistedIn: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getStatus()).toBe("enlisted");
      }
    });

    it("should return both", () => {
      const result = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
        interestedIn: true,
        enlistedIn: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getStatus()).toBe("both");
      }
    });
  });

  describe("UserEvent.getCompositeId", () => {
    it("should return composite ID", () => {
      const result = UserEvent.create({
        userId: "user-123",
        eventId: "event-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getCompositeId()).toBe("user-123:event-456");
      }
    });
  });
});
