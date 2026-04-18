import { describe, it, expect } from "bun:test";
import { LocationUpdated, InvalidCoordinatesError } from "./LocationUpdated";
import { UserId } from "../../user/value-objects/UserId";

describe("[UNIT] LocationUpdated", () => {
  it("can be constructed with all required fields", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const friendId1 = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12");
    const friendId2 = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13");
    const occurredAt = new Date("2024-01-15T10:30:00Z");

    const event = new LocationUpdated(
      "evt-123",
      userId,
      52.5200,
      13.4050,
      10.5,
      occurredAt,
      [friendId1, friendId2],
    );

    expect(event._tag).toBe("LocationUpdated");
    expect(event.version).toBe(1);
    expect(event.eventId).toBe("evt-123");
    expect(event.userId).toBe(userId);
    expect(event.aggregateId).toBe(userId);
    expect(event.latitude).toBe(52.5200);
    expect(event.longitude).toBe(13.4050);
    expect(event.accuracy).toBe(10.5);
    expect(event.occurredAt).toBe(occurredAt);
    expect(event.sharingList).toEqual([friendId1, friendId2]);
  });

  it("implements IDomainEvent interface correctly", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const occurredAt = new Date("2024-01-15T10:30:00Z");

    const event = new LocationUpdated(
      "evt-456",
      userId,
      40.7128,
      -74.0060,
      5.0,
      occurredAt,
      [],
    );

    // Verify all IDomainEvent fields are present
    expect(event._tag).toBeDefined();
    expect(typeof event._tag).toBe("string");
    expect(event.aggregateId).toBeDefined();
    expect(typeof event.aggregateId).toBe("string");
    expect(event.occurredAt).toBeDefined();
    expect(event.occurredAt instanceof Date).toBe(true);
    expect(event.version).toBeDefined();
    expect(typeof event.version).toBe("number");
  });

  it("has readonly _tag property", () => {
    const event = new LocationUpdated(
      "evt-789",
      UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"),
      0,
      0,
      null,
      new Date(),
      [],
    );

    expect(event._tag).toBe("LocationUpdated");
  });

  it("has readonly version property", () => {
    const event = new LocationUpdated(
      "evt-abc",
      UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"),
      0,
      0,
      null,
      new Date(),
      [],
    );

    expect(event.version).toBe(1);
  });

  it("aggregateId returns userId as string", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const event = new LocationUpdated(
      "evt-def",
      userId,
      51.5074,
      -0.1278,
      null,
      new Date(),
      [],
    );

    expect(event.aggregateId).toBe(userId);
    expect(typeof event.aggregateId).toBe("string");
  });

  it("supports null accuracy", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const event = new LocationUpdated(
      "evt-null-acc",
      userId,
      35.6762,
      139.6503,
      null,
      new Date(),
      [],
    );

    expect(event.accuracy).toBeNull();
  });

  it("supports empty sharing list", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const event = new LocationUpdated(
      "evt-empty",
      userId,
      48.8566,
      2.3522,
      15.0,
      new Date(),
      [],
    );

    expect(event.sharingList).toEqual([]);
    expect(event.sharingList.length).toBe(0);
  });

  it("supports multiple friends in sharing list", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const friendIds = [
      UserId.create("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01"),
      UserId.create("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02"),
      UserId.create("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03"),
      UserId.create("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04"),
      UserId.create("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05"),
    ];

    const event = new LocationUpdated(
      "evt-multi",
      userId,
      37.7749,
      -122.4194,
      8.0,
      new Date(),
      friendIds,
    );

    expect(event.sharingList.length).toBe(5);
    expect(event.sharingList).toEqual(friendIds);
  });

  it("validates latitude minimum bound (-90)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    expect(() => {
      new LocationUpdated(
        "evt-invalid",
        userId,
        -90.1,
        0,
        null,
        new Date(),
        [],
      );
    }).toThrow(InvalidCoordinatesError);
  });

  it("validates latitude maximum bound (90)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    expect(() => {
      new LocationUpdated(
        "evt-invalid",
        userId,
        90.1,
        0,
        null,
        new Date(),
        [],
      );
    }).toThrow(InvalidCoordinatesError);
  });

  it("validates longitude minimum bound (-180)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    expect(() => {
      new LocationUpdated(
        "evt-invalid",
        userId,
        0,
        -180.1,
        null,
        new Date(),
        [],
      );
    }).toThrow(InvalidCoordinatesError);
  });

  it("validates longitude maximum bound (180)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    expect(() => {
      new LocationUpdated(
        "evt-invalid",
        userId,
        0,
        180.1,
        null,
        new Date(),
        [],
      );
    }).toThrow(InvalidCoordinatesError);
  });

  it("validates accuracy cannot be negative", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    expect(() => {
      new LocationUpdated(
        "evt-invalid",
        userId,
        0,
        0,
        -1,
        new Date(),
        [],
      );
    }).toThrow(InvalidCoordinatesError);
  });

  it("accepts boundary latitude values (-90 and 90)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    const eventMin = new LocationUpdated(
      "evt-min",
      userId,
      -90,
      0,
      null,
      new Date(),
      [],
    );
    expect(eventMin.latitude).toBe(-90);

    const eventMax = new LocationUpdated(
      "evt-max",
      userId,
      90,
      0,
      null,
      new Date(),
      [],
    );
    expect(eventMax.latitude).toBe(90);
  });

  it("accepts boundary longitude values (-180 and 180)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    const eventMin = new LocationUpdated(
      "evt-min",
      userId,
      0,
      -180,
      null,
      new Date(),
      [],
    );
    expect(eventMin.longitude).toBe(-180);

    const eventMax = new LocationUpdated(
      "evt-max",
      userId,
      0,
      180,
      null,
      new Date(),
      [],
    );
    expect(eventMax.longitude).toBe(180);
  });

  it("accepts zero accuracy", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    const event = new LocationUpdated(
      "evt-zero",
      userId,
      0,
      0,
      0,
      new Date(),
      [],
    );
    expect(event.accuracy).toBe(0);
  });

  it("preserves branded ID types for type safety", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const friendId = UserId.create("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01");

    const event = new LocationUpdated(
      "evt-branded",
      userId,
      45.4642,
      9.1900,
      3.5,
      new Date(),
      [friendId],
    );

    expect(event.userId).toBe(userId);
    expect(event.sharingList[0]).toBe(friendId);
  });

  it("works with coordinates at equator and prime meridian", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    const event = new LocationUpdated(
      "evt-origin",
      userId,
      0,
      0,
      null,
      new Date(),
      [],
    );

    expect(event.latitude).toBe(0);
    expect(event.longitude).toBe(0);
  });

  it("works with negative coordinates in southern/western hemispheres", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    // Buenos Aires: -34.6037, -58.3816
    const event = new LocationUpdated(
      "evt-south-america",
      userId,
      -34.6037,
      -58.3816,
      12.0,
      new Date(),
      [],
    );

    expect(event.latitude).toBe(-34.6037);
    expect(event.longitude).toBe(-58.3816);
  });
});
