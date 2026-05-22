import { describe, it, expect } from "@jest/globals";
import {
  resolveTripIdForUpdate,
  resolveTripIdForRemove,
} from "../../groups/useGroupEditor";

describe("resolveTripIdForUpdate", () => {
  it("should return provided tripId when available", () => {
    expect(resolveTripIdForUpdate("trip1", "trip2")).toBe("trip1");
  });

  it("should fallback to group tripId when no provided tripId", () => {
    expect(resolveTripIdForUpdate(undefined, "trip2")).toBe("trip2");
  });

  it("should throw when neither tripId is available", () => {
    expect(() => resolveTripIdForUpdate(undefined, undefined)).toThrow(
      "Missing tripId for updateGroup",
    );
  });
});

describe("resolveTripIdForRemove", () => {
  it("should return group tripId", () => {
    expect(resolveTripIdForRemove("trip1")).toBe("trip1");
  });

  it("should throw when group tripId is missing", () => {
    expect(() => resolveTripIdForRemove(undefined)).toThrow("Missing tripId for removeUser");
  });
});
