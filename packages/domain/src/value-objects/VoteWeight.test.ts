import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { VoteWeight } from "./VoteWeight";
import { ValidationError } from "../errors";

describe("[UNIT] VoteWeight", () => {
  describe("[UNIT] VoteWeight.create", () => {
    it("creates valid vote weight", async () => {
      const result = await Effect.runPromise(VoteWeight.create(1.5));
      expect(result.value).toBe(1.5);
    });

    it("creates weight with value of 1", async () => {
      const result = await Effect.runPromise(VoteWeight.create(1));
      expect(result.value).toBe(1);
    });

    it("fails for zero weight", async () => {
      const exit = await Effect.runPromiseExit(VoteWeight.create(0));
      expect(exit._tag).toBe("Failure");
    });

    it("fails for negative weight", async () => {
      const exit = await Effect.runPromiseExit(VoteWeight.create(-1));
      expect(exit._tag).toBe("Failure");
    });

    it("fails for NaN", async () => {
      const exit = await Effect.runPromiseExit(VoteWeight.create(NaN));
      expect(exit._tag).toBe("Failure");
    });

    it("returns ValidationError on failure", async () => {
      const result = await Effect.runPromise(
        Effect.either(VoteWeight.create(0)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe("Vote weight must be positive");
      }
    });
  });

  describe("[UNIT] VoteWeight.unsafeCreate", () => {
    it("creates weight without validation", () => {
      const result = VoteWeight.unsafeCreate(5);
      expect(result.value).toBe(5);
    });
  });

  describe("[UNIT] VoteWeight.default", () => {
    it("returns default weight of 1.0", () => {
      const result = VoteWeight.default();
      expect(result.value).toBe(1.0);
    });
  });

  describe("[UNIT] VoteWeight.applyTo", () => {
    it("calculates weighted points", async () => {
      const weight = await Effect.runPromise(VoteWeight.create(2));
      const result = weight.applyTo(10);
      expect(result).toBe(20);
    });
  });

  describe("[UNIT] VoteWeight.isDefault", () => {
    it("returns true for default weight", () => {
      const weight = VoteWeight.default();
      expect(weight.isDefault()).toBe(true);
    });

    it("returns false for non-default weight", async () => {
      const weight = await Effect.runPromise(VoteWeight.create(2));
      expect(weight.isDefault()).toBe(false);
    });
  });

  describe("[UNIT] VoteWeight.equals", () => {
    it("returns true for equal weights", async () => {
      const weight1 = await Effect.runPromise(VoteWeight.create(1.5));
      const weight2 = await Effect.runPromise(VoteWeight.create(1.5));
      expect(weight1.equals(weight2)).toBe(true);
    });

    it("returns false for different weights", async () => {
      const weight1 = await Effect.runPromise(VoteWeight.create(1));
      const weight2 = await Effect.runPromise(VoteWeight.create(2));
      expect(weight1.equals(weight2)).toBe(false);
    });
  });

  describe("[UNIT] VoteWeight.isGreaterThan", () => {
    it("returns true when greater", async () => {
      const weight1 = await Effect.runPromise(VoteWeight.create(2));
      const weight2 = await Effect.runPromise(VoteWeight.create(1));
      expect(weight1.isGreaterThan(weight2)).toBe(true);
    });

    it("returns false when equal", async () => {
      const weight1 = await Effect.runPromise(VoteWeight.create(1.5));
      const weight2 = await Effect.runPromise(VoteWeight.create(1.5));
      expect(weight1.isGreaterThan(weight2)).toBe(false);
    });

    it("returns false when less", async () => {
      const weight1 = await Effect.runPromise(VoteWeight.create(1));
      const weight2 = await Effect.runPromise(VoteWeight.create(2));
      expect(weight1.isGreaterThan(weight2)).toBe(false);
    });
  });
});
