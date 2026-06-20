import { describe, expect, it } from "vitest";
import { extractErrorMessage } from "../errorUtils";

describe("extractErrorMessage", () => {
  it("extracts message from Error object", () => {
    expect(extractErrorMessage(new Error("test error"))).toBe("test error");
  });

  it("returns string as-is", () => {
    expect(extractErrorMessage("string error")).toBe("string error");
  });

  it("returns Unknown error for null", () => {
    expect(extractErrorMessage(null)).toBe("Unknown error");
  });

  it("returns Unknown error for undefined", () => {
    expect(extractErrorMessage(undefined)).toBe("Unknown error");
  });

  it("extracts message from object with message property", () => {
    expect(extractErrorMessage({ message: "object error" })).toBe("object error");
  });

  it("returns Unknown error for number", () => {
    expect(extractErrorMessage(123)).toBe("Unknown error");
  });

  it("returns Unknown error for plain object without message", () => {
    expect(extractErrorMessage({ foo: "bar" })).toBe("Unknown error");
  });

  it("handles nested error objects", () => {
    const nested = new Error("nested");
    expect(extractErrorMessage(nested)).toBe("nested");
  });
});
