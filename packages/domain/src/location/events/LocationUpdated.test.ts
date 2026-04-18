import { describe, it, expect } from "bun:test";
import { LocationUpdated, InvalidCoordinatesError } from "./LocationUpdated";
import { UserId } from "../../user/value-objects/UserId";

describe("[UNIT] LocationUpdated", () => {
  it("can be constructed with all required fields", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const friendId1 = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12");
    const friendId2 = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13");
    const timestamp = new Date("2024-01-15T10:30:00Z");

    const event = new LocationUpdated({
      eventId: "evt-123",
      userId,
      coordinates: {
        latitude: 52.52,
        longitude: 13.405,
      },
      accuracy: 10.5,
      timestamp,
      sharingList: [friendId1, friendId2],
    });

    expect(event._tag).toBe("LocationUpdated");
    expect(event.version).toBe(1);
    expect(event.eventId).toBe("evt-123");
    expect(event.userId).toBe(userId);
    expect(event.aggregateId).toBe(userId);
    expect(event.coordinates.latitude).toBe(52.52);
    expect(event.coordinates.longitude).toBe(13.405);
    expect(event.accuracy).toBe(10.5);
    expect(event.timestamp).toBe(timestamp);
    expect(event.occurredAt).toBe(timestamp);
    expect(event.sharingList).toEqual([friendId1, friendId2]);
  });

  it("implements IDomainEvent interface correctly", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const timestamp = new Date("2024-01-15T10:30:00Z");

    const event = new LocationUpdated({
      eventId: "evt-456",
      userId,
      coordinates: {
        latitude: 40.7128,
        longitude: -74.006,
      },
      accuracy: 5.0,
      timestamp,
      sharingList: [],
    });

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
    const event = new LocationUpdated({
      eventId: "evt-789",
      userId: UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"),
      coordinates: {
        latitude: 0,
        longitude: 0,
      },
      timestamp: new Date(),
      sharingList: [],
    });

    expect(event._tag).toBe("LocationUpdated");
  });

  it("has readonly version property", () => {
    const event = new LocationUpdated({
      eventId: "evt-abc",
      userId: UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"),
      coordinates: {
        latitude: 0,
        longitude: 0,
      },
      timestamp: new Date(),
      sharingList: [],
    });

    expect(event.version).toBe(1);
  });

  it("aggregateId returns userId as string", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const event = new LocationUpdated({
      eventId: "evt-def",
      userId,
      coordinates: {
        latitude: 51.5074,
        longitude: -0.1278,
      },
      timestamp: new Date(),
      sharingList: [],
    });

    expect(event.aggregateId).toBe(userId);
    expect(typeof event.aggregateId).toBe("string");
  });

  it("supports undefined accuracy", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const event = new LocationUpdated({
      eventId: "evt-undefined-acc",
      userId,
      coordinates: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      timestamp: new Date(),
      sharingList: [],
    });

    expect(event.accuracy).toBeUndefined();
  });

  it("supports empty sharing list", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const event = new LocationUpdated({
      eventId: "evt-empty",
      userId,
      coordinates: {
        latitude: 48.8566,
        longitude: 2.3522,
      },
      accuracy: 15.0,
      timestamp: new Date(),
      sharingList: [],
    });

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

    const event = new LocationUpdated({
      eventId: "evt-multi",
      userId,
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
      accuracy: 8.0,
      timestamp: new Date(),
      sharingList: friendIds,
    });

    expect(event.sharingList.length).toBe(5);
    expect(event.sharingList).toEqual(friendIds);
  });

  it("validates latitude minimum bound (-90)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    expect(() => {
      new LocationUpdated({
        eventId: "evt-invalid",
        userId,
        coordinates: {
          latitude: -90.1,
          longitude: 0,
        },
        timestamp: new Date(),
        sharingList: [],
      });
    }).toThrow(InvalidCoordinatesError);
  });

  it("validates latitude maximum bound (90)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    expect(() => {
      new LocationUpdated({
        eventId: "evt-invalid",
        userId,
        coordinates: {
          latitude: 90.1,
          longitude: 0,
        },
        timestamp: new Date(),
        sharingList: [],
      });
    }).toThrow(InvalidCoordinatesError);
  });

  it("validates longitude minimum bound (-180)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    expect(() => {
      new LocationUpdated({
        eventId: "evt-invalid",
        userId,
        coordinates: {
          latitude: 0,
          longitude: -180.1,
        },
        timestamp: new Date(),
        sharingList: [],
      });
    }).toThrow(InvalidCoordinatesError);
  });

  it("validates longitude maximum bound (180)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    expect(() => {
      new LocationUpdated({
        eventId: "evt-invalid",
        userId,
        coordinates: {
          latitude: 0,
          longitude: 180.1,
        },
        timestamp: new Date(),
        sharingList: [],
      });
    }).toThrow(InvalidCoordinatesError);
  });

  it("validates accuracy cannot be negative", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    expect(() => {
      new LocationUpdated({
        eventId: "evt-invalid",
        userId,
        coordinates: {
          latitude: 0,
          longitude: 0,
        },
        accuracy: -1,
        timestamp: new Date(),
        sharingList: [],
      });
    }).toThrow(InvalidCoordinatesError);
  });

  it("accepts boundary latitude values (-90 and 90)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    const eventMin = new LocationUpdated({
      eventId: "evt-min",
      userId,
      coordinates: {
        latitude: -90,
        longitude: 0,
      },
      timestamp: new Date(),
      sharingList: [],
    });
    expect(eventMin.coordinates.latitude).toBe(-90);

    const eventMax = new LocationUpdated({
      eventId: "evt-max",
      userId,
      coordinates: {
        latitude: 90,
        longitude: 0,
      },
      timestamp: new Date(),
      sharingList: [],
    });
    expect(eventMax.coordinates.latitude).toBe(90);
  });

  it("accepts boundary longitude values (-180 and 180)", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    const eventMin = new LocationUpdated({
      eventId: "evt-min",
      userId,
      coordinates: {
        latitude: 0,
        longitude: -180,
      },
      timestamp: new Date(),
      sharingList: [],
    });
    expect(eventMin.coordinates.longitude).toBe(-180);

    const eventMax = new LocationUpdated({
      eventId: "evt-max",
      userId,
      coordinates: {
        latitude: 0,
        longitude: 180,
      },
      timestamp: new Date(),
      sharingList: [],
    });
    expect(eventMax.coordinates.longitude).toBe(180);
  });

  it("accepts zero accuracy", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    const event = new LocationUpdated({
      eventId: "evt-zero",
      userId,
      coordinates: {
        latitude: 0,
        longitude: 0,
      },
      accuracy: 0,
      timestamp: new Date(),
      sharingList: [],
    });
    expect(event.accuracy).toBe(0);
  });

  it("preserves branded ID types for type safety", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    const friendId = UserId.create("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01");

    const event = new LocationUpdated({
      eventId: "evt-branded",
      userId,
      coordinates: {
        latitude: 45.4642,
        longitude: 9.19,
      },
      accuracy: 3.5,
      timestamp: new Date(),
      sharingList: [friendId],
    });

    expect(event.userId).toBe(userId);
    expect(event.sharingList[0]).toBe(friendId);
  });

  it("works with coordinates at equator and prime meridian", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    const event = new LocationUpdated({
      eventId: "evt-origin",
      userId,
      coordinates: {
        latitude: 0,
        longitude: 0,
      },
      timestamp: new Date(),
      sharingList: [],
    });

    expect(event.coordinates.latitude).toBe(0);
    expect(event.coordinates.longitude).toBe(0);
  });

  it("works with negative coordinates in southern/western hemispheres", () => {
    const userId = UserId.create("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

    // Buenos Aires: -34.6037, -58.3816
    const event = new LocationUpdated({
      eventId: "evt-south-america",
      userId,
      coordinates: {
        latitude: -34.6037,
        longitude: -58.3816,
      },
      accuracy: 12.0,
      timestamp: new Date(),
      sharingList: [],
    });

    expect(event.coordinates.latitude).toBe(-34.6037);
    expect(event.coordinates.longitude).toBe(-58.3816);
  });
});
