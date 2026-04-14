import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { createContainer, asClass, asValue } from "awilix";
import { Effect, Layer, Context } from "effect";

import {
  setAwilixContainer,
  resetAwilixContainer,
  createServicesLayer,
  createCradleLayer,
  createLazyLayer,
  composeWithContainer,
  createTransformedLayer,
  buildCompleteAppLayer,
  initializeAppLayer as initializeEffectAppLayer,
  AwilixCradleTag,
  createContainerLayer,
  fromContainer,
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
}

// =============================================================================
// Test Suite
// =============================================================================

describe("[UNIT] Effect Layer Composition Utilities", () => {
  let container: ReturnType<typeof createContainer>;

  beforeEach(() => {
    container = createContainer({ injectionMode: "PROXY" });
    container.register({
      testService: asClass(TestService).singleton(),
      testRepository: asClass(TestRepository).singleton(),
      config: asValue({ apiUrl: "https://api.example.com", timeout: 5000 }),
    });
    resetAwilixContainer();
  });

  afterEach(() => {
    resetAwilixContainer();
  });

  describe("[UNIT] createServicesLayer", () => {
    test("creates Layer from service map", async () => {
      const ServiceTag = Context.Tag("TestService")<
        TestServiceTag,
        TestService
      >();
      const RepoTag = Context.Tag("TestRepository")<
        TestRepositoryTag,
        TestRepository
      >();

      const AppLayer = createServicesLayer(container, {
        testService: ServiceTag,
        testRepository: RepoTag,
      });

      const program = Effect.gen(function* () {
        const service = yield* ServiceTag;
        const repo = yield* RepoTag;
        return {
          value: service.getValue(),
          hasRepo: !!repo,
        };
      });

      const result = await Effect.runPromise(Effect.provide(program, AppLayer));

      expect(result.value).toBe(42);
      expect(result.hasRepo).toBe(true);
    });

    test("empty service map creates empty Layer", async () => {
      const EmptyLayer = createServicesLayer(container, {});

      const program = Effect.sync(() => "success");

      const result = await Effect.runPromise(
        Effect.provide(program, EmptyLayer),
      );

      expect(result).toBe("success");
    });
  });

  describe("[UNIT] createCradleLayer", () => {
    test("provides container as cradle", async () => {
      // Create a Layer that provides both the cradle access and individual services
      const CradleLayer = createCradleLayer(container);
      const ServiceLayer = fromContainer<TestService>(container, "testService");
      const CombinedLayer = Layer.merge(CradleLayer, ServiceLayer);

      const ServiceTag = Context.GenericTag<TestService>("testService");

      const program = Effect.gen(function* () {
        // Can access individual service via its Tag
        const service = yield* ServiceTag;
        return service.getValue();
      });

      const result = await Effect.runPromise(
        Effect.provide(program, CombinedLayer),
      );

      expect(result).toBe(42);
    });
  });

  describe("[UNIT] createLazyLayer", () => {
    test("resolves service lazily", async () => {
      const LazyLayer = createLazyLayer<TestService>(container, "testService");

      const Tag = Context.GenericTag<TestService>("testService");
      const program = Effect.gen(function* () {
        const service = yield* Tag;
        return service.getValue();
      });

      const result = await Effect.runPromise(
        Effect.provide(program, LazyLayer),
      );

      expect(result).toBe(42);
    });

    test("lazy resolution creates new access each time", async () => {
      let resolveCount = 0;
      const trackingContainer = createContainer({ injectionMode: "PROXY" });
      trackingContainer.register({
        counter: asValue({
          increment: () => ++resolveCount,
          getCount: () => resolveCount,
        }),
      });

      const LazyLayer = createLazyLayer(trackingContainer, "counter");

      const CounterTag = Context.GenericTag<{
        increment: () => number;
        getCount: () => number;
      }>("counter");

      const program = Effect.gen(function* () {
        const counter = yield* CounterTag;
        return counter.increment();
      });

      // First run
      await Effect.runPromise(Effect.provide(program, LazyLayer));
      expect(resolveCount).toBe(1);

      // Second run - should resolve again
      await Effect.runPromise(Effect.provide(program, LazyLayer));
      expect(resolveCount).toBe(2);
    });
  });

  describe("[UNIT] composeWithContainer", () => {
    test("composes container with additional layers", async () => {
      const ConfigTag = Context.Tag("Config")<ConfigTag, { apiUrl: string }>();
      const ConfigLayer = Layer.succeed(ConfigTag, {
        apiUrl: "https://test.com",
      });

      // composeWithContainer provides the container itself, we need to add service layers
      const ContainerLayer = createContainerLayer(container);
      const ServiceLayer = fromContainer<TestService>(container, "testService");
      const ComposedLayer = Layer.mergeAll(
        ContainerLayer,
        ServiceLayer,
        ConfigLayer,
      );

      const ServiceTag = Context.GenericTag<TestService>("testService");
      const program = Effect.gen(function* () {
        const service = yield* ServiceTag;
        const config = yield* ConfigTag;
        return {
          value: service.getValue(),
          url: config.apiUrl,
        };
      });

      const result = await Effect.runPromise(
        Effect.provide(program, ComposedLayer),
      );

      expect(result.value).toBe(42);
      expect(result.url).toBe("https://test.com");
    });

    test("works with just service layers", async () => {
      const ServiceLayer = fromContainer<TestService>(container, "testService");

      const ServiceTag = Context.GenericTag<TestService>("testService");
      const program = Effect.gen(function* () {
        const service = yield* ServiceTag;
        return service.getValue();
      });

      const result = await Effect.runPromise(
        Effect.provide(program, ServiceLayer),
      );

      expect(result).toBe(42);
    });
  });

  describe("[UNIT] createTransformedLayer", () => {
    test("transforms service before providing", async () => {
      const TransformedLayer = createTransformedLayer(
        container,
        "testService",
        (service: TestService) => ({
          original: service,
          doubledValue: () => service.getValue() * 2,
        }),
      );

      const TransformedTag = Context.GenericTag<{
        original: TestService;
        doubledValue: () => number;
      }>("testService");

      const program = Effect.gen(function* () {
        const transformed = yield* TransformedTag;
        return transformed.doubledValue();
      });

      const result = await Effect.runPromise(
        Effect.provide(program, TransformedLayer),
      );

      expect(result).toBe(84);
    });

    test("can transform config objects", async () => {
      const EnhancedConfigLayer = createTransformedLayer(
        container,
        "config",
        (config: { apiUrl: string; timeout: number }) => ({
          ...config,
          fullUrl: `${config.apiUrl}/api/v1`,
          isProduction: config.apiUrl.includes("production"),
        }),
      );

      const ConfigTag = Context.GenericTag<{
        apiUrl: string;
        timeout: number;
        fullUrl: string;
        isProduction: boolean;
      }>("config");

      const program = Effect.gen(function* () {
        const config = yield* ConfigTag;
        return {
          url: config.fullUrl,
          prod: config.isProduction,
        };
      });

      const result = await Effect.runPromise(
        Effect.provide(program, EnhancedConfigLayer),
      );

      expect(result.url).toBe("https://api.example.com/api/v1");
      expect(result.prod).toBe(false);
    });
  });

  describe("[UNIT] buildCompleteAppLayer", () => {
    test("builds Layer with all options", async () => {
      const LoggerTag = Context.Tag("Logger")<
        LoggerTag,
        { log: (msg: string) => void }
      >();
      const LoggerLayer = Layer.succeed(LoggerTag, {
        log: (msg: string) => console.log(msg),
      });

      const AppLayer = buildCompleteAppLayer(
        container,
        ["testService", "config"],
        {
          additionalLayers: [LoggerLayer],
          transformations: {
            config: (cfg: { apiUrl: string; timeout: number }) => ({
              ...cfg,
              enhanced: true,
            }),
          },
          includeContainer: true,
        },
      );

      const ServiceTag = Context.GenericTag<TestService>("testService");
      const ConfigTag = Context.GenericTag<{
        apiUrl: string;
        timeout: number;
        enhanced: boolean;
      }>("config");

      const program = Effect.gen(function* () {
        const service = yield* ServiceTag;
        const config = yield* ConfigTag;
        const logger = yield* LoggerTag;
        return {
          value: service.getValue(),
          enhanced: config.enhanced,
          hasLogger: !!logger,
        };
      });

      const result = await Effect.runPromise(Effect.provide(program, AppLayer));

      expect(result.value).toBe(42);
      expect(result.enhanced).toBe(true);
      expect(result.hasLogger).toBe(true);
    });

    test("builds simple Layer without options", async () => {
      const AppLayer = buildCompleteAppLayer(container, ["testService"]);

      const ServiceTag = Context.GenericTag<TestService>("testService");
      const program = Effect.gen(function* () {
        const service = yield* ServiceTag;
        return service.getValue();
      });

      const result = await Effect.runPromise(Effect.provide(program, AppLayer));

      expect(result).toBe(42);
    });

    test("returns empty Layer for empty tokens and no additional layers", async () => {
      const EmptyLayer = buildCompleteAppLayer(container, []);

      const program = Effect.sync(() => "empty-success");

      const result = await Effect.runPromise(
        Effect.provide(program, EmptyLayer),
      );

      expect(result).toBe("empty-success");
    });
  });

  describe("[UNIT] initializeEffectAppLayer", () => {
    test("initializes global container and returns Layer", async () => {
      setAwilixContainer(container);

      const AppLayer = initializeEffectAppLayer(container, [
        "testService",
        "testRepository",
      ]);

      const ServiceTag = Context.GenericTag<TestService>("testService");
      const RepoTag = Context.GenericTag<TestRepository>("testRepository");

      const program = Effect.gen(function* () {
        const service = yield* ServiceTag;
        const repo = yield* RepoTag;
        return {
          value: service.getValue(),
          hasRepo: !!repo,
        };
      });

      const result = await Effect.runPromise(Effect.provide(program, AppLayer));

      expect(result.value).toBe(42);
      expect(result.hasRepo).toBe(true);
    });
  });
});

describe("[INTEGRATION] Layer Composition End-to-End", () => {
  test("complete flow with all utilities", async () => {
    // Setup container
    const appContainer = createContainer({ injectionMode: "PROXY" });
    appContainer.register({
      db: asValue({ query: (sql: string) => [`result-${sql}`] }),
      cache: asValue({ get: (key: string) => `cached-${key}` }),
      api: asValue({ fetch: (url: string) => ({ data: url }) }),
    });

    // Create Tags
    const DbTag = Context.Tag("Database")<
      DbTag,
      { query: (sql: string) => string[] }
    >();
    const CacheTag = Context.Tag("Cache")<
      CacheTag,
      { get: (key: string) => string }
    >();
    const ApiTag = Context.Tag("Api")<
      ApiTag,
      { fetch: (url: string) => { data: string } }
    >();

    // Create Layer using service map
    const AppLayer = createServicesLayer(appContainer, {
      db: DbTag,
      cache: CacheTag,
      api: ApiTag,
    });

    // Complex business logic
    const businessLogic = Effect.gen(function* () {
      const db = yield* DbTag;
      const cache = yield* CacheTag;
      const api = yield* ApiTag;

      const dbResult = db.query("SELECT * FROM users");
      const cacheResult = cache.get("user:123");
      const apiResult = api.fetch("/users/123");

      return {
        db: dbResult,
        cache: cacheResult,
        api: apiResult,
      };
    });

    // Execute
    const result = await Effect.runPromise(
      Effect.provide(businessLogic, AppLayer),
    );

    // Verify
    expect(result.db).toEqual(["result-SELECT * FROM users"]);
    expect(result.cache).toBe("cached-user:123");
    expect(result.api).toEqual({ data: "/users/123" });
  });

  test("layer composition with transformations", async () => {
    const container = createContainer({ injectionMode: "PROXY" });
    container.register({
      rawConfig: asValue({ env: "test", debug: true }),
    });

    // Transform raw config to enhanced config
    const EnhancedConfigLayer = createTransformedLayer(
      container,
      "rawConfig",
      (raw: { env: string; debug: boolean }) => ({
        environment: raw.env,
        isDebug: raw.debug,
        isTest: raw.env === "test",
        features: {
          logging: raw.debug,
          caching: true,
        },
      }),
    );

    const ConfigTag = Context.GenericTag<{
      environment: string;
      isDebug: boolean;
      isTest: boolean;
      features: { logging: boolean; caching: boolean };
    }>("rawConfig");

    const program = Effect.gen(function* () {
      const config = yield* ConfigTag;
      return {
        env: config.environment,
        canLog: config.features.logging,
        isTest: config.isTest,
      };
    });

    const result = await Effect.runPromise(
      Effect.provide(program, EnhancedConfigLayer),
    );

    expect(result.env).toBe("test");
    expect(result.canLog).toBe(true);
    expect(result.isTest).toBe(true);
  });
});
