import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { NOTIFICATIONS_OPT_OUT_KEY } from "~/services/notifications";
import { executeToggleSubscription } from "../../notifications/useNotifications";

const mockGetExpoPushToken = Notifications.getExpoPushTokenAsync as unknown as jest.Mock<
  () => Promise<{ data: string }>
>;

describe("executeToggleSubscription", () => {
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

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockGetExpoPushToken.mockReset();
    mockGetExpoPushToken.mockResolvedValue({ data: "this-device-token" });
  });

  it("should unsubscribe only this device when other devices stay subscribed", async () => {
    const deps = createMockDeps();
    deps.permissionDeps.permission = "granted";
    deps.subscriptionStatus = {
      isSubscribed: true,
      subscriptions: [{ token: "this-device-token" }, { token: "other-device-token" }],
    };

    await executeToggleSubscription(deps.subscriptionStatus, deps.permissionDeps, deps.mutations);

    expect(deps.mutations.unsubscribeMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(deps.mutations.unsubscribeMutation.mutateAsync).toHaveBeenCalledWith({
      token: "this-device-token",
    });
  });

  it("should unsubscribe every token when this device token cannot be resolved", async () => {
    const deps = createMockDeps();
    deps.permissionDeps.permission = "granted";
    deps.subscriptionStatus = {
      isSubscribed: true,
      subscriptions: [{ token: "token-1" }, { token: "token-2" }],
    };
    mockGetExpoPushToken.mockRejectedValueOnce(new Error("no push token on this device"));

    await executeToggleSubscription(deps.subscriptionStatus, deps.permissionDeps, deps.mutations);

    expect(deps.mutations.unsubscribeMutation.mutateAsync).toHaveBeenCalledTimes(2);
    expect(deps.mutations.unsubscribeMutation.mutateAsync).toHaveBeenNthCalledWith(1, {
      token: "token-1",
    });
    expect(deps.mutations.unsubscribeMutation.mutateAsync).toHaveBeenNthCalledWith(2, {
      token: "token-2",
    });
  });

  it("should remember the opt-out when notifications are turned off", async () => {
    const deps = createMockDeps();
    deps.permissionDeps.permission = "granted";
    deps.subscriptionStatus = {
      isSubscribed: true,
      subscriptions: [{ token: "this-device-token" }],
    };

    await executeToggleSubscription(deps.subscriptionStatus, deps.permissionDeps, deps.mutations);

    await expect(AsyncStorage.getItem(NOTIFICATIONS_OPT_OUT_KEY)).resolves.toBe("true");
  });

  it("should clear a previous opt-out when notifications are turned on", async () => {
    await AsyncStorage.setItem(NOTIFICATIONS_OPT_OUT_KEY, "true");
    const deps = createMockDeps();
    mockGetExpoPushToken.mockResolvedValue({ data: "fresh-token" });

    await executeToggleSubscription(deps.subscriptionStatus, deps.permissionDeps, deps.mutations);

    expect(deps.mutations.subscribeMutation.mutateAsync).toHaveBeenCalledWith({
      token: "fresh-token",
    });
    await expect(AsyncStorage.getItem(NOTIFICATIONS_OPT_OUT_KEY)).resolves.toBe("false");
  });

  it("should subscribe instead of unsubscribing when the device permission is missing", async () => {
    const deps = createMockDeps();
    deps.permissionDeps.permission = "undetermined";
    deps.subscriptionStatus = {
      isSubscribed: true,
      subscriptions: [{ token: "stale-token" }],
    };
    mockGetExpoPushToken.mockResolvedValue({ data: "fresh-token" });

    await executeToggleSubscription(deps.subscriptionStatus, deps.permissionDeps, deps.mutations);

    expect(deps.mutations.unsubscribeMutation.mutateAsync).not.toHaveBeenCalled();
    expect(deps.permissionDeps.requestPermission).toHaveBeenCalled();
    expect(deps.mutations.subscribeMutation.mutateAsync).toHaveBeenCalledWith({
      token: "fresh-token",
    });
  });

  it("should show alert when permission not granted", async () => {
    const deps = createMockDeps();
    deps.permissionDeps.requestPermission = jest.fn(async () => "denied");

    await executeToggleSubscription(deps.subscriptionStatus, deps.permissionDeps, deps.mutations);

    expect(deps.mutations.subscribeMutation.mutateAsync).not.toHaveBeenCalled();
  });
});
