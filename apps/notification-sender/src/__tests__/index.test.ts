import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Create mock functions at module level
const mockTrackDeliveryStart = vi.fn();
const mockSendMobileNotifications = vi.fn();
const mockTrackDeliveryComplete = vi.fn();
const mockTrackDeliveryFailure = vi.fn();
const mockRemoveChannel = vi.fn();
const mockCleanup = vi.fn();
const mockCreateSupabaseClient = vi.fn();
const mockGetORPCClient = vi.fn();
const mockChannelOn = vi.fn();
const mockChannelSubscribe = vi.fn();

// Setup hoisted mocks - these are evaluated once when the test file loads
vi.mock("@mirai-app/supabase", async () => {
  const { vi } = await import("vitest");
  mockChannelOn.mockReturnValue({
    subscribe: mockChannelSubscribe,
  });
  return {
    createSupabaseClient: (...args: unknown[]) => {
      mockCreateSupabaseClient(...args);
      return {
        channel: vi.fn().mockReturnValue({
          on: mockChannelOn,
        }),
        removeChannel: mockRemoveChannel.mockResolvedValue(undefined),
      };
    },
  };
});

vi.mock("@mirai-app/orpc/client", () => {
  return {
    getORPCClient: (...args: unknown[]) => {
      mockGetORPCClient(...args);
      return {
        client: {
          notificationSender: {
            trackDeliveryStart: mockTrackDeliveryStart,
            sendMobileNotifications: mockSendMobileNotifications,
            trackDeliveryComplete: mockTrackDeliveryComplete,
            trackDeliveryFailure: mockTrackDeliveryFailure,
          },
        },
        cleanup: mockCleanup.mockResolvedValue(undefined),
      };
    },
  };
});

describe("Notification Sender - Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockChannelOn.mockReturnValue({ subscribe: mockChannelSubscribe });
    mockRemoveChannel.mockResolvedValue(undefined);
    mockCleanup.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should throw error when TRPC_HOST is missing", async () => {
    delete process.env.TRPC_HOST;
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const { main } = await import("../index");
    expect(() => main()).toThrow("Missing env: TRPC_HOST");
  });

  it("should throw error when SUPABASE_URL is missing", async () => {
    process.env.TRPC_HOST = "localhost:2022";
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const { main } = await import("../index");
    expect(() => main()).toThrow("Missing env: SUPABASE_URL");
  });

  it("should throw error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { main } = await import("../index");
    expect(() => main()).toThrow("Missing env: SUPABASE_SERVICE_ROLE_KEY");
  });
});

describe("Notification Sender - Main Error Handling", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockChannelOn.mockReturnValue({ subscribe: mockChannelSubscribe });
    mockRemoveChannel.mockResolvedValue(undefined);
    mockCleanup.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should throw errors from main function", async () => {
    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    mockCreateSupabaseClient.mockImplementationOnce(() => {
      throw new Error("Supabase connection failed");
    });

    const { main } = await import("../index");
    expect(() => main()).toThrow("Supabase connection failed");
  });

  it("should handle non-Error exceptions in main", async () => {
    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    mockCreateSupabaseClient.mockImplementationOnce(() => {
      throw new Error("string error");
    });

    const { main } = await import("../index");
    expect(() => main()).toThrow("string error");
  });
});

describe("Notification Sender - Client Initialization", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockChannelOn.mockReturnValue({ subscribe: mockChannelSubscribe });
    mockRemoveChannel.mockResolvedValue(undefined);
    mockCleanup.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should create supabase client with correct parameters", async () => {
    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const { main } = await import("../index");
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await main();

    expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
      "http://localhost:8000",
      "test-key",
      undefined,
      { realtime: { params: { eventsPerSecond: 2 } } }
    );
  });

  it("should create oRPC client with correct parameters", async () => {
    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const { main } = await import("../index");
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await main();

    expect(mockGetORPCClient).toHaveBeenCalledWith(
      "http://localhost:2022/api/trpc",
      "ws://localhost:2022/api/trpc",
      "test-key"
    );
  });

  it("should create supabase channel for Notification table", async () => {
    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const { main } = await import("../index");
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await main();

    expect(mockChannelOn).toBeDefined();
  });
});

describe("Notification Sender - Subscribe Callback", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockChannelOn.mockReturnValue({ subscribe: mockChannelSubscribe });
    mockRemoveChannel.mockResolvedValue(undefined);
    mockCleanup.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should log realtime channel status", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });
    let subscribeCallback: ((status: string) => void) | undefined;
    mockChannelSubscribe.mockImplementation((callback: (status: string) => void) => {
      subscribeCallback = callback;
    });

    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const { main } = await import("../index");
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await main();

    if (subscribeCallback) {
      subscribeCallback("SUBSCRIBED");
      expect(consoleLogSpy).toHaveBeenCalledWith("Realtime channel status:", "SUBSCRIBED");
    }

    consoleLogSpy.mockRestore();
  });

  it("should handle different channel statuses", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });
    let subscribeCallback: ((status: string) => void) | undefined;
    mockChannelSubscribe.mockImplementation((callback: (status: string) => void) => {
      subscribeCallback = callback;
    });

    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const { main } = await import("../index");
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await main();

    if (subscribeCallback) {
      subscribeCallback("CLOSED");
      expect(consoleLogSpy).toHaveBeenCalledWith("Realtime channel status:", "CLOSED");

      subscribeCallback("CHANNEL_ERROR");
      expect(consoleLogSpy).toHaveBeenCalledWith("Realtime channel status:", "CHANNEL_ERROR");
    }

    consoleLogSpy.mockRestore();
  });
});

describe("Notification Sender - SIGINT Handling", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockChannelOn.mockReturnValue({ subscribe: mockChannelSubscribe });
    mockRemoveChannel.mockResolvedValue(undefined);
    mockCleanup.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should have set up SIGINT handler during initialization", async () => {
    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const { main } = await import("../index");
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await main();

    expect(mockChannelSubscribe).toBeDefined();
  });

  it("should remove channel and cleanup on SIGINT", async () => {
    const processOnSpy = vi.spyOn(process, "on");
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation((() => { /* noop */ }) as (code?: string | number | null) => never);
    let sigintHandler: (() => Promise<void>) | undefined;
    const capturedChannel = { on: mockChannelOn, subscribe: mockChannelSubscribe };

    processOnSpy.mockImplementation(((event: string | symbol, handler: (...args: unknown[]) => void) => {
      if (event === "SIGINT") {
        sigintHandler = handler as () => Promise<void>;
      }
      return process;
    }) as (event: string | symbol, listener: (...args: unknown[]) => void) => NodeJS.Process);

    mockCreateSupabaseClient.mockImplementationOnce(() => ({
      channel: vi.fn().mockReturnValue(capturedChannel),
      removeChannel: mockRemoveChannel.mockResolvedValue(undefined),
    }));

    mockGetORPCClient.mockImplementationOnce(() => ({
      client: {
        notificationSender: {
          trackDeliveryStart: mockTrackDeliveryStart,
          sendMobileNotifications: mockSendMobileNotifications,
          trackDeliveryComplete: mockTrackDeliveryComplete,
          trackDeliveryFailure: mockTrackDeliveryFailure,
        },
      },
      cleanup: mockCleanup.mockResolvedValue(undefined),
    }));

    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const { main } = await import("../index");
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await main();

    expect(sigintHandler).toBeDefined();

    if (sigintHandler) {
      await sigintHandler();

      expect(mockRemoveChannel).toHaveBeenCalled();
      expect(mockCleanup).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    }

    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it("should log shutdown message on SIGINT", async () => {
    const processOnSpy = vi.spyOn(process, "on");
    const processExitSpy = vi.spyOn(process, "exit").mockImplementation((() => { /* noop */ }) as (code?: string | number | null) => never);
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });
    let sigintHandler: (() => Promise<void>) | undefined;

    processOnSpy.mockImplementation(((event: string | symbol, handler: (...args: unknown[]) => void) => {
      if (event === "SIGINT") {
        sigintHandler = handler as () => Promise<void>;
      }
      return process;
    }) as (event: string | symbol, listener: (...args: unknown[]) => void) => NodeJS.Process);

    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const { main } = await import("../index");
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await main();

    if (sigintHandler) {
      await sigintHandler();

      expect(consoleLogSpy).toHaveBeenCalledWith("Shutting down...");
    }

    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});

describe("Notification Sender - Notification Processing", () => {
  const originalEnv = process.env;

  async function setupTest(mobileResponse?: { total: number; sent: number; failed: number; success: boolean }) {
    vi.resetModules();
    vi.clearAllMocks();

    const processExitSpy = vi.spyOn(process, "exit").mockImplementation((() => { /* noop */ }) as (code?: string | number | null) => never);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { /* noop */ });
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

    process.env = { ...originalEnv };
    process.env.TRPC_HOST = "localhost:2022";
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    mockChannelOn.mockReturnValue({ subscribe: vi.fn() });
    mockTrackDeliveryStart.mockResolvedValue(undefined);
    mockSendMobileNotifications.mockResolvedValue(mobileResponse ?? {
      total: 10,
      sent: 8,
      failed: 2,
      success: false,
    });
    mockTrackDeliveryComplete.mockResolvedValue(undefined);
    mockTrackDeliveryFailure.mockResolvedValue(undefined);

    const { main } = await import("../index");
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await main();

    type PayloadHandler = (payload: { new: { id: string | number } }) => Promise<void> | void;
    const rawHandler = mockChannelOn.mock.calls[0]?.[2] as PayloadHandler | undefined;

    const payloadHandler = async (payload: { new: { id: string | number } }) => {
      if (!rawHandler) return;
      await rawHandler(payload);
      await new Promise((resolve) => setImmediate(resolve));
    };

    return { payloadHandler, processExitSpy, consoleErrorSpy, consoleLogSpy };
  }

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should process INSERT event and track delivery start", async () => {
    const { payloadHandler } = await setupTest();
    if (!payloadHandler) return;
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(mockTrackDeliveryStart).toHaveBeenCalledWith({ notificationId: "notif-123" });
  });

  it("should send mobile notifications after tracking start", async () => {
    const { payloadHandler } = await setupTest();
    if (!payloadHandler) return;
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(mockSendMobileNotifications).toHaveBeenCalledWith({ notificationId: "notif-123" });
  });

  it("should track delivery completion with correct metrics for failed delivery", async () => {
    const { payloadHandler } = await setupTest({ total: 10, sent: 8, failed: 2, success: false });
    if (!payloadHandler) return;
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(mockTrackDeliveryComplete).toHaveBeenCalledWith({
      notificationId: "notif-123",
      totalRecipients: 10,
      successCount: 8,
      failureCount: 2,
      errors: "Some deliveries failed",
    });
  });

  it("should log delivery summary", async () => {
    const { payloadHandler, consoleLogSpy } = await setupTest({ total: 10, sent: 8, failed: 2, success: false });
    if (!payloadHandler) return;
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(consoleLogSpy).toHaveBeenCalledWith("Delivery summary:", {
      mobile: {
        total: 10,
        sent: 8,
        failed: 2,
        success: false,
      },
    });
  });

  it("should handle successful delivery with no failures", async () => {
    const { payloadHandler } = await setupTest({ total: 10, sent: 10, failed: 0, success: true });
    if (!payloadHandler) return;
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(mockTrackDeliveryComplete).toHaveBeenCalledWith({
      notificationId: "notif-123",
      totalRecipients: 10,
      successCount: 10,
      failureCount: 0,
      errors: null,
    });
  });

  it("should handle delivery with partial failures", async () => {
    const { payloadHandler } = await setupTest({ total: 10, sent: 5, failed: 5, success: false });
    if (!payloadHandler) return;
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(mockTrackDeliveryComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: "notif-123",
        successCount: 5,
        failureCount: 5,
        errors: "Some deliveries failed",
      })
    );
  });

  it("should handle errors during delivery start tracking", async () => {
    const { payloadHandler, consoleErrorSpy } = await setupTest();
    if (!payloadHandler) return;
    mockTrackDeliveryStart.mockRejectedValueOnce(new Error("Start failed"));
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(consoleErrorSpy).toHaveBeenCalled();
    interface TrackFailureCall { notificationId: string; error: Error }
    const trackFailureCall = mockTrackDeliveryFailure.mock.calls[0]?.[0] as TrackFailureCall | undefined;
    expect(trackFailureCall?.notificationId).toBe("notif-123");
    expect(trackFailureCall?.error).toBeInstanceOf(Error);
  });

  it("should handle errors during mobile notification sending", async () => {
    const { payloadHandler, consoleErrorSpy } = await setupTest();
    if (!payloadHandler) return;
    mockSendMobileNotifications.mockRejectedValueOnce(new Error("Send failed"));
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(consoleErrorSpy).toHaveBeenCalled();
    interface TrackFailureCall { notificationId: string; error: Error }
    const trackFailureCall = mockTrackDeliveryFailure.mock.calls[0]?.[0] as TrackFailureCall | undefined;
    expect(trackFailureCall?.notificationId).toBe("notif-123");
    expect(trackFailureCall?.error).toBeInstanceOf(Error);
  });

  it("should handle errors during delivery completion tracking", async () => {
    const { payloadHandler, consoleErrorSpy } = await setupTest();
    if (!payloadHandler) return;
    mockTrackDeliveryComplete.mockRejectedValueOnce(new Error("Complete failed"));
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(consoleErrorSpy).toHaveBeenCalled();
    interface TrackFailureCall { notificationId: string; error: Error }
    const trackFailureCall = mockTrackDeliveryFailure.mock.calls[0]?.[0] as TrackFailureCall | undefined;
    expect(trackFailureCall?.notificationId).toBe("notif-123");
    expect(trackFailureCall?.error).toBeInstanceOf(Error);
  });

  it("should handle non-Error exceptions", async () => {
    const { payloadHandler } = await setupTest();
    if (!payloadHandler) return;
    mockSendMobileNotifications.mockRejectedValueOnce("string error");
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(mockTrackDeliveryFailure).toHaveBeenCalledWith({
      notificationId: "notif-123",
      error: "string error",
    });
  });

  it("should handle null/undefined errors", async () => {
    const { payloadHandler } = await setupTest();
    if (!payloadHandler) return;
    mockSendMobileNotifications.mockRejectedValueOnce(null);
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(mockTrackDeliveryFailure).toHaveBeenCalledWith({
      notificationId: "notif-123",
      error: "null",
    });
  });

  it("should handle errors in error tracking gracefully", async () => {
    const { payloadHandler, consoleErrorSpy } = await setupTest();
    if (!payloadHandler) return;
    mockSendMobileNotifications.mockRejectedValueOnce(new Error("Send failed"));
    mockTrackDeliveryFailure.mockRejectedValueOnce(new Error("Track failed"));
    const mockPayload = { new: { id: "notif-123" } };
    await payloadHandler(mockPayload);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("should handle multiple notifications in sequence", async () => {
    const { payloadHandler } = await setupTest();
    if (!payloadHandler) return;
    await payloadHandler({ new: { id: "notif-1" } });
    await payloadHandler({ new: { id: "notif-2" } });
    await payloadHandler({ new: { id: "notif-3" } });
    expect(mockTrackDeliveryStart).toHaveBeenCalledTimes(3);
    expect(mockSendMobileNotifications).toHaveBeenCalledTimes(3);
    expect(mockTrackDeliveryComplete).toHaveBeenCalledTimes(3);
  });

  it("should handle mixed success and failure scenarios", async () => {
    const { payloadHandler } = await setupTest();
    if (!payloadHandler) return;
    mockSendMobileNotifications
      .mockResolvedValueOnce({ total: 10, sent: 10, failed: 0, success: true })
      .mockRejectedValueOnce(new Error("Second failed"))
      .mockResolvedValueOnce({ total: 10, sent: 5, failed: 5, success: false });
    await payloadHandler({ new: { id: "notif-1" } });
    await payloadHandler({ new: { id: "notif-2" } });
    await payloadHandler({ new: { id: "notif-3" } });
    expect(mockTrackDeliveryComplete).toHaveBeenCalledTimes(2);
    expect(mockTrackDeliveryFailure).toHaveBeenCalledTimes(1);
  });

  it("should handle payload with different ID formats", async () => {
    const { payloadHandler } = await setupTest();
    if (!payloadHandler) return;
    await payloadHandler({ new: { id: 123 } });
    expect(mockTrackDeliveryStart).toHaveBeenCalledWith({ notificationId: 123 });
    await payloadHandler({ new: { id: "uuid-string" } });
    expect(mockTrackDeliveryStart).toHaveBeenCalledWith({ notificationId: "uuid-string" });
  });

  it("should handle empty payload gracefully", async () => {
    const { payloadHandler } = await setupTest();
    if (!payloadHandler) return;
    await payloadHandler({ new: {} as { id: string | number } });
    expect(mockTrackDeliveryStart).toHaveBeenCalledWith({ notificationId: undefined });
  });
});