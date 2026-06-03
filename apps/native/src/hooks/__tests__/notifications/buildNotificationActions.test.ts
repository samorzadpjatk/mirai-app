import { describe, it, expect, jest } from "@jest/globals";
import { buildNotificationActions } from "../../notifications/useNotifications";

const mockGetExpoPushTokenAsync = jest.fn(async () => ({ data: "test-token" }));

jest.mock("expo-notifications", () => ({
  PermissionStatus: {
    UNDETERMINED: "undetermined",
    GRANTED: "granted",
    DENIED: "denied",
  },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: () => mockGetExpoPushTokenAsync(),
}));

describe("buildNotificationActions", () => {
  const createMockDeps = () => ({
    subscriptionStatus: undefined as
      | { isSubscribed?: boolean; subscriptions?: Array<{ token: string }> }
      | undefined,
    permissionDeps: {
      permission: "undetermined",
      requestPermission: jest.fn(async () => "granted"),
      openAppSettings: jest.fn(),
    },
    mutations: {
      subscribeMutation: { mutateAsync: jest.fn(async (_data: { token: string }) => ({})) },
      unsubscribeMutation: { mutateAsync: jest.fn(async (_data: { token: string }) => ({})) },
    },
  });

  beforeEach(() => {
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: "test-token" });
  });

  it("should build toggleSubscription that calls executeToggleSubscription", async () => {
    const deps = createMockDeps();
    const actions = buildNotificationActions(
      deps.subscriptionStatus,
      deps.permissionDeps,
      deps.mutations,
    );

    await actions.toggleSubscription();

    expect(deps.permissionDeps.requestPermission).toHaveBeenCalled();
    expect(mockGetExpoPushTokenAsync).toHaveBeenCalled();
    expect(deps.mutations.subscribeMutation.mutateAsync).toHaveBeenCalledWith({
      token: "test-token",
    });
  });

  it("should build testNotification that returns void", () => {
    const deps = createMockDeps();
    const actions = buildNotificationActions(
      deps.subscriptionStatus,
      deps.permissionDeps,
      deps.mutations,
    );

    expect(actions.testNotification()).toBeUndefined();
  });

  it("should build onTogglePress that calls toggleSubscription", async () => {
    const deps = createMockDeps();
    const actions = buildNotificationActions(
      deps.subscriptionStatus,
      deps.permissionDeps,
      deps.mutations,
    );

    actions.onTogglePress();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(deps.permissionDeps.requestPermission).toHaveBeenCalled();
  });
});
