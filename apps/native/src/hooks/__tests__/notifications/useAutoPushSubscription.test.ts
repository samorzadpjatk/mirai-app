import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { NOTIFICATIONS_OPT_OUT_KEY } from "~/services/notifications";
import {
  isAutoPushBlocked,
  parseToken,
  resolveProjectId,
  runAutoPushSubscriptionFlow,
} from "../../notifications/useAutoPushSubscription";

describe("resolveProjectId", () => {
  it("should return undefined when no config is available", () => {
    const result = resolveProjectId();
    expect(result).toBeUndefined();
  });
});

describe("parseToken", () => {
  it("should return null for null input", () => {
    expect(parseToken(null)).toBeNull();
  });

  it("should return null for non-object input", () => {
    expect(parseToken("string")).toBeNull();
    expect(parseToken(123)).toBeNull();
    expect(parseToken(undefined)).toBeNull();
  });

  it("should return null when data is missing", () => {
    expect(parseToken({})).toBeNull();
    expect(parseToken({ other: "field" })).toBeNull();
  });

  it("should return null when data is not a string", () => {
    expect(parseToken({ data: 123 })).toBeNull();
    expect(parseToken({ data: null })).toBeNull();
    expect(parseToken({ data: true })).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(parseToken({ data: "" })).toBeNull();
    expect(parseToken({ data: "   " })).toBeNull();
  });

  it("should return trimmed token string", () => {
    expect(parseToken({ data: "my-token" })).toBe("my-token");
  });

  it("should trim whitespace from token", () => {
    expect(parseToken({ data: "  token-with-spaces  " })).toBe("token-with-spaces");
  });
});

describe("isAutoPushBlocked", () => {
  it("should return true when no session", () => {
    expect(isAutoPushBlocked(false, "user1", false, false, null)).toBe(true);
  });

  it("should return true when no authUserId", () => {
    expect(isAutoPushBlocked(true, null, false, false, null)).toBe(true);
  });

  it("should return true when status is loading", () => {
    expect(isAutoPushBlocked(true, "user1", true, false, null)).toBe(true);
  });

  it("should return true when mutation is pending", () => {
    expect(isAutoPushBlocked(true, "user1", false, true, null)).toBe(true);
  });

  it("should return true when already attempted for user", () => {
    expect(isAutoPushBlocked(true, "user1", false, false, "user1")).toBe(true);
  });

  it("should return false when all conditions allow", () => {
    expect(isAutoPushBlocked(true, "user1", false, false, null)).toBe(false);
  });
});

describe("runAutoPushSubscriptionFlow", () => {
  const mockGetPermissions = Notifications.getPermissionsAsync as unknown as jest.Mock<
    () => Promise<{ status: string }>
  >;
  const mockRequestPermissions = Notifications.requestPermissionsAsync as unknown as jest.Mock<
    () => Promise<{ status: string }>
  >;
  const mockGetExpoPushToken = Notifications.getExpoPushTokenAsync as unknown as jest.Mock<
    () => Promise<{ data: string }>
  >;

  const createSubscribeMutation = () => ({
    mutateAsync: jest.fn(async (_data: { token: string }) => ({})),
  });

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockGetPermissions.mockReset();
    mockRequestPermissions.mockReset();
    mockGetExpoPushToken.mockReset();
    mockGetPermissions.mockResolvedValue({ status: "granted" });
    mockGetExpoPushToken.mockResolvedValue({ data: "device-token" });
  });

  it("should ask for permission and subscribe when the server subscription belongs to another device", async () => {
    mockGetPermissions.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissions.mockResolvedValue({ status: "granted" });
    const subscribeMutation = createSubscribeMutation();

    await runAutoPushSubscriptionFlow(subscribeMutation, ["stale-token-from-old-install"]);

    expect(mockRequestPermissions).toHaveBeenCalled();
    expect(subscribeMutation.mutateAsync).toHaveBeenCalledWith({ token: "device-token" });
  });

  it("should skip subscribing when this device token is already registered", async () => {
    const subscribeMutation = createSubscribeMutation();

    await runAutoPushSubscriptionFlow(subscribeMutation, ["device-token"]);

    expect(subscribeMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("should respect a deliberate opt-out and never ask for permission", async () => {
    await AsyncStorage.setItem(NOTIFICATIONS_OPT_OUT_KEY, "true");
    mockGetPermissions.mockResolvedValue({ status: "undetermined" });
    const subscribeMutation = createSubscribeMutation();

    await runAutoPushSubscriptionFlow(subscribeMutation, []);

    expect(mockGetPermissions).not.toHaveBeenCalled();
    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(subscribeMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("should subscribe on a fresh install once permission is granted", async () => {
    const subscribeMutation = createSubscribeMutation();

    await runAutoPushSubscriptionFlow(subscribeMutation, []);

    expect(subscribeMutation.mutateAsync).toHaveBeenCalledWith({ token: "device-token" });
  });
});
