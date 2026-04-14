import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { UserEvent } from "./UserEvent";
import { ValidationError } from "../errors";

describe("[UNIT] UserEvent Entity", () => {
  describe("[UNIT] UserEvent.create", () => {
    it("should create user event with valid data", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
        }),
      );

      expect(userEvent.userId).toBe("user-123");
      expect(userEvent.eventId).toBe("event-456");
      expect(userEvent.interestedIn).toBe(false);
      expect(userEvent.enlistedIn).toBe(false);
      expect(userEvent.hasParticipation()).toBe(false);
    });

    it("should create with interest", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
          interestedIn: true,
        }),
      );

      expect(userEvent.interestedIn).toBe(true);
      expect(userEvent.isInterested()).toBe(true);
      expect(userEvent.hasParticipation()).toBe(true);
    });

    it("should create with enlistment", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
          enlistedIn: true,
        }),
      );

      expect(userEvent.enlistedIn).toBe(true);
      expect(userEvent.isEnlisted()).toBe(true);
    });

    it("should create with both interest and enlistment", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
          interestedIn: true,
          enlistedIn: true,
        }),
      );

      expect(userEvent.isInterested()).toBe(true);
      expect(userEvent.isEnlisted()).toBe(true);
    });

    it("should reject empty userId", () => {
      const effect = UserEvent.create({
        userId: "",
        eventId: "event-456",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty eventId", () => {
      const effect = UserEvent.create({
        userId: "user-123",
        eventId: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("[UNIT] UserEvent.markInterested / removeInterest", () => {
    it("should mark as interested", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
        }),
      );

      const updated = userEvent.markInterested();

      expect(updated.interestedIn).toBe(true);
      expect(updated.isInterested()).toBe(true);
    });

    it("should remove interest", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
          interestedIn: true,
        }),
      );

      const updated = userEvent.removeInterest();

      expect(updated.interestedIn).toBe(false);
      expect(updated.isInterested()).toBe(false);
    });
  });

  describe("[UNIT] UserEvent.enlist / unenlist", () => {
    it("should enlist in event", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
        }),
      );

      const updated = userEvent.enlist();

      expect(updated.enlistedIn).toBe(true);
      expect(updated.isEnlisted()).toBe(true);
    });

    it("should unenlist from event", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
          enlistedIn: true,
        }),
      );

      const updated = userEvent.unenlist();

      expect(updated.enlistedIn).toBe(false);
      expect(updated.isEnlisted()).toBe(false);
    });
  });

  describe("[UNIT] UserEvent.updateParticipation", () => {
    it("should update both flags", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
        }),
      );

      const updated = userEvent.updateParticipation({
        interestedIn: true,
        enlistedIn: true,
      });

      expect(updated.interestedIn).toBe(true);
      expect(updated.enlistedIn).toBe(true);
    });
  });

  describe("[UNIT] UserEvent.getStatus", () => {
    it("should return none for no participation", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
        }),
      );

      expect(userEvent.getStatus()).toBe("none");
    });

    it("should return interested", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
          interestedIn: true,
        }),
      );

      expect(userEvent.getStatus()).toBe("interested");
    });

    it("should return enlisted", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
          enlistedIn: true,
        }),
      );

      expect(userEvent.getStatus()).toBe("enlisted");
    });

    it("should return both", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
          interestedIn: true,
          enlistedIn: true,
        }),
      );

      expect(userEvent.getStatus()).toBe("both");
    });
  });

  describe("[UNIT] UserEvent.getCompositeId", () => {
    it("should return composite ID", () => {
      const userEvent = Effect.runSync(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
        }),
      );

      expect(userEvent.getCompositeId()).toBe("user-123:event-456");
    });
  });
});
