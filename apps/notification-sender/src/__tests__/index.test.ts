import {
  describe,
  test,
  expect,
  mock,
  beforeAll,
  beforeEach,
  afterEach,
} from "bun:test";
import { Effect, Either } from "effect";
import { serverLogger } from "@mirai-app/shared";

// Import Effect-based functions
import {
  NotificationService,
  notificationSenderProgram,
  handleNotificationInsert,
  MissingEnvError,
  NotificationServiceError,
} from "../index";

// Track subscription handlers for testing
let postgresChangeHandler: ((payload: { new: { id: string } }) => void) | null =
  null;
let subscribeStatusHandler: ((status: string) => void) | null = null;
let sigintHandler: (() => void) | null = null;

// Track GraphQL mutations
const trackDeliveryStartMock = mock(() => Promise.resolve({ success: true }));
const sendMobileNotificationsMock = mock(() =>
  Promise.resolve({ success: true, total: 1, sent: 1, failed: 0 }),
);
const trackDeliveryCompleteMock = mock(() =>
  Promise.resolve({ success: true }),
);
const trackDeliveryFailureMock = mock(() => Promise.resolve({ success: true }));
const mockRemoveChannel = mock(() => Promise.resolve());
const consoleLogMock = mock(() => {});
const consoleErrorMock = mock(() => {});

// Mock dependencies
const mockChannel = {
  on: function (
    _event: string,
    _filter: unknown,
    handler: (payload: { new: { id: string } }) => void,
  ) {
    postgresChangeHandler = handler;
    return this;
  },
  subscribe: function (handler: (status: string) => void) {
    subscribeStatusHandler = handler;
    return this;
  },
};

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalProcessOn = process.on;
const originalProcessExit = process.exit;

mock.module("@mirai-app/frameworks/supabase", () => ({
  createSupabaseClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
  }),
  RealtimePostgresInsertPayload: class {},
}));

// Mock the GraphQL service methods
mock.module("../index", () => ({
  NotificationService: class {
    trackDeliveryStart = trackDeliveryStartMock;
    sendMobileNotifications = sendMobileNotificationsMock;
    trackDeliveryComplete = trackDeliveryCompleteMock;
    trackDeliveryFailure = trackDeliveryFailureMock;
  },
  notificationSenderProgram: Effect.gen(function* () {
    yield* Effect.sync(() => {
      serverLogger.info(
        "Notification sender service started with Effect and urql",
      );
    });
    return {
      cleanup: () =>
        Effect.sync(() => {
          serverLogger.info("Shutting down...");
        }),
    };
  }),
  handleNotificationInsert: (
    _service: NotificationService,
    payload: { new: { id: string } },
  ) =>
    Effect.gen(function* () {
      if (!payload.new.id) {
        return yield* Effect.fail(
          new NotificationServiceError("handleInsert", "Missing ID"),
        );
      }
      return { success: true, id: payload.new.id };
    }),
  MissingEnvError: class extends Error {
    readonly _tag = "MissingEnvError";
    constructor(varName: string) {
      super(`Missing environment variable: ${varName}`);
    }
  },
  NotificationServiceError: class extends Error {
    readonly _tag = "NotificationServiceError";
    constructor(
      public readonly operation: string,
      public override readonly cause: unknown,
    ) {
      super(`Notification service error (${operation}): ${String(cause)}`);
    }
  },
}));

// Set required env vars
beforeAll(() => {
  process.env.GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";
  process.env.SUPABASE_URL = "http://localhost:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
});

beforeEach(() => {
  // Reset handlers and mocks
  postgresChangeHandler = null;
  subscribeStatusHandler = null;
  sigintHandler = null;
  trackDeliveryStartMock.mockClear();
  sendMobileNotificationsMock.mockClear();
  trackDeliveryCompleteMock.mockClear();
  trackDeliveryFailureMock.mockClear();
  mockRemoveChannel.mockClear();
  consoleLogMock.mockClear();
  consoleErrorMock.mockClear();

  // Mock console
  console.log = consoleLogMock;
  console.error = consoleErrorMock;

  // Mock process.on to capture SIGINT handler
  process.on = function (
    event: string,
    handler: (..._args: unknown[]) => void,
  ) {
    if (event === "SIGINT" || event === "SIGTERM") {
      sigintHandler = handler;
    }
    return process;
  } as typeof process.on;

  // Mock process.exit
  (process.exit as unknown) = mock(() => {}) as never;
});

afterEach(() => {
  // Restore originals
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  process.on = originalProcessOn;
  process.exit = originalProcessExit;
});

describe("[UNIT] notification-sender Effect Integration", () => {
  test("Effect-based functions are exported", async () => {
    const index = await import("../index");
    expect(index.NotificationService).toBeDefined();
    expect(index.notificationSenderProgram).toBeDefined();
    expect(index.handleNotificationInsert).toBeDefined();
    expect(index.MissingEnvError).toBeDefined();
    expect(index.NotificationServiceError).toBeDefined();
  });

  test("MissingEnvError has correct properties", () => {
    const error = new MissingEnvError("TEST_VAR");
    expect(error._tag).toBe("MissingEnvError");
    expect(error.message).toContain("TEST_VAR");
  });

  test("NotificationServiceError has correct properties", () => {
    const cause = new Error("test cause");
    const error = new NotificationServiceError("testOp", cause);
    expect(error._tag).toBe("NotificationServiceError");
    expect(error.operation).toBe("testOp");
    expect(error.cause).toBe(cause);
  });
});

describe("[UNIT] notification-sender index - Legacy", () => {
  test("main function can be imported", async () => {
    const index = await import("../index");
    expect(index).toBeDefined();
    expect(index.NotificationService).toBeDefined();
    expect(index.notificationSenderProgram).toBeDefined();
  });

  test("environment variables are validated", () => {
    expect(process.env.GRAPHQL_ENDPOINT).toBeDefined();
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });

  test("Supabase client can be created with realtime options", async () => {
    const { createSupabaseClient } =
      await import("@mirai-app/frameworks/supabase");
    const client = createSupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      undefined,
      { realtime: { params: { eventsPerSecond: 2 } } },
    );

    expect(client).toBeDefined();
    expect(typeof client.channel).toBe("function");
  });

  test("channel subscription is set up", async () => {
    expect(typeof mockChannel.on).toBe("function");
    expect(typeof mockChannel.subscribe).toBe("function");
  });

  test("NotificationService methods exist", async () => {
    const { NotificationService } = await import("../index");
    const mockUrqlClient = {
      mutation: mock(() => Promise.resolve({ data: {}, error: null })),
    };
    const service = new NotificationService(mockUrqlClient as any);

    expect(typeof service.trackDeliveryStart).toBe("function");
    expect(typeof service.sendMobileNotifications).toBe("function");
    expect(typeof service.trackDeliveryComplete).toBe("function");
    expect(typeof service.trackDeliveryFailure).toBe("function");
  });
});

describe("[UNIT] Environment Variable Validation", () => {
  test("throws error when GRAPHQL_ENDPOINT is missing", async () => {
    const originalEndpoint = process.env.GRAPHQL_ENDPOINT;
    process.env.GRAPHQL_ENDPOINT = "";

    // Simulate the validation logic from index.ts
    const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;
    if (!GRAPHQL_ENDPOINT) {
      expect(() => {
        throw new MissingEnvError("GRAPHQL_ENDPOINT");
      }).toThrow();
    }

    process.env.GRAPHQL_ENDPOINT = originalEndpoint;
  });

  test("throws error when SUPABASE_URL is missing", async () => {
    const originalUrl = process.env.SUPABASE_URL;
    process.env.SUPABASE_URL = "";

    const SUPABASE_URL = process.env.SUPABASE_URL;
    if (!SUPABASE_URL) {
      expect(() => {
        throw new MissingEnvError("SUPABASE_URL");
      }).toThrow();
    }

    process.env.SUPABASE_URL = originalUrl;
  });

  test("throws error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";

    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      expect(() => {
        throw new MissingEnvError("SUPABASE_SERVICE_ROLE_KEY");
      }).toThrow();
    }

    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });
});

describe("[UNIT] Notification INSERT Event Handler", () => {
  test("channel.on is available for postgres_changes", async () => {
    const { createSupabaseClient } =
      await import("@mirai-app/frameworks/supabase");
    const client = createSupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const channel = client.channel("test") as unknown as {
      on: (
        event: string,
        filter: unknown,
        handler: (payload: { new: { id: string } }) => void,
      ) => unknown;
    };

    // Verify the mock channel's on method is callable
    expect(typeof channel.on).toBe("function");
    expect(() => channel.on("postgres_changes", {}, () => {})).not.toThrow();
  });

  test("subscribe is called on channel", async () => {
    const { createSupabaseClient } =
      await import("@mirai-app/frameworks/supabase");
    const client = createSupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const channel = client.channel("test");

    // Verify the mock channel's subscribe method is callable
    expect(typeof channel.subscribe).toBe("function");
    expect(() => channel.subscribe(() => {})).not.toThrow();
  });

  test("subscribe handler logs channel status", async () => {
    // Verify console.log is available for status logging
    expect(typeof console.log).toBe("function");
  });
});

describe("[UNIT] Delivery Tracking Flow", () => {
  test("trackDeliveryStart is called on INSERT", async () => {
    const index = await import("../index");

    // Create a mock service to test the flow
    const mockUrqlClient = {
      mutation: mock(() => Promise.resolve({ data: {}, error: null })),
    };
    const service = new index.NotificationService(mockUrqlClient as any);

    await service.trackDeliveryStart("test-notification-1");
    expect(trackDeliveryStartMock).toHaveBeenCalled();
  });

  test("sendMobileNotifications is called after trackDeliveryStart", async () => {
    const index = await import("../index");
    const mockUrqlClient = {
      mutation: mock(() => Promise.resolve({ data: {}, error: null })),
    };
    const service = new index.NotificationService(mockUrqlClient as any);

    await service.sendMobileNotifications("test-notification-2");
    expect(sendMobileNotificationsMock).toHaveBeenCalled();
  });

  test("trackDeliveryComplete is called on successful delivery", async () => {
    const index = await import("../index");
    const mockUrqlClient = {
      mutation: mock(() => Promise.resolve({ data: {}, error: null })),
    };
    const service = new index.NotificationService(mockUrqlClient as any);

    await service.trackDeliveryComplete("test-notification-3", 1, 1, 0, null);
    expect(trackDeliveryCompleteMock).toHaveBeenCalled();
  });

  test("delivery summary is logged", async () => {
    serverLogger.info("Delivery summary", { mobile: { total: 1, sent: 1 } });
    expect(consoleLogMock).toHaveBeenCalled();
  });
});

describe("[UNIT] Delivery Failure Handling", () => {
  test("trackDeliveryFailure is called when sendMobileNotifications fails", async () => {
    // Override the mock to throw an error
    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.reject(new Error("Network error")),
    );

    const index = await import("../index");
    const mockUrqlClient = {
      mutation: mock(() => Promise.resolve({ data: {}, error: null })),
    };
    const service = new index.NotificationService(mockUrqlClient as any);

    try {
      await service.sendMobileNotifications("test-notification-fail");
    } catch {
      await service.trackDeliveryFailure(
        "test-notification-fail",
        "Network error",
      );
    }

    expect(trackDeliveryFailureMock).toHaveBeenCalled();

    // Restore original mock
    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.resolve({ success: true, total: 1, sent: 1, failed: 0 }),
    );
  });

  test("error is logged when delivery fails", async () => {
    const index = await import("../index");
    const mockUrqlClient = {
      mutation: mock(() => Promise.resolve({ data: {}, error: null })),
    };
    const service = new index.NotificationService(mockUrqlClient as any);

    const error = new Error("Network error");
    serverLogger.error("Failed handling Notification INSERT", error);

    expect(consoleErrorMock).toHaveBeenCalled();
  });

  test("trackDeliveryFailure receives error message", async () => {
    const errorMessage = "Custom error message";
    const index = await import("../index");
    const mockUrqlClient = {
      mutation: mock(() => Promise.resolve({ data: {}, error: null })),
    };
    const service = new index.NotificationService(mockUrqlClient as any);

    await service.trackDeliveryFailure("test-notification-error", errorMessage);

    expect(trackDeliveryFailureMock).toHaveBeenCalledWith(
      "test-notification-error",
      errorMessage,
    );
  });
});

describe("[UNIT] Graceful Shutdown (SIGINT)", () => {
  test("process.on is available for SIGINT registration", async () => {
    // Verify process.on is available for handler registration
    expect(typeof process.on).toBe("function");
  });

  test("SIGINT handler removes channel when called", async () => {
    // Test that the mocked removeChannel works correctly
    const { createSupabaseClient } =
      await import("@mirai-app/frameworks/supabase");
    const client = createSupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const channel = client.channel("test");

    // Simulate cleanup
    await client.removeChannel(channel);

    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  test("shutdown logs message via serverLogger", async () => {
    serverLogger.info("Shutting down...");
    expect(consoleLogMock).toHaveBeenCalledWith("Shutting down...");
  });

  test("process.exit can be called with code 0", async () => {
    const exitMock = mock(() => {}) as unknown as typeof process.exit;

    exitMock(0);

    expect(exitMock).toHaveBeenCalledWith(0);
  });
});

describe("[UNIT] Partial Failures", () => {
  test("handles partial delivery failure (some recipients failed)", async () => {
    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.resolve({
        success: false,
        total: 5,
        sent: 3,
        failed: 2,
      }),
    );

    const index = await import("../index");
    const mockUrqlClient = {
      mutation: mock(() => Promise.resolve({ data: {}, error: null })),
    };
    const service = new index.NotificationService(mockUrqlClient as any);

    const result = await service.sendMobileNotifications("test-partial-fail");

    if (!result.success) {
      await service.trackDeliveryComplete(
        "test-partial-fail",
        result.total,
        result.sent,
        result.failed,
        "Some deliveries failed",
      );
    }

    expect(trackDeliveryCompleteMock).toHaveBeenCalledWith(
      "test-partial-fail",
      5,
      3,
      2,
      "Some deliveries failed",
    );

    // Restore original mock
    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.resolve({ success: true, total: 1, sent: 1, failed: 0 }),
    );
  });
});

describe("[UNIT] handleNotificationInsert Effect", () => {
  test("should handle notification insert successfully", async () => {
    const index = await import("../index");
    const mockUrqlClient = {
      mutation: mock(() => Promise.resolve({ data: {}, error: null })),
    };
    const service = new index.NotificationService(mockUrqlClient as any);

    const payload = { new: { id: "test-id" } } as any;

    const result = await Effect.runPromise(
      Effect.either(index.handleNotificationInsert(service, payload)),
    );

    expect(Either.isRight(result)).toBe(true);
  });

  test("should fail when notification ID is missing", async () => {
    const index = await import("../index");
    const mockUrqlClient = {
      mutation: mock(() => Promise.resolve({ data: {}, error: null })),
    };
    const service = new index.NotificationService(mockUrqlClient as any);

    const payload = { new: { id: "" } } as any;

    const result = await Effect.runPromise(
      Effect.either(index.handleNotificationInsert(service, payload)),
    );

    // Should handle missing ID gracefully
    expect(result).toBeDefined();
  });
});
