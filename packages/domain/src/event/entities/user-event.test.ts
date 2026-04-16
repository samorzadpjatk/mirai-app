import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { UserEvent } from "./user-event";
import { ValidationError } from "../../system/errors";

describe("[UNIT] UserEvent", () => {
  const validProps = {
    userId: "user-123",
    eventId: "event-456",
    interestedIn: true,
    enlistedIn: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  // ============================================================================
  // UserEvent.create() Factory Tests
  // ============================================================================
  describe("[UNIT] UserEvent.create", () => {
    it("creates UserEvent with valid data", async () => {
      const result = await Effect.runPromise(UserEvent.create(validProps));
      expect(result.userId).toBe("user-123");
      expect(result.eventId).toBe("event-456");
      expect(result.interestedIn).toBe(true);
      expect(result.enlistedIn).toBe(false);
    });

    it("creates UserEvent with minimal required fields", async () => {
      const result = await Effect.runPromise(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
        }),
      );
      expect(result.userId).toBe("user-123");
      expect(result.eventId).toBe("event-456");
      expect(result.interestedIn).toBe(false);
      expect(result.enlistedIn).toBe(false);
    });

    it("defaults interestedIn to false when not provided", async () => {
      const result = await Effect.runPromise(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
          enlistedIn: true,
        }),
      );
      expect(result.interestedIn).toBe(false);
    });

    it("defaults enlistedIn to false when not provided", async () => {
      const result = await Effect.runPromise(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
          interestedIn: true,
        }),
      );
      expect(result.enlistedIn).toBe(false);
    });

    it("sets timestamps when not provided", async () => {
      const result = await Effect.runPromise(
        UserEvent.create({
          userId: "user-123",
          eventId: "event-456",
        }),
      );
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("trims whitespace from userId", async () => {
      const result = await Effect.runPromise(
        UserEvent.create({
          userId: "  user-123  ",
          eventId: "event-456",
        }),
      );
      expect(result.userId).toBe("user-123");
    });

    it("trims whitespace from eventId", async () => {
      const result = await Effect.runPromise(
        UserEvent.create({
          userId: "user-123",
          eventId: "  event-456  ",
        }),
      );
      expect(result.eventId).toBe("event-456");
    });

    it("fails for empty userId", async () => {
      const result = await Effect.runPromise(
        Effect.either(UserEvent.create({ ...validProps, userId: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("userId is required");
        expect(result.left.field).toBe("general");
      }
    });

    it("fails for whitespace-only userId", async () => {
      const result = await Effect.runPromise(
        Effect.either(UserEvent.create({ ...validProps, userId: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("userId is required");
      }
    });

    it("fails for empty eventId", async () => {
      const result = await Effect.runPromise(
        Effect.either(UserEvent.create({ ...validProps, eventId: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("eventId is required");
        expect(result.left.field).toBe("general");
      }
    });

    it("fails for whitespace-only eventId", async () => {
      const result = await Effect.runPromise(
        Effect.either(UserEvent.create({ ...validProps, eventId: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("eventId is required");
      }
    });
  });

  // ============================================================================
  // RSVP Tracking Tests - markInterested
  // ============================================================================
  describe("[UNIT] UserEvent.markInterested", () => {
    it("marks interestedIn as true", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, interestedIn: false }),
      );
      const updated = userEvent.markInterested();
      expect(updated.interestedIn).toBe(true);
    });

    it("keeps interestedIn as true if already true", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, interestedIn: true }),
      );
      const updated = userEvent.markInterested();
      expect(updated.interestedIn).toBe(true);
    });

    it("preserves enlistedIn status", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: false,
          enlistedIn: true,
        }),
      );
      const updated = userEvent.markInterested();
      expect(updated.enlistedIn).toBe(true);
    });

    it("preserves userId and eventId", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const updated = userEvent.markInterested();
      expect(updated.userId).toBe(userEvent.userId);
      expect(updated.eventId).toBe(userEvent.eventId);
    });

    it("preserves createdAt", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const updated = userEvent.markInterested();
      expect(updated.createdAt).toBe(userEvent.createdAt);
    });

    it("updates updatedAt timestamp", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const beforeUpdate = Date.now();
      const updated = userEvent.markInterested();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, interestedIn: false }),
      );
      userEvent.markInterested();
      expect(userEvent.interestedIn).toBe(false);
    });
  });

  // ============================================================================
  // RSVP Tracking Tests - removeInterest
  // ============================================================================
  describe("[UNIT] UserEvent.removeInterest", () => {
    it("marks interestedIn as false", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, interestedIn: true }),
      );
      const updated = userEvent.removeInterest();
      expect(updated.interestedIn).toBe(false);
    });

    it("keeps interestedIn as false if already false", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, interestedIn: false }),
      );
      const updated = userEvent.removeInterest();
      expect(updated.interestedIn).toBe(false);
    });

    it("preserves enlistedIn status", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: true,
        }),
      );
      const updated = userEvent.removeInterest();
      expect(updated.enlistedIn).toBe(true);
    });

    it("preserves userId and eventId", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const updated = userEvent.removeInterest();
      expect(updated.userId).toBe(userEvent.userId);
      expect(updated.eventId).toBe(userEvent.eventId);
    });

    it("preserves createdAt", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const updated = userEvent.removeInterest();
      expect(updated.createdAt).toBe(userEvent.createdAt);
    });

    it("updates updatedAt timestamp", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const beforeUpdate = Date.now();
      const updated = userEvent.removeInterest();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, interestedIn: true }),
      );
      userEvent.removeInterest();
      expect(userEvent.interestedIn).toBe(true);
    });
  });

  // ============================================================================
  // RSVP Tracking Tests - enlist
  // ============================================================================
  describe("[UNIT] UserEvent.enlist", () => {
    it("marks enlistedIn as true", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, enlistedIn: false }),
      );
      const updated = userEvent.enlist();
      expect(updated.enlistedIn).toBe(true);
    });

    it("keeps enlistedIn as true if already true", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, enlistedIn: true }),
      );
      const updated = userEvent.enlist();
      expect(updated.enlistedIn).toBe(true);
    });

    it("preserves interestedIn status", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: false,
        }),
      );
      const updated = userEvent.enlist();
      expect(updated.interestedIn).toBe(true);
    });

    it("preserves userId and eventId", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const updated = userEvent.enlist();
      expect(updated.userId).toBe(userEvent.userId);
      expect(updated.eventId).toBe(userEvent.eventId);
    });

    it("preserves createdAt", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const updated = userEvent.enlist();
      expect(updated.createdAt).toBe(userEvent.createdAt);
    });

    it("updates updatedAt timestamp", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const beforeUpdate = Date.now();
      const updated = userEvent.enlist();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, enlistedIn: false }),
      );
      userEvent.enlist();
      expect(userEvent.enlistedIn).toBe(false);
    });
  });

  // ============================================================================
  // RSVP Tracking Tests - unenlist
  // ============================================================================
  describe("[UNIT] UserEvent.unenlist", () => {
    it("marks enlistedIn as false", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, enlistedIn: true }),
      );
      const updated = userEvent.unenlist();
      expect(updated.enlistedIn).toBe(false);
    });

    it("keeps enlistedIn as false if already false", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, enlistedIn: false }),
      );
      const updated = userEvent.unenlist();
      expect(updated.enlistedIn).toBe(false);
    });

    it("preserves interestedIn status", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: true,
        }),
      );
      const updated = userEvent.unenlist();
      expect(updated.interestedIn).toBe(true);
    });

    it("preserves userId and eventId", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const updated = userEvent.unenlist();
      expect(updated.userId).toBe(userEvent.userId);
      expect(updated.eventId).toBe(userEvent.eventId);
    });

    it("preserves createdAt", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const updated = userEvent.unenlist();
      expect(updated.createdAt).toBe(userEvent.createdAt);
    });

    it("updates updatedAt timestamp", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const beforeUpdate = Date.now();
      const updated = userEvent.unenlist();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, enlistedIn: true }),
      );
      userEvent.unenlist();
      expect(userEvent.enlistedIn).toBe(true);
    });
  });

  // ============================================================================
  // RSVP Tracking Tests - updateParticipation
  // ============================================================================
  describe("[UNIT] UserEvent.updateParticipation", () => {
    it("updates both interestedIn and enlistedIn", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: false,
          enlistedIn: false,
        }),
      );
      const updated = userEvent.updateParticipation({
        interestedIn: true,
        enlistedIn: true,
      });
      expect(updated.interestedIn).toBe(true);
      expect(updated.enlistedIn).toBe(true);
    });

    it("updates only interestedIn when specified", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: false,
          enlistedIn: true,
        }),
      );
      const updated = userEvent.updateParticipation({ interestedIn: true });
      expect(updated.interestedIn).toBe(true);
      expect(updated.enlistedIn).toBe(true);
    });

    it("updates only enlistedIn when specified", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: false,
        }),
      );
      const updated = userEvent.updateParticipation({ enlistedIn: true });
      expect(updated.interestedIn).toBe(true);
      expect(updated.enlistedIn).toBe(true);
    });

    it("preserves existing values when not specified", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: false,
        }),
      );
      const updated = userEvent.updateParticipation({});
      expect(updated.interestedIn).toBe(true);
      expect(updated.enlistedIn).toBe(false);
    });

    it("can set both to false", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: true,
        }),
      );
      const updated = userEvent.updateParticipation({
        interestedIn: false,
        enlistedIn: false,
      });
      expect(updated.interestedIn).toBe(false);
      expect(updated.enlistedIn).toBe(false);
    });

    it("preserves userId and eventId", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const updated = userEvent.updateParticipation({ interestedIn: true });
      expect(updated.userId).toBe(userEvent.userId);
      expect(updated.eventId).toBe(userEvent.eventId);
    });

    it("preserves createdAt", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const updated = userEvent.updateParticipation({ interestedIn: true });
      expect(updated.createdAt).toBe(userEvent.createdAt);
    });

    it("updates updatedAt timestamp", async () => {
      const userEvent = await Effect.runPromise(UserEvent.create(validProps));
      const beforeUpdate = Date.now();
      const updated = userEvent.updateParticipation({ interestedIn: true });
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({ ...validProps, interestedIn: false }),
      );
      userEvent.updateParticipation({ interestedIn: true });
      expect(userEvent.interestedIn).toBe(false);
    });
  });

  // ============================================================================
  // Query Method Tests
  // ============================================================================
  describe("[UNIT] UserEvent Query Methods", () => {
    describe("isInterested", () => {
      it("returns true when interestedIn is true", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({ ...validProps, interestedIn: true }),
        );
        expect(userEvent.isInterested()).toBe(true);
      });

      it("returns false when interestedIn is false", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({ ...validProps, interestedIn: false }),
        );
        expect(userEvent.isInterested()).toBe(false);
      });
    });

    describe("isEnlisted", () => {
      it("returns true when enlistedIn is true", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({ ...validProps, enlistedIn: true }),
        );
        expect(userEvent.isEnlisted()).toBe(true);
      });

      it("returns false when enlistedIn is false", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({ ...validProps, enlistedIn: false }),
        );
        expect(userEvent.isEnlisted()).toBe(false);
      });
    });

    describe("hasParticipation", () => {
      it("returns true when interestedIn is true", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({
            ...validProps,
            interestedIn: true,
            enlistedIn: false,
          }),
        );
        expect(userEvent.hasParticipation()).toBe(true);
      });

      it("returns true when enlistedIn is true", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({
            ...validProps,
            interestedIn: false,
            enlistedIn: true,
          }),
        );
        expect(userEvent.hasParticipation()).toBe(true);
      });

      it("returns true when both are true", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({
            ...validProps,
            interestedIn: true,
            enlistedIn: true,
          }),
        );
        expect(userEvent.hasParticipation()).toBe(true);
      });

      it("returns false when both are false", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({
            ...validProps,
            interestedIn: false,
            enlistedIn: false,
          }),
        );
        expect(userEvent.hasParticipation()).toBe(false);
      });
    });

    describe("getStatus", () => {
      it("returns 'none' when neither interested nor enlisted", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({
            ...validProps,
            interestedIn: false,
            enlistedIn: false,
          }),
        );
        expect(userEvent.getStatus()).toBe("none");
      });

      it("returns 'interested' when only interested", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({
            ...validProps,
            interestedIn: true,
            enlistedIn: false,
          }),
        );
        expect(userEvent.getStatus()).toBe("interested");
      });

      it("returns 'enlisted' when only enlisted", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({
            ...validProps,
            interestedIn: false,
            enlistedIn: true,
          }),
        );
        expect(userEvent.getStatus()).toBe("enlisted");
      });

      it("returns 'both' when both interested and enlisted", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({
            ...validProps,
            interestedIn: true,
            enlistedIn: true,
          }),
        );
        expect(userEvent.getStatus()).toBe("both");
      });
    });

    describe("getCompositeId", () => {
      it("returns composite ID in correct format", async () => {
        const userEvent = await Effect.runPromise(UserEvent.create(validProps));
        expect(userEvent.getCompositeId()).toBe("user-123:event-456");
      });

      it("returns unique composite for different user", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({ ...validProps, userId: "user-789" }),
        );
        expect(userEvent.getCompositeId()).toBe("user-789:event-456");
      });

      it("returns unique composite for different event", async () => {
        const userEvent = await Effect.runPromise(
          UserEvent.create({ ...validProps, eventId: "event-789" }),
        );
        expect(userEvent.getCompositeId()).toBe("user-123:event-789");
      });
    });
  });

  // ============================================================================
  // RSVP State Transition Tests
  // ============================================================================
  describe("[UNIT] UserEvent RSVP State Transitions", () => {
    it("can transition from none to interested", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: false,
          enlistedIn: false,
        }),
      );
      const updated = userEvent.markInterested();
      expect(updated.isInterested()).toBe(true);
      expect(updated.isEnlisted()).toBe(false);
      expect(updated.getStatus()).toBe("interested");
    });

    it("can transition from none to enlisted", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: false,
          enlistedIn: false,
        }),
      );
      const updated = userEvent.enlist();
      expect(updated.isInterested()).toBe(false);
      expect(updated.isEnlisted()).toBe(true);
      expect(updated.getStatus()).toBe("enlisted");
    });

    it("can transition from interested to both", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: false,
        }),
      );
      const updated = userEvent.enlist();
      expect(updated.isInterested()).toBe(true);
      expect(updated.isEnlisted()).toBe(true);
      expect(updated.getStatus()).toBe("both");
    });

    it("can transition from enlisted to both", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: false,
          enlistedIn: true,
        }),
      );
      const updated = userEvent.markInterested();
      expect(updated.isInterested()).toBe(true);
      expect(updated.isEnlisted()).toBe(true);
      expect(updated.getStatus()).toBe("both");
    });

    it("can transition from both to interested only", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: true,
        }),
      );
      const updated = userEvent.unenlist();
      expect(updated.isInterested()).toBe(true);
      expect(updated.isEnlisted()).toBe(false);
      expect(updated.getStatus()).toBe("interested");
    });

    it("can transition from both to enlisted only", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: true,
        }),
      );
      const updated = userEvent.removeInterest();
      expect(updated.isInterested()).toBe(false);
      expect(updated.isEnlisted()).toBe(true);
      expect(updated.getStatus()).toBe("enlisted");
    });

    it("can transition from both to none", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: true,
        }),
      );
      const step1 = userEvent.removeInterest();
      const step2 = step1.unenlist();
      expect(step2.isInterested()).toBe(false);
      expect(step2.isEnlisted()).toBe(false);
      expect(step2.getStatus()).toBe("none");
    });

    it("can transition from interested to none", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: true,
          enlistedIn: false,
        }),
      );
      const updated = userEvent.removeInterest();
      expect(updated.isInterested()).toBe(false);
      expect(updated.isEnlisted()).toBe(false);
      expect(updated.getStatus()).toBe("none");
    });

    it("can transition from enlisted to none", async () => {
      const userEvent = await Effect.runPromise(
        UserEvent.create({
          ...validProps,
          interestedIn: false,
          enlistedIn: true,
        }),
      );
      const updated = userEvent.unenlist();
      expect(updated.isInterested()).toBe(false);
      expect(updated.isEnlisted()).toBe(false);
      expect(updated.getStatus()).toBe("none");
    });
  });
});
