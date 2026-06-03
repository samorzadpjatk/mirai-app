import { describe, expect, it } from "vitest";
import { AuthenticationError, AuthorizationError } from "../authServer";

describe("AuthenticationError", () => {
  it("should create error with default message", () => {
    const error = new AuthenticationError();
    expect(error.name).toBe("AuthenticationError");
    expect(error.message).toBe("Not Authenticated");
  });

  it("should create error with custom message", () => {
    const error = new AuthenticationError("Custom auth error");
    expect(error.message).toBe("Custom auth error");
  });
});

describe("AuthorizationError", () => {
  it("should create error with default message", () => {
    const error = new AuthorizationError();
    expect(error.name).toBe("AuthorizationError");
    expect(error.message).toBe("Missing Required Permissions");
  });

  it("should create error with custom message", () => {
    const error = new AuthorizationError("Custom authz error");
    expect(error.message).toBe("Custom authz error");
  });
});
