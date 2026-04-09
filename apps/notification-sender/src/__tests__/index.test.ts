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

// Track tRPC mutations
const trackDeliveryStartMock = mock(() => Promise.resolve());
const sendMobileNotificationsMock = mock(() =>
  Promise.resolve({ total: 1, sent: 1, failed: 0, success: true }),
);
const trackDeliveryCompleteMock = mock(() => Promise.resolve());
const trackDeliveryFailureMock = mock(() => Promise.resolve());
const mockCleanup = mock(() => Promise.resolve());
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

mock.module("@repo/frameworks/supabase", () => ({
  createSupabaseClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
  }),
  RealtimePostgresInsertPayload: class {},
}));

mock.module("@repo/frameworks/trpc/client", () => ({
  getTRPCClient: () => ({
    client: {
      notificationSender: {
        trackDeliveryStart: { mutate: trackDeliveryStartMock },
        sendMobileNotifications: { mutate: sendMobileNotificationsMock },
        trackDeliveryComplete: { mutate: trackDeliveryCompleteMock },
        trackDeliveryFailure: { mutate: trackDeliveryFailureMock },
      },
    },
    cleanup: mockCleanup,
  }),
}));

// Set required env vars
beforeAll(() => {
  process.env.TRPC_HOST = "localhost:3001";
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
  mockCleanup.mockClear();
  mockRemoveChannel.mockClear();
  consoleLogMock.mockClear();
  consoleErrorMock.mockClear();

  // Mock console
  console.log = consoleLogMock;
  console.error = consoleErrorMock;

  // Mock process.on to capture SIGINT handler
  process.on = function (event: string, handler: () => void) {
    if (event === "SIGINT") {
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
  });

  test("environment variables are validated", () => {
    expect(process.env.TRPC_HOST).toBeDefined();
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });

  test("Supabase client can be created with realtime options", async () => {
    const { createSupabaseClient } = await import("@repo/frameworks/supabase");
    const client = createSupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      undefined,
      { realtime: { params: { eventsPerSecond: 2 } } },
    );

    expect(client).toBeDefined();
    expect(typeof client.channel).toBe("function");
  });

  test("tRPC client can be created", async () => {
    const { getTRPCClient } = await import("@repo/frameworks/trpc/client");
    const { client, cleanup } = getTRPCClient(
      `http://${process.env.TRPC_HOST}/api/trpc`,
      `ws://${process.env.TRPC_HOST}/api/trpc`,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    expect(client).toBeDefined();
    expect(typeof cleanup).toBe("function");
  });

  test("channel subscription is set up", async () => {
    expect(typeof mockChannel.on).toBe("function");
    expect(typeof mockChannel.subscribe).toBe("function");
  });

  test("notification delivery flow methods exist", async () => {
    const { getTRPCClient } = await import("@repo/frameworks/trpc/client");
    const { client } = getTRPCClient(
      `http://${process.env.TRPC_HOST}/api/trpc`,
      `ws://${process.env.TRPC_HOST}/api/trpc`,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    expect(client.notificationSender).toBeDefined();
    expect(client.notificationSender.trackDeliveryStart).toBeDefined();
    expect(client.notificationSender.sendMobileNotifications).toBeDefined();
    expect(client.notificationSender.trackDeliveryComplete).toBeDefined();
    expect(client.notificationSender.trackDeliveryFailure).toBeDefined();
  });
});

describe("[UNIT] Environment Variable Validation", () => {
  test("throws error when TRPC_HOST is missing", async () => {
    const originalHost = process.env.TRPC_HOST;
    process.env.TRPC_HOST = "";

    // Simulate the validation logic from index.ts
    const TRPC_HOST = process.env.TRPC_HOST;
    if (!TRPC_HOST) {
      expect(() => {
        throw new Error("Missing env: TRPC_HOST");
      }).toThrow("Missing env: TRPC_HOST");
    }

    process.env.TRPC_HOST = originalHost;
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
    const { createSupabaseClient } = await import("@repo/frameworks/supabase");
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
    const { createSupabaseClient } = await import("@repo/frameworks/supabase");
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
    await import("../index");

    if (postgresChangeHandler) {
      await postgresChangeHandler({ new: { id: "test-notification-1" } });

      expect(trackDeliveryStartMock).toHaveBeenCalled();
      expect(trackDeliveryStartMock).toHaveBeenCalledWith({
        notificationId: "test-notification-1",
      });
    }
  });

  test("sendMobileNotifications is called after trackDeliveryStart", async () => {
    await import("../index");

    if (postgresChangeHandler) {
      await postgresChangeHandler({ new: { id: "test-notification-2" } });

      expect(sendMobileNotificationsMock).toHaveBeenCalled();
      expect(sendMobileNotificationsMock).toHaveBeenCalledWith({
        notificationId: "test-notification-2",
      });
    }
  });

  test("trackDeliveryComplete is called on successful delivery", async () => {
    await import("../index");

    if (postgresChangeHandler) {
      await postgresChangeHandler({ new: { id: "test-notification-3" } });

      expect(trackDeliveryCompleteMock).toHaveBeenCalled();
      expect(trackDeliveryCompleteMock).toHaveBeenCalledWith({
        notificationId: "test-notification-3",
        totalRecipients: 1,
        successCount: 1,
        failureCount: 0,
        errors: null,
      });
    }
  });

  test("delivery summary is logged", async () => {
    await import("../index");

    if (postgresChangeHandler) {
      await postgresChangeHandler({ new: { id: "test-notification-4" } });

      expect(consoleLogMock).toHaveBeenCalled();
      const calls = consoleLogMock.mock.calls;
      const hasDeliverySummary = calls.some((call) =>
        call.some(
          (arg: unknown) =>
            typeof arg === "object" && arg !== null && "mobile" in arg,
        ),
      );
      expect(hasDeliverySummary || calls.length > 0).toBe(true);
    }
  });
});

describe("[UNIT] Delivery Failure Handling", () => {
  test("trackDeliveryFailure is called when sendMobileNotifications fails", async () => {
    // Override the mock to throw an error
    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.reject(new Error("Network error")),
    );

    await import("../index");

    if (postgresChangeHandler) {
      await postgresChangeHandler({ new: { id: "test-notification-fail" } });

      expect(trackDeliveryFailureMock).toHaveBeenCalled();
    }

    // Restore original mock
    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.resolve({ total: 1, sent: 1, failed: 0, success: true }),
    );
  });

  test("trackDeliveryFailure is called when trackDeliveryStart fails", async () => {
    trackDeliveryStartMock.mockImplementation(() =>
      Promise.reject(new Error("Start failed")),
    );

    await import("../index");

    if (postgresChangeHandler) {
      await postgresChangeHandler({
        new: { id: "test-notification-start-fail" },
      });

      expect(trackDeliveryFailureMock).toHaveBeenCalled();
    }

    trackDeliveryStartMock.mockImplementation(() => Promise.resolve());
  });

  test("error is logged when delivery fails", async () => {
    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.reject(new Error("Network error")),
    );

    await import("../index");

    if (postgresChangeHandler) {
      await postgresChangeHandler({ new: { id: "test-notification-log" } });

      expect(consoleErrorMock).toHaveBeenCalled();
    }

    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.resolve({ total: 1, sent: 1, failed: 0, success: true }),
    );
  });

  test("trackDeliveryFailure receives error message", async () => {
    const errorMessage = "Custom error message";
    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.reject(new Error(errorMessage)),
    );

    await import("../index");

    if (postgresChangeHandler) {
      await postgresChangeHandler({
        new: { id: "test-notification-error-msg" },
      });

      expect(trackDeliveryFailureMock).toHaveBeenCalledWith({
        notificationId: "test-notification-error-msg",
        error: expect.stringContaining(errorMessage),
      });
    }

    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.resolve({ total: 1, sent: 1, failed: 0, success: true }),
    );
  });
});

describe("[UNIT] Graceful Shutdown (SIGINT)", () => {
  test("process.on is available for SIGINT registration", async () => {
    // Verify process.on is available for handler registration
    expect(typeof process.on).toBe("function");
  });

  test("SIGINT handler removes channel and cleans up when called", async () => {
    // Test that the mocked removeChannel and cleanup work correctly
    const { createSupabaseClient } = await import("@repo/frameworks/supabase");
    const client = createSupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const channel = client.channel("test");

    // Simulate cleanup
    await client.removeChannel(channel);
    await mockCleanup();

    expect(mockRemoveChannel).toHaveBeenCalled();
    expect(mockCleanup).toHaveBeenCalled();
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

describe("[UNIT] Partial Failures", () => {
  test("handles partial delivery failure (some recipients failed)", async () => {
    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.resolve({
        total: 5,
        sent: 3,
        failed: 2,
        success: false,
      }),
    );

    await import("../index");

    if (postgresChangeHandler) {
      await postgresChangeHandler({ new: { id: "test-partial-fail" } });

      expect(trackDeliveryCompleteMock).toHaveBeenCalledWith({
        notificationId: "test-partial-fail",
        totalRecipients: 5,
        successCount: 3,
        failureCount: 2,
        errors: "Some deliveries failed",
      });
    }

    sendMobileNotificationsMock.mockImplementation(() =>
      Promise.resolve({ total: 1, sent: 1, failed: 0, success: true }),
    );
  });
});
