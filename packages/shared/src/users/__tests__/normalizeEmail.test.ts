import { describe, it, expect } from "vitest";
import { normalizeEmail } from "../normalizeEmail";

describe("normalizeEmail", () => {
  it("trims whitespace from email", () => {
    expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
    expect(normalizeEmail("\tuser@example.com\n")).toBe("user@example.com");
  });

  it("converts email to lowercase", () => {
    expect(normalizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
    expect(normalizeEmail("User@Example.COM")).toBe("user@example.com");
  });

  it("handles empty string", () => {
    expect(normalizeEmail("")).toBe("");
    expect(normalizeEmail("   ")).toBe("");
  });
});
