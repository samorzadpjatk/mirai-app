import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useAutoPushSubscription } from "../../notifications/useAutoPushSubscription";

// Mock expo-notifications
const mockGetPermissionsAsync = jest.fn<() => Promise<{ status: string }>>();
const mockRequestPermissionsAsync = jest.fn<() => Promise<{ status: string }>>();
const mockGetExpoPushTokenAsync =
  jest.fn<(opts?: { projectId?: string }) => Promise<{ data: string | null }>>();

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: () => mockGetPermissionsAsync(),
  requestPermissionsAsync: () => mockRequestPermissionsAsync(),
  getExpoPushTokenAsync: (options?: { projectId?: string }) => mockGetExpoPushTokenAsync(options),
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
  easConfig: {
    projectId: "test-project-id",
  },
}));

// Mock auth
const mockUseAuth = jest.fn();

jest.mock("@mirai-app/auth/client", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock oRPC
jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    notifications: {
      getSubscriptionStatus: {
        queryOptions: ({ input }: { input: Record<string, never> }) => ({
          queryKey: ["notifications", "getSubscriptionStatus", input],
        }),
      },
      subscribe: {
        mutationOptions: ({ onSuccess }: { onSuccess?: () => void | Promise<void> }) => ({
          mutationFn: jest.fn(),
          onSuccess,
        }),
      },
    },
  },
}));

// Mock query invalidation
jest.mock("@mirai-app/orpc/client/query", () => ({
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

describe("useAutoPushSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: "test-push-token" });
  });

  it("should not attempt subscription without session", () => {
    mockUseAuth.mockReturnValue({
      session: null,
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderHook(() => useAutoPushSubscription());

    expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
  });

  it("should not attempt subscription when already subscribed", () => {
    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: true, subscriptions: [{ token: "existing-token" }] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderHook(() => useAutoPushSubscription());

    expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
  });

  it("should not attempt subscription while loading", () => {
    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderHook(() => useAutoPushSubscription());

    expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
  });

  it("should not attempt subscription while mutation is pending", () => {
    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    renderHook(() => useAutoPushSubscription());

    expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
  });

  it("should auto-subscribe when permission is granted", async () => {
    const mockSubscribe = jest
      .fn<(args: { token: string }) => Promise<{ success: boolean }>>()
      .mockResolvedValue({ success: true });

    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockSubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    renderHook(() => useAutoPushSubscription());

    await waitFor(() => {
      expect(mockGetPermissionsAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "test-project-id" });
    });

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith({ token: "test-push-token" });
    });
  });

  it("should request permission when undetermined", async () => {
    const mockSubscribe = jest
      .fn<() => Promise<{ success: boolean }>>()
      .mockResolvedValue({ success: true });

    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockSubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" });

    renderHook(() => useAutoPushSubscription());

    await waitFor(() => {
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });

  it("should not subscribe when permission is denied", async () => {
    const mockSubscribe = jest.fn();

    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockSubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "denied" });

    renderHook(() => useAutoPushSubscription());

    await waitFor(() => {
      expect(mockGetPermissionsAsync).toHaveBeenCalled();
    });

    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("should not subscribe when permission request is denied", async () => {
    const mockSubscribe = jest.fn();

    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockSubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "denied" });

    renderHook(() => useAutoPushSubscription());

    await waitFor(() => {
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
    });

    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("should handle missing push token", async () => {
    const mockSubscribe = jest.fn();
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockSubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: null });

    renderHook(() => useAutoPushSubscription());

    await waitFor(() => {
      expect(mockGetExpoPushTokenAsync).toHaveBeenCalled();
    });

    expect(mockSubscribe).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should handle subscription errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest
        .fn<() => Promise<never>>()
        .mockRejectedValue(new Error("Subscription failed")),
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: "test-token" });

    renderHook(() => useAutoPushSubscription());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to run automatic notification onboarding:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it("should only attempt once per user", async () => {
    const mockSubscribe = jest
      .fn<() => Promise<{ success: boolean }>>()
      .mockResolvedValue({ success: true });

    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockSubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { rerender } = renderHook(() => useAutoPushSubscription());

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledTimes(1);
    });

    // Rerender with same user - should not subscribe again
    rerender({});

    // Wait a bit to ensure no additional calls
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it("should attempt again for different user", async () => {
    const mockSubscribe = jest
      .fn<() => Promise<{ success: boolean }>>()
      .mockResolvedValue({ success: true });

    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockSubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { rerender } = renderHook(() => useAutoPushSubscription());

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledTimes(1);
    });

    // Change user
    mockUseAuth.mockReturnValue({
      session: {
        access_token: "new-token",
        user: { id: "user-456" },
      },
    });

    rerender({});

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledTimes(2);
    });
  });

  it("should reset attempt ref when session is cleared", async () => {
    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest
        .fn<() => Promise<{ success: boolean }>>()
        .mockResolvedValue({ success: true }),
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { rerender } = renderHook(() => useAutoPushSubscription());

    await waitFor(() => {
      expect(mockGetPermissionsAsync).toHaveBeenCalled();
    });

    // Clear session
    mockUseAuth.mockReturnValue({
      session: null,
    });

    rerender({});

    // Should not attempt when no session
    expect(mockGetPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it("should handle invalid token data", async () => {
    const mockSubscribe = jest.fn();
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    mockUseAuth.mockReturnValue({
      session: {
        access_token: "test-token",
        user: { id: "user-123" },
      },
    });

    mockUseQuery.mockReturnValue({
      data: { isSubscribed: false, subscriptions: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockSubscribe,
      isPending: false,
    });

    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: "" }); // Empty token

    renderHook(() => useAutoPushSubscription());

    await waitFor(() => {
      expect(mockGetExpoPushTokenAsync).toHaveBeenCalled();
    });

    expect(mockSubscribe).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
