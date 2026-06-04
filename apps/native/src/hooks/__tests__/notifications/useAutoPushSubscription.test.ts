import { describe, expect, it } from "@jest/globals";
import {
  isAutoPushBlocked,
  parseToken,
  resolveProjectId,
} from "../../notifications/useAutoPushSubscription";

describe("resolveProjectId", () => {
  it("should return undefined when no config is available", () => {
    const result = resolveProjectId();
    expect(result).toBeUndefined();
  });
});

describe("parseToken", () => {
  it("should return null for null input", () => {
    expect(parseToken(null)).toBeNull();
  });

  it("should return null for non-object input", () => {
    expect(parseToken("string")).toBeNull();
    expect(parseToken(123)).toBeNull();
    expect(parseToken(undefined)).toBeNull();
  });

  it("should return null when data is missing", () => {
    expect(parseToken({})).toBeNull();
    expect(parseToken({ other: "field" })).toBeNull();
  });

  it("should return null when data is not a string", () => {
    expect(parseToken({ data: 123 })).toBeNull();
    expect(parseToken({ data: null })).toBeNull();
    expect(parseToken({ data: true })).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(parseToken({ data: "" })).toBeNull();
    expect(parseToken({ data: "   " })).toBeNull();
  });

  it("should return trimmed token string", () => {
    expect(parseToken({ data: "my-token" })).toBe("my-token");
  });

  it("should trim whitespace from token", () => {
    expect(parseToken({ data: "  token-with-spaces  " })).toBe("token-with-spaces");
  });
});

describe("isAutoPushBlocked", () => {
  it("should return true when no session", () => {
    expect(isAutoPushBlocked(false, "user1", false, false, false, null)).toBe(true);
  });

  it("should return true when no authUserId", () => {
    expect(isAutoPushBlocked(true, null, false, false, false, null)).toBe(true);
  });

  it("should return true when status is loading", () => {
    expect(isAutoPushBlocked(true, "user1", true, false, false, null)).toBe(true);
  });

  it("should return true when already subscribed", () => {
    expect(isAutoPushBlocked(true, "user1", false, true, false, null)).toBe(true);
  });

  it("should return true when mutation is pending", () => {
    expect(isAutoPushBlocked(true, "user1", false, false, true, null)).toBe(true);
  });

  it("should return true when already attempted for user", () => {
    expect(isAutoPushBlocked(true, "user1", false, false, false, "user1")).toBe(true);
  });

  it("should return false when all conditions allow", () => {
    expect(isAutoPushBlocked(true, "user1", false, false, false, null)).toBe(false);
  });
});
