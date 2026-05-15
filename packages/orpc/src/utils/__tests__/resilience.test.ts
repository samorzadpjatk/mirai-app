import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeWithRetry } from "../resilience";

describe("resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("executeWithRetry", () => {
    it("should return result on first successful execution", async () => {
      const toExecute = vi.fn<[], Promise<string>>().mockResolvedValue("success");
      const onError = vi.fn();

      const result = await executeWithRetry(toExecute, onError);

      expect(result).toBe("success");

      expect(toExecute).toHaveBeenCalledTimes(1);

      expect(onError).not.toHaveBeenCalled();
    });

    it("should retry on failure and eventually succeed", async () => {
      const toExecute = vi
        .fn<[], Promise<string>>()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockRejectedValueOnce(new Error("Second failure"))
        .mockResolvedValue("success");
      const onError = vi.fn();

      const result = await executeWithRetry(toExecute, onError, undefined, 5, 10);

      expect(result).toBe("success");

      expect(toExecute).toHaveBeenCalledTimes(3);

      expect(onError).toHaveBeenCalledTimes(2);

      expect(onError).toHaveBeenNthCalledWith(1, new Error("First failure"), 0);

      expect(onError).toHaveBeenNthCalledWith(2, new Error("Second failure"), 1);
    });

    it("should throw error after max retries exceeded", async () => {
      const error = new Error("Persistent failure");
      const toExecute = vi.fn<[], Promise<never>>().mockRejectedValue(error);
      const onError = vi.fn();

      await expect(executeWithRetry(toExecute, onError, undefined, 3, 10)).rejects.toThrow(
        "Persistent failure",
      );

      expect(toExecute).toHaveBeenCalledTimes(3);

      expect(onError).toHaveBeenCalledTimes(3);
    });

    it("should use default max retries (5) when not specified", async () => {
      const error = new Error("Persistent failure");
      const toExecute = vi.fn<[], Promise<never>>().mockRejectedValue(error);
      const onError = vi.fn();

      await expect(executeWithRetry(toExecute, onError, undefined, 5, 10)).rejects.toThrow(
        "Persistent failure",
      );

      expect(toExecute).toHaveBeenCalledTimes(5);
    });

    it("should retry when isValidResult returns false", async () => {
      const toExecute = vi
        .fn<[], Promise<string>>()
        .mockResolvedValueOnce("invalid")
        .mockResolvedValueOnce("invalid")
        .mockResolvedValue("valid");
      const onError = vi.fn();
      const isValidResult = (result: string): boolean => result === "valid";

      const result = await executeWithRetry(toExecute, onError, isValidResult, 5, 10);

      expect(result).toBe("valid");

      expect(toExecute).toHaveBeenCalledTimes(3);

      expect(onError).not.toHaveBeenCalled();
    });

    it("should throw error when all retries return invalid results", async () => {
      const toExecute = vi.fn<[], Promise<string>>().mockResolvedValue("invalid");
      const onError = vi.fn();
      const isValidResult = (result: string): boolean => result === "valid";

      await expect(executeWithRetry(toExecute, onError, isValidResult, 3, 10)).rejects.toThrow(
        "None of the 3 retry attempts provided a valid result.",
      );

      expect(toExecute).toHaveBeenCalledTimes(3);
    });

    it("should handle async onError callback", async () => {
      const toExecute = vi
        .fn<[], Promise<string>>()
        .mockRejectedValueOnce(new Error("Failure"))
        .mockResolvedValue("success");
      const asyncOnError = vi.fn<[Error, number], Promise<void>>().mockResolvedValue(undefined);

      await executeWithRetry(toExecute, asyncOnError, undefined, 3, 10);

      expect(asyncOnError).toHaveBeenCalledTimes(1);
    });

    it("should apply exponential backoff with jitter", async () => {
      const toExecute = vi
        .fn<[], Promise<string>>()
        .mockRejectedValueOnce(new Error("Failure 1"))
        .mockRejectedValueOnce(new Error("Failure 2"))
        .mockResolvedValue("success");
      const onError = vi.fn();

      const startTime = Date.now();
      await executeWithRetry(toExecute, onError, undefined, 5, 10);
      const endTime = Date.now();

      // Should have taken some time due to backoff (at least 10ms + 20ms minimum)
      expect(endTime - startTime).toBeGreaterThanOrEqual(15);
    });

    it("should handle synchronous errors", async () => {
      const toExecute = vi.fn<[], Promise<string>>().mockImplementation((): never => {
        throw new Error("Sync error");
      });
      const onError = vi.fn();

      await expect(executeWithRetry(toExecute, onError, undefined, 2, 10)).rejects.toThrow(
        "Sync error",
      );

      expect(toExecute).toHaveBeenCalledTimes(2);
    });

    it("should handle non-Error exceptions", async () => {
      const toExecute = vi.fn<[], Promise<string>>().mockRejectedValue("string error");
      const onError = vi.fn<[string, number], void>();

      await expect(executeWithRetry(toExecute, onError, undefined, 2, 10)).rejects.toBe(
        "string error",
      );

      expect(onError).toHaveBeenCalledWith("string error", 0);
    });

    it("should work without onError callback", async () => {
      const toExecute = vi
        .fn<[], Promise<string>>()
        .mockRejectedValueOnce(new Error("Failure"))
        .mockResolvedValue("success");

      const result = await executeWithRetry(toExecute, undefined, undefined, 3, 10);

      expect(result).toBe("success");
    });

    it("should work without isValidResult callback", async () => {
      const toExecute = vi.fn<[], Promise<string>>().mockResolvedValue("any result");

      const result = await executeWithRetry(toExecute);

      expect(result).toBe("any result");
    });

    it("should handle complex result types", async () => {
      interface ComplexResult {
        data: string;
        success: boolean;
      }

      const toExecute = vi.fn<[], Promise<ComplexResult>>().mockResolvedValue({
        data: "test",
        success: true,
      });
      const isValidResult = (result: ComplexResult): boolean => result.success;

      const result = await executeWithRetry(toExecute, undefined, isValidResult);

      expect(result).toEqual({ data: "test", success: true });
    });
  });
});
