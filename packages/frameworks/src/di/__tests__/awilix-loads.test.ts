import { describe, it, expect } from "bun:test";

/**
 * [UNIT] Awilix Package Loading Test
 *
 * Verifies that awilix and awilix-modular packages are correctly installed
 * and can be imported without requiring reflect-metadata or decorator settings.
 *
 * This is a foundational test for the DI migration from Inversify to Awilix.
 *
 * Key benefits of Awilix over Inversify:
 * - No reflect-metadata dependency required
 * - No experimentalDecorators needed in tsconfig
 * - No emitDecoratorMetadata needed in tsconfig
 * - Proxy-based resolution (cleaner, more modern)
 */

describe("[UNIT] Awilix Package Loading", () => {
  it("should import awilix without errors", () => {
    // This test passes if the import works - no exceptions thrown
    const awilix = require("awilix");

    expect(awilix).toBeDefined();
    expect(awilix.createContainer).toBeDefined();
    expect(typeof awilix.createContainer).toBe("function");
  });

  it("should verify reflect-metadata is NOT needed for awilix", () => {
    // This test documents a key benefit of awilix over Inversify:
    // awilix does NOT require the reflect-metadata package
    //
    // Inversify requires: import "reflect-metadata";
    // Awilix works without any decorator metadata system
    //
    // This repository no longer depends on reflect-metadata.
    // awilix works without any decorator metadata system.

    const { createContainer, asClass } = require("awilix");

    class TestService {
      value = "works without reflect-metadata!";
    }

    const container = createContainer();
    container.register({
      service: asClass(TestService),
    });

    const resolved = container.resolve("service");
    expect(resolved.value).toBe("works without reflect-metadata!");
  });

  it("should create a basic container", () => {
    const { createContainer } = require("awilix");

    const container = createContainer();

    expect(container).toBeDefined();
    expect(container.resolve).toBeDefined();
    expect(typeof container.resolve).toBe("function");
    expect(container.register).toBeDefined();
    expect(typeof container.register).toBe("function");
  });

  it("should register and resolve a simple value", () => {
    const { createContainer, asValue } = require("awilix");

    const container = createContainer();
    const testValue = { message: "Hello from Awilix!" };

    container.register({
      testService: asValue(testValue),
    });

    const resolved = container.resolve("testService");

    expect(resolved).toBe(testValue);
    expect(resolved.message).toBe("Hello from Awilix!");
  });

  it("should register and resolve a class-based service", () => {
    const { createContainer, asClass } = require("awilix");

    class TestService {
      getMessage() {
        return "TestService works!";
      }
    }

    const container = createContainer();

    container.register({
      testService: asClass(TestService).scoped(),
    });

    const resolved = container.resolve("testService");

    expect(resolved).toBeInstanceOf(TestService);
    expect(resolved.getMessage()).toBe("TestService works!");
  });

  it("should support scoped lifetime (singleton)", () => {
    const { createContainer, asClass, Lifetime } = require("awilix");

    let instanceCount = 0;

    class CounterService {
      id: number;
      constructor() {
        this.id = ++instanceCount;
      }
    }

    const container = createContainer();

    container.register({
      counter: asClass(CounterService).singleton(),
    });

    // Resolve twice - should get same instance
    const instance1 = container.resolve("counter");
    const instance2 = container.resolve("counter");

    expect(instance1.id).toBe(1);
    expect(instance2.id).toBe(1); // Same instance
    expect(instanceCount).toBe(1);
  });

  it("should support scoped lifetime (transient)", () => {
    const { createContainer, asClass } = require("awilix");

    let instanceCount = 0;

    class CounterService {
      id: number;
      constructor() {
        this.id = ++instanceCount;
      }
    }

    const container = createContainer();

    container.register({
      counter: asClass(CounterService).transient(),
    });

    // Resolve twice - should get different instances
    const instance1 = container.resolve("counter");
    const instance2 = container.resolve("counter");

    expect(instance1.id).toBe(1);
    expect(instance2.id).toBe(2); // Different instance
    expect(instanceCount).toBe(2);
  });

  it("should support container scope (child containers)", () => {
    const { createContainer, asClass } = require("awilix");

    class ParentService {
      name = "parent";
    }

    const parentContainer = createContainer();
    parentContainer.register({
      service: asClass(ParentService).singleton(),
    });

    // Create child container
    const childContainer = parentContainer.createScope();

    // Resolve from child - should get parent's singleton
    const resolvedFromChild = childContainer.resolve("service");
    const resolvedFromParent = parentContainer.resolve("service");

    expect(resolvedFromChild).toBe(resolvedFromParent); // Same instance
  });

  it("should work with ESM imports (no reflect-metadata)", async () => {
    // This test verifies that awilix works with native ESM
    // without needing reflect-metadata polyfill
    const awilix = await import("awilix");

    expect(awilix.createContainer).toBeDefined();

    const container = awilix.createContainer();

    container.register({
      config: awilix.asValue({ env: "test" }),
    });

    const config = container.resolve("config");
    expect(config.env).toBe("test");
  });

  it("should verify no reflect-metadata import needed", () => {
    // This test documents that awilix does NOT require reflect-metadata
    // Unlike Inversify which requires: import "reflect-metadata";

    // If this test runs without throwing, it proves awilix works
    // without the reflect-metadata side-effect import
    const { createContainer, asClass } = require("awilix");

    class MyService {
      greet() {
        return "Hello!";
      }
    }

    const container = createContainer();
    container.register({
      myService: asClass(MyService),
    });

    const service = container.resolve("myService");
    expect(service.greet()).toBe("Hello!");
  });
});

describe("[UNIT] Awilix-Modular Package Loading", () => {
  it("should import awilix-modular with correct exports", () => {
    const awilixModular = require("awilix-modular");

    expect(awilixModular).toBeDefined();
    expect(awilixModular.createStaticModule).toBeDefined();
    expect(typeof awilixModular.createStaticModule).toBe("function");
    expect(awilixModular.createDynamicModule).toBeDefined();
    expect(typeof awilixModular.createDynamicModule).toBe("function");
    expect(awilixModular.DIContext).toBeDefined();
  });

  it("should create a static module using awilix-modular", () => {
    const { createStaticModule } = require("awilix-modular");

    // Define a simple service class
    class TestService {
      greet() {
        return "Hello from TestService!";
      }
    }

    // Create a static module
    const TestModule = createStaticModule({
      name: "TestModule",
      providers: {
        testService: TestService,
      },
      exports: {
        testService: TestService,
      },
    });

    expect(TestModule).toBeDefined();
    expect(TestModule.name).toBe("TestModule");
    expect(TestModule.providers).toBeDefined();
    expect(TestModule.exports).toBeDefined();
  });

  it("should create a dynamic module using awilix-modular", () => {
    const { createDynamicModule } = require("awilix-modular");

    // Create a dynamic module factory function
    // The factory receives params and returns module configuration
    const ConfigModule = createDynamicModule<{ apiUrl: string }>((params) => ({
      name: "ConfigModule",
      providers: {
        config: {
          apiUrl: params.apiUrl,
        },
      },
      exports: {
        config: {
          apiUrl: params.apiUrl,
        },
      },
    }));

    expect(ConfigModule).toBeDefined();
    expect(typeof ConfigModule.forRoot).toBe("function");

    // Use forRoot to get the module instance with params
    const moduleInstance = ConfigModule.forRoot({
      apiUrl: "https://api.example.com",
    });
    expect(moduleInstance).toBeDefined();
    expect(moduleInstance.name).toBe("ConfigModule");
    expect(moduleInstance.providers).toBeDefined();
    expect(moduleInstance.exports).toBeDefined();
    expect(moduleInstance.providers.config.apiUrl).toBe(
      "https://api.example.com",
    );
  });

  it("should verify no reflect-metadata needed for awilix-modular", () => {
    // This test verifies that awilix-modular works without reflect-metadata
    // Unlike Inversify which requires: import "reflect-metadata";
    const { createStaticModule } = require("awilix-modular");
    const { createContainer, asClass } = require("awilix");

    class SimpleService {
      value = 42;
    }

    // Create a module without any decorator metadata
    const SimpleModule = createStaticModule({
      name: "SimpleModule",
      providers: {
        simpleService: SimpleService,
      },
      exports: {
        simpleService: SimpleService,
      },
    });

    expect(SimpleModule).toBeDefined();
    expect(SimpleModule.name).toBe("SimpleModule");
  });
});
