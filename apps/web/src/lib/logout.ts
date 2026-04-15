import { authStore } from "@mirai-app/frameworks/auth/client";
import { supabase } from "./supabase";

export const logout = async (): Promise<void> => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear the auth store state
    await authStore.getState().signOut();
  } catch {
    // Ignore errors during logout
  } finally {
    // Always clear cookies and redirect, even if there's an error
    clearAuthCookies();
    window.location.href = "/login";
  }
};
