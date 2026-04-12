import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { Event } from "./Event";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] Event Entity", () => {
  describe("Event.create", () => {
    it("should create event with valid data", () => {
      const startTime = new Date("2024-06-01T10:00:00Z");
      const endTime = new Date("2024-06-01T12:00:00Z");

      const effect = Event.create({
        creatorId: "user-123",
        title: "Team Meeting",
        startTime,
        endTime,
        location: "Conference Room A",
        description: "Weekly team sync meeting",
      });

      const entity = Effect.runSync(effect);
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.creatorId).toBe("user-123");
      expect(entity.title).toBe("Team Meeting");
      expect(entity.location).toBe("Conference Room A");
      expect(entity.isOrganizedByGroup()).toBe(false);
    });

    it("should create event with group organizer", () => {
      const startTime = new Date("2024-06-01T10:00:00Z");
      const endTime = new Date("2024-06-01T12:00:00Z");

      const effect = Event.create({
        creatorId: "user-123",
        organizerGroupId: "group-456",
        title: "Group Activity",
        startTime,
        endTime,
        location: "Park",
        description: "Group team building",
      });

      const entity = Effect.runSync(effect);
      expect(entity).toBeDefined();
      expect(entity.organizerGroupId).toBe("group-456");
      expect(entity.isOrganizedByGroup()).toBe(true);
    });

    it("should reject empty creatorId", () => {
      const effect = Event.create({
        creatorId: "",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty title", () => {
      const effect = Event.create({
        creatorId: "user-123",
        title: "",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject endTime before startTime", () => {
      const startTime = new Date("2024-06-01T12:00:00Z");
      const endTime = new Date("2024-06-01T10:00:00Z");

      const effect = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime,
        endTime,
        location: "Room A",
        description: "Description",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.message).toContain("date");
      }
    });

    it("should reject too many files", () => {
      const effect = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
        files: Array(11).fill("file.pdf"),
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("Event.updateDetails", () => {
    it("should update event details", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Old Title",
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          location: "Old Location",
          description: "Old Description",
        }),
      );

      const updated = Effect.runSync(
        event.updateDetails({
          title: "New Title",
          location: "New Location",
        }),
      );

      expect(updated.title).toBe("New Title");
      expect(updated.location).toBe("New Location");
    });

    it("should reject invalid title in updateDetails", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Valid Title",
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          location: "Room A",
          description: "Description",
        }),
      );

      const effect = event.updateDetails({
        title: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("Event.updateTimes", () => {
    it("should update event times", () => {
      const startTime = new Date("2024-06-01T10:00:00Z");
      const endTime = new Date("2024-06-01T12:00:00Z");

      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Meeting",
          startTime,
          endTime,
          location: "Room A",
          description: "Description",
        }),
      );

      const newStartTime = new Date("2024-06-01T14:00:00Z");
      const newEndTime = new Date("2024-06-01T16:00:00Z");
      const updated = Effect.runSync(
        event.updateTimes({
          startTime: newStartTime,
          endTime: newEndTime,
        }),
      );

      expect(updated.startTime).toBe(newStartTime);
      expect(updated.endTime).toBe(newEndTime);
    });

    it("should reject invalid time range", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Meeting",
          startTime: new Date("2024-06-01T10:00:00Z"),
          endTime: new Date("2024-06-01T12:00:00Z"),
          location: "Room A",
          description: "Description",
        }),
      );

      const effect = event.updateTimes({
        startTime: new Date("2024-06-01T15:00:00Z"),
        endTime: new Date("2024-06-01T14:00:00Z"),
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("Event.addFile / removeFile", () => {
    it("should add file to event", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Meeting",
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          location: "Room A",
          description: "Description",
        }),
      );

      const updated = Effect.runSync(event.addFile("document.pdf"));

      expect(updated.files).toContain("document.pdf");
    });

    it("should reject empty file path", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Meeting",
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          location: "Room A",
          description: "Description",
        }),
      );

      const effect = event.addFile("");

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject adding file when at max capacity", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Meeting",
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          location: "Room A",
          description: "Description",
          files: Array(10).fill("existing.pdf"),
        }),
      );

      const effect = event.addFile("new.pdf");

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should remove file from event", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Meeting",
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          location: "Room A",
          description: "Description",
          files: ["doc1.pdf", "doc2.pdf"],
        }),
      );

      const updated = event.removeFile("doc1.pdf");

      expect(updated.files).not.toContain("doc1.pdf");
      expect(updated.files).toContain("doc2.pdf");
    });
  });

  describe("Event.assignToGroup / removeFromGroup", () => {
    it("should assign to group", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Meeting",
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          location: "Room A",
          description: "Description",
        }),
      );

      const updated = Effect.runSync(event.assignToGroup("group-456"));

      expect(updated.organizerGroupId).toBe("group-456");
    });

    it("should reject empty groupId", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Meeting",
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          location: "Room A",
          description: "Description",
        }),
      );

      const effect = event.assignToGroup("");

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should remove from group", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          organizerGroupId: "group-456",
          title: "Meeting",
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          location: "Room A",
          description: "Description",
        }),
      );

      const updated = event.removeFromGroup();

      expect(updated.organizerGroupId).toBeNull();
    });
  });

  describe("Event.getDurationMinutes", () => {
    it("should calculate duration correctly", () => {
      const startTime = new Date("2024-06-01T10:00:00Z");
      const endTime = new Date("2024-06-01T12:30:00Z");

      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Meeting",
          startTime,
          endTime,
          location: "Room A",
          description: "Description",
        }),
      );

      expect(event.getDurationMinutes()).toBe(150);
    });
  });

  describe("Event.getSummary", () => {
    it("should return event summary", () => {
      const event = Effect.runSync(
        Event.create({
          creatorId: "user-123",
          title: "Team Meeting",
          startTime: new Date("2024-06-01T10:00:00Z"),
          endTime: new Date("2024-06-01T12:00:00Z"),
          location: "Conference Room A",
          description: "Description",
        }),
      );

      const summary = event.getSummary();
      expect(summary).toContain("Team Meeting");
      expect(summary).toContain("Conference Room A");
    });
  });
});
