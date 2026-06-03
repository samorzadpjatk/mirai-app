import { describe, it, expect } from "vitest";
import { validateUrlProtocol, isValidHttpUrl } from "../url-validation";
import { ORPCError } from "@orpc/server";

describe("validateUrlProtocol", () => {
  it("should allow HTTP URLs", () => {
    expect(() => validateUrlProtocol("http://example.com")).not.toThrow();
  });

  it("should allow HTTPS URLs", () => {
    expect(() => validateUrlProtocol("https://example.com")).not.toThrow();
  });

  it("should reject javascript: URLs", () => {
    expect(() => validateUrlProtocol("javascript:alert(1)")).toThrow(ORPCError);
  });

  it("should reject data: URLs", () => {
    expect(() => validateUrlProtocol("data:text/html,<script>alert(1)</script>")).toThrow(
      ORPCError,
    );
  });

  it("should reject file: URLs", () => {
    expect(() => validateUrlProtocol("file:///etc/passwd")).toThrow(ORPCError);
  });

  it("should reject ftp: URLs", () => {
    expect(() => validateUrlProtocol("ftp://example.com")).toThrow(ORPCError);
  });

  it("should not throw for empty strings", () => {
    expect(() => validateUrlProtocol("")).not.toThrow();
  });

  it("should not throw for undefined", () => {
    expect(() => validateUrlProtocol(undefined)).not.toThrow();
  });

  it("should allow custom protocols when specified", () => {
    expect(() =>
      validateUrlProtocol("ftp://example.com", ["http:", "https:", "ftp:"]),
    ).not.toThrow();
  });

  it("should reject invalid URL formats", () => {
    expect(() => validateUrlProtocol("not-a-url")).toThrow(ORPCError);
  });
});

describe("isValidHttpUrl", () => {
  it("should return true for HTTP URLs", () => {
    expect(isValidHttpUrl("http://example.com")).toBe(true);
  });

  it("should return true for HTTPS URLs", () => {
    expect(isValidHttpUrl("https://example.com/path?query=1")).toBe(true);
  });

  it("should return false for javascript: URLs", () => {
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("should return false for data: URLs", () => {
    expect(isValidHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("should return false for file: URLs", () => {
    expect(isValidHttpUrl("file:///etc/passwd")).toBe(false);
  });

  it("should return false for empty strings", () => {
    expect(isValidHttpUrl("")).toBe(false);
  });

  it("should return false for invalid URL formats", () => {
    expect(isValidHttpUrl("not-a-url")).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isValidHttpUrl(undefined)).toBe(false);
  });
});
