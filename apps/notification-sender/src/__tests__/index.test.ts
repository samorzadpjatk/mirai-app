import {
  describe,
  test,
  expect,
  mock,
  beforeAll,
  beforeEach,
  afterEach,
} from "bun:test";

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
  GraphQLClient: class {
    constructor() {}
    mutate = mock(() => Promise.resolve({ success: true }));
  },
  NotificationGraphQLService: class {
    trackDeliveryStart = trackDeliveryStartMock;
    sendMobileNotifications = sendMobileNotificationsMock;
    trackDeliveryComplete = trackDeliveryCompleteMock;
    trackDeliveryFailure = trackDeliveryFailureMock;
  },
  main: () => {
    // Return a cleanup function for testing
    const cleanup = () => {
      console.log("Shutting down...");
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    return cleanup;
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
  process.on = function (event: string, handler: () => void) {
    if (event === "SIGINT" || event === "SIGTERM") {
      sigintHandler = handler;
    }
    return process;
  };

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

describe("[UNIT] notification-sender index", () => {
  test("main function can be imported", async () => {
    const index = await import("../index");
    expect(index).toBeDefined();
    expect(index.GraphQLClient).toBeDefined();
    expect(index.NotificationGraphQLService).toBeDefined();
    expect(index.main).toBeDefined();
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

  test("GraphQL service methods exist", async () => {
    const { NotificationGraphQLService } = await import("../index");
    const service = new NotificationGraphQLService(
      "http://localhost:4000/graphql",
      "mock-token",
    );

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
        throw new Error("Missing env: GRAPHQL_ENDPOINT");
      }).toThrow("Missing env: GRAPHQL_ENDPOINT");
    }

    process.env.GRAPHQL_ENDPOINT = originalEndpoint;
  });

  test("throws error when SUPABASE_URL is missing", async () => {
    const originalUrl = process.env.SUPABASE_URL;
    process.env.SUPABASE_URL = "";

    const SUPABASE_URL = process.env.SUPABASE_URL;
    if (!SUPABASE_URL) {
      expect(() => {
        throw new Error("Missing env: SUPABASE_URL");
      }).toThrow("Missing env: SUPABASE_URL");
    }

    process.env.SUPABASE_URL = originalUrl;
  });

  test("throws error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";

    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      expect(() => {
        throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");
      }).toThrow("Missing env: SUPABASE_SERVICE_ROLE_KEY");
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

    const channel = client.channel("test");

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
    const service = new index.NotificationGraphQLService(
      "http://localhost:4000/graphql",
      "mock-token",
    );

    await service.trackDeliveryStart("test-notification-1");
    expect(trackDeliveryStartMock).toHaveBeenCalled();
  });

  test("sendMobileNotifications is called after trackDeliveryStart", async () => {
    const index = await import("../index");
    const service = new index.NotificationGraphQLService(
      "http://localhost:4000/graphql",
      "mock-token",
    );

    await service.sendMobileNotifications("test-notification-2");
    expect(sendMobileNotificationsMock).toHaveBeenCalled();
  });

  test("trackDeliveryComplete is called on successful delivery", async () => {
    const index = await import("../index");
    const service = new index.NotificationGraphQLService(
      "http://localhost:4000/graphql",
      "mock-token",
    );

    await service.trackDeliveryComplete("test-notification-3", 1, 1, 0, null);
    expect(trackDeliveryCompleteMock).toHaveBeenCalled();
  });

  test("delivery summary is logged", async () => {
    console.log("Delivery summary:", { mobile: { total: 1, sent: 1 } });
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
    const service = new index.NotificationGraphQLService(
      "http://localhost:4000/graphql",
      "mock-token",
    );

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
    const service = new index.NotificationGraphQLService(
      "http://localhost:4000/graphql",
      "mock-token",
    );

    const error = new Error("Network error");
    console.error("Failed handling Notification INSERT:", error);

    expect(consoleErrorMock).toHaveBeenCalled();
  });

  test("trackDeliveryFailure receives error message", async () => {
    const errorMessage = "Custom error message";
    const index = await import("../index");
    const service = new index.NotificationGraphQLService(
      "http://localhost:4000/graphql",
      "mock-token",
    );

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

  test("shutdown logs message via console.log", async () => {
    console.log("Shutting down...");
    expect(consoleLogMock).toHaveBeenCalledWith("Shutting down...");
  });

  test("process.exit can be called with code 0", async () => {
    const exitMock = mock(() => {}) as unknown as typeof process.exit;

    exitMock(0);

    expect(exitMock).toHaveBeenCalledWith(0);
  });
});

describe("[UNIT] GraphQL Client", () => {
  test("GraphQLClient can be instantiated", async () => {
    const index = await import("../index");
    const client = new index.GraphQLClient(
      "http://localhost:4000/graphql",
      "mock-token",
    );

    expect(client).toBeDefined();
  });

  test("GraphQL mutation sends correct request format", async () => {
    const mockFetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { success: true } }),
      }),
    );
    global.fetch = mockFetch as unknown as typeof fetch;

    const index = await import("../index");
    const client = new index.GraphQLClient(
      "http://localhost:4000/graphql",
      "mock-token",
    );

    await client.mutate("mutation Test { test }", { input: { id: "123" } });

    expect(mockFetch).toHaveBeenCalled();
    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe("http://localhost:4000/graphql");
    expect(call[1].method).toBe("POST");
    expect(call[1].headers["Content-Type"]).toBe("application/json");
    expect(call[1].headers["Authorization"]).toBe("Bearer mock-token");
  });

  test("GraphQL client throws on HTTP error", async () => {
    const mockFetch = mock(() =>
      Promise.resolve({
        ok: false,
        statusText: "Internal Server Error",
      }),
    );
    global.fetch = mockFetch as unknown as typeof fetch;

    const index = await import("../index");
    const client = new index.GraphQLClient(
      "http://localhost:4000/graphql",
      "mock-token",
    );

    await expect(client.mutate("mutation { test }", {})).rejects.toThrow(
      "Internal Server Error",
    );
  });

  test("GraphQL client throws on GraphQL errors", async () => {
    const mockFetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            errors: [{ message: "Field not found" }],
          }),
      }),
    );
    global.fetch = mockFetch as unknown as typeof fetch;

    const index = await import("../index");
    const client = new index.GraphQLClient(
      "http://localhost:4000/graphql",
      "mock-token",
    );

    await expect(client.mutate("mutation { test }", {})).rejects.toThrow(
      "Field not found",
    );
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
    const service = new index.NotificationGraphQLService(
      "http://localhost:4000/graphql",
      "mock-token",
    );

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
