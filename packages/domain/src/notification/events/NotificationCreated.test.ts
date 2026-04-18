import { describe, it, expect } from "bun:test";
import { NotificationCreated } from "./NotificationCreated";
import { NotificationId } from "../value-objects/NotificationId";
import { TripId } from "../../trip/value-objects/TripId";

describe("[UNIT] NotificationCreated", () => {
  it("can be constructed with all required fields", () => {
    const notificationId = NotificationId.create("cm5abc123def456ghi789jkl0");
    const tripId = TripId.create("cm5xyz789uvw654rst321qpo0");
    const occurredAt = new Date("2024-01-15T10:30:00Z");

    const event = new NotificationCreated(
      notificationId,
      tripId,
      "Trip Invitation",
      "You have been invited to join a trip to Paris",
      "/trips/123",
      ["user-1", "user-2", "user-3"],
      occurredAt,
    );

    expect(event._tag).toBe("NotificationCreated");
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe(notificationId);
    expect(event.tripId).toBe(tripId);
    expect(event.title).toBe("Trip Invitation");
    expect(event.body).toBe("You have been invited to join a trip to Paris");
    expect(event.url).toBe("/trips/123");
    expect(event.userIds).toEqual(["user-1", "user-2", "user-3"]);
    expect(event.occurredAt).toBe(occurredAt);
  });

  it("allows null tripId for non-trip notifications", () => {
    const notificationId = NotificationId.create("cm5abc123def456ghi789jkl0");
    const occurredAt = new Date("2024-01-15T10:30:00Z");

    const event = new NotificationCreated(
      notificationId,
      null,
      "System Maintenance",
      "Scheduled maintenance tonight at 2 AM",
      "/system/maintenance",
      ["user-1"],
      occurredAt,
    );

    expect(event.tripId).toBeNull();
    expect(event._tag).toBe("NotificationCreated");
    expect(event.title).toBe("System Maintenance");
  });

  it("implements IDomainEvent interface correctly", () => {
    const notificationId = NotificationId.create("cm5abc123def456ghi789jkl0");
    const occurredAt = new Date("2024-01-15T10:30:00Z");

    const event = new NotificationCreated(
      notificationId,
      null,
      "Test",
      "Test body",
      "/test",
      ["user-1"],
      occurredAt,
    );

    // Verify all IDomainEvent fields are present
    expect(event._tag).toBeDefined();
    expect(typeof event._tag).toBe("string");
    expect(event.aggregateId).toBeDefined();
    expect(event.occurredAt).toBeDefined();
    expect(event.occurredAt instanceof Date).toBe(true);
    expect(event.version).toBeDefined();
    expect(typeof event.version).toBe("number");
  });

  it("has readonly _tag property", () => {
    const event = new NotificationCreated(
      NotificationId.create("cm5abc123def456ghi789jkl0"),
      null,
      "Test",
      "Test body",
      "/test",
      ["user-1"],
      new Date(),
    );

    // _tag is readonly - TypeScript would error if we tried to assign
    // This test verifies the property exists and has correct value
    expect(event._tag).toBe("NotificationCreated");
  });

  it("has readonly version property", () => {
    const event = new NotificationCreated(
      NotificationId.create("cm5abc123def456ghi789jkl0"),
      null,
      "Test",
      "Test body",
      "/test",
      ["user-1"],
      new Date(),
    );

    expect(event.version).toBe(1);
  });

  it("has readonly constructor parameters", () => {
    const notificationId = NotificationId.create("cm5abc123def456ghi789jkl0");
    const tripId = TripId.create("cm5xyz789uvw654rst321qpo0");
    const occurredAt = new Date("2024-01-15T10:30:00Z");

    const event = new NotificationCreated(
      notificationId,
      tripId,
      "Trip Update",
      "Your trip has been updated",
      "/trips/456",
      ["user-1", "user-2"],
      occurredAt,
    );

    // All fields should be readonly - TypeScript prevents reassignment
    // We verify values are preserved correctly
    expect(event.aggregateId).toBe(notificationId);
    expect(event.tripId).toBe(tripId);
    expect(event.title).toBe("Trip Update");
    expect(event.body).toBe("Your trip has been updated");
    expect(event.url).toBe("/trips/456");
    expect(event.userIds).toEqual(["user-1", "user-2"]);
    expect(event.occurredAt).toBe(occurredAt);
  });

  it("supports multiple userIds for bulk notifications", () => {
    const event = new NotificationCreated(
      NotificationId.create("cm5abc123def456ghi789jkl0"),
      null,
      "Announcement",
      "Important update for all users",
      "/announcements/1",
      ["user-1", "user-2", "user-3", "user-4", "user-5"],
      new Date(),
    );

    expect(event.userIds.length).toBe(5);
    expect(event.userIds).toContain("user-1");
    expect(event.userIds).toContain("user-5");
  });

  it("supports empty userIds array", () => {
    const event = new NotificationCreated(
      NotificationId.create("cm5abc123def456ghi789jkl0"),
      null,
      "Test",
      "Test body",
      "/test",
      [],
      new Date(),
    );

    expect(event.userIds).toEqual([]);
    expect(event.userIds.length).toBe(0);
  });

  it("preserves branded ID types for type safety", () => {
    const notificationId = NotificationId.create("cm5abc123def456ghi789jkl0");
    const tripId = TripId.create("cm5xyz789uvw654rst321qpo0");

    const event = new NotificationCreated(
      notificationId,
      tripId,
      "Test",
      "Test body",
      "/test",
      ["user-1"],
      new Date(),
    );

    // Verify the IDs are the branded types
    expect(event.aggregateId).toBe(notificationId);
    expect(event.tripId).toBe(tripId);
  });
});
