import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeWithRetry } from "../resilience";

describe("resilience utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("executeWithRetry", () => {
    it("should return result on first successful attempt", async () => {
      const mockFn = vi.fn().mockResolvedValue("success");
      const result = await executeWithRetry(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValue("success");

      const result = await executeWithRetry(mockFn, undefined, undefined, 5, 10);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it("should call onError callback on each failure", async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockResolvedValue("success");
      const onError = vi.fn();

      await executeWithRetry(mockFn, onError, undefined, 5, 10);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error), 0);
    });

    it("should throw error after max retries exceeded", async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error("persistent failure"));
      const maxRetries = 3;

      await expect(
        executeWithRetry(mockFn, undefined, undefined, maxRetries, 10)
      ).rejects.toThrow("persistent failure");

      expect(mockFn).toHaveBeenCalledTimes(maxRetries);
    });

    it("should validate result with isValidResult function", async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce({ valid: false })
        .mockResolvedValueOnce({ valid: false })
        .mockResolvedValue({ valid: true });

      const isValidResult = vi.fn((result: any) => result.valid === true);

      const result = await executeWithRetry(
        mockFn,
        undefined,
        isValidResult,
        5,
        10
      );

      expect(result).toEqual({ valid: true });
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(isValidResult).toHaveBeenCalledTimes(3);
    });

    it("should throw error if no valid result after max retries", async () => {
      const mockFn = vi.fn().mockResolvedValue({ valid: false });
      const isValidResult = vi.fn(() => false);
      const maxRetries = 3;

      await expect(
        executeWithRetry(mockFn, undefined, isValidResult, maxRetries, 10)
      ).rejects.toThrow(
        `None of the ${maxRetries} retry attempts provided a valid result.`
      );

      expect(mockFn).toHaveBeenCalledTimes(maxRetries);
    });

    it("should use default max retries count if not provided", async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error("fail"));

      await expect(executeWithRetry(mockFn, undefined, undefined, undefined, 10)).rejects.toThrow(
        "fail"
      );

      // Default is 5 retries
      expect(mockFn).toHaveBeenCalledTimes(5);
    });

    it("should apply exponential backoff with jitter", async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValue("success");

      const start = Date.now();
      await executeWithRetry(mockFn, undefined, undefined, 5, 10);
      const duration = Date.now() - start;

      // Should have at least some delay (with jitter, minimum is 0.5 * delay)
      expect(duration).toBeGreaterThanOrEqual(5); // At least 5ms total
    });

    it("should handle async onError callback", async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("success");
      const onError = vi.fn().mockResolvedValue(undefined);

      await executeWithRetry(mockFn, onError, undefined, 5, 10);

      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});
