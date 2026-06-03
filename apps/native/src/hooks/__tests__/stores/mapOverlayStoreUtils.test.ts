import { describe, expect, it } from "@jest/globals";
import {
  buildFocusStateFromUser,
  getNextMapTheme,
  isValidCoordinate,
  removeUserFromSharingSettings,
  removeUserFromSharingUserIds,
  shouldCollapseList,
} from "~/stores/map/mapOverlayStore";

describe("getNextMapTheme", () => {
  it("should toggle from dark to light", () => {
    expect(getNextMapTheme("dark")).toBe("light");
  });

  it("should toggle from light to dark", () => {
    expect(getNextMapTheme("light")).toBe("dark");
  });
});

describe("isValidCoordinate", () => {
  it("should return true for valid coordinate", () => {
    expect(isValidCoordinate([52.2297, 21.0122])).toBe(true);
  });

  it("should return false for null", () => {
    expect(isValidCoordinate(null)).toBe(false);
  });

  it("should return false for invalid length", () => {
    expect(isValidCoordinate([52.2297] as number[] as [number, number])).toBe(false);
    expect(isValidCoordinate([52.2297, 21.0122, 0] as number[] as [number, number])).toBe(false);
  });
});

describe("shouldCollapseList", () => {
  it("should return true when list is expanded", () => {
    expect(shouldCollapseList(true)).toBe(true);
  });

  it("should return false when list is not expanded", () => {
    expect(shouldCollapseList(false)).toBe(false);
  });
});

describe("buildFocusStateFromUser", () => {
  it("should build focus state from user coordinate", () => {
    const user = { coordinate: [52.2297, 21.0122] as [number, number] };
    const result = buildFocusStateFromUser(user);
    expect(result).toEqual({
      followMode: "user",
      focusedCoordinate: [52.2297, 21.0122],
    });
  });
});

describe("removeUserFromSharingUserIds", () => {
  it("should remove user from sharing user ids", () => {
    const result = removeUserFromSharingUserIds(["user1", "user2", "user3"], "user2");
    expect(result).toEqual(["user1", "user3"]);
  });

  it("should handle empty array", () => {
    expect(removeUserFromSharingUserIds([], "user1")).toEqual([]);
  });

  it("should handle non-existent user", () => {
    expect(removeUserFromSharingUserIds(["user1"], "user2")).toEqual(["user1"]);
  });
});

describe("removeUserFromSharingSettings", () => {
  it("should remove user from sharing settings", () => {
    const settings = {
      usersToShareWith: [
        { id: "user1", firstName: "John" },
        { id: "user2", firstName: "Jane" },
      ],
    };
    const result = removeUserFromSharingSettings(settings, "user1");
    expect(result).toEqual({
      usersToShareWith: [{ id: "user2", firstName: "Jane" }],
    });
  });

  it("should return null when settings is null", () => {
    expect(removeUserFromSharingSettings(null, "user1")).toBeNull();
  });

  it("should return empty usersToShareWith when input array is empty", () => {
    const result = removeUserFromSharingSettings({ usersToShareWith: [] }, "user1");
    expect(result).toEqual({ usersToShareWith: [] });
  });
});
