import { authStore } from "@mirai-app/auth/client";
import { supabase } from "./supabase";

/**
 * Clear all authentication cookies
 */
const clearAuthCookies = () => {
  document.cookie = "sb-access-token=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "sb-refresh-token=; Path=/; Max-Age=0; SameSite=Lax";
};

/**
 * Sign out the current user, clear cookies, and redirect to login page
 */
export const logout = async (): Promise<void> => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear the auth store state
    authStore.getState().signOut();
  } catch (error) {
    console.error("[admin-web] Error during logout:", error);
  } finally {
    // Always clear cookies and redirect, even if there's an error
    clearAuthCookies();
    window.location.href = "/login";
  }
};
