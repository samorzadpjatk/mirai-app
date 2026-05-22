import { describe, it, expect } from "@jest/globals";
import {
  buildLocationUpdateData,
  buildUserDataFromLocationUser,
  removeUserFromLocations,
  isUnauthorizedError,
  isValidLocationEvent,
} from "../../map/useMapLocationStream";

describe("buildLocationUpdateData", () => {
  it("should extract latitude, longitude, and timestamp from location", () => {
    const location = {
      coords: { latitude: 52.2297, longitude: 21.0122 },
      timestamp: "2024-01-15T10:30:00Z",
    };

    const result = buildLocationUpdateData(location);

    expect(result).toEqual({
      latitude: 52.2297,
      longitude: 21.0122,
      updatedAt: "2024-01-15T10:30:00Z",
    });
  });

  it("should handle numeric timestamp", () => {
    const location = {
      coords: { latitude: 0, longitude: 0 },
      timestamp: 1705312200000,
    };

    const result = buildLocationUpdateData(location);

    expect(result).toEqual({
      latitude: 0,
      longitude: 0,
      updatedAt: 1705312200000,
    });
  });
});

describe("buildUserDataFromLocationUser", () => {
  it("should build user data with formatted name and image", () => {
    const user = {
      firstName: "John",
      lastName: "Doe",
      image: "https://example.com/avatar.jpg",
    };

    const result = buildUserDataFromLocationUser(user);

    expect(result).toEqual({
      name: "John Doe",
      image: "https://example.com/avatar.jpg",
    });
  });

  it("should handle null firstName and lastName", () => {
    const user = {
      firstName: null,
      lastName: null,
      image: null,
    };

    const result = buildUserDataFromLocationUser(user);

    expect(result).toEqual({
      name: undefined,
      image: undefined,
    });
  });

  it("should handle partial name data", () => {
    const user = {
      firstName: "Jane",
      lastName: null,
      image: undefined,
    };

    const result = buildUserDataFromLocationUser(user);

    expect(result).toEqual({
      name: "Jane",
      image: undefined,
    });
  });
});

describe("removeUserFromLocations", () => {
  it("should remove user from locations record", () => {
    const prev = {
      user1: { latitude: 52, longitude: 21 },
      user2: { latitude: 53, longitude: 22 },
    };

    const result = removeUserFromLocations(prev, "user1");

    expect(result).toEqual({
      user2: { latitude: 53, longitude: 22 },
    });
  });

  it("should not mutate original object", () => {
    const prev = {
      user1: { latitude: 52, longitude: 21 },
    };

    const result = removeUserFromLocations(prev, "user1");

    expect(result).toEqual({});
    expect(prev).toEqual({
      user1: { latitude: 52, longitude: 21 },
    });
  });

  it("should handle non-existent userId gracefully", () => {
    const prev = {
      user1: { latitude: 52, longitude: 21 },
    };

    const result = removeUserFromLocations(prev, "nonexistent");

    expect(result).toEqual({
      user1: { latitude: 52, longitude: 21 },
    });
  });
});

describe("isUnauthorizedError", () => {
  it("should return true for Error with UNAUTHORIZED message", () => {
    expect(isUnauthorizedError(new Error("UNAUTHORIZED"))).toBe(true);
  });

  it("should return true for Error containing UNAUTHORIZED", () => {
    expect(isUnauthorizedError(new Error("User UNAUTHORIZED to access"))).toBe(true);
  });

  it("should return false for Error without UNAUTHORIZED", () => {
    expect(isUnauthorizedError(new Error("Network error"))).toBe(false);
  });

  it("should return false for non-Error value", () => {
    expect(isUnauthorizedError("string")).toBe(false);
    expect(isUnauthorizedError(null)).toBe(false);
    expect(isUnauthorizedError(123)).toBe(false);
  });
});

describe("isValidLocationEvent", () => {
  it("should return true for upsert event with location", () => {
    expect(isValidLocationEvent({ type: "upsert", location: { lat: 1 } })).toBe(true);
  });

  it("should return false for upsert event without location", () => {
    expect(isValidLocationEvent({ type: "upsert" })).toBe(false);
  });

  it("should return true for delete event with userId", () => {
    expect(isValidLocationEvent({ type: "delete", userId: "user1" })).toBe(true);
  });

  it("should return false for delete event without userId", () => {
    expect(isValidLocationEvent({ type: "delete" })).toBe(false);
  });

  it("should return false for unknown event type", () => {
    expect(isValidLocationEvent({ type: "unknown" })).toBe(false);
  });
});
