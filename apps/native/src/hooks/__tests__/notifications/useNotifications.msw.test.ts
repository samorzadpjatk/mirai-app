import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { waitFor, act } from "@testing-library/react-native";
import { useNotifications } from "../../notifications/useNotifications";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler, resetHandlers } from "../../../test-utils/msw/server";
import { Alert } from "react-native";

jest.mock("expo-notifications", () => ({
  PermissionStatus: { GRANTED: "granted", DENIED: "denied", UNDETERMINED: "undetermined" },
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: "test-token" })),
}));

jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: "ios" },
  Linking: { openSettings: jest.fn(() => Promise.resolve()) },
}));

const mockNotifications = jest.requireMock("expo-notifications") as {
  getPermissionsAsync: jest.Mock<() => Promise<{ status: string }>>;
  requestPermissionsAsync: jest.Mock<() => Promise<{ status: string }>>;
  getExpoPushTokenAsync: jest.Mock<() => Promise<{ data: string }>>;
};

describe("useNotifications (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: "granted" });
  });

  it("should return subscription status when API returns subscribed", async () => {
    server.use(
      createORPCHandler(["notifications", "getSubscriptionStatus"], () => ({
        isSubscribed: true,
        subscriptions: [{ id: "sub-1", token: "test-token", createdAt: new Date().toISOString() }],
      })),
    );

    const { result } = renderHookWithMSW(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isSubscribedElsewhere).toBe(false);
  });

  it("should handle not subscribed state", async () => {
    server.use(
      createORPCHandler(["notifications", "getSubscriptionStatus"], () => ({
        isSubscribed: false,
        subscriptions: [],
      })),
    );

    const { result } = renderHookWithMSW(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isSubscribedElsewhere).toBe(false);
  });

  it("should handle subscribed elsewhere when permission denied", async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValueOnce({ status: "denied" });

    server.use(
      createORPCHandler(["notifications", "getSubscriptionStatus"], () => ({
        isSubscribed: true,
        subscriptions: [{ id: "sub-1", token: "test-token", createdAt: new Date().toISOString() }],
      })),
    );

    const { result } = renderHookWithMSW(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isSubscribedElsewhere).toBe(true);
  });

  it("should call unsubscribe mutation when toggling off subscription", async () => {
    const unsubscribeMock = jest.fn(async (_input: unknown) => ({ success: true }));
    const subscribeMock = jest.fn(async (_input: unknown) => ({ success: true }));

    server.use(
      createORPCHandler(["notifications", "getSubscriptionStatus"], () => ({
        isSubscribed: true,
        subscriptions: [{ id: "sub-1", token: "test-token", createdAt: new Date().toISOString() }],
      })),
      createORPCHandler(["notifications", "unsubscribe"], unsubscribeMock),
      createORPCHandler(["notifications", "subscribe"], subscribeMock),
    );

    const { result } = renderHookWithMSW(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSubscribed).toBe(true);

    await act(async () => {
      await result.current.toggleSubscription();
    });

    expect(unsubscribeMock).toHaveBeenCalledWith({ token: "test-token" });
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it("should call subscribe mutation when toggling on subscription with granted permission", async () => {
    const unsubscribeMock = jest.fn(async (_input: unknown) => ({ success: true }));
    const subscribeMock = jest.fn(async (_input: unknown) => ({ success: true }));

    server.use(
      createORPCHandler(["notifications", "getSubscriptionStatus"], () => ({
        isSubscribed: false,
        subscriptions: [],
      })),
      createORPCHandler(["notifications", "unsubscribe"], unsubscribeMock),
      createORPCHandler(["notifications", "subscribe"], subscribeMock),
    );

    const { result } = renderHookWithMSW(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSubscribed).toBe(false);

    await act(async () => {
      await result.current.toggleSubscription();
    });

    expect(subscribeMock).toHaveBeenCalledWith({ token: "test-token" });
    expect(unsubscribeMock).not.toHaveBeenCalled();
  });

  it("should show alert when toggling on subscription with denied permission", async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: "denied" });
    mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: "denied" });

    server.use(
      createORPCHandler(["notifications", "getSubscriptionStatus"], () => ({
        isSubscribed: false,
        subscriptions: [],
      })),
      createORPCHandler(["notifications", "subscribe"], () => ({ success: true })),
    );

    const { result } = renderHookWithMSW(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleSubscription();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Permission Required",
      "Please enable notifications in your device settings",
      expect.any(Array),
    );
  });

  it("should handle onTogglePress without throwing", async () => {
    server.use(
      createORPCHandler(["notifications", "getSubscriptionStatus"], () => ({
        isSubscribed: true,
        subscriptions: [{ id: "sub-1", token: "test-token", createdAt: new Date().toISOString() }],
      })),
      createORPCHandler(["notifications", "unsubscribe"], () => Promise.resolve({ success: true })),
    );

    const { result } = renderHookWithMSW(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.onTogglePress();
    });

    await waitFor(() => {
      expect(Alert.alert).not.toHaveBeenCalledWith("Error", "Failed to update notification settings");
    });
  });

  it("should call testNotification alert", async () => {
    server.use(
      createORPCHandler(["notifications", "getSubscriptionStatus"], () => ({
        isSubscribed: false,
        subscriptions: [],
      })),
    );

    const { result } = renderHookWithMSW(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.testNotification();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Test", "This would trigger a test notification flow");
  });

  it("should request permission and return granted status", async () => {
    server.use(
      createORPCHandler(["notifications", "getSubscriptionStatus"], () => ({
        isSubscribed: false,
        subscriptions: [],
      })),
    );

    const { result } = renderHookWithMSW(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let permissionResult: string | undefined;
    await act(async () => {
      permissionResult = await result.current.requestPermission();
    });

    expect(permissionResult).toBe("granted");
  });

  it("should handle initial loading state", async () => {
    server.use(
      createORPCHandler(["notifications", "getSubscriptionStatus"], () => ({
        isSubscribed: false,
        subscriptions: [],
      })),
    );

    const { result } = renderHookWithMSW(() => useNotifications());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSubscribed).toBe(false);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
