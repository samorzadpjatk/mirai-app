import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { useMapLocationStream } from "../../map/useMapLocationStream";

const mockUseSubscription = jest.fn();
const mockRandomUUID = jest.fn();

// Type for subscription options
interface SubscriptionOptions {
  input: {
    connectionId: string;
    radiusKm?: number;
    latitude?: number;
    longitude?: number;
  };
  options: {
    enabled: boolean;
    onData: (data: unknown) => void;
    onError?: (error: unknown) => void;
  };
}

// Type for useLocationContext mock
interface LocationContextValue {
  canViewOthersLocations: boolean;
}

const mockUseLocationContext = jest.fn<LocationContextValue, []>();

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    location: {
      getFriendsLocationsStream: {
        subscriptionOptions: jest.fn((input: unknown, options: unknown) => ({
          input,
          options,
        })),
      },
    },
  })),
  useSubscription: function (options: SubscriptionOptions): undefined {
    mockUseSubscription(options);
    return undefined;
  },
}));

jest.mock("expo-crypto", () => ({
  randomUUID: function (): string {
    const result = mockRandomUUID() as string;
    return result;
  },
}));

jest.mock("~/stores/location", () => ({
  useLocationContext: (): LocationContextValue => {
    const result = mockUseLocationContext() as LocationContextValue;
    return result;
  },
}));

describe("useMapLocationStream", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRandomUUID.mockReturnValue("test-connection-id");
    mockUseLocationContext.mockReturnValue({ canViewOthersLocations: true });
  });

  it("should initialize with empty locations and users data", () => {
    mockUseSubscription.mockImplementation(() => { /* noop */ });

    const { result } = renderHook(() => useMapLocationStream(true));

    expect(result.current.locationsByUserId).toEqual({});
    expect(result.current.usersData).toEqual({});
  });

  it("should generate a unique connectionId", () => {
    mockUseSubscription.mockImplementation(() => { /* noop */ });

    renderHook(() => useMapLocationStream(true));

    expect(mockRandomUUID).toHaveBeenCalled();
  });

  it("should call useSubscription with correct options when enabled", () => {
    mockUseSubscription.mockImplementation(() => { /* noop */ });

    renderHook(() => useMapLocationStream(true));

    expect(mockUseSubscription).toHaveBeenCalled();
    const subscriptionCall = mockUseSubscription.mock.calls[0] as [SubscriptionOptions];
    expect(subscriptionCall[0].input).toMatchObject({
      connectionId: "test-connection-id",
      radiusKm: undefined,
      latitude: undefined,
      longitude: undefined,
    });
  });

  it("should enable subscription when enabled is true and canViewOthersLocations is true", () => {
    mockUseSubscription.mockImplementation(() => { /* noop */ });

    renderHook(() => useMapLocationStream(true));

    const subscriptionCall = mockUseSubscription.mock.calls[0] as [SubscriptionOptions];
    expect(subscriptionCall[0].options.enabled).toBe(true);
  });

  it("should disable subscription when enabled is false", () => {
    mockUseSubscription.mockImplementation(() => { /* noop */ });

    renderHook(() => useMapLocationStream(false));

    const subscriptionCall = mockUseSubscription.mock.calls[0] as [SubscriptionOptions];
    expect(subscriptionCall[0].options.enabled).toBe(false);
  });

  it("should disable subscription when canViewOthersLocations is false", () => {
    mockUseLocationContext.mockReturnValue({ canViewOthersLocations: false });
    mockUseSubscription.mockImplementation(() => { /* noop */ });

    renderHook(() => useMapLocationStream(true));

    const subscriptionCall = mockUseSubscription.mock.calls[0] as [SubscriptionOptions];
    expect(subscriptionCall[0].options.enabled).toBe(false);
  });

  it("should handle upsert event and add location", () => {
    let onDataCallback: ((data: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onDataCallback = options.options.onData;
    });

    const { result } = renderHook(() => useMapLocationStream(true));

    const upsertEvent = {
      data: {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John", lastName: "Doe", image: "https://example.com/john.jpg" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
    };

    act(() => {
      onDataCallback?.(upsertEvent);
    });

    expect(result.current.locationsByUserId["user-1"]).toEqual({
      latitude: 52.23,
      longitude: 21.01,
      updatedAt: 1704067200000,
    });
    expect(result.current.usersData["user-1"]).toEqual({
      name: "John Doe",
      image: "https://example.com/john.jpg",
    });
  });

  it("should handle upsert event with partial user data", () => {
    let onDataCallback: ((data: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onDataCallback = options.options.onData;
    });

    const { result } = renderHook(() => useMapLocationStream(true));

    const upsertEvent = {
      data: {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "Jane" },
          coords: { latitude: 52.24, longitude: 21.02 },
          timestamp: 1704067200000,
        },
      },
    };

    act(() => {
      onDataCallback?.(upsertEvent);
    });

    expect(result.current.usersData["user-1"]).toEqual({
      name: "Jane",
      image: undefined,
    });
  });

  it("should handle upsert event without user data", () => {
    let onDataCallback: ((data: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onDataCallback = options.options.onData;
    });

    const { result } = renderHook(() => useMapLocationStream(true));

    const upsertEvent = {
      data: {
        type: "upsert",
        location: {
          coords: { latitude: 52.25, longitude: 21.03 },
          timestamp: 1704067200000,
        },
      },
    };

    act(() => {
      onDataCallback?.(upsertEvent);
    });

    expect(result.current.locationsByUserId[""]).toEqual({
      latitude: 52.25,
      longitude: 21.03,
      updatedAt: 1704067200000,
    });
  });

  it("should handle delete event and remove location", () => {
    let onDataCallback: ((data: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onDataCallback = options.options.onData;
    });

    const { result } = renderHook(() => useMapLocationStream(true));

    const upsertEvent = {
      data: {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John", lastName: "Doe" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
    };

    act(() => {
      onDataCallback?.(upsertEvent);
    });

    expect(result.current.locationsByUserId["user-1"]).toBeDefined();

    const deleteEvent = {
      data: {
        type: "delete",
        userId: "user-1",
      },
    };

    act(() => {
      onDataCallback?.(deleteEvent);
    });

    expect(result.current.locationsByUserId["user-1"]).toBeUndefined();
    expect(result.current.usersData["user-1"]).toBeUndefined();
  });

  it("should handle delete event with missing userId gracefully", () => {
    let onDataCallback: ((data: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onDataCallback = options.options.onData;
    });

    const { result } = renderHook(() => useMapLocationStream(true));

    const upsertEvent = {
      data: {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
    };

    act(() => {
      onDataCallback?.(upsertEvent);
    });

    const deleteEvent = {
      data: {
        type: "delete",
        userId: null,
      },
    };

    act(() => {
      onDataCallback?.(deleteEvent);
    });

    expect(result.current.locationsByUserId["user-1"]).toBeDefined();
  });

  it("should handle multiple upsert events for different users", () => {
    let onDataCallback: ((data: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onDataCallback = options.options.onData;
    });

    const { result } = renderHook(() => useMapLocationStream(true));

    const upsertEvent1 = {
      data: {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John", lastName: "Doe" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
    };

    const upsertEvent2 = {
      data: {
        type: "upsert",
        location: {
          user: { id: "user-2", firstName: "Jane", lastName: "Smith" },
          coords: { latitude: 52.24, longitude: 21.02 },
          timestamp: 1704067201000,
        },
      },
    };

    act(() => {
      onDataCallback?.(upsertEvent1);
      onDataCallback?.(upsertEvent2);
    });

    expect(Object.keys(result.current.locationsByUserId)).toHaveLength(2);
    expect(result.current.locationsByUserId["user-1"]).toBeDefined();
    expect(result.current.locationsByUserId["user-2"]).toBeDefined();
  });

  it("should update existing location on upsert", () => {
    let onDataCallback: ((data: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onDataCallback = options.options.onData;
    });

    const { result } = renderHook(() => useMapLocationStream(true));

    const initialEvent = {
      data: {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
    };

    act(() => {
      onDataCallback?.(initialEvent);
    });

    expect(result.current.locationsByUserId["user-1"].latitude).toBe(52.23);

    const updateEvent = {
      data: {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John", lastName: "Updated" },
          coords: { latitude: 52.25, longitude: 21.05 },
          timestamp: 1704067201000,
        },
      },
    };

    act(() => {
      onDataCallback?.(updateEvent);
    });

    expect(result.current.locationsByUserId["user-1"].latitude).toBe(52.25);
    expect(result.current.locationsByUserId["user-1"].longitude).toBe(21.05);
    expect(result.current.usersData["user-1"].name).toBe("John Updated");
  });

  it("should handle subscription errors", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { /* noop */ });
    let onErrorCallback: ((error: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onErrorCallback = options.options.onError ?? null;
    });

    renderHook(() => useMapLocationStream(true));

    const error = new Error("Subscription failed");

    act(() => {
      onErrorCallback?.(error);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Location subscription error:", error);

    consoleErrorSpy.mockRestore();
  });

  it("should handle UNAUTHORIZED errors as warnings", () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => { /* noop */ });
    let onErrorCallback: ((error: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onErrorCallback = options.options.onError ?? null;
    });

    renderHook(() => useMapLocationStream(true));

    const error = new Error("UNAUTHORIZED: User not logged in");

    act(() => {
      onErrorCallback?.(error);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Location subscription unauthorized - user may not be logged in"
    );

    consoleWarnSpy.mockRestore();
  });

  it("should expose setUsersData for manual updates", () => {
    mockUseSubscription.mockImplementation(() => { /* noop */ });

    const { result } = renderHook(() => useMapLocationStream(true));

    expect(typeof result.current.setUsersData).toBe("function");
  });

  it("should allow manual updates to usersData via setUsersData", () => {
    mockUseSubscription.mockImplementation(() => { /* noop */ });

    const { result } = renderHook(() => useMapLocationStream(true));

    act(() => {
      result.current.setUsersData({
        "user-1": { name: "Manual User", email: "manual@example.com" },
      });
    });

    expect(result.current.usersData["user-1"]).toEqual({
      name: "Manual User",
      email: "manual@example.com",
    });
  });

  it("should handle non-Error objects in error callback", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { /* noop */ });
    let onErrorCallback: ((error: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onErrorCallback = options.options.onError ?? null;
    });

    renderHook(() => useMapLocationStream(true));

    act(() => {
      onErrorCallback?.("string error");
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Location subscription error:", "string error");

    consoleErrorSpy.mockRestore();
  });

  it("should handle upsert with empty user name", () => {
    let onDataCallback: ((data: unknown) => void) | null = null;
    mockUseSubscription.mockImplementation((options: SubscriptionOptions) => {
      onDataCallback = options.options.onData;
    });

    const { result } = renderHook(() => useMapLocationStream(true));

    const upsertEvent = {
      data: {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "", lastName: "" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
    };

    act(() => {
      onDataCallback?.(upsertEvent);
    });

    expect(result.current.usersData["user-1"].name).toBe("");
  });
});
