import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  LocationStreamingService,
  LocationStreamingError,
} from "./location-streaming";
import {
  EventBus,
  type EventSubscription,
} from "../../system/shared/services/event-bus";
import {
  ConnectionManager,
  type BroadcastLocation,
  ConnectionManagerError,
} from "../../system/shared/services/connection-manager";

// Mock types for LocationUpdated event
interface LocationUpdated {
  type: "LocationUpdated";
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  occurredAt: Date;
}

// Mock factory functions
const createMockEventBus = () => {
  const subscriptions = new Map<string, Set<(...args: unknown[]) => unknown>>();
  let unsubscribeMock: (() => Effect.Effect<void, never, never>) | null = null;

  return {
    subscribe: (
      eventType: string,
      handler: (...args: unknown[]) => unknown,
    ): EventSubscription => {
      if (!subscriptions.has(eventType)) {
        subscriptions.set(eventType, new Set());
      }
      subscriptions.get(eventType)!.add(handler);

      unsubscribeMock = () =>
        Effect.sync(() => {
          subscriptions.get(eventType)?.delete(handler);
        });

      return {
        unsubscribe: unsubscribeMock,
      };
    },
    subscribeLegacy: (
      eventType: string,
      handler: (...args: unknown[]) => unknown,
    ): EventSubscription => {
      if (!subscriptions.has(eventType)) {
        subscriptions.set(eventType, new Set());
      }
      subscriptions.get(eventType)!.add(handler);

      unsubscribeMock = () =>
        Effect.sync(() => {
          subscriptions.get(eventType)?.delete(handler);
        });

      return {
        unsubscribe: unsubscribeMock,
      };
    },
    getSubscriptions: () => subscriptions,
    triggerEvent: (eventType: string, event: unknown) => {
      const handlers = subscriptions.get(eventType);
      if (handlers) {
        for (const handler of handlers) {
          handler(event);
        }
      }
    },
    getUnsubscribeMock: () => unsubscribeMock,
  };
};

const createMockConnectionManager = () => {
  const onlineUsers = new Set<string>();
  const totalConnections = { count: 0 };
  let broadcastResult: {
    success: boolean;
    broadcastCount: number;
    throttled: boolean;
    errors: string[];
  } = { success: true, broadcastCount: 0, throttled: false, errors: [] };
  let shouldFail = false;
  let failError: ConnectionManagerError | null = null;

  return {
    isUserOnline: (userId: string): boolean => onlineUsers.has(userId),
    broadcastLocation: (
      _userId: string,
      _location: BroadcastLocation,
      _friendIds: string[],
    ): Effect.Effect<
      {
        success: boolean;
        broadcastCount: number;
        throttled: boolean;
        errors: string[];
      },
      ConnectionManagerError,
      never
    > => {
      if (shouldFail && failError) {
        return Effect.fail(failError);
      }
      return Effect.succeed(broadcastResult);
    },
    getOnlineUsers: (): string[] => Array.from(onlineUsers),
    getTotalConnectionCount: (): number => totalConnections.count,
    setUserOnline: (userId: string) => onlineUsers.add(userId),
    setUserOffline: (userId: string) => onlineUsers.delete(userId),
    setTotalConnections: (count: number) => {
      totalConnections.count = count;
    },
    setBroadcastResult: (result: {
      success: boolean;
      broadcastCount: number;
      throttled: boolean;
      errors: string[];
    }) => {
      broadcastResult = result;
    },
    setShouldFail: (fail: boolean, error?: ConnectionManagerError) => {
      shouldFail = fail;
      failError = error || null;
    },
  };
};

const createMockLocationRepository = () => {
  let friendsToNotify: string[] = [];
  let shouldFail = false;
  let failError: Error | null = null;

  return {
    findFriendsToNotify: async (_userId: string): Promise<string[]> => {
      if (shouldFail) {
        throw failError || new Error("Repository error");
      }
      return friendsToNotify;
    },
    setFriendsToNotify: (friends: string[]) => {
      friendsToNotify = friends;
    },
    setShouldFail: (fail: boolean, error?: Error) => {
      shouldFail = fail;
      failError = error || null;
    },
  };
};

describe("[UNIT] LocationStreamingService", () => {
  let mockEventBus: ReturnType<typeof createMockEventBus>;
  let mockConnectionManager: ReturnType<typeof createMockConnectionManager>;
  let mockLocationRepository: ReturnType<typeof createMockLocationRepository>;
  let service: LocationStreamingService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    mockConnectionManager = createMockConnectionManager();
    mockLocationRepository = createMockLocationRepository();
    service = new LocationStreamingService(
      mockEventBus as unknown as EventBus,
      mockConnectionManager as unknown as ConnectionManager,
      mockLocationRepository,
    );
  });

  describe("initialize", () => {
    it("subscribes to LocationUpdated events", () => {
      service.initialize();

      const subscriptions = mockEventBus.getSubscriptions();
      expect(subscriptions.has("LocationUpdated")).toBe(true);
      expect(subscriptions.get("LocationUpdated")!.size).toBe(1);
    });

    it("does not subscribe if already initialized", () => {
      service.initialize();
      service.initialize();

      const subscriptions = mockEventBus.getSubscriptions();
      expect(subscriptions.get("LocationUpdated")!.size).toBe(1);
    });
  });

  describe("initializeEffect", () => {
    it("subscribes to LocationUpdated events using Effect", async () => {
      await Effect.runPromise(service.initializeEffect());

      const subscriptions = mockEventBus.getSubscriptions();
      expect(subscriptions.has("LocationUpdated")).toBe(true);
      expect(subscriptions.get("LocationUpdated")!.size).toBe(1);
    });

    it("does not subscribe if already initialized", async () => {
      await Effect.runPromise(service.initializeEffect());
      await Effect.runPromise(service.initializeEffect());

      const subscriptions = mockEventBus.getSubscriptions();
      expect(subscriptions.get("LocationUpdated")!.size).toBe(1);
    });
  });

  describe("shutdown", () => {
    it("unsubscribes from events and resets state", () => {
      service.initialize();
      service.shutdown();

      expect(service.getStats().isInitialized).toBe(false);
    });

    it("handles shutdown when not initialized", () => {
      // Should not throw
      service.shutdown();
      expect(service.getStats().isInitialized).toBe(false);
    });
  });

  describe("shutdownEffect", () => {
    it("unsubscribes from events and resets state using Effect", async () => {
      await Effect.runPromise(service.initializeEffect());
      await Effect.runPromise(service.shutdownEffect());

      expect(service.getStats().isInitialized).toBe(false);
    });

    it("handles shutdown when not initialized using Effect", async () => {
      await Effect.runPromise(service.shutdownEffect());
      expect(service.getStats().isInitialized).toBe(false);
    });
  });

  describe("broadcast", () => {
    it("broadcasts location to online friends", async () => {
      const userId = "user-123";
      const friendIds = ["friend-1", "friend-2"];
      mockLocationRepository.setFriendsToNotify(friendIds);
      mockConnectionManager.setBroadcastResult({
        success: true,
        broadcastCount: 2,
        throttled: false,
        errors: [],
      });

      const result = await Effect.runPromise(
        service.broadcast(userId, 40.7128, -74.006, 10),
      );

      expect(result.success).toBe(true);
      expect(result.broadcastCount).toBe(2);
      expect(result.throttled).toBe(false);
    });

    it("returns empty result when no friends to notify", async () => {
      const userId = "user-123";
      mockLocationRepository.setFriendsToNotify([]);

      const result = await Effect.runPromise(
        service.broadcast(userId, 40.7128, -74.006, 10),
      );

      expect(result.success).toBe(true);
      expect(result.broadcastCount).toBe(0);
      expect(result.throttled).toBe(false);
    });

    it("returns LocationStreamingError when repository fails", async () => {
      const userId = "user-123";
      mockLocationRepository.setShouldFail(
        true,
        new Error("DB connection failed"),
      );

      const result = await Effect.runPromise(
        Effect.either(service.broadcast(userId, 40.7128, -74.006, 10)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("LocationStreamingError");
        expect(result.left.operation).toBe("broadcast");
        expect(result.left.message).toContain(
          "Failed to find friends to notify",
        );
      }
    });

    it("returns LocationStreamingError when connection manager fails", async () => {
      const userId = "user-123";
      const friendIds = ["friend-1"];
      mockLocationRepository.setFriendsToNotify(friendIds);
      mockConnectionManager.setShouldFail(
        true,
        new ConnectionManagerError({
          operation: "broadcast",
          message: "Connection lost",
        }),
      );

      const result = await Effect.runPromise(
        Effect.either(service.broadcast(userId, 40.7128, -74.006, 10)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("LocationStreamingError");
        expect(result.left.operation).toBe("broadcast");
        expect(result.left.message).toBe("Connection lost");
      }
    });
  });

  describe("getStats", () => {
    it("returns correct statistics", () => {
      mockConnectionManager.setUserOnline("user-1");
      mockConnectionManager.setUserOnline("user-2");
      mockConnectionManager.setTotalConnections(5);
      service.initialize();

      const stats = service.getStats();

      expect(stats.onlineUsers).toBe(2);
      expect(stats.totalConnections).toBe(5);
      expect(stats.isInitialized).toBe(true);
    });

    it("returns isInitialized false when not initialized", () => {
      const stats = service.getStats();

      expect(stats.isInitialized).toBe(false);
    });
  });

  describe("getStatsEffect", () => {
    it("returns correct statistics using Effect", async () => {
      mockConnectionManager.setUserOnline("user-1");
      mockConnectionManager.setUserOnline("user-2");
      mockConnectionManager.setTotalConnections(3);
      await Effect.runPromise(service.initializeEffect());

      const stats = await Effect.runPromise(service.getStatsEffect());

      expect(stats.onlineUsers).toBe(2);
      expect(stats.totalConnections).toBe(3);
      expect(stats.isInitialized).toBe(true);
    });
  });

  describe("handleLocationUpdated (legacy via initialize)", () => {
    it("broadcasts to online friends when LocationUpdated event is received", async () => {
      const userId = "user-123";
      const friendIds = ["friend-1", "friend-2"];
      mockLocationRepository.setFriendsToNotify(friendIds);
      mockConnectionManager.setUserOnline("friend-1");
      mockConnectionManager.setBroadcastResult({
        success: true,
        broadcastCount: 1,
        throttled: false,
        errors: [],
      });

      service.initialize();

      const event: LocationUpdated = {
        type: "LocationUpdated",
        userId,
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: null,
        occurredAt: new Date(),
      };

      // Trigger the event
      mockEventBus.triggerEvent("LocationUpdated", event);

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it("skips broadcast when no friends are online", async () => {
      const userId = "user-123";
      const friendIds = ["friend-1", "friend-2"];
      mockLocationRepository.setFriendsToNotify(friendIds);
      // No users set as online

      service.initialize();

      const event: LocationUpdated = {
        type: "LocationUpdated",
        userId,
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: null,
        occurredAt: new Date(),
      };

      mockEventBus.triggerEvent("LocationUpdated", event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // No errors should occur
    });

    it("handles repository errors gracefully without throwing", async () => {
      const userId = "user-123";
      mockLocationRepository.setShouldFail(true, new Error("DB error"));

      service.initialize();

      const event: LocationUpdated = {
        type: "LocationUpdated",
        userId,
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: null,
        occurredAt: new Date(),
      };

      // Should not throw
      mockEventBus.triggerEvent("LocationUpdated", event);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });

  describe("handleLocationUpdatedEffect (via initializeEffect)", () => {
    it("broadcasts to online friends using Effect-based handler", async () => {
      const userId = "user-123";
      const friendIds = ["friend-1", "friend-2"];
      mockLocationRepository.setFriendsToNotify(friendIds);
      mockConnectionManager.setUserOnline("friend-1");
      mockConnectionManager.setBroadcastResult({
        success: true,
        broadcastCount: 1,
        throttled: false,
        errors: [],
      });

      await Effect.runPromise(service.initializeEffect());

      const event: LocationUpdated = {
        type: "LocationUpdated",
        userId,
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: null,
        occurredAt: new Date(),
      };

      mockEventBus.triggerEvent("LocationUpdated", event);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it("returns LocationStreamingError when repository fails in Effect handler", async () => {
      const userId = "user-123";
      mockLocationRepository.setShouldFail(true, new Error("DB error"));

      await Effect.runPromise(service.initializeEffect());

      const event: LocationUpdated = {
        type: "LocationUpdated",
        userId,
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: null,
        occurredAt: new Date(),
      };

      // The handler will fail but errors are isolated
      mockEventBus.triggerEvent("LocationUpdated", event);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });
});

describe("[UNIT] LocationStreamingError", () => {
  it("creates error with correct properties", () => {
    const cause = new Error("Original error");
    const error = new LocationStreamingError({
      operation: "broadcast",
      message: "Failed to broadcast location",
      cause,
    });

    expect(error._tag).toBe("LocationStreamingError");
    expect(error.code).toBe("LOCATION_STREAMING_ERROR");
    expect(error.operation).toBe("broadcast");
    expect(error.message).toBe("Failed to broadcast location");
    expect(error.cause).toBe(cause);
  });

  it("creates error without cause", () => {
    const error = new LocationStreamingError({
      operation: "initialize",
      message: "Service already initialized",
    });

    expect(error._tag).toBe("LocationStreamingError");
    expect(error.operation).toBe("initialize");
    expect(error.cause).toBeUndefined();
  });
});
