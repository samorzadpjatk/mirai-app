import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Effect, Layer } from "effect";

import {
  initializeRuntime,
  getRuntime,
  isRuntimeInitialized,
  resetRuntime,
  runEffect,
  runEffectSync,
  runEffectWith,
  runEffectWithLayer,
  mergeLayers,
} from "../runtime";

// =============================================================================
// Test Tags and Layers
// =============================================================================

class TestTag extends Effect.Tag("TestTag")<TestTag, { value: string }>() {}

class LoggerTag extends Effect.Tag("LoggerTag")<
  LoggerTag,
  { log: (msg: string) => void }
>() {}

const TestLayer = Layer.succeed(TestTag, { value: "test-value" });

const LoggerLayer = Layer.succeed(LoggerTag, {
  log: (msg: string) => console.log(msg),
});

const CombinedLayer = Layer.mergeAll(TestLayer, LoggerLayer);

// =============================================================================
// Test Suite
// =============================================================================

describe("[UNIT] Effect Runtime", () => {
  beforeEach(() => {
    resetRuntime();
  });

  afterEach(() => {
    resetRuntime();
  });

  describe("[UNIT] Initialization", () => {
    test("initializeRuntime creates a valid runtime", () => {
      expect(isRuntimeInitialized()).toBe(false);

      const runtime = initializeRuntime(TestLayer);

      expect(isRuntimeInitialized()).toBe(true);
      expect(runtime).toBeDefined();
      expect(getRuntime()).toBe(runtime);
    });

    test("getRuntime throws if not initialized", () => {
      expect(isRuntimeInitialized()).toBe(false);

      expect(() => getRuntime()).toThrow("Runtime not initialized");
    });

    test("resetRuntime clears the runtime", () => {
      initializeRuntime(TestLayer);
      expect(isRuntimeInitialized()).toBe(true);

      resetRuntime();

      expect(isRuntimeInitialized()).toBe(false);
    });
  });

  describe("[UNIT] runEffect", () => {
    test("runs a simple Effect successfully", async () => {
      initializeRuntime(TestLayer);

      const effect = Effect.gen(function* () {
        const service = yield* TestTag;
        return service.value;
      });

      const result = await runEffectWith(effect);
      expect(result).toBe("test-value");
    });

    test("runs Effect that requires multiple services", async () => {
      initializeRuntime(CombinedLayer);

      const effect = Effect.gen(function* () {
        const test = yield* TestTag;
        const logger = yield* LoggerTag;
        logger.log("hello");
        return test.value;
      });

      const result = await runEffectWith(effect);
      expect(result).toBe("test-value");
    });
  });

  describe("[UNIT] runEffectSync", () => {
    test("runs a synchronous Effect", () => {
      const effect = Effect.sync(() => 42);

      const result = runEffectSync(effect);
      expect(result).toBe(42);
    });
  });

  describe("[UNIT] runEffectWith", () => {
    test("runs Effect with the initialized application layer", async () => {
      const AdditionalTag = Effect.Tag("Additional")<
        AdditionalTag,
        { extra: string }
      >();
      const AdditionalLayer = Layer.succeed(AdditionalTag, { extra: "extra" });

      initializeRuntime(AdditionalLayer);

      const effect = Effect.gen(function* () {
        const additional = yield* AdditionalTag;
        return { extra: additional.extra };
      });

      const result = await runEffectWith(effect);
      expect(result).toEqual({ extra: "extra" });
    });
  });

  describe("[UNIT] runEffectWithLayer", () => {
    test("runs Effect with a custom layer on top", async () => {
      initializeRuntime(TestLayer);

      const CustomTag = Effect.Tag("Custom")<CustomTag, { custom: string }>();
      const CustomLayer = Layer.succeed(CustomTag, { custom: "custom" });

      const effect = Effect.gen(function* () {
        const custom = yield* CustomTag;
        return { custom: custom.custom };
      });

      const result = await runEffectWithLayer(effect, CustomLayer);
      expect(result).toEqual({ custom: "custom" });
    });
  });

  describe("[UNIT] mergeLayers", () => {
    test("merges two layers into one", async () => {
      const merged = mergeLayers(TestLayer, LoggerLayer);

      const effect = Effect.gen(function* () {
        const test = yield* TestTag;
        return { value: test.value };
      });

      const result = await runEffectWithLayer(effect, merged);
      expect(result.value).toBe("test-value");
    });
  });
});

describe("[INTEGRATION] Runtime with Full App Setup", () => {
  afterEach(() => {
    resetRuntime();
  });

  test("complete runtime lifecycle", async () => {
    const appLayer = Layer.mergeAll(TestLayer, LoggerLayer);
    initializeRuntime(appLayer);

    expect(isRuntimeInitialized()).toBe(true);

    const effect1 = Effect.gen(function* () {
      const test = yield* TestTag;
      return test.value;
    });

    const effect2 = Effect.gen(function* () {
      const logger = yield* LoggerTag;
      logger.log("test");
      return "logged";
    });

    const [result1, result2] = await Promise.all([
      runEffectWith(effect1),
      runEffectWith(effect2),
    ]);

    expect(result1).toBe("test-value");
    expect(result2).toBe("logged");

    resetRuntime();
    expect(isRuntimeInitialized()).toBe(false);
  });
});
