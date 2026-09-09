import { describe, expect, it } from "@jest/globals";
import type { FriendLocationSnapshot } from "../../map/useMapLocationStream";
import { mergeFallbackLocations, mergeFallbackUsers } from "../../map/useMapLocationStream";

const friend = (overrides: Partial<FriendLocationSnapshot> = {}): FriendLocationSnapshot => ({
  userId: "friend-1",
  latitude: 52.2297,
  longitude: 21.0122,
  timestamp: "2026-01-02T00:00:00.000Z",
  isSharingLocation: true,
  user: { id: "friend-1", firstName: "Ada", lastName: "Lovelace", image: null },
  ...overrides,
});

describe("mergeFallbackLocations", () => {
  it("populates the map when the stream produced nothing", () => {
    const result = mergeFallbackLocations({}, [friend()]);

    expect(result).toEqual({
      "friend-1": {
        latitude: 52.2297,
        longitude: 21.0122,
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    });
  });

  it("returns the same object when there is nothing to poll", () => {
    const prev = {};
    expect(mergeFallbackLocations(prev, [])).toBe(prev);
    expect(mergeFallbackLocations(prev, undefined)).toBe(prev);
  });

  it("does not rewind a fresher position already delivered by the stream", () => {
    const prev = {
      "friend-1": { latitude: 1, longitude: 2, updatedAt: "2026-02-01T00:00:00.000Z" },
    };

    expect(mergeFallbackLocations(prev, [friend()])).toBe(prev);
  });

  it("replaces a stale stream position with newer polled data", () => {
    const prev = {
      "friend-1": { latitude: 1, longitude: 2, updatedAt: "2025-01-01T00:00:00.000Z" },
    };

    const result = mergeFallbackLocations(prev, [friend()]);

    expect(result).not.toBe(prev);
    expect(result["friend-1"]?.latitude).toBe(52.2297);
  });

  it("accepts Date and epoch-millis timestamps", () => {
    const asDate = mergeFallbackLocations({}, [
      friend({ timestamp: new Date("2026-01-02T00:00:00.000Z") }),
    ]);
    expect(asDate["friend-1"]).toBeDefined();

    const asMillis = mergeFallbackLocations(
      { "friend-1": { latitude: 1, longitude: 2, updatedAt: 1000 } },
      [friend({ timestamp: 2000 })],
    );
    expect(asMillis["friend-1"]?.updatedAt).toBe(2000);
  });

  it("skips rows that cannot be placed on the map", () => {
    expect(mergeFallbackLocations({}, [friend({ userId: null })])).toEqual({});
    expect(mergeFallbackLocations({}, [friend({ latitude: null })])).toEqual({});
    expect(mergeFallbackLocations({}, [friend({ longitude: undefined })])).toEqual({});
  });

  it("skips friends who stopped sharing", () => {
    expect(mergeFallbackLocations({}, [friend({ isSharingLocation: false })])).toEqual({});
  });
});

describe("mergeFallbackUsers", () => {
  it("adds display data for friends the stream has not described", () => {
    expect(mergeFallbackUsers({}, [friend()])).toEqual({
      "friend-1": { name: "Ada Lovelace", image: undefined },
    });
  });

  it("leaves stream-provided user data untouched", () => {
    const prev = { "friend-1": { name: "From stream", image: "signed-url" } };

    expect(mergeFallbackUsers(prev, [friend()])).toBe(prev);
  });

  it("keeps the avatar url when the poll supplies one", () => {
    const result = mergeFallbackUsers({}, [
      friend({ user: { id: "friend-1", firstName: "Ada", lastName: null, image: "url" } }),
    ]);

    expect(result["friend-1"]).toEqual({ name: "Ada", image: "url" });
  });

  it("returns the same object when there is nothing to poll", () => {
    const prev = {};
    expect(mergeFallbackUsers(prev, undefined)).toBe(prev);
    expect(mergeFallbackUsers(prev, [])).toBe(prev);
  });
});
