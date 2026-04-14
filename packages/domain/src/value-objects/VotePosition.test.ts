import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { VotePosition } from "./VotePosition";
import { ValidationError } from "../errors";

describe("[UNIT] VotePosition", () => {
  describe("[UNIT] VotePosition.create", () => {
    it("creates first place position", async () => {
      const result = await Effect.runPromise(VotePosition.create(1));
      expect(result.value).toBe(1);
    });

    it("creates second place position", async () => {
      const result = await Effect.runPromise(VotePosition.create(2));
      expect(result.value).toBe(2);
    });

    it("creates third place position", async () => {
      const result = await Effect.runPromise(VotePosition.create(3));
      expect(result.value).toBe(3);
    });

    it("fails for position 0", async () => {
      const exit = await Effect.runPromiseExit(VotePosition.create(0));
      expect(exit._tag).toBe("Failure");
    });

    it("fails for position 4", async () => {
      const exit = await Effect.runPromiseExit(VotePosition.create(4));
      expect(exit._tag).toBe("Failure");
    });

    it("fails for negative position", async () => {
      const exit = await Effect.runPromiseExit(VotePosition.create(-1));
      expect(exit._tag).toBe("Failure");
    });

    it("fails for non-integer position", async () => {
      const exit = await Effect.runPromiseExit(VotePosition.create(1.5));
      expect(exit._tag).toBe("Failure");
    });

    it("returns ValidationError on failure", async () => {
      const result = await Effect.runPromise(
        Effect.either(VotePosition.create(4)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toBe(
          "Vote position must be between 1 and 3",
        );
      }
    });
  });

  describe("[UNIT] VotePosition.unsafeCreate", () => {
    it("creates position without validation", () => {
      const result = VotePosition.unsafeCreate(5);
      expect(result.value).toBe(5);
    });
  });

  describe("[UNIT] VotePosition.isFirstPlace", () => {
    it("returns true for position 1", async () => {
      const position = await Effect.runPromise(VotePosition.create(1));
      expect(position.isFirstPlace()).toBe(true);
    });

    it("returns false for other positions", async () => {
      const position = await Effect.runPromise(VotePosition.create(2));
      expect(position.isFirstPlace()).toBe(false);
    });
  });

  describe("[UNIT] VotePosition.isSecondPlace", () => {
    it("returns true for position 2", async () => {
      const position = await Effect.runPromise(VotePosition.create(2));
      expect(position.isSecondPlace()).toBe(true);
    });

    it("returns false for other positions", async () => {
      const position = await Effect.runPromise(VotePosition.create(1));
      expect(position.isSecondPlace()).toBe(false);
    });
  });

  describe("[UNIT] VotePosition.isThirdPlace", () => {
    it("returns true for position 3", async () => {
      const position = await Effect.runPromise(VotePosition.create(3));
      expect(position.isThirdPlace()).toBe(true);
    });

    it("returns false for other positions", async () => {
      const position = await Effect.runPromise(VotePosition.create(1));
      expect(position.isThirdPlace()).toBe(false);
    });
  });

  describe("[UNIT] VotePosition.toPoints", () => {
    it("returns 3 points for first place", async () => {
      const position = await Effect.runPromise(VotePosition.create(1));
      expect(position.toPoints()).toBe(3);
    });

    it("returns 2 points for second place", async () => {
      const position = await Effect.runPromise(VotePosition.create(2));
      expect(position.toPoints()).toBe(2);
    });

    it("returns 1 point for third place", async () => {
      const position = await Effect.runPromise(VotePosition.create(3));
      expect(position.toPoints()).toBe(1);
    });
  });

  describe("[UNIT] VotePosition.equals", () => {
    it("returns true for equal positions", async () => {
      const position1 = await Effect.runPromise(VotePosition.create(1));
      const position2 = await Effect.runPromise(VotePosition.create(1));
      expect(position1.equals(position2)).toBe(true);
    });

    it("returns false for different positions", async () => {
      const position1 = await Effect.runPromise(VotePosition.create(1));
      const position2 = await Effect.runPromise(VotePosition.create(2));
      expect(position1.equals(position2)).toBe(false);
    });
  });

  describe("[UNIT] VotePosition.isBetterThan", () => {
    it("returns true when position is better (lower number)", async () => {
      const position1 = await Effect.runPromise(VotePosition.create(1));
      const position2 = await Effect.runPromise(VotePosition.create(2));
      expect(position1.isBetterThan(position2)).toBe(true);
    });

    it("returns false when position is worse (higher number)", async () => {
      const position1 = await Effect.runPromise(VotePosition.create(2));
      const position2 = await Effect.runPromise(VotePosition.create(1));
      expect(position1.isBetterThan(position2)).toBe(false);
    });

    it("returns false when positions are equal", async () => {
      const position1 = await Effect.runPromise(VotePosition.create(1));
      const position2 = await Effect.runPromise(VotePosition.create(1));
      expect(position1.isBetterThan(position2)).toBe(false);
    });
  });
});
