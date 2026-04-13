import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { createContainer, asClass, asValue } from "awilix";
import { Effect, Layer, Context } from "effect";

import {
  setAwilixContainer,
  getAwilixContainer,
  hasAwilixContainer,
  resetAwilixContainer,
  createContainerLayer,
  fromAwilix,
  fromAwilixWithTag,
  fromContainer,
  buildAppLayer,
  buildAppLayerFromGlobal,
  createServiceTag,
  runWithAwilixContainer,
  runWithGlobalContainer,
  AwilixContainerTag,
} from "../effect-layer";

// =============================================================================
// Test Services
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

  async findById(id: string): Promise<{ id: string; name: string } | null> {
    return { id, name: `User-${id}` };
  }
}

// Custom Tag for testing fromAwilixWithTag
const TestRepositoryTag = Context.Tag("TestRepository")<
  TestRepositoryTag,
  TestRepository
>();

// =============================================================================
// Test Suite
// =============================================================================

describe("[UNIT] Effect Layer Composition", () => {
  let container: ReturnType<typeof createContainer>;

  beforeEach(() => {
    container = createContainer({ injectionMode: "PROXY" });
    container.register({
      testService: asClass(TestService).singleton(),
      testRepository: asClass(TestRepository).singleton(),
      config: asValue({ apiUrl: "https://api.example.com" }),
    });
    resetAwilixContainer();
  });

  afterEach(() => {
    resetAwilixContainer();
  });

  describe("Container Management", () => {
    test("setAwilixContainer stores container globally", () => {
      expect(hasAwilixContainer()).toBe(false);

      setAwilixContainer(container);

      expect(hasAwilixContainer()).toBe(true);
      expect(getAwilixContainer()).toBe(container);
    });

    test("resetAwilixContainer clears global container", () => {
      setAwilixContainer(container);
      expect(hasAwilixContainer()).toBe(true);

      resetAwilixContainer();

      expect(hasAwilixContainer()).toBe(false);
      expect(() => getAwilixContainer()).toThrow("Awilix container not set");
    });

    test("getAwilixContainer throws when not set", () => {
      expect(() => getAwilixContainer()).toThrow("Awilix container not set");
    });
  });

  describe("createContainerLayer", () => {
    test("creates Layer providing the container", async () => {
      const ContainerLayer = createContainerLayer(container);

      const program = Effect.gen(function* () {
        const ctr = yield* AwilixContainerTag;
        const service = ctr.resolve<TestService>("testService");
        return service.getValue();
      });

      const result = await Effect.runPromise(
        Effect.provide(program, ContainerLayer),
      );

      expect(result).toBe(42);
    });

    test("container Layer can resolve multiple services", async () => {
      const ContainerLayer = createContainerLayer(container);

      const program = Effect.gen(function* () {
        const ctr = yield* AwilixContainerTag;
        const service = ctr.resolve<TestService>("testService");
        const repo = ctr.resolve<TestRepository>("testRepository");
        const config = ctr.resolve<{ apiUrl: string }>("config");

        return {
          value: service.getValue(),
          hasRepo: !!repo,
          apiUrl: config.apiUrl,
        };
      });

      const result = await Effect.runPromise(
        Effect.provide(program, ContainerLayer),
      );

      expect(result.value).toBe(42);
      expect(result.hasRepo).toBe(true);
      expect(result.apiUrl).toBe("https://api.example.com");
    });
  });

  describe("fromContainer", () => {
    test("creates Layer from specific container (not global)", async () => {
      // Don't set global container - fromContainer doesn't need it
      const ServiceLayer = fromContainer<TestService>(container, "testService");

      const Tag = Context.GenericTag<TestService>("testService");
      const program = Effect.gen(function* () {
        const service = yield* Tag;
        return service.getValue();
      });

      const result = await Effect.runPromise(
        Effect.provide(program, ServiceLayer),
      );

      expect(result).toBe(42);
    });

    test("multiple fromContainer layers can be merged", async () => {
      const ServiceLayer = fromContainer<TestService>(container, "testService");
      const ConfigLayer = fromContainer<{ apiUrl: string }>(
        container,
        "config",
      );

      const AppLayer = Layer.mergeAll(ServiceLayer, ConfigLayer);

      const ServiceTag = Context.GenericTag<TestService>("testService");
      const ConfigTag = Context.GenericTag<{ apiUrl: string }>("config");

      const program = Effect.gen(function* () {
        const service = yield* ServiceTag;
        const config = yield* ConfigTag;
        return { value: service.getValue(), url: config.apiUrl };
      });

      const result = await Effect.runPromise(Effect.provide(program, AppLayer));

      expect(result.value).toBe(42);
      expect(result.url).toBe("https://api.example.com");
    });
  });

  describe("fromAwilix", () => {
    test("creates Layer from global container", async () => {
      setAwilixContainer(container);

      const ServiceLayer = fromAwilix<TestService>("testService");

      const Tag = Context.GenericTag<TestService>("testService");
      const program = Effect.gen(function* () {
        const service = yield* Tag;
        return service.getValue();
      });

      const result = await Effect.runPromise(
        Effect.provide(program, ServiceLayer),
      );

      expect(result).toBe(42);
    });

    test("fromAwilix resolves fresh on each run (Effect.sync)", async () => {
      setAwilixContainer(container);

      const ServiceLayer = fromAwilix<TestService>("testService");

      const Tag = Context.GenericTag<TestService>("testService");

      // First run
      const program1 = Effect.gen(function* () {
        const service = yield* Tag;
        service.setValue(100);
        return service.getValue();
      });

      const result1 = await Effect.runPromise(
        Effect.provide(program1, ServiceLayer),
      );
      expect(result1).toBe(100);

      // Verify container state
      const containerService = container.resolve<TestService>("testService");
      expect(containerService.getValue()).toBe(100);
    });
  });

  describe("fromAwilixWithTag", () => {
    test("creates Layer with custom Tag", async () => {
      setAwilixContainer(container);

      const RepoLayer = fromAwilixWithTag("testRepository", TestRepositoryTag);

      const program = Effect.gen(function* () {
        const repo = yield* TestRepositoryTag;
        repo.add("test-item");
        return repo.getAll();
      });

      const result = await Effect.runPromise(
        Effect.provide(program, RepoLayer),
      );

      expect(result).toEqual(["test-item"]);
    });

    test("custom Tag provides type safety", async () => {
      setAwilixContainer(container);

      const RepoLayer = fromAwilixWithTag("testRepository", TestRepositoryTag);

      const program = Effect.gen(function* () {
        const repo = yield* TestRepositoryTag;
        // TypeScript knows this is a TestRepository
        const user = yield* Effect.promise(() => repo.findById("123"));
        return user;
      });

      const result = await Effect.runPromise(
        Effect.provide(program, RepoLayer),
      );

      expect(result).toEqual({ id: "123", name: "User-123" });
    });
  });

  describe("buildAppLayer", () => {
    test("builds Layer from multiple tokens", async () => {
      const AppLayer = buildAppLayer(container, [
        "testService",
        "testRepository",
        "config",
      ]);

      const ServiceTag = Context.GenericTag<TestService>("testService");
      const RepoTag = Context.GenericTag<TestRepository>("testRepository");
      const ConfigTag = Context.GenericTag<{ apiUrl: string }>("config");

      const program = Effect.gen(function* () {
        const service = yield* ServiceTag;
        const repo = yield* RepoTag;
        const config = yield* ConfigTag;

        return {
          value: service.getValue(),
          repoItems: repo.getAll().length,
          apiUrl: config.apiUrl,
        };
      });

      const result = await Effect.runPromise(Effect.provide(program, AppLayer));

      expect(result.value).toBe(42);
      expect(result.repoItems).toBe(0);
      expect(result.apiUrl).toBe("https://api.example.com");
    });

    test("empty token list creates empty Layer", async () => {
      const EmptyLayer = buildAppLayer(container, []);

      const program = Effect.sync(() => "success");

      const result = await Effect.runPromise(
        Effect.provide(program, EmptyLayer),
      );

      expect(result).toBe("success");
    });
  });

  describe("buildAppLayerFromGlobal", () => {
    test("uses global container to build Layer", async () => {
      setAwilixContainer(container);

      const AppLayer = buildAppLayerFromGlobal(["testService", "config"]);

      const ServiceTag = Context.GenericTag<TestService>("testService");
      const ConfigTag = Context.GenericTag<{ apiUrl: string }>("config");

      const program = Effect.gen(function* () {
        const service = yield* ServiceTag;
        const config = yield* ConfigTag;
        return { value: service.getValue(), url: config.apiUrl };
      });

      const result = await Effect.runPromise(Effect.provide(program, AppLayer));

      expect(result.value).toBe(42);
      expect(result.url).toBe("https://api.example.com");
    });

    test("throws when global container not set", () => {
      expect(() => buildAppLayerFromGlobal(["testService"])).toThrow(
        "Awilix container not set",
      );
    });
  });

  describe("createServiceTag", () => {
    test("creates Tag and Layer factory", async () => {
      const UserRepo = createServiceTag<TestRepository>("testRepository");

      // Use the tag in an Effect
      const program = Effect.gen(function* () {
        const repo = yield* UserRepo.tag;
        repo.add("item-1");
        return repo.getAll();
      });

      // Create the layer from container
      const RepoLayer = UserRepo.layer(container);

      const result = await Effect.runPromise(
        Effect.provide(program, RepoLayer),
      );

      expect(result).toEqual(["item-1"]);
    });

    test("multiple service tags work together", async () => {
      const Service = createServiceTag<TestService>("testService");
      const Config = createServiceTag<{ apiUrl: string }>("config");

      const program = Effect.gen(function* () {
        const service = yield* Service.tag;
        const config = yield* Config.tag;
        return {
          value: service.getValue(),
          url: config.apiUrl,
        };
      });

      const AppLayer = Layer.mergeAll(
        Service.layer(container),
        Config.layer(container),
      );

      const result = await Effect.runPromise(Effect.provide(program, AppLayer));

      expect(result.value).toBe(42);
      expect(result.url).toBe("https://api.example.com");
    });
  });

  describe("runWithAwilixContainer", () => {
    test("runs Effect with container-provided services", async () => {
      const Tag = Context.GenericTag<TestService>("testService");

      const program = Effect.gen(function* () {
        const service = yield* Tag;
        return service.getValue();
      });

      const result = await runWithAwilixContainer(
        container,
        ["testService"],
        program,
      );

      expect(result).toBe(42);
    });

    test("sets global container automatically", async () => {
      const Tag = Context.GenericTag<TestService>("testService");

      const program = Effect.gen(function* () {
        // This uses getAwilixContainer() internally
        const ctr = getAwilixContainer();
        const service = ctr.resolve<TestService>("testService");
        return service.getValue();
      });

      expect(hasAwilixContainer()).toBe(false);

      await runWithAwilixContainer(container, [], program);

      expect(hasAwilixContainer()).toBe(true);
    });
  });

  describe("runWithGlobalContainer", () => {
    test("runs Effect with global container", async () => {
      setAwilixContainer(container);

      const Tag = Context.GenericTag<TestRepository>("testRepository");

      const program = Effect.gen(function* () {
        const repo = yield* Tag;
        repo.add("global-test");
        return repo.getAll();
      });

      const result = await runWithGlobalContainer(["testRepository"], program);

      expect(result).toEqual(["global-test"]);
    });

    test("throws when global container not set", async () => {
      const program = Effect.sync(() => "test");

      await expect(runWithGlobalContainer([], program)).rejects.toThrow(
        "Awilix container not set",
      );
    });
  });
});

describe("[INTEGRATION] Layer Composition with Real Use Case", () => {
  test("complete flow: container -> Layer -> Effect -> service resolution", async () => {
    // Setup
    const appContainer = createContainer({ injectionMode: "PROXY" });
    appContainer.register({
      userService: asClass(TestService).singleton(),
      userRepository: asClass(TestRepository).singleton(),
      appConfig: asValue({ env: "test", version: "1.0.0" }),
    });

    // Create Layer from container
    const AppLayer = buildAppLayer(appContainer, [
      "userService",
      "userRepository",
      "appConfig",
    ]);

    // Create Context Tags
    const UserServiceTag = Context.GenericTag<TestService>("userService");
    const UserRepoTag = Context.GenericTag<TestRepository>("userRepository");
    const ConfigTag = Context.GenericTag<{ env: string; version: string }>(
      "appConfig",
    );

    // Complex business logic Effect
    const businessLogic = Effect.gen(function* () {
      const service = yield* UserServiceTag;
      const repo = yield* UserRepoTag;
      const config = yield* ConfigTag;

      // Simulate business operations
      const value = service.getValue();
      repo.add(`processed-${value}`);

      return {
        computedValue: value * 2,
        items: repo.getAll(),
        environment: config.env,
      };
    });

    // Execute
    const result = await Effect.runPromise(
      Effect.provide(businessLogic, AppLayer),
    );

    // Verify
    expect(result.computedValue).toBe(84);
    expect(result.items).toEqual(["processed-42"]);
    expect(result.environment).toBe("test");
  });

  test("layers can be composed and overridden for testing", async () => {
    // Production container
    const prodContainer = createContainer({ injectionMode: "PROXY" });
    prodContainer.register({
      apiClient: asValue({ baseUrl: "https://api.production.com" }),
    });

    // Test override container
    const testContainer = createContainer({ injectionMode: "PROXY" });
    testContainer.register({
      apiClient: asValue({ baseUrl: "https://api.test.com" }),
    });

    const ApiTag = Context.GenericTag<{ baseUrl: string }>("apiClient");

    const checkUrl = Effect.gen(function* () {
      const api = yield* ApiTag;
      return api.baseUrl;
    });

    // Production Layer
    const ProdLayer = fromContainer(prodContainer, "apiClient");
    const prodResult = await Effect.runPromise(
      Effect.provide(checkUrl, ProdLayer),
    );
    expect(prodResult).toBe("https://api.production.com");

    // Test Layer (override)
    const TestLayer = fromContainer(testContainer, "apiClient");
    const testResult = await Effect.runPromise(
      Effect.provide(checkUrl, TestLayer),
    );
    expect(testResult).toBe("https://api.test.com");
  });
});
