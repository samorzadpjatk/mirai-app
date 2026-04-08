import { describe, expect, test, mock, beforeEach } from "bun:test";
import { executeWithRetry } from "../resilience";

describe("resilience utils", () => {
  beforeEach(() => {
    mock.restore();
  });

  describe("executeWithRetry", () => {
    test("returns result on first successful attempt", async () => {
      const mockFn = mock(async () => "success");
      const result = await executeWithRetry(mockFn);
      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test("retries on failure and eventually succeeds", async () => {
      let attempts = 0;
      const mockFn = mock(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Temporary failure");
        }
        return "success";
      });

      const result = await executeWithRetry(
        mockFn,
        undefined,
        undefined,
        5,
        10,
      );
      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test("exhausts retries and throws on persistent failure", async () => {
      let attempts = 0;
      const mockFn = mock(async () => {
        attempts++;
        throw new Error("Persistent failure");
      });

      let threw = false;
      let thrownError: unknown;
      try {
        await executeWithRetry(mockFn, undefined, undefined, 3, 10);
      } catch (e) {
        threw = true;
        thrownError = e;
      }
      expect(threw).toBe(true);
      expect((thrownError as Error).message).toBe("Persistent failure");
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test("uses isValidResult to determine success", async () => {
      let attempts = 0;
      const mockFn = mock(async () => {
        attempts++;
        return { value: attempts };
      });

      const isValidResult = (result: { value: number }) => result.value >= 3;

      const result = await executeWithRetry(
        mockFn,
        undefined,
        isValidResult,
        5,
        10,
      );
      expect(result.value).toBe(3);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test("retries when isValidResult returns false", async () => {
      let attempts = 0;
      const mockFn = mock(async () => {
        attempts++;
        return { valid: attempts >= 2 };
      });

      const isValidResult = (result: { valid: boolean }) => result.valid;

      const result = await executeWithRetry(
        mockFn,
        undefined,
        isValidResult,
        5,
        10,
      );
      expect(result.valid).toBe(true);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test("uses custom maxRetriesCount", async () => {
      const mockFn = mock(async () => {
        throw new Error("Always fails");
      });

      let threw = false;
      try {
        await executeWithRetry(mockFn, undefined, undefined, 2, 10);
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test("handles non-Error thrown values", async () => {
      const mockFn = mock(async () => {
        throw "string error";
      });

      let threw = false;
      try {
        await executeWithRetry(mockFn, undefined, undefined, 2, 10);
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    test("does not retry when maxRetriesCount is 1", async () => {
      const mockFn = mock(async () => {
        throw new Error("Fail");
      });

      let threw = false;
      try {
        await executeWithRetry(mockFn, undefined, undefined, 1, 10);
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
