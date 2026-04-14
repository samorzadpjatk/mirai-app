import { describe, expect, test, beforeEach } from "bun:test";
import {
  createContainer,
  asClass,
  asValue,
  type AwilixContainer,
} from "awilix";
import { createStaticModule } from "awilix-modular";

import {
  container,
  initializeContainer,
  getContainer,
  createChildContainer,
  createTestContainer,
  isContainerInitialized,
  resetContainer,
  asClass as exportAsClass,
  asValue as exportAsValue,
  Lifetime,
  createStaticModule as exportCreateStaticModule,
  createDynamicModule as exportCreateDynamicModule,
} from "../container";

// =============================================================================
// Test Classes
// =============================================================================

class TestService {
  private value = 42;

  getValue(): number {
    return this.value;
  }

  setValue(v: number): void {
    this.value = v;
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
// Test Module
// =============================================================================

const TestModule = createStaticModule({
  name: "TestModule",
  providers: {
    testService: TestService,
    testRepository: TestRepository,
    counterService: CounterService,
  },
  exports: ["testService", "testRepository", "counterService"],
});

// =============================================================================
// Test Suite
// =============================================================================

describe("[UNIT] DI Container (awilix-modular)", () => {
  beforeEach(() => {
    resetContainer();
  });

  describe("[UNIT] Container Export", () => {
    test("exports container proxy that throws before initialization", () => {
      // Container is a proxy that throws before initialization
      expect(() => container.resolve("anything")).toThrow(
        "Container not initialized",
      );
    });

    test("re-exports createStaticModule", () => {
      expect(exportCreateStaticModule).toBeDefined();
      expect(typeof exportCreateStaticModule).toBe("function");
    });

    test("re-exports createDynamicModule", () => {
      expect(exportCreateDynamicModule).toBeDefined();
      expect(typeof exportCreateDynamicModule).toBe("function");
    });

    test("re-exports asClass", () => {
      expect(exportAsClass).toBeDefined();
      expect(typeof exportAsClass).toBe("function");
    });

    test("re-exports asValue", () => {
      expect(exportAsValue).toBeDefined();
      expect(typeof exportAsValue).toBe("function");
    });

    test("re-exports Lifetime", () => {
      expect(Lifetime).toBeDefined();
    });
  });

  describe("[UNIT] Container Initialization", () => {
    test("initializeContainer creates and returns container", () => {
      const result = initializeContainer();

      expect(result).toBeDefined();
      expect(result.resolve).toBeDefined();
      expect(typeof result.resolve).toBe("function");
    });

    test("getContainer returns same container after initialization", () => {
      const initialized = initializeContainer();
      const retrieved = getContainer();

      expect(retrieved).toBe(initialized);
    });

    test("isContainerInitialized returns true after initialization", () => {
      expect(isContainerInitialized()).toBe(false);
      initializeContainer();
      expect(isContainerInitialized()).toBe(true);
    });

    test("can resolve classes from registered modules", () => {
      initializeContainer([TestModule]);

      const service = getContainer().resolve<TestService>("testService");
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(TestService);
      expect(service.getValue()).toBe(42);
    });

    test("can resolve multiple classes from module", () => {
      initializeContainer([TestModule]);

      const container = getContainer();
      const service = container.resolve<TestService>("testService");
      const repo = container.resolve<TestRepository>("testRepository");
      const counter = container.resolve<CounterService>("counterService");

      expect(service).toBeInstanceOf(TestService);
      expect(repo).toBeInstanceOf(TestRepository);
      expect(counter).toBeInstanceOf(CounterService);
    });
  });

  describe("[UNIT] Module Registration", () => {
    test("createStaticModule creates a valid module", () => {
      expect(TestModule).toBeDefined();
      expect(TestModule.name).toBe("TestModule");
      expect(TestModule.providers).toBeDefined();
      expect(TestModule.exports).toBeDefined();
    });

    test("module exports contain expected keys", () => {
      expect(TestModule.exports).toContain("testService");
      expect(TestModule.exports).toContain("testRepository");
      expect(TestModule.exports).toContain("counterService");
    });
  });

  describe("[UNIT] Child Container Creation", () => {
    test("createChildContainer returns new container", () => {
      initializeContainer();

      const child = createChildContainer();

      expect(child).toBeDefined();
      expect(child.resolve).toBeDefined();
      expect(child).not.toBe(getContainer());
    });

    test("child container can override parent registrations", () => {
      initializeContainer([TestModule]);

      const child = createChildContainer();
      const customService = new TestService();
      customService.setValue(999);

      child.register({
        testService: asValue(customService),
      });

      const resolved = child.resolve<TestService>("testService");
      expect(resolved.getValue()).toBe(999);
    });

    test("child container inherits from parent", () => {
      initializeContainer([TestModule]);

      const child = createChildContainer();

      // Should be able to resolve from parent
      const service = child.resolve<TestService>("testService");
      expect(service).toBeDefined();
      expect(service.getValue()).toBe(42);
    });

    test("child container registrations do not affect parent", () => {
      initializeContainer([TestModule]);

      const child = createChildContainer();
      child.register({
        configValue: asValue("child-value"),
      });

      // Child should have the value
      expect(child.resolve<string>("configValue")).toBe("child-value");

      // Parent should not have it
      expect(() => getContainer().resolve("configValue")).toThrow();
    });

    test("child container can have multiple overrides", () => {
      initializeContainer([TestModule]);

      const child = createChildContainer();

      // Override multiple services
      const customService = new TestService();
      customService.setValue(111);

      const customRepo = new TestRepository();
      customRepo.add("preloaded");

      child.register({
        testService: asValue(customService),
        testRepository: asValue(customRepo),
      });

      // Verify overrides work
      const resolvedService = child.resolve<TestService>("testService");
      const resolvedRepo = child.resolve<TestRepository>("testRepository");

      expect(resolvedService.getValue()).toBe(111);
      expect(resolvedRepo.getAll()).toEqual(["preloaded"]);
    });
  });

  describe("[UNIT] Test Container Creation", () => {
    test("createTestContainer returns isolated container", () => {
      const testContainer = createTestContainer();

      expect(testContainer).toBeDefined();
      expect(testContainer.resolve).toBeDefined();
      expect(typeof testContainer.resolve).toBe("function");
    });

    test("test container is isolated from root container", () => {
      initializeContainer([TestModule]);

      const testContainer = createTestContainer();

      // Modify test container
      const customService = new TestService();
      customService.setValue(123);
      testContainer.register({
        testService: asValue(customService),
      });

      // Test container should have custom value
      const testService = testContainer.resolve<TestService>("testService");
      expect(testService.getValue()).toBe(123);

      // Root container should not be affected (but also doesn't have testService)
      // since we didn't register it there
      expect(() => getContainer().resolve("testService")).not.toThrow();
    });

    test("test container can register and resolve classes", () => {
      const testContainer = createTestContainer();

      testContainer.register({
        testService: asClass(TestService).singleton(),
        testRepository: asClass(TestRepository).singleton(),
      });

      const service = testContainer.resolve<TestService>("testService");
      const repo = testContainer.resolve<TestRepository>("testRepository");

      expect(service).toBeDefined();
      expect(repo).toBeDefined();
      expect(service).toBeInstanceOf(TestService);
      expect(repo).toBeInstanceOf(TestRepository);
    });
  });

  describe("[UNIT] Reset Container", () => {
    test("resetContainer clears initialization state", () => {
      initializeContainer();
      expect(isContainerInitialized()).toBe(true);

      resetContainer();

      expect(isContainerInitialized()).toBe(false);
    });

    test("getContainer throws after reset", () => {
      initializeContainer();
      resetContainer();

      expect(() => getContainer()).toThrow("Container not initialized");
    });

    test("can reinitialize after reset", () => {
      initializeContainer([TestModule]);
      resetContainer();
      initializeContainer([TestModule]);

      const service = getContainer().resolve<TestService>("testService");
      expect(service).toBeDefined();
    });
  });

  describe("[UNIT] Service Functionality", () => {
    test("resolved service methods work correctly", () => {
      const testContainer = createTestContainer();
      testContainer.register({
        testService: asClass(TestService).singleton(),
      });

      const service = testContainer.resolve<TestService>("testService");

      expect(service.getValue()).toBe(42);
      service.setValue(100);
      expect(service.getValue()).toBe(100);
    });

    test("resolved repository methods work correctly", () => {
      const testContainer = createTestContainer();
      testContainer.register({
        testRepository: asClass(TestRepository).singleton(),
      });

      const repo = testContainer.resolve<TestRepository>("testRepository");

      repo.add("item-1");
      repo.add("item-2");

      expect(repo.getAll()).toEqual(["item-1", "item-2"]);
    });

    test("singleton scope preserves state across resolutions", () => {
      const testContainer = createTestContainer();
      testContainer.register({
        counterService: asClass(CounterService).singleton(),
      });

      const counter1 = testContainer.resolve<CounterService>("counterService");
      counter1.increment();
      counter1.increment();

      const counter2 = testContainer.resolve<CounterService>("counterService");
      expect(counter2.getCount()).toBe(2);

      counter2.increment();
      expect(counter1.getCount()).toBe(3);
    });

    test("transient scope creates new instances", () => {
      const testContainer = createTestContainer();
      testContainer.register({
        counterService: asClass(CounterService).transient(),
      });

      const counter1 = testContainer.resolve<CounterService>("counterService");
      counter1.increment();
      counter1.increment();

      const counter2 = testContainer.resolve<CounterService>("counterService");
      expect(counter2.getCount()).toBe(0); // Fresh instance
    });
  });

  describe("[UNIT] Clean Architecture Compliance", () => {
    test("container lives in frameworks layer", () => {
      // This test documents the architectural decision
      // The container is in packages/frameworks/src/di/
      // which is the outermost layer (frameworks)

      expect(import.meta.url).toContain("frameworks/src/di");
    });

    test("container can resolve classes from modules", () => {
      // The container doesn't care which layer the class comes from
      // It just manages instantiation through modules

      initializeContainer([TestModule]);

      // Simulating resolution of different layer classes
      const service = getContainer().resolve<TestService>("testService");
      const repo = getContainer().resolve<TestRepository>("testRepository");
      const counter = getContainer().resolve<CounterService>("counterService");

      expect(service).toBeDefined();
      expect(repo).toBeDefined();
      expect(counter).toBeDefined();
    });
  });

  describe("[UNIT] No reflect-metadata requirement", () => {
    test("works without reflect-metadata import", () => {
      // This test verifies awilix-modular doesn't need reflect-metadata
      // Unlike Inversify which requires: import "reflect-metadata";

      const testContainer = createContainer({
        injectionMode: "PROXY",
      });

      testContainer.register({
        testService: asClass(TestService),
      });

      const service = testContainer.resolve<TestService>("testService");
      expect(service).toBeDefined();
      expect(service.getValue()).toBe(42);
    });
  });
});
