import { describe, it, expect, jest } from "@jest/globals";
import { executeToggleSubscription } from "../../notifications/useNotifications";

describe("executeToggleSubscription", () => {
  const createMockDeps = () => ({
    subscriptionStatus: undefined as { isSubscribed?: boolean; subscriptions?: Array<{ token: string }> } | undefined,
    permissionDeps: {
      permission: "undetermined",
      requestPermission: jest.fn().mockResolvedValue("granted"),
      openAppSettings: jest.fn(),
    },
    mutations: {
      subscribeMutation: { mutateAsync: jest.fn() },
      unsubscribeMutation: { mutateAsync: jest.fn() },
    },
  });

  it("should unsubscribe all tokens when already subscribed", async () => {
    const deps = createMockDeps();
    deps.subscriptionStatus = {
      isSubscribed: true,
      subscriptions: [{ token: "token-1" }, { token: "token-2" }],
    };

    await executeToggleSubscription(deps.subscriptionStatus, deps.permissionDeps, deps.mutations);

    expect(deps.mutations.unsubscribeMutation.mutateAsync).toHaveBeenCalledTimes(2);
    expect(deps.mutations.unsubscribeMutation.mutateAsync).toHaveBeenNthCalledWith(1, { token: "token-1" });
    expect(deps.mutations.unsubscribeMutation.mutateAsync).toHaveBeenNthCalledWith(2, { token: "token-2" });
  });

  it("should show alert when permission not granted", async () => {
    const deps = createMockDeps();
    deps.permissionDeps.requestPermission = jest.fn().mockResolvedValue("denied");

    await executeToggleSubscription(deps.subscriptionStatus, deps.permissionDeps, deps.mutations);

    expect(deps.mutations.subscribeMutation.mutateAsync).not.toHaveBeenCalled();
  });
});
