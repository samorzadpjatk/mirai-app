import { describe, it, expect } from "bun:test";
import { Event } from "./Event";
import { ValidationError } from "../errors/domain-errors";

describe("[UNIT] Event Entity", () => {
  describe("Event.create", () => {
    it("should create event with valid data", () => {
      const startTime = new Date("2024-06-01T10:00:00Z");
      const endTime = new Date("2024-06-01T12:00:00Z");

      const result = Event.create({
        creatorId: "user-123",
        title: "Team Meeting",
        startTime,
        endTime,
        location: "Conference Room A",
        description: "Weekly team sync meeting",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.creatorId).toBe("user-123");
        expect(result.value.title).toBe("Team Meeting");
        expect(result.value.location).toBe("Conference Room A");
        expect(result.value.isOrganizedByGroup()).toBe(false);
      }
    });

    it("should create event with group organizer", () => {
      const startTime = new Date("2024-06-01T10:00:00Z");
      const endTime = new Date("2024-06-01T12:00:00Z");

      const result = Event.create({
        creatorId: "user-123",
        organizerGroupId: "group-456",
        title: "Group Activity",
        startTime,
        endTime,
        location: "Park",
        description: "Group team building",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.organizerGroupId).toBe("group-456");
        expect(result.value.isOrganizedByGroup()).toBe(true);
      }
    });

    it("should reject empty creatorId", () => {
      const result = Event.create({
        creatorId: "",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty title", () => {
      const result = Event.create({
        creatorId: "user-123",
        title: "",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject endTime before startTime", () => {
      const startTime = new Date("2024-06-01T12:00:00Z");
      const endTime = new Date("2024-06-01T10:00:00Z");

      const result = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime,
        endTime,
        location: "Room A",
        description: "Description",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("date");
      }
    });

    it("should reject too many files", () => {
      const result = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
        files: Array(11).fill("file.pdf"),
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("Event.updateDetails", () => {
    it("should update event details", () => {
      const eventResult = Event.create({
        creatorId: "user-123",
        title: "Old Title",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Old Location",
        description: "Old Description",
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const event = eventResult.value;
      const updated = event.updateDetails({
        title: "New Title",
        location: "New Location",
      });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.title).toBe("New Title");
        expect(updated.value.location).toBe("New Location");
      }
    });

    it("should reject invalid title in updateDetails", () => {
      const eventResult = Event.create({
        creatorId: "user-123",
        title: "Valid Title",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const updated = eventResult.value.updateDetails({
        title: "",
      });

      expect(updated.kind).toBe("err");
      if (updated.kind === "err") {
        expect(updated.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("Event.updateTimes", () => {
    it("should update event times", () => {
      const startTime = new Date("2024-06-01T10:00:00Z");
      const endTime = new Date("2024-06-01T12:00:00Z");

      const eventResult = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime,
        endTime,
        location: "Room A",
        description: "Description",
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const newStartTime = new Date("2024-06-01T14:00:00Z");
      const newEndTime = new Date("2024-06-01T16:00:00Z");
      const updated = eventResult.value.updateTimes({
        startTime: newStartTime,
        endTime: newEndTime,
      });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.startTime).toBe(newStartTime);
        expect(updated.value.endTime).toBe(newEndTime);
      }
    });

    it("should reject invalid time range", () => {
      const eventResult = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime: new Date("2024-06-01T10:00:00Z"),
        endTime: new Date("2024-06-01T12:00:00Z"),
        location: "Room A",
        description: "Description",
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const updated = eventResult.value.updateTimes({
        startTime: new Date("2024-06-01T15:00:00Z"),
        endTime: new Date("2024-06-01T14:00:00Z"),
      });

      expect(updated.kind).toBe("err");
      if (updated.kind === "err") {
        expect(updated.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("Event.addFile / removeFile", () => {
    it("should add file to event", () => {
      const eventResult = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const updated = eventResult.value.addFile("document.pdf");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.files).toContain("document.pdf");
      }
    });

    it("should reject empty file path", () => {
      const eventResult = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const updated = eventResult.value.addFile("");

      expect(updated.kind).toBe("err");
      if (updated.kind === "err") {
        expect(updated.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject adding file when at max capacity", () => {
      const eventResult = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
        files: Array(10).fill("existing.pdf"),
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const updated = eventResult.value.addFile("new.pdf");

      expect(updated.kind).toBe("err");
      if (updated.kind === "err") {
        expect(updated.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should remove file from event", () => {
      const eventResult = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
        files: ["doc1.pdf", "doc2.pdf"],
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const updated = eventResult.value.removeFile("doc1.pdf");

      expect(updated.files).not.toContain("doc1.pdf");
      expect(updated.files).toContain("doc2.pdf");
    });
  });

  describe("Event.assignToGroup / removeFromGroup", () => {
    it("should assign to group", () => {
      const eventResult = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const updated = eventResult.value.assignToGroup("group-456");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.organizerGroupId).toBe("group-456");
      }
    });

    it("should reject empty groupId", () => {
      const eventResult = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const updated = eventResult.value.assignToGroup("");

      expect(updated.kind).toBe("err");
      if (updated.kind === "err") {
        expect(updated.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should remove from group", () => {
      const eventResult = Event.create({
        creatorId: "user-123",
        organizerGroupId: "group-456",
        title: "Meeting",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        location: "Room A",
        description: "Description",
      });

      expect(eventResult.kind).toBe("ok");
      if (eventResult.kind !== "ok") return;

      const updated = eventResult.value.removeFromGroup();

      expect(updated.organizerGroupId).toBeNull();
    });
  });

  describe("Event.getDurationMinutes", () => {
    it("should calculate duration correctly", () => {
      const startTime = new Date("2024-06-01T10:00:00Z");
      const endTime = new Date("2024-06-01T12:30:00Z");

      const result = Event.create({
        creatorId: "user-123",
        title: "Meeting",
        startTime,
        endTime,
        location: "Room A",
        description: "Description",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getDurationMinutes()).toBe(150);
      }
    });
  });

  describe("Event.getSummary", () => {
    it("should return event summary", () => {
      const result = Event.create({
        creatorId: "user-123",
        title: "Team Meeting",
        startTime: new Date("2024-06-01T10:00:00Z"),
        endTime: new Date("2024-06-01T12:00:00Z"),
        location: "Conference Room A",
        description: "Description",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const summary = result.value.getSummary();
        expect(summary).toContain("Team Meeting");
        expect(summary).toContain("Conference Room A");
      }
    });
  });
});
