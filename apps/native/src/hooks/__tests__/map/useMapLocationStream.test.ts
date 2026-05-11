import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useMapLocationStream } from "../../map/useMapLocationStream";

const mockCall = jest.fn<(...args: unknown[]) => Promise<AsyncIterable<unknown>>>();
const mockRandomUUID = jest.fn();
const mockUseLocationContext = jest.fn<() => LocationContextValue>();

interface LocationContextValue {
  canViewOthersLocations: boolean;
}

const createStream = (events: unknown[] = [], error?: unknown) => ({
  async *[Symbol.asyncIterator]() {
    if (error) throw error;
    for (const event of events) yield event;
  },
});

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    location: {
      getFriendsLocationsStream: {
        call: (...args: unknown[]) => mockCall(...args),
      },
    },
  },
}));

jest.mock("expo-crypto", () => ({
  randomUUID: () => mockRandomUUID(),
}));

jest.mock("~/stores/location", () => ({
  useLocationContext: (): LocationContextValue => mockUseLocationContext(),
}));

describe("useMapLocationStream", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRandomUUID.mockReturnValue("test-connection-id");
    mockUseLocationContext.mockReturnValue({ canViewOthersLocations: true });
  });

  it("should initialize with empty locations and users data", async () => {
    mockCall.mockResolvedValue(createStream());

    const { result } = renderHook(() => useMapLocationStream(true));

    await waitFor(() => expect(mockCall).toHaveBeenCalled());
    expect(result.current.locationsByUserId).toEqual({});
    expect(result.current.usersData).toEqual({});
  });

  it("should generate a unique connectionId", async () => {
    mockCall.mockResolvedValue(createStream());

    renderHook(() => useMapLocationStream(true));

    await waitFor(() => expect(mockRandomUUID).toHaveBeenCalled());
  });

  it("should call stream with correct input when enabled", async () => {
    mockCall.mockResolvedValue(createStream());

    renderHook(() => useMapLocationStream(true));

    await waitFor(() => expect(mockCall).toHaveBeenCalled());
    expect(mockCall.mock.calls[0]?.[0]).toMatchObject({
      connectionId: "test-connection-id",
      radiusKm: undefined,
      latitude: undefined,
      longitude: undefined,
    });
  });

  it("should enable stream when enabled is true and canViewOthersLocations is true", async () => {
    mockCall.mockResolvedValue(createStream());

    renderHook(() => useMapLocationStream(true));

    await waitFor(() => expect(mockCall).toHaveBeenCalledTimes(1));
  });

  it("should not start stream when enabled is false", () => {
    renderHook(() => useMapLocationStream(false));
    expect(mockCall).not.toHaveBeenCalled();
  });

  it("should not start stream when canViewOthersLocations is false", () => {
    mockUseLocationContext.mockReturnValue({ canViewOthersLocations: false });
    renderHook(() => useMapLocationStream(true));
    expect(mockCall).not.toHaveBeenCalled();
  });

  it("should handle upsert event and add location", async () => {
    mockCall.mockResolvedValue(createStream([
      {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John", lastName: "Doe", image: "https://example.com/john.jpg" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
    ]));

    const { result } = renderHook(() => useMapLocationStream(true));

    await waitFor(() => {
      expect(result.current.locationsByUserId["user-1"]).toEqual({
        latitude: 52.23,
        longitude: 21.01,
        updatedAt: 1704067200000,
      });
    });
    expect(result.current.usersData["user-1"]).toEqual({
      name: "John Doe",
      image: "https://example.com/john.jpg",
    });
  });

  it("should handle upsert event with partial user data", async () => {
    mockCall.mockResolvedValue(createStream([
      {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "Jane" },
          coords: { latitude: 52.24, longitude: 21.02 },
          timestamp: 1704067200000,
        },
      },
    ]));

    const { result } = renderHook(() => useMapLocationStream(true));

    await waitFor(() => {
      expect(result.current.usersData["user-1"]).toEqual({
        name: "Jane",
        image: undefined,
      });
    });
  });

  it("should handle upsert event without user data", async () => {
    mockCall.mockResolvedValue(createStream([
      {
        type: "upsert",
        location: {
          coords: { latitude: 52.25, longitude: 21.03 },
          timestamp: 1704067200000,
        },
      },
    ]));

    const { result } = renderHook(() => useMapLocationStream(true));

    await waitFor(() => {
      expect(result.current.locationsByUserId[""]).toEqual({
        latitude: 52.25,
        longitude: 21.03,
        updatedAt: 1704067200000,
      });
    });
  });

  it("should handle delete event and remove location", async () => {
    mockCall.mockResolvedValue(createStream([
      {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John", lastName: "Doe" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
      { type: "delete", userId: "user-1" },
    ]));

    const { result } = renderHook(() => useMapLocationStream(true));

    await waitFor(() => expect(result.current.locationsByUserId["user-1"]).toBeUndefined());
    expect(result.current.usersData["user-1"]).toBeUndefined();
  });

  it("should handle delete event with missing userId gracefully", async () => {
    mockCall.mockResolvedValue(createStream([
      {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
      { type: "delete", userId: null },
    ]));

    const { result } = renderHook(() => useMapLocationStream(true));

    await waitFor(() => expect(result.current.locationsByUserId["user-1"]).toBeDefined());
  });

  it("should handle multiple upsert events for different users", async () => {
    mockCall.mockResolvedValue(createStream([
      {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John", lastName: "Doe" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
      {
        type: "upsert",
        location: {
          user: { id: "user-2", firstName: "Jane", lastName: "Smith" },
          coords: { latitude: 52.24, longitude: 21.02 },
          timestamp: 1704067201000,
        },
      },
    ]));

    const { result } = renderHook(() => useMapLocationStream(true));

    await waitFor(() => expect(Object.keys(result.current.locationsByUserId)).toHaveLength(2));
  });

  it("should update existing location on upsert", async () => {
    mockCall.mockResolvedValue(createStream([
      {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
      {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "John", lastName: "Updated" },
          coords: { latitude: 52.25, longitude: 21.05 },
          timestamp: 1704067201000,
        },
      },
    ]));

    const { result } = renderHook(() => useMapLocationStream(true));

    await waitFor(() => expect(result.current.locationsByUserId["user-1"]!.latitude).toBe(52.25));
    expect(result.current.locationsByUserId["user-1"]!.longitude).toBe(21.05);
    expect(result.current.usersData["user-1"]!.name).toBe("John Updated");
  });

  it("should handle subscription errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { /* noop */ });
    mockCall.mockResolvedValue(createStream([], new Error("Subscription failed")));

    renderHook(() => useMapLocationStream(true));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Location subscription error:", expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle UNAUTHORIZED errors as warnings", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => { /* noop */ });
    mockCall.mockResolvedValue(createStream([], new Error("UNAUTHORIZED: User not logged in")));

    renderHook(() => useMapLocationStream(true));

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Location subscription unauthorized - user may not be logged in"
      );
    });

    consoleWarnSpy.mockRestore();
  });

  it("should expose setUsersData for manual updates", () => {
    mockCall.mockResolvedValue(createStream());
    const { result } = renderHook(() => useMapLocationStream(true));
    expect(typeof result.current.setUsersData).toBe("function");
  });

  it("should allow manual updates to usersData via setUsersData", () => {
    mockCall.mockResolvedValue(createStream());
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

  it("should handle non-Error objects in error callback", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { /* noop */ });
    mockCall.mockResolvedValue(createStream([], "string error"));

    renderHook(() => useMapLocationStream(true));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Location subscription error:", "string error");
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle upsert with empty user name", async () => {
    mockCall.mockResolvedValue(createStream([
      {
        type: "upsert",
        location: {
          user: { id: "user-1", firstName: "", lastName: "" },
          coords: { latitude: 52.23, longitude: 21.01 },
          timestamp: 1704067200000,
        },
      },
    ]));

    const { result } = renderHook(() => useMapLocationStream(true));

    await waitFor(() => expect(result.current.usersData["user-1"]!.name).toBe(""));
  });
});
