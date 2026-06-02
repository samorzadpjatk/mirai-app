import { describe, it, expect } from "vitest";
import { calculateBanDuration, buildBanMetadata } from "../banUtils";

describe("calculateBanDuration", () => {
  it("returns bannedUntil and banDuration for a valid future timestamp", () => {
    const futureMs = Date.now() + 5 * 60000; // 5 minutes from now
    const result = calculateBanDuration(futureMs);

    expect(result.bannedUntil).toEqual(new Date(futureMs));
    expect(result.banDuration).toBe("5m");
  });

  it("throws for NaN timestamp", () => {
    expect(() => calculateBanDuration(NaN)).toThrow("Invalid ban date");
  });

  it("throws for a past timestamp", () => {
    const pastMs = Date.now() - 60000;
    expect(() => calculateBanDuration(pastMs)).toThrow("Ban date must be in the future");
  });

  it("throws for a current timestamp", () => {
    const nowMs = Date.now();
    expect(() => calculateBanDuration(nowMs)).toThrow("Ban date must be in the future");
  });

  it("rounds up fractional minutes", () => {
    const futureMs = Date.now() + 65000; // 65 seconds = 1.08 minutes
    const result = calculateBanDuration(futureMs);
    expect(result.banDuration).toBe("2m");
  });
});

describe("buildBanMetadata", () => {
  it("merges ban_reason into existing metadata", () => {
    const existing = { role: "user" };
    const result = buildBanMetadata(existing, "Spam");

    expect(result).toEqual({ role: "user", ban_reason: "Spam" });
  });

  it("sets ban_reason to null when no reason provided", () => {
    const existing = { role: "user" };
    const result = buildBanMetadata(existing);

    expect(result).toEqual({ role: "user", ban_reason: null });
  });

  it("sets ban_reason to null for empty string reason", () => {
    const existing = { role: "user" };
    const result = buildBanMetadata(existing, "");

    expect(result).toEqual({ role: "user", ban_reason: null });
  });

  it("sets ban_reason to null for whitespace-only reason", () => {
    const existing = { role: "user" };
    const result = buildBanMetadata(existing, "   ");

    expect(result).toEqual({ role: "user", ban_reason: null });
  });

  it("trims the reason before storing", () => {
    const existing = { role: "user" };
    const result = buildBanMetadata(existing, "  Violation  ");

    expect(result).toEqual({ role: "user", ban_reason: "Violation" });
  });

  it("preserves all existing metadata fields", () => {
    const existing = { role: "admin", team: "blue", score: 42 };
    const result = buildBanMetadata(existing, "Cheating");

    expect(result).toEqual({
      role: "admin",
      team: "blue",
      score: 42,
      ban_reason: "Cheating",
    });
  });
});
