import { describe, it, expect, jest } from "@jest/globals";
import { executeWithRetry } from "../resilience";

const err = new Error("TEST_ERR");
const onError = jest.fn((_err: unknown, _attempt: number) => void 0);

describe("resilience", () => {
  describe("executeWithRetry", () => {
    it("should execute once when succeeds on first try", async () => {
      const toExecute = jest.fn(async () => "success");

      const result = await executeWithRetry(
        toExecute,
        onError,
        undefined,
        3,
        10,
      );

      expect(result).toBe("success");
      expect(toExecute).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it("should retry on failure", async () => {
      let attempts = 0;
      const toExecute = jest.fn(async () => {
        attempts++;
        if (attempts === 1) throw err;
        return "success";
      });

      const result = await executeWithRetry(
        toExecute,
        onError,
        undefined,
        3,
        10,
      );

      expect(result).toBe("success");
      expect(toExecute).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: err.message }),
        0,
      );
    });

    it("should stop and throw after max retries", async () => {
      const toExecute = jest.fn(async () => {
        throw err;
      });

      await expect(
        executeWithRetry(toExecute, onError, undefined, 2, 10),
      ).rejects.toThrow(err.message);

      expect(toExecute).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenLastCalledWith(err, 1);
    });

    it("should retry until valid result", async () => {
      let attempts = 0;
      const toExecute = jest.fn(async () => {
        attempts++;
        return { status: attempts === 2 ? "success" : "pending" };
      });
      const isValidResult = (result: { status: string }) =>
        result.status === "success";

      const result = await executeWithRetry(
        toExecute,
        onError,
        isValidResult,
        3,
        10,
      );

      expect(result).toEqual({ status: "success" });
      expect(toExecute).toHaveBeenCalledTimes(2);
      expect(onError).not.toHaveBeenCalled();
    });

    it("should fail if no valid result after max retries", async () => {
      const toExecute = jest.fn(async () => ({ status: "pending" }));
      const isValidResult = (result: { status: string }) =>
        result.status === "success";

      await expect(
        executeWithRetry(toExecute, onError, isValidResult, 2, 10),
      ).rejects.toThrow("None of the 2 retry attempts provided a valid result");

      expect(toExecute).toHaveBeenCalledTimes(2);
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
