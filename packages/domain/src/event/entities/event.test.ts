import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { Event } from "./event";
import { ValidationError } from "../../system/errors";

describe("[UNIT] Event", () => {
  const validProps = {
    id: "event-123",
    creatorId: "user-456",
    organizerGroupId: "group-789",
    title: "Test Event",
    startTime: new Date("2024-06-15T10:00:00"),
    endTime: new Date("2024-06-15T12:00:00"),
    location: "Conference Room A",
    description: "A test event description",
    files: ["file1.pdf", "file2.png"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  // ============================================================================
  // Event.create() Factory Tests
  // ============================================================================
  describe("[UNIT] Event.create", () => {
    it("creates event with valid data", async () => {
      const result = await Effect.runPromise(Event.create(validProps));
      expect(result.id).toBe("event-123");
      expect(result.creatorId).toBe("user-456");
      expect(result.organizerGroupId).toBe("group-789");
      expect(result.title).toBe("Test Event");
      expect(result.location).toBe("Conference Room A");
      expect(result.description).toBe("A test event description");
      expect(result.files).toEqual(["file1.pdf", "file2.png"]);
    });

    it("creates event without optional organizerGroupId", async () => {
      const props = { ...validProps, organizerGroupId: undefined };
      const result = await Effect.runPromise(Event.create(props));
      expect(result.organizerGroupId).toBeNull();
    });

    it("creates event with null organizerGroupId", async () => {
      const props = { ...validProps, organizerGroupId: null };
      const result = await Effect.runPromise(Event.create(props));
      expect(result.organizerGroupId).toBeNull();
    });

    it("creates event with empty files array by default", async () => {
      const props = { ...validProps, files: undefined };
      const result = await Effect.runPromise(Event.create(props));
      expect(result.files).toEqual([]);
    });

    it("generates UUID when id not provided", async () => {
      const props = { ...validProps, id: undefined };
      const result = await Effect.runPromise(Event.create(props));
      expect(result.id).toBeTruthy();
      expect(typeof result.id).toBe("string");
      expect(result.id.length).toBeGreaterThan(0);
    });

    it("sets timestamps when not provided", async () => {
      const props = {
        creatorId: "user-456",
        title: "Test Event",
        startTime: new Date("2024-06-15T10:00:00"),
        endTime: new Date("2024-06-15T12:00:00"),
        location: "Room A",
        description: "Test description",
      };
      const result = await Effect.runPromise(Event.create(props));
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("fails for empty creatorId", async () => {
      const result = await Effect.runPromise(
        Effect.either(Event.create({ ...validProps, creatorId: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("creatorId");
      }
    });

    it("fails for empty title", async () => {
      const result = await Effect.runPromise(
        Effect.either(Event.create({ ...validProps, title: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("title");
        expect(result.left.message).toBe("title is required");
      }
    });

    it("fails for whitespace-only title", async () => {
      const result = await Effect.runPromise(
        Effect.either(Event.create({ ...validProps, title: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("title");
      }
    });

    it("fails for title exceeding 255 characters", async () => {
      const longTitle = "a".repeat(256);
      const result = await Effect.runPromise(
        Effect.either(Event.create({ ...validProps, title: longTitle })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("title");
        expect(result.left.message).toBe(
          "title must be at most 255 characters",
        );
      }
    });

    it("fails when endTime is before startTime", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          Event.create({
            ...validProps,
            startTime: new Date("2024-06-15T12:00:00"),
            endTime: new Date("2024-06-15T10:00:00"),
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("endTime");
        expect(result.left.message).toBe("endTime must be after startTime");
      }
    });

    it("fails when endTime equals startTime", async () => {
      const sameTime = new Date("2024-06-15T10:00:00");
      const result = await Effect.runPromise(
        Effect.either(
          Event.create({
            ...validProps,
            startTime: sameTime,
            endTime: sameTime,
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("endTime");
      }
    });

    it("fails for empty location", async () => {
      const result = await Effect.runPromise(
        Effect.either(Event.create({ ...validProps, location: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("location");
        expect(result.left.message).toBe("location is required");
      }
    });

    it("fails for location exceeding 500 characters", async () => {
      const longLocation = "a".repeat(501);
      const result = await Effect.runPromise(
        Effect.either(Event.create({ ...validProps, location: longLocation })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("location");
        expect(result.left.message).toBe(
          "location must be at most 500 characters",
        );
      }
    });

    it("fails for empty description", async () => {
      const result = await Effect.runPromise(
        Effect.either(Event.create({ ...validProps, description: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("description");
        expect(result.left.message).toBe("description is required");
      }
    });

    it("fails for description exceeding 2000 characters", async () => {
      const longDescription = "a".repeat(2001);
      const result = await Effect.runPromise(
        Effect.either(
          Event.create({ ...validProps, description: longDescription }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("description");
        expect(result.left.message).toBe(
          "description must be at most 2000 characters",
        );
      }
    });

    it("fails for file path exceeding 1000 characters", async () => {
      const longFilePath = "path/" + "a".repeat(1000);
      const result = await Effect.runPromise(
        Effect.either(Event.create({ ...validProps, files: [longFilePath] })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("files");
        expect(result.left.message).toBe(
          "file path must be at most 1000 characters",
        );
      }
    });
  });

  // ============================================================================
  // Event.update() Tests
  // ============================================================================
  describe("[UNIT] Event.update", () => {
    it("updates title", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const updated = await Effect.runPromise(
        event.update({ title: "Updated Title" }),
      );
      expect(updated.title).toBe("Updated Title");
      expect(updated.location).toBe(event.location);
    });

    it("updates location", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const updated = await Effect.runPromise(
        event.update({ location: "New Location" }),
      );
      expect(updated.location).toBe("New Location");
      expect(updated.title).toBe(event.title);
    });

    it("updates description", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const updated = await Effect.runPromise(
        event.update({ description: "Updated description" }),
      );
      expect(updated.description).toBe("Updated description");
    });

    it("updates time range", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const newStart = new Date("2024-06-16T14:00:00");
      const newEnd = new Date("2024-06-16T16:00:00");
      const updated = await Effect.runPromise(
        event.update({ startTime: newStart, endTime: newEnd }),
      );
      expect(updated.startTime).toEqual(newStart);
      expect(updated.endTime).toEqual(newEnd);
    });

    it("updates files array", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const newFiles = ["new1.pdf", "new2.pdf"];
      const updated = await Effect.runPromise(
        event.update({ files: newFiles }),
      );
      expect(updated.files).toEqual(newFiles);
    });

    it("updates multiple fields at once", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const updated = await Effect.runPromise(
        event.update({
          title: "New Title",
          location: "New Location",
          description: "New Description",
        }),
      );
      expect(updated.title).toBe("New Title");
      expect(updated.location).toBe("New Location");
      expect(updated.description).toBe("New Description");
    });

    it("fails when updating with invalid time range", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(
          event.update({
            startTime: new Date("2024-06-15T12:00:00"),
            endTime: new Date("2024-06-15T10:00:00"),
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("endTime");
      }
    });

    it("fails for empty title on update", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(event.update({ title: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("title");
      }
    });

    it("fails for title exceeding 255 chars on update", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(event.update({ title: "a".repeat(256) })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("title");
      }
    });

    it("fails for empty location on update", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(event.update({ location: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("location");
      }
    });

    it("fails for location exceeding 500 chars on update", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(event.update({ location: "a".repeat(501) })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("location");
      }
    });

    it("fails for empty description on update", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(event.update({ description: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("description");
      }
    });

    it("fails for description exceeding 2000 chars on update", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(event.update({ description: "a".repeat(2001) })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("description");
      }
    });

    it("fails for file path exceeding 1000 chars on update", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const longFilePath = "path/" + "a".repeat(1000);
      const result = await Effect.runPromise(
        Effect.either(event.update({ files: [longFilePath] })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("files");
      }
    });

    it("updates updatedAt timestamp", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const beforeUpdate = Date.now();
      const updated = await Effect.runPromise(
        event.update({ title: "New Title" }),
      );
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        event.updatedAt.getTime(),
      );
    });

    it("preserves unchanged fields", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      const updated = await Effect.runPromise(
        event.update({ title: "New Title" }),
      );
      expect(updated.id).toBe(event.id);
      expect(updated.creatorId).toBe(event.creatorId);
      expect(updated.organizerGroupId).toBe(event.organizerGroupId);
      expect(updated.startTime).toEqual(event.startTime);
      expect(updated.endTime).toEqual(event.endTime);
      expect(updated.createdAt).toEqual(event.createdAt);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const event = await Effect.runPromise(Event.create(validProps));
      await Effect.runPromise(event.update({ title: "New Title" }));
      expect(event.title).toBe("Test Event");
    });
  });

  // ============================================================================
  // File Management Tests
  // ============================================================================
  describe("[UNIT] Event File Management", () => {
    describe("addFile", () => {
      it("adds a file to empty files array", async () => {
        const event = await Effect.runPromise(
          Event.create({ ...validProps, files: [] }),
        );
        const updated = await Effect.runPromise(event.addFile("new-file.pdf"));
        expect(updated.files).toEqual(["new-file.pdf"]);
      });

      it("appends file to existing files array", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const updated = await Effect.runPromise(event.addFile("new-file.pdf"));
        expect(updated.files).toEqual([
          "file1.pdf",
          "file2.png",
          "new-file.pdf",
        ]);
      });

      it("fails for file path exceeding 1000 characters", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const longFilePath = "path/" + "a".repeat(1000);
        const result = await Effect.runPromise(
          Effect.either(event.addFile(longFilePath)),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.field).toBe("file");
          expect(result.left.message).toBe(
            "file path must be at most 1000 characters",
          );
        }
      });

      it("updates updatedAt timestamp", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const updated = await Effect.runPromise(event.addFile("new-file.pdf"));
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
          event.updatedAt.getTime(),
        );
      });

      it("returns immutable instance (original unchanged)", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        await Effect.runPromise(event.addFile("new-file.pdf"));
        expect(event.files).toEqual(["file1.pdf", "file2.png"]);
      });
    });

    describe("removeFile", () => {
      it("removes existing file from array", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const updated = event.removeFile("file1.pdf");
        expect(updated.files).toEqual(["file2.png"]);
      });

      it("handles removing non-existent file gracefully", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const updated = event.removeFile("non-existent.pdf");
        expect(updated.files).toEqual(["file1.pdf", "file2.png"]);
      });

      it("removes all matching files", async () => {
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            files: ["dup.pdf", "dup.pdf", "other.pdf"],
          }),
        );
        const updated = event.removeFile("dup.pdf");
        expect(updated.files).toEqual(["other.pdf"]);
      });

      it("updates updatedAt timestamp", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const updated = event.removeFile("file1.pdf");
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
          event.updatedAt.getTime(),
        );
      });

      it("returns immutable instance (original unchanged)", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        event.removeFile("file1.pdf");
        expect(event.files).toEqual(["file1.pdf", "file2.png"]);
      });
    });
  });

  // ============================================================================
  // Time-Based Method Tests
  // ============================================================================
  describe("[UNIT] Event Time-Based Methods", () => {
    describe("isFuture", () => {
      it("returns true for future event", async () => {
        const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const futureEnd = new Date(Date.now() + 26 * 60 * 60 * 1000);
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: futureStart,
            endTime: futureEnd,
          }),
        );
        expect(event.isFuture()).toBe(true);
      });

      it("returns false for ongoing event", async () => {
        const pastStart = new Date(Date.now() - 60 * 60 * 1000);
        const futureEnd = new Date(Date.now() + 60 * 60 * 1000);
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: pastStart,
            endTime: futureEnd,
          }),
        );
        expect(event.isFuture()).toBe(false);
      });

      it("returns false for past event", async () => {
        const pastStart = new Date(Date.now() - 26 * 60 * 60 * 1000);
        const pastEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: pastStart,
            endTime: pastEnd,
          }),
        );
        expect(event.isFuture()).toBe(false);
      });

      it("respects custom now parameter", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const beforeStart = new Date("2024-06-14");
        expect(event.isFuture(beforeStart)).toBe(true);
      });
    });

    describe("isOngoing", () => {
      it("returns true for ongoing event", async () => {
        const pastStart = new Date(Date.now() - 60 * 60 * 1000);
        const futureEnd = new Date(Date.now() + 60 * 60 * 1000);
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: pastStart,
            endTime: futureEnd,
          }),
        );
        expect(event.isOngoing()).toBe(true);
      });

      it("returns true at exact start time", async () => {
        const now = new Date();
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: now,
            endTime: new Date(now.getTime() + 60 * 60 * 1000),
          }),
        );
        expect(event.isOngoing(now)).toBe(true);
      });

      it("returns true at exact end time", async () => {
        const now = new Date();
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: new Date(now.getTime() - 60 * 60 * 1000),
            endTime: now,
          }),
        );
        expect(event.isOngoing(now)).toBe(true);
      });

      it("returns false for future event", async () => {
        const futureStart = new Date(Date.now() + 60 * 60 * 1000);
        const futureEnd = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: futureStart,
            endTime: futureEnd,
          }),
        );
        expect(event.isOngoing()).toBe(false);
      });

      it("returns false for past event", async () => {
        const pastStart = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const pastEnd = new Date(Date.now() - 60 * 60 * 1000);
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: pastStart,
            endTime: pastEnd,
          }),
        );
        expect(event.isOngoing()).toBe(false);
      });
    });

    describe("isPast", () => {
      it("returns true for past event", async () => {
        const pastStart = new Date(Date.now() - 26 * 60 * 60 * 1000);
        const pastEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: pastStart,
            endTime: pastEnd,
          }),
        );
        expect(event.isPast()).toBe(true);
      });

      it("returns false for ongoing event", async () => {
        const pastStart = new Date(Date.now() - 60 * 60 * 1000);
        const futureEnd = new Date(Date.now() + 60 * 60 * 1000);
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: pastStart,
            endTime: futureEnd,
          }),
        );
        expect(event.isPast()).toBe(false);
      });

      it("returns false for future event", async () => {
        const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const futureEnd = new Date(Date.now() + 26 * 60 * 60 * 1000);
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: futureStart,
            endTime: futureEnd,
          }),
        );
        expect(event.isPast()).toBe(false);
      });

      it("returns false at exact end time", async () => {
        const now = new Date();
        const event = await Effect.runPromise(
          Event.create({
            ...validProps,
            startTime: new Date(now.getTime() - 60 * 60 * 1000),
            endTime: now,
          }),
        );
        expect(event.isPast(now)).toBe(false);
      });
    });
  });

  // ============================================================================
  // Duration and Conflict Detection Tests
  // ============================================================================
  describe("[UNIT] Event Duration and Conflict Detection", () => {
    describe("getDurationInMinutes", () => {
      it("calculates duration for 2 hour event", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        expect(event.getDurationInMinutes()).toBe(120);
      });

      it("calculates duration for 30 minute event", async () => {
        const start = new Date("2024-06-15T10:00:00");
        const end = new Date("2024-06-15T10:30:00");
        const event = await Effect.runPromise(
          Event.create({ ...validProps, startTime: start, endTime: end }),
        );
        expect(event.getDurationInMinutes()).toBe(30);
      });

      it("calculates duration for multi-day event", async () => {
        const start = new Date("2024-06-15T10:00:00");
        const end = new Date("2024-06-17T10:00:00");
        const event = await Effect.runPromise(
          Event.create({ ...validProps, startTime: start, endTime: end }),
        );
        expect(event.getDurationInMinutes()).toBe(48 * 60);
      });

      it("rounds up fractional minutes", async () => {
        const start = new Date("2024-06-15T10:00:00");
        const end = new Date("2024-06-15T10:00:30");
        const event = await Effect.runPromise(
          Event.create({ ...validProps, startTime: start, endTime: end }),
        );
        expect(event.getDurationInMinutes()).toBe(1);
      });
    });

    describe("conflictsWith", () => {
      it("detects conflict with overlapping time ranges", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const otherStart = new Date("2024-06-15T11:00:00");
        const otherEnd = new Date("2024-06-15T13:00:00");
        expect(event.conflictsWith(otherStart, otherEnd)).toBe(true);
      });

      it("detects conflict when other event is contained within", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const otherStart = new Date("2024-06-15T10:30:00");
        const otherEnd = new Date("2024-06-15T11:30:00");
        expect(event.conflictsWith(otherStart, otherEnd)).toBe(true);
      });

      it("detects conflict when this event is contained within other", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const otherStart = new Date("2024-06-15T09:00:00");
        const otherEnd = new Date("2024-06-15T13:00:00");
        expect(event.conflictsWith(otherStart, otherEnd)).toBe(true);
      });

      it("detects conflict when events partially overlap at start", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const otherStart = new Date("2024-06-15T09:00:00");
        const otherEnd = new Date("2024-06-15T11:00:00");
        expect(event.conflictsWith(otherStart, otherEnd)).toBe(true);
      });

      it("detects conflict when events partially overlap at end", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const otherStart = new Date("2024-06-15T11:00:00");
        const otherEnd = new Date("2024-06-15T14:00:00");
        expect(event.conflictsWith(otherStart, otherEnd)).toBe(true);
      });

      it("returns false for non-overlapping events (other before this)", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const otherStart = new Date("2024-06-15T08:00:00");
        const otherEnd = new Date("2024-06-15T09:00:00");
        expect(event.conflictsWith(otherStart, otherEnd)).toBe(false);
      });

      it("returns false for non-overlapping events (other after this)", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const otherStart = new Date("2024-06-15T13:00:00");
        const otherEnd = new Date("2024-06-15T14:00:00");
        expect(event.conflictsWith(otherStart, otherEnd)).toBe(false);
      });

      it("returns false when other event ends at this event's start", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const otherStart = new Date("2024-06-15T08:00:00");
        const otherEnd = new Date("2024-06-15T10:00:00");
        expect(event.conflictsWith(otherStart, otherEnd)).toBe(false);
      });

      it("returns false when other event starts at this event's end", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        const otherStart = new Date("2024-06-15T12:00:00");
        const otherEnd = new Date("2024-06-15T14:00:00");
        expect(event.conflictsWith(otherStart, otherEnd)).toBe(false);
      });
    });
  });

  // ============================================================================
  // Query Method Tests
  // ============================================================================
  describe("[UNIT] Event Query Methods", () => {
    describe("hasOrganizerGroup", () => {
      it("returns true when organizerGroupId is set", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        expect(event.hasOrganizerGroup()).toBe(true);
      });

      it("returns false when organizerGroupId is null", async () => {
        const event = await Effect.runPromise(
          Event.create({ ...validProps, organizerGroupId: null }),
        );
        expect(event.hasOrganizerGroup()).toBe(false);
      });

      it("returns false when organizerGroupId is undefined", async () => {
        const event = await Effect.runPromise(
          Event.create({ ...validProps, organizerGroupId: undefined }),
        );
        expect(event.hasOrganizerGroup()).toBe(false);
      });
    });

    describe("isCreator", () => {
      it("returns true for matching creatorId", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        expect(event.isCreator("user-456")).toBe(true);
      });

      it("returns false for non-matching creatorId", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        expect(event.isCreator("different-user")).toBe(false);
      });

      it("returns false for empty string", async () => {
        const event = await Effect.runPromise(Event.create(validProps));
        expect(event.isCreator("")).toBe(false);
      });
    });
  });
});
