import { classifyError, isNetworkError } from "../errorClassifier";

describe("errorClassifier", () => {
  it("should classify network errors", () => {
    const errors = [
      new Error("Network request failed"),
      new Error("Failed to fetch"),
      new Error("Network Error"),
      new Error("timeout"),
      new Error("ECONNREFUSED"),
      new Error("ENOTFOUND"),
      new Error("ENETUNREACH"),
    ];

    errors.forEach((error) => {
      const result = classifyError(error);
      expect(result.type).toBe("NETWORK_ERROR");
      expect(result.shouldQueue).toBe(true);
      expect(result.shouldRetry).toBe(true);
    });
  });

  it("should classify validation errors", () => {
    const error = { status: 400, message: "Bad request" };
    const result = classifyError(error);
    expect(result.type).toBe("VALIDATION_ERROR");
    expect(result.shouldQueue).toBe(false);
    expect(result.shouldRetry).toBe(false);
  });

  it("should classify conflict errors", () => {
    const error = { status: 409, message: "Conflict" };
    const result = classifyError(error);
    expect(result.type).toBe("CONFLICT_ERROR");
    expect(result.shouldQueue).toBe(false);
    expect(result.shouldRetry).toBe(false);
  });

  it("should classify server errors", () => {
    const error = { status: 500, message: "Server error" };
    const result = classifyError(error);
    expect(result.type).toBe("SERVER_ERROR");
    expect(result.shouldQueue).toBe(true);
    expect(result.shouldRetry).toBe(true);
  });

  it("should classify unknown errors as server errors", () => {
    const result = classifyError(new Error("Something went wrong"));
    expect(result.type).toBe("SERVER_ERROR");
    expect(result.shouldQueue).toBe(true);
    expect(result.shouldRetry).toBe(true);
  });

  it("should identify network errors with isNetworkError", () => {
    expect(isNetworkError(new Error("Network request failed"))).toBe(true);
    expect(isNetworkError(new Error("Validation failed"))).toBe(false);
  });
});
