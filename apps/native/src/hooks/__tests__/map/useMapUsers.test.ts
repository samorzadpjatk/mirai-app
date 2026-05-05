import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useMapUsers } from "../../map/useMapUsers";

describe("useMapUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultArgs = {
    locationsByUserId: {},
    usersData: {},
    session: null,
    currentUserName: null,
    currentUserAvatarUrl: null,
    currentCoordinate: null,
  };

  it("should return empty array when no locations or current coordinate", () => {
    const { result } = renderHook(() => useMapUsers(defaultArgs));

    expect(result.current).toEqual([]);
  });

  it("should include current user when currentCoordinate is provided", () => {
    const args = {
      ...defaultArgs,
      currentCoordinate: [52.2297, 21.0122] as [number, number],
      session: { user: { id: "user-1", email: "user@example.com" } },
      currentUserName: "John Doe",
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      id: "user-1",
      name: "John Doe",
      email: "user@example.com",
      address: "Your location",
      coordinate: [52.2297, 21.0122],
      avatarUrl: null,
    });
  });

  it("should use session email when currentUserName is not provided", () => {
    const args = {
      ...defaultArgs,
      currentCoordinate: [52.2297, 21.0122] as [number, number],
      session: { user: { id: "user-1", email: "user@example.com" } },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].name).toBe("user@example.com");
  });

  it("should use 'You' as fallback when no name or email", () => {
    const args = {
      ...defaultArgs,
      currentCoordinate: [52.2297, 21.0122] as [number, number],
      session: { user: { id: "user-1" } },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].name).toBe("You");
  });

  it("should use 'me' as id when session user id is not available", () => {
    const args = {
      ...defaultArgs,
      currentCoordinate: [52.2297, 21.0122] as [number, number],
      session: { user: {} },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].id).toBe("me");
  });

  it("should include avatarUrl when provided", () => {
    const args = {
      ...defaultArgs,
      currentCoordinate: [52.2297, 21.0122] as [number, number],
      session: { user: { id: "user-1" } },
      currentUserAvatarUrl: "https://example.com/avatar.jpg",
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].avatarUrl).toBe("https://example.com/avatar.jpg");
  });

  it("should include other users from locationsByUserId", () => {
    const args = {
      ...defaultArgs,
      locationsByUserId: {
        "user-2": { latitude: 52.23, longitude: 21.01, updatedAt: Date.now() },
      },
      usersData: {
        "user-2": { name: "Jane Doe", email: "jane@example.com", image: "https://example.com/jane.jpg", houseNumber: "42" },
      },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      id: "user-2",
      name: "Jane Doe",
      email: "jane@example.com",
      address: "House 42",
      coordinate: [21.01, 52.23],
      avatarUrl: "https://example.com/jane.jpg",
    });
  });

  it("should use 'Unknown' as name when user data is not available", () => {
    const args = {
      ...defaultArgs,
      locationsByUserId: {
        "user-2": { latitude: 52.23, longitude: 21.01, updatedAt: Date.now() },
      },
      usersData: {},
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].name).toBe("Unknown");
  });

  it("should not include address when houseNumber is not provided", () => {
    const args = {
      ...defaultArgs,
      locationsByUserId: {
        "user-2": { latitude: 52.23, longitude: 21.01, updatedAt: Date.now() },
      },
      usersData: {
        "user-2": { name: "Jane Doe" },
      },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].address).toBeUndefined();
  });

  it("should exclude current user from other users list", () => {
    const args = {
      ...defaultArgs,
      currentCoordinate: [52.2297, 21.0122] as [number, number],
      session: { user: { id: "user-1" } },
      locationsByUserId: {
        "user-1": { latitude: 52.23, longitude: 21.01, updatedAt: Date.now() },
        "user-2": { latitude: 52.24, longitude: 21.02, updatedAt: Date.now() },
      },
      usersData: {
        "user-1": { name: "Current User" },
        "user-2": { name: "Other User" },
      },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).toBe("user-1");
    expect(result.current[1].id).toBe("user-2");
  });

  it("should combine current user and other users", () => {
    const args = {
      ...defaultArgs,
      currentCoordinate: [52.2297, 21.0122] as [number, number],
      session: { user: { id: "user-1", email: "user@example.com" } },
      currentUserName: "Current User",
      locationsByUserId: {
        "user-2": { latitude: 52.23, longitude: 21.01, updatedAt: Date.now() },
        "user-3": { latitude: 52.24, longitude: 21.02, updatedAt: Date.now() },
      },
      usersData: {
        "user-2": { name: "User 2" },
        "user-3": { name: "User 3" },
      },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current).toHaveLength(3);
    expect(result.current[0].id).toBe("user-1");
    expect(result.current[1].id).toBe("user-2");
    expect(result.current[2].id).toBe("user-3");
  });

  it("should update lastActiveAt every second", async () => {
    const args = {
      ...defaultArgs,
      currentCoordinate: [52.2297, 21.0122] as [number, number],
      session: { user: { id: "user-1" } },
    };

    const { result } = renderHook(() => useMapUsers(args));
    const initialTimestamp = result.current[0].lastActiveAt;

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current[0].lastActiveAt).toBeGreaterThan(initialTimestamp);
    });
  });

  it("should handle Date object in updatedAt", () => {
    const now = new Date();
    const args = {
      ...defaultArgs,
      locationsByUserId: {
        "user-2": { latitude: 52.23, longitude: 21.01, updatedAt: now },
      },
      usersData: {
        "user-2": { name: "Jane Doe" },
      },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].lastActiveAt).toBe(now.getTime());
  });

  it("should handle string timestamp in updatedAt", () => {
    const timestamp = "2024-01-01T00:00:00.000Z";
    const args = {
      ...defaultArgs,
      locationsByUserId: {
        "user-2": { latitude: 52.23, longitude: 21.01, updatedAt: timestamp },
      },
      usersData: {
        "user-2": { name: "Jane Doe" },
      },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].lastActiveAt).toBe(timestamp);
  });

  it("should handle number timestamp in updatedAt", () => {
    const timestamp = 1704067200000;
    const args = {
      ...defaultArgs,
      locationsByUserId: {
        "user-2": { latitude: 52.23, longitude: 21.01, updatedAt: timestamp },
      },
      usersData: {
        "user-2": { name: "Jane Doe" },
      },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].lastActiveAt).toBe(timestamp);
  });

  it("should trim whitespace from currentUserName", () => {
    const args = {
      ...defaultArgs,
      currentCoordinate: [52.2297, 21.0122] as [number, number],
      session: { user: { id: "user-1" } },
      currentUserName: "  John Doe  ",
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].name).toBe("John Doe");
  });

  it("should use email fallback when currentUserName is only whitespace", () => {
    const args = {
      ...defaultArgs,
      currentCoordinate: [52.2297, 21.0122] as [number, number],
      session: { user: { id: "user-1", email: "user@example.com" } },
      currentUserName: "   ",
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].name).toBe("user@example.com");
  });

  it("should handle null avatarUrl in usersData", () => {
    const args = {
      ...defaultArgs,
      locationsByUserId: {
        "user-2": { latitude: 52.23, longitude: 21.01, updatedAt: Date.now() },
      },
      usersData: {
        "user-2": { name: "Jane Doe", image: null },
      },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].avatarUrl).toBeNull();
  });

  it("should handle undefined avatarUrl in usersData", () => {
    const args = {
      ...defaultArgs,
      locationsByUserId: {
        "user-2": { latitude: 52.23, longitude: 21.01, updatedAt: Date.now() },
      },
      usersData: {
        "user-2": { name: "Jane Doe" },
      },
    };

    const { result } = renderHook(() => useMapUsers(args));

    expect(result.current[0].avatarUrl).toBeNull();
  });

  it("should memoize results and not recalculate unnecessarily", () => {
    const args = {
      ...defaultArgs,
      locationsByUserId: {
        "user-2": { latitude: 52.23, longitude: 21.01, updatedAt: Date.now() },
      },
      usersData: {
        "user-2": { name: "Jane Doe" },
      },
    };

    const { result, rerender } = renderHook(() => useMapUsers(args));
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });
});
