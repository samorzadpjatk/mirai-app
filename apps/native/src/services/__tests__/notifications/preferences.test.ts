import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NOTIFICATIONS_OPT_OUT_KEY } from "../../notifications/constants";
import {
  hasOptedOutOfNotifications,
  setNotificationsOptOut,
} from "../../notifications/preferences";

describe("notification preferences", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("should report no opt-out when nothing was stored", async () => {
    await expect(hasOptedOutOfNotifications()).resolves.toBe(false);
  });

  it("should persist an opt-out and read it back", async () => {
    await setNotificationsOptOut(true);

    await expect(AsyncStorage.getItem(NOTIFICATIONS_OPT_OUT_KEY)).resolves.toBe("true");
    await expect(hasOptedOutOfNotifications()).resolves.toBe(true);
  });

  it("should clear a previous opt-out", async () => {
    await setNotificationsOptOut(true);
    await setNotificationsOptOut(false);

    await expect(hasOptedOutOfNotifications()).resolves.toBe(false);
  });

  it("should treat storage failures as no opt-out", async () => {
    const getItem = jest.spyOn(AsyncStorage, "getItem");
    getItem.mockRejectedValueOnce(new Error("storage unavailable"));

    await expect(hasOptedOutOfNotifications()).resolves.toBe(false);

    getItem.mockRestore();
  });

  it("should swallow storage failures when persisting", async () => {
    const setItem = jest.spyOn(AsyncStorage, "setItem");
    setItem.mockRejectedValueOnce(new Error("storage unavailable"));

    await expect(setNotificationsOptOut(true)).resolves.toBeUndefined();

    setItem.mockRestore();
  });
});
