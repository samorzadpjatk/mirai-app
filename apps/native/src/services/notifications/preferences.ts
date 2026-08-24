import AsyncStorage from "@react-native-async-storage/async-storage";
import { NOTIFICATIONS_OPT_OUT_KEY } from "./constants";

export async function hasOptedOutOfNotifications(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_OPT_OUT_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setNotificationsOptOut(optedOut: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_OPT_OUT_KEY, optedOut.toString());
  } catch {
    // Best-effort preference: toggling notifications must not fail on storage errors
  }
}
