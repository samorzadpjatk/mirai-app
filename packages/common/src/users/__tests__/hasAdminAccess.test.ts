import { describe, expect, it } from "vitest";
import { hasAdminAccess } from "../hasAdminAccess";

describe("hasAdminAccess", () => {
  it("returns true for ADMIN role", () => {
    expect(hasAdminAccess("ADMIN")).toBe(true);
  });

  it("returns true for MODERATOR role", () => {
    expect(hasAdminAccess("MODERATOR")).toBe(true);
  });

  it("returns false for USER role", () => {
    expect(hasAdminAccess("USER")).toBe(false);
  });

  it("returns false for an unknown string", () => {
    expect(hasAdminAccess("SOMETHING")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(hasAdminAccess(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(hasAdminAccess(null)).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(hasAdminAccess("")).toBe(false);
  });

  it("returns false for case variations", () => {
    expect(hasAdminAccess("admin")).toBe(false);
    expect(hasAdminAccess("moderator")).toBe(false);
    expect(hasAdminAccess("Admin")).toBe(false);
  });
});
