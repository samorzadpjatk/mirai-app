/**
 * Test Infrastructure Helpers - Self-Test Suite
 *
 * Validates that the test infrastructure helpers work correctly.
 * These tests ensure the helpers themselves are properly implemented.
 *
 * @module test-infrastructure.test
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer, Data, Exit, Context } from "effect";
import {
  runWithTestLayer,
  runWithTestLayerExit,
  runWithTestLayerEither,
  createTestLayer,
  createFailingLayer,
  mergeTestLayers,
  assertSuccess,
  assertFailure,
  isFailureWithTag,
} from "./test-helpers.js";

// =============================================================================
// Test Error Types
// =============================================================================

class TestError extends Data.TaggedError("TestError")<{ message: string }> {}

class NotFoundError extends Data.TaggedError("NotFoundError")<{ id: string }> {}

// =============================================================================
// Test Service Definition
// =============================================================================

interface TestService {
  readonly getValue: () => Effect.Effect<string, never, never>;
  readonly getNumber: () => Effect.Effect<number, never, never>;
  readonly failWithError: () => Effect.Effect<string, TestError, never>;
}

class TestServiceTag extends Context.Tag("TestService")<
  TestServiceTag,
  TestService
>() {}

// =============================================================================
// Test Suite
// =============================================================================

describe("[UNIT] Test Infrastructure Helpers", () => {
  describe("runWithTestLayer", () => {
    it("should run program with provided layer and return success", async () => {
      const mockService: TestService = {
        getValue: () => Effect.succeed("test-value"),
        getNumber: () => Effect.succeed(42),
        failWithError: () => Effect.fail(new TestError({ message: "error" })),
      };

      const testLayer = Layer.succeed(TestServiceTag, mockService);

      const result = await runWithTestLayer(
        Effect.gen(function* () {
          const service = yield* TestServiceTag;
          return yield* service.getValue();
        }),
        testLayer,
      );

      expect(result).toBe("test-value");
    });

    it("should handle program with multiple yields", async () => {
      const mockService: TestService = {
        getValue: () => Effect.succeed("value"),
        getNumber: () => Effect.succeed(100),
        failWithError: () => Effect.fail(new TestError({ message: "error" })),
      };

      const testLayer = Layer.succeed(TestServiceTag, mockService);

      const result = await runWithTestLayer(
        Effect.gen(function* () {
          const service = yield* TestServiceTag;
          const value = yield* service.getValue();
          const num = yield* service.getNumber();
          return `${value}-${num}`;
        }),
        testLayer,
      );

      expect(result).toBe("value-100");
    });
  });

  describe("runWithTestLayerExit", () => {
    it("should return Exit.Success for successful program", async () => {
      const testLayer = Layer.empty;

      const exit = await runWithTestLayerExit(
        Effect.succeed("success"),
        testLayer,
      );

      expect(Exit.isSuccess(exit)).toBe(true);
      if (Exit.isSuccess(exit)) {
        expect(exit.value).toBe("success");
      }
    });

    it("should return Exit.Failure for failed program", async () => {
      const testLayer = Layer.empty;

      const exit = await runWithTestLayerExit(
        Effect.fail(new TestError({ message: "test failure" })),
        testLayer,
      );

      expect(Exit.isFailure(exit)).toBe(true);
    });
  });

  describe("runWithTestLayerEither", () => {
    it("should return Either.Right for success", async () => {
      const testLayer = Layer.empty;

      const either = await runWithTestLayerEither(
        Effect.succeed("success"),
        testLayer,
      );

      expect(either._tag).toBe("Right");
      if (either._tag === "Right") {
        expect(either.right).toBe("success");
      }
    });

    it("should return Either.Left for failure", async () => {
      const testLayer = Layer.empty;

      const either = await runWithTestLayerEither(
        Effect.fail(new NotFoundError({ id: "123" })),
        testLayer,
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left._tag).toBe("NotFoundError");
      }
    });
  });

  describe("createTestLayer", () => {
    it("should create a Layer that provides the service", async () => {
      const mockService: TestService = {
        getValue: () => Effect.succeed("from-layer"),
        getNumber: () => Effect.succeed(0),
        failWithError: () => Effect.fail(new TestError({ message: "error" })),
      };

      const layer = createTestLayer(TestServiceTag, mockService);

      const result = await runWithTestLayer(
        Effect.gen(function* () {
          const service = yield* TestServiceTag;
          return yield* service.getValue();
        }),
        layer,
      );

      expect(result).toBe("from-layer");
    });
  });

  describe("createFailingLayer", () => {
    it("should create a layer where all methods fail", async () => {
      const error = new TestError({ message: "always fails" });
      const failingLayer = createFailingLayer(TestServiceTag, error);

      let caught = false;
      try {
        await runWithTestLayer(
          Effect.gen(function* () {
            const service = yield* TestServiceTag;
            return yield* service.getValue();
          }),
          failingLayer,
        );
      } catch (e) {
        caught = true;
      }

      expect(caught).toBe(true);
    });
  });

  describe("mergeTestLayers", () => {
    it("should merge multiple layers into one", async () => {
      interface ServiceA {
        readonly getA: () => Effect.Effect<string, never, never>;
      }
      interface ServiceB {
        readonly getB: () => Effect.Effect<number, never, never>;
      }

      class ServiceATag extends Context.Tag("ServiceA")<
        ServiceATag,
        ServiceA
      >() {}
      class ServiceBTag extends Context.Tag("ServiceB")<
        ServiceBTag,
        ServiceB
      >() {}

      const layerA = Layer.succeed(ServiceATag, {
        getA: () => Effect.succeed("A-value"),
      });
      const layerB = Layer.succeed(ServiceBTag, {
        getB: () => Effect.succeed(42),
      });

      const mergedLayer = mergeTestLayers(layerA, layerB);

      const result = await runWithTestLayer(
        Effect.gen(function* () {
          const a = yield* ServiceATag;
          const b = yield* ServiceBTag;
          const valA = yield* a.getA();
          const valB = yield* b.getB();
          return { a: valA, b: valB };
        }),
        mergedLayer,
      );

      expect(result).toEqual({ a: "A-value", b: 42 });
    });
  });

  describe("assertSuccess", () => {
    it("should return value from successful Exit", () => {
      const exit = Exit.succeed("success-value");
      const result = assertSuccess(exit);
      expect(result).toBe("success-value");
    });

    it("should throw for failed Exit", () => {
      const exit = Exit.fail(new TestError({ message: "error" }));
      expect(() => assertSuccess(exit)).toThrow();
    });
  });

  describe("assertFailure", () => {
    it("should return error from failed Exit", () => {
      const testError = new TestError({ message: "test" });
      const exit = Exit.fail(testError);
      const result = assertFailure(exit);
      expect(result).toBe(testError);
    });

    it("should throw for successful Exit", () => {
      const exit = Exit.succeed("value");
      expect(() => assertFailure(exit)).toThrow();
    });
  });

  describe("isFailureWithTag", () => {
    it("should return true for matching error tag", () => {
      const exit = Exit.fail(new NotFoundError({ id: "123" }));
      expect(isFailureWithTag(exit, "NotFoundError")).toBe(true);
    });

    it("should return false for non-matching error tag", () => {
      const exit = Exit.fail(new TestError({ message: "test" }));
      expect(isFailureWithTag(exit, "NotFoundError")).toBe(false);
    });

    it("should return false for successful Exit", () => {
      const exit = Exit.succeed("value");
      expect(isFailureWithTag(exit, "NotFoundError")).toBe(false);
    });
  });
});
