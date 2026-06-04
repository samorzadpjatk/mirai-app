import { describe, expect, it } from "vitest";
import { normalizeGroupImageInput, toUserWithEmail } from "../imageUtils";

describe("toUserWithEmail", () => {
  it("adds email from lookup map", () => {
    const user = { id: "u1", firstName: "John", authUserId: "auth-1" };
    const emailMap = new Map([["auth-1", "john@example.com"]]);
    const result = toUserWithEmail(user, emailMap);
    expect(result).toEqual({ id: "u1", firstName: "John", email: "john@example.com" });
  });

  it("adds null email when authUserId not in map", () => {
    const user = { id: "u1", firstName: "John", authUserId: "auth-1" };
    const emailMap = new Map<string, string | null>();
    const result = toUserWithEmail(user, emailMap);
    expect(result.email).toBeNull();
  });

  it("adds null email when authUserId is null", () => {
    const user = { id: "u1", firstName: "John", authUserId: null };
    const emailMap = new Map([["auth-1", "john@example.com"]]);
    const result = toUserWithEmail(user, emailMap);
    expect(result.email).toBeNull();
  });

  it("preserves all other properties", () => {
    const user = { id: "u1", firstName: "John", lastName: "Doe", age: 30, authUserId: "auth-1" };
    const emailMap = new Map([["auth-1", "john@example.com"]]);
    const result = toUserWithEmail(user, emailMap);
    expect(result).toEqual({
      id: "u1",
      firstName: "John",
      lastName: "Doe",
      age: 30,
      email: "john@example.com",
    });
  });
});

describe("normalizeGroupImageInput", () => {
  it("returns undefined for empty string", () => {
    expect(normalizeGroupImageInput("")).toBeUndefined();
  });

  it("returns undefined for undefined input", () => {
    expect(normalizeGroupImageInput(undefined)).toBeUndefined();
  });

  it("returns storage path for supabase URL", () => {
    const input = "https://example.com/storage/v1/object/public/groups/image.jpg";
    const result = normalizeGroupImageInput(input);
    expect(result).toBe("groups/image.jpg");
  });

  it("returns original value for non-supabase path", () => {
    const input = "custom-path.jpg";
    expect(normalizeGroupImageInput(input)).toBe("custom-path.jpg");
  });
});
