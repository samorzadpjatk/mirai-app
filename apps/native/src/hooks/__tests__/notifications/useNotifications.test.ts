import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useNotifications } from "../../notifications/useNotifications";

// Mock expo-notifications
const mockGetPermissionsAsync = jest.fn<() => Promise<{ status: string }>>();
const mockRequestPermissionsAsync = jest.fn<() => Promise<{ status: string }>>();
const mockGetExpoPushTokenAsync = jest.fn<(opts: { projectId?: string }) => Promise<{ data: string }>>();

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: () => mockGetPermissionsAsync(),
  requestPermissionsAsync: () => mockRequestPermissionsAsync(),
  getExpoPushTokenAsync: (options: { projectId?: string }) => mockGetExpoPushTokenAsync(options),
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: "test-project-id",
      },
    },
  },
}));

// Mock react-native
interface AlertButton { text: string; style?: string; onPress?: () => void }
const mockAlert = jest.fn<(title: string, message: string, buttons: AlertButton[]) => void>();
const mockLinkingOpenSettings = jest.fn<() => Promise<void>>();

jest.mock("react-native", () => ({
  Alert: {
    alert: (...args: [string, string, AlertButton[]]) => mockAlert(...args),
  },
  Linking: {
    openSettings: () => mockLinkingOpenSettings(),
  },
}));

// Mock tRPC
const mockGetSubscriptionStatusQuery = jest.fn(() => ({
  queryKey: ["notifications", "getSubscriptionStatus"],
}));

const mockSubscribeMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockUnsubscribeMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    notifications: {
      getSubscriptionStatus: {
        queryOptions: mockGetSubscriptionStatusQuery,
      },
      subscribe: {
        mutationOptions: mockSubscribeMutation,
      },
      unsubscribe: {
        mutationOptions: mockUnsubscribeMutation,
      },
    },
  })),
}));

// Mock query invalidation
jest.mock("@mirai-app/trpc/client/query", () => ({
  invalidateNotificationQueries: jest.fn(),
}));

// Mock React Query
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn(() => ({
  invalidateQueries: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

describe("useNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: "test-push-token" });
    mockLinkingOpenSettings.mockResolvedValue(undefined);
  });

  it("should return initial loading state", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useNotifications());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it("should return subscription status when subscribed", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        isSubscribed: true,
        subscriptions: [{ token: "test-token" }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });

    expect(result.current.isSubscribedElsewhere).toBe(false);
  });

  it("should detect subscription elsewhere when permission denied", () => {
    mockUseQuery.mockReturnValue({
      data: {
        isSubscribed: true,
        subscriptions: [{ token: "test-token" }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "denied" });

    const { result } = renderHook(() => useNotifications());

    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isSubscribedElsewhere).toBe(true);
  });

  it("should request permission successfully", async () => {
    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useNotifications());

    let permissionResult: string | undefined;
    await act(async () => {
      permissionResult = await result.current.requestPermission();
    });

    expect(mockGetPermissionsAsync).toHaveBeenCalled();
    expect(mockRequestPermissionsAsync).toHaveBeenCalled();
    expect(permissionResult).toBe("granted");
  });

  it("should not request permission if already granted", async () => {
    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useNotifications());

    let permissionResult: string | undefined;
    await act(async () => {
      permissionResult = await result.current.requestPermission();
    });

    expect(mockGetPermissionsAsync).toHaveBeenCalled();
    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    expect(permissionResult).toBe("granted");
  });

  it("should subscribe when toggling and not subscribed", async () => {
    const mockSubscribe = jest.fn<() => Promise<{ success: boolean }>>().mockResolvedValue({ success: true });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockSubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.toggleSubscription();
    });

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "test-project-id" });
    expect(mockSubscribe).toHaveBeenCalledWith({ token: "test-push-token" });
  });

  it("should unsubscribe when toggling and already subscribed", async () => {
    const mockUnsubscribe = jest.fn<() => Promise<{ success: boolean }>>().mockResolvedValue({ success: true });

    mockUseQuery.mockReturnValue({
      data: {
        isSubscribed: true,
        subscriptions: [{ token: "test-token-1" }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockUnsubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.toggleSubscription();
    });

    expect(mockUnsubscribe).toHaveBeenCalledWith({ token: "test-token-1" });
  });

  it("should show alert when permission denied during toggle", async () => {
    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "denied" });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.toggleSubscription();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "Permission Required",
      "Please enable notifications in your device settings",
      expect.arrayContaining([
        expect.objectContaining({ text: "Cancel", style: "cancel" }),
        expect.objectContaining({ text: "Open Settings", onPress: expect.any(Function) }),
      ])
    );
  });

  it("should open settings when alert button pressed", async () => {
    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "denied" });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.toggleSubscription();
    });

    const alertCalls = mockAlert.mock.calls;
    expect(alertCalls.length).toBeGreaterThan(0);

    const alertButtons = alertCalls[0][2] as { text: string; onPress?: () => void }[];
    const openSettingsButton = alertButtons.find((b) => b.text === "Open Settings");

    if (openSettingsButton?.onPress) {
      openSettingsButton.onPress();
      expect(mockLinkingOpenSettings).toHaveBeenCalled();
    }
  });

  it("should handle onTogglePress with error", async () => {
    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<never>>().mockRejectedValue(new Error("Subscribe failed")),
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.onTogglePress();
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith("Error", "Failed to update notification settings");
    });
  });

  it("should show test notification alert", () => {
    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.testNotification();
    });

    expect(mockAlert).toHaveBeenCalledWith("Test", "This would trigger a test notification flow");
  });

  it("should handle multiple subscriptions when unsubscribing", async () => {
    const mockUnsubscribe = jest.fn<() => Promise<{ success: boolean }>>().mockResolvedValue({ success: true });

    mockUseQuery.mockReturnValue({
      data: {
        isSubscribed: true,
        subscriptions: [
          { token: "token-1" },
          { token: "token-2" },
        ],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockUnsubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.toggleSubscription();
    });

    expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    expect(mockUnsubscribe).toHaveBeenCalledWith({ token: "token-1" });
    expect(mockUnsubscribe).toHaveBeenCalledWith({ token: "token-2" });
  });

  it("should handle permission check on mount", async () => {
    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mockGetPermissionsAsync).toHaveBeenCalled();
    });
  });

  it("should handle permission check errors gracefully", async () => {
    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockGetPermissionsAsync.mockRejectedValue(new Error("Permission check failed"));

    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => { /* noop */ });

    renderHook(() => useNotifications());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to get notification permissions",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
