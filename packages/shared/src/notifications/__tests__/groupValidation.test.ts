import { describe, expect, it } from "vitest";
import { extractUserIdsFromParticipants, validateGroupBelongsToTrip } from "../groupValidation";

describe("validateGroupBelongsToTrip", () => {
  it("throws NOT_FOUND when group is null", () => {
    expect(() => validateGroupBelongsToTrip(null, "trip-1")).toThrow("Group not found");
  });

  it("throws NOT_FOUND when group tripId does not match", () => {
    const group = { tripId: "trip-2", isDeleted: false };
    expect(() => validateGroupBelongsToTrip(group, "trip-1")).toThrow("Group not found");
  });

  it("throws NOT_FOUND when group is deleted", () => {
    const group = { tripId: "trip-1", isDeleted: true };
    expect(() => validateGroupBelongsToTrip(group, "trip-1")).toThrow("Group not found");
  });

  it("does not throw when group belongs to trip and is not deleted", () => {
    const group = { tripId: "trip-1", isDeleted: false };
    expect(() => validateGroupBelongsToTrip(group, "trip-1")).not.toThrow();
  });
});

describe("extractUserIdsFromParticipants", () => {
  it("returns empty array for empty participants", () => {
    expect(extractUserIdsFromParticipants([])).toEqual([]);
  });

  it("extracts userIds from participants", () => {
    const participants = [{ userId: "user-1" }, { userId: "user-2" }, { userId: "user-3" }];
    expect(extractUserIdsFromParticipants(participants)).toEqual(["user-1", "user-2", "user-3"]);
  });

  it("preserves order of participants", () => {
    const participants = [{ userId: "z" }, { userId: "a" }, { userId: "m" }];
    expect(extractUserIdsFromParticipants(participants)).toEqual(["z", "a", "m"]);
  });
});
