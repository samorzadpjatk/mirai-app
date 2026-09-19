import { focusManager } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Feed React Query's focus manager from `AppState`.
 *
 * `refetchOnWindowFocus` is built on a browser event this platform never
 * fires, so on its own it does nothing in React Native: the focus manager
 * stays on whatever it last believed. Without this bridge a screen left
 * mounted while the phone sat in a pocket keeps rendering the data it cached
 * before -- which is how an awarded coin balance could look like it never
 * arrived until the app was force-quit.
 *
 * Mount once, at the root, above `QueryProvider`'s consumers.
 */
export function useAppStateRefresh(): void {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status: AppStateStatus) => {
      focusManager.setFocused(status === "active");
    });

    return () => subscription.remove();
  }, []);
}
