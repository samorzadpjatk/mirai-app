import { describe, expect, test, beforeEach } from "bun:test";
import { createContainer, asClass, asValue } from "awilix";
import { Effect, Layer } from "effect";

import {
  setAwilixContainer,
  getAwilixContainer,
  hasAwilixContainer,
  fromAwilix,
  buildAppLayer,
  runWithAwilixContainer,
} from "../effect-layer";

// =============================================================================
// Test Services
// =============================================================================

class TestService {
  private value = 42;

  getValue(): number {
    return this.value;
  }
}

class TestRepository {
  private data: string[] = [];

  add(item: string): void {
    this.data.push(item);
  }

  getAll(): string[] {
    return [...this.data];
  }
}

// =============================================================================
// Test Suite
// =============================================================================

describe("[UNIT] Effect Layer Integration", () => {
  let container: any;

  beforeEach(() => {
    container = createContainer({ injectionMode: "PROXY" });

    container.register({
      testService: asClass(TestService).singleton(),
      testRepository: asClass(TestRepository).singleton(),
    });
  });

  describe("[UNIT] Container Registration", () => {
    test("setAwilixContainer and getAwilixContainer work correctly", () => {
      expect(hasAwilixContainer()).toBe(false);

      setAwilixContainer(container);

      expect(hasAwilixContainer()).toBe(true);
      expect(getAwilixContainer()).toBe(container);
    });
  });

  describe("[UNIT] fromAwilix", () => {
    test("creates a Layer that resolves from awilix container", async () => {
      setAwilixContainer(container);

      const TestServiceLayer = fromAwilix<TestService>("testService");

      const program = Effect.sync(() => {
        const service =
          getAwilixContainer().resolve<TestService>("testService");
        return service.getValue();
      });

      const runnable = Effect.provide(program, TestServiceLayer);
      const result = await Effect.runPromise(runnable);

      expect(result).toBe(42);
    });
  });

  describe("[UNIT] buildAppLayer", () => {
    test("builds complete AppLayer from container and tokens", async () => {
      setAwilixContainer(container);

      const AppLayer = buildAppLayer(container, [
        "testService",
        "testRepository",
      ]);

      const program = Effect.sync(() => {
        const service =
          getAwilixContainer().resolve<TestService>("testService");
        const repo =
          getAwilixContainer().resolve<TestRepository>("testRepository");
        repo.add("built");
        return { value: service.getValue(), items: repo.getAll() };
      });

      const runnable = Effect.provide(program, AppLayer);
      const result = await Effect.runPromise(runnable);

      expect(result.value).toBe(42);
      expect(result.items).toEqual(["built"]);
    });
  });

  describe("[UNIT] runWithAwilixContainer", () => {
    test("runs Effect with container and tokens", async () => {
      const program = Effect.sync(() => {
        const service =
          getAwilixContainer().resolve<TestService>("testService");
        return service.getValue();
      });

      const result = await runWithAwilixContainer(
        container,
        ["testService"],
        program,
      );

      expect(result).toBe(42);
    });
  });
});

describe("[INTEGRATION] Effect Layer with Real Container Setup", () => {
  test("complete flow: container → Layer → Effect execution", async () => {
    const appContainer = createContainer({ injectionMode: "PROXY" });

    appContainer.register({
      db: asValue({ query: () => "database-query" }),
      userRepo: asValue({
        findById: () => Promise.resolve({ id: "1", name: "Test" }),
      }),
    });

    setAwilixContainer(appContainer);

    const AppLayer = buildAppLayer(appContainer, ["db", "userRepo"]);

    const program = Effect.gen(function* () {
      const db = yield* Effect.sync(() =>
        appContainer.resolve<{ query: () => string }>("db"),
      );
      const repo = yield* Effect.sync(() =>
        appContainer.resolve<{
          findById: (id: string) => Promise<{ id: string; name: string }>;
        }>("userRepo"),
      );
      const user = yield* Effect.promise(() => repo.findById("1"));
      return { dbResult: db.query(), user };
    });

    const runnable = Effect.provide(program, AppLayer);
    const result = await Effect.runPromise(runnable);

    expect(result.dbResult).toBe("database-query");
    expect(result.user).toEqual({ id: "1", name: "Test" });
  });
});
