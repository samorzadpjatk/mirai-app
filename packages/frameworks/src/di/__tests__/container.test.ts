import { describe, expect, test, beforeEach } from "bun:test";
import { Container } from "inversify";
import { provide } from "@inversifyjs/binding-decorators";
import "reflect-metadata";

import {
  container,
  initializeContainer,
  createChildContainer,
  createTestContainer,
  resetContainer,
} from "../container";

// =============================================================================
// Test Service Identifiers
// =============================================================================

const TEST_TYPES = {
  TestService: Symbol.for("TestService"),
  TestRepository: Symbol.for("TestRepository"),
  ConfigValue: Symbol.for("ConfigValue"),
  CounterService: Symbol.for("CounterService"),
};

// =============================================================================
// Test Classes with @provide Decorator
// =============================================================================

/**
 * Simple service decorated with @provide
 * No constructor dependencies - works with Bun
 */
@provide(TEST_TYPES.TestService)
class TestService {
  private value = 42;

  getValue(): number {
    return this.value;
  }

  setValue(v: number): void {
    this.value = v;
  }
}

/**
 * Repository pattern test class
 * No constructor dependencies - works with Bun
 */
@provide(TEST_TYPES.TestRepository)
class TestRepository {
  private data: string[] = [];

  add(item: string): void {
    this.data.push(item);
  }

  getAll(): string[] {
    return [...this.data];
  }
}

/**
 * Counter service to demonstrate transient vs singleton
 */
@provide(TEST_TYPES.CounterService)
class CounterService {
  private count = 0;

  increment(): number {
    this.count += 1;
    return this.count;
  }

  getCount(): number {
    return this.count;
  }
}

// =============================================================================
// Test Suite
// =============================================================================

describe("[UNIT] DI Container", () => {
  beforeEach(() => {
    resetContainer();
  });

  describe("Container Export", () => {
    test("exports a configured Container instance", () => {
      expect(container).toBeDefined();
      expect(container).toBeInstanceOf(Container);
    });

    test("container is empty before initialization", () => {
      // Before initialization, no @provide classes are registered
      // So getting a non-existent service should throw
      expect(() => container.get(TEST_TYPES.TestService)).toThrow();
    });
  });

  describe("Container Initialization", () => {
    test("initializeContainer loads buildProviderModule", () => {
      initializeContainer();

      // After initialization, @provide decorated classes should resolve
      const service = container.get<TestService>(TEST_TYPES.TestService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(TestService);
    });

    test("can resolve @provide decorated class", () => {
      initializeContainer();

      const service = container.get<TestService>(TEST_TYPES.TestService);
      expect(service.getValue()).toBe(42);
    });

    test("resolves same instance for singleton scope (default)", () => {
      initializeContainer();

      const instance1 = container.get<TestService>(TEST_TYPES.TestService);
      const instance2 = container.get<TestService>(TEST_TYPES.TestService);

      expect(instance1).toBe(instance2);
    });

    test("singleton instances share state", () => {
      initializeContainer();

      const instance1 = container.get<TestService>(TEST_TYPES.TestService);
      instance1.setValue(100);

      const instance2 = container.get<TestService>(TEST_TYPES.TestService);
      expect(instance2.getValue()).toBe(100);
    });

    test("can resolve multiple different @provide decorated classes", () => {
      initializeContainer();

      const service = container.get<TestService>(TEST_TYPES.TestService);
      const repo = container.get<TestRepository>(TEST_TYPES.TestRepository);
      const counter = container.get<CounterService>(TEST_TYPES.CounterService);

      expect(service).toBeInstanceOf(TestService);
      expect(repo).toBeInstanceOf(TestRepository);
      expect(counter).toBeInstanceOf(CounterService);
    });
  });

  describe("Child Container Creation", () => {
    test("createChildContainer returns new container", () => {
      const child = createChildContainer();

      expect(child).toBeDefined();
      expect(child).toBeInstanceOf(Container);
      expect(child).not.toBe(container);
    });

    test("child container can override parent bindings", () => {
      initializeContainer();

      const child = createChildContainer();
      const customService = new TestService();
      customService.setValue(999);

      child.bind(TEST_TYPES.TestService).toConstantValue(customService);

      const resolved = child.get<TestService>(TEST_TYPES.TestService);
      expect(resolved.getValue()).toBe(999);
    });

    test("child container inherits from parent", () => {
      initializeContainer();

      const child = createChildContainer();

      // Should be able to resolve from parent
      const service = child.get<TestService>(TEST_TYPES.TestService);
      expect(service).toBeDefined();
      expect(service.getValue()).toBe(42);
    });

    test("child container bindings do not affect parent", () => {
      initializeContainer();

      const child = createChildContainer();
      child.bind(TEST_TYPES.ConfigValue).toConstantValue("child-value");

      // Child should have the value
      expect(child.get<string>(TEST_TYPES.ConfigValue)).toBe("child-value");

      // Parent should not have it
      expect(() => container.get(TEST_TYPES.ConfigValue)).toThrow();
    });

    test("child container can have multiple overrides", () => {
      initializeContainer();

      const child = createChildContainer();

      // Override multiple services
      const customService = new TestService();
      customService.setValue(111);

      const customRepo = new TestRepository();
      customRepo.add("preloaded");

      child.bind(TEST_TYPES.TestService).toConstantValue(customService);
      child.bind(TEST_TYPES.TestRepository).toConstantValue(customRepo);

      // Verify overrides work
      const resolvedService = child.get<TestService>(TEST_TYPES.TestService);
      const resolvedRepo = child.get<TestRepository>(TEST_TYPES.TestRepository);

      expect(resolvedService.getValue()).toBe(111);
      expect(resolvedRepo.getAll()).toEqual(["preloaded"]);
    });
  });

  describe("Test Container Creation", () => {
    test("createTestContainer returns isolated container", () => {
      const testContainer = createTestContainer();

      expect(testContainer).toBeDefined();
      expect(testContainer).toBeInstanceOf(Container);
    });

    test("test container has provider module loaded", () => {
      const testContainer = createTestContainer();

      const service = testContainer.get<TestService>(TEST_TYPES.TestService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(TestService);
    });

    test("test container is isolated from root container", () => {
      const testContainer = createTestContainer();

      // Modify test container
      const customService = new TestService();
      customService.setValue(123);
      testContainer
        .rebind(TEST_TYPES.TestService)
        .toConstantValue(customService);

      // Root container should still have original
      initializeContainer();
      const rootService = container.get<TestService>(TEST_TYPES.TestService);
      expect(rootService.getValue()).toBe(42);
    });

    test("test container can resolve all @provide classes", () => {
      const testContainer = createTestContainer();

      const service = testContainer.get<TestService>(TEST_TYPES.TestService);
      const repo = testContainer.get<TestRepository>(TEST_TYPES.TestRepository);
      const counter = testContainer.get<CounterService>(
        TEST_TYPES.CounterService,
      );

      expect(service).toBeDefined();
      expect(repo).toBeDefined();
      expect(counter).toBeDefined();
    });
  });

  describe("Reset Container", () => {
    test("resetContainer clears all bindings", () => {
      initializeContainer();

      // Verify it works
      const service = container.get<TestService>(TEST_TYPES.TestService);
      expect(service).toBeDefined();

      // Reset
      resetContainer();

      // Should throw now
      expect(() => container.get(TEST_TYPES.TestService)).toThrow();
    });

    test("can reinitialize after reset", () => {
      initializeContainer();
      resetContainer();
      initializeContainer();

      const service = container.get<TestService>(TEST_TYPES.TestService);
      expect(service).toBeDefined();
    });

    test("reset clears all registered services", () => {
      initializeContainer();

      // Use multiple services
      container.get<TestService>(TEST_TYPES.TestService);
      container.get<TestRepository>(TEST_TYPES.TestRepository);
      container.get<CounterService>(TEST_TYPES.CounterService);

      resetContainer();

      // All should throw
      expect(() => container.get(TEST_TYPES.TestService)).toThrow();
      expect(() => container.get(TEST_TYPES.TestRepository)).toThrow();
      expect(() => container.get(TEST_TYPES.CounterService)).toThrow();
    });
  });

  describe("Service Functionality", () => {
    test("@provide decorated service methods work correctly", () => {
      initializeContainer();

      const service = container.get<TestService>(TEST_TYPES.TestService);

      expect(service.getValue()).toBe(42);
      service.setValue(100);
      expect(service.getValue()).toBe(100);
    });

    test("@provide decorated repository methods work correctly", () => {
      initializeContainer();

      const repo = container.get<TestRepository>(TEST_TYPES.TestRepository);

      repo.add("item-1");
      repo.add("item-2");

      expect(repo.getAll()).toEqual(["item-1", "item-2"]);
    });

    test("singleton scope preserves state across resolutions", () => {
      initializeContainer();

      const counter1 = container.get<CounterService>(TEST_TYPES.CounterService);
      counter1.increment();
      counter1.increment();

      const counter2 = container.get<CounterService>(TEST_TYPES.CounterService);
      expect(counter2.getCount()).toBe(2);

      counter2.increment();
      expect(counter1.getCount()).toBe(3);
    });
  });

  describe("Clean Architecture Compliance", () => {
    test("container lives in frameworks layer", () => {
      // This test documents the architectural decision
      // The container is in packages/frameworks/src/di/
      // which is the outermost layer (frameworks)

      expect(import.meta.url).toContain("frameworks/src/di");
    });

    test("container can resolve classes from any layer", () => {
      // The container doesn't care which layer the class comes from
      // It just manages instantiation

      initializeContainer();

      // Simulating resolution of different layer classes
      const service = container.get<TestService>(TEST_TYPES.TestService);
      const repo = container.get<TestRepository>(TEST_TYPES.TestRepository);
      const counter = container.get<CounterService>(TEST_TYPES.CounterService);

      expect(service).toBeDefined();
      expect(repo).toBeDefined();
      expect(counter).toBeDefined();
    });
  });
});
