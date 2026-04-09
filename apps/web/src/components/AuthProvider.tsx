"use client";

import { AuthStoreProvider, authStore } from "@mirai-app/frameworks/auth/client";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { env } from "../lib/env";
import { onAuthUserFetch } from "../lib/auth";
import { supabase } from "../lib/supabase";

// Refresh token 5 minutes before expiration
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Decode JWT and extract expiration time
 */
const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload)) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

/**
 * Schedule a token refresh before expiration
 */
const scheduleTokenRefresh = (accessToken: string): (() => void) | null => {
  const expiresAt = getTokenExpiration(accessToken);
  if (!expiresAt) return null;

  const refreshAt = expiresAt - TOKEN_REFRESH_BUFFER_MS;
  const delay = refreshAt - Date.now();

  if (delay <= 0) {
    // Token is already expiring or expired, refresh immediately
    void authStore.getState().refreshSession().catch(console.error);
    return null;
  }

  const timeoutId = setTimeout(() => {
    void authStore.getState().refreshSession().catch(console.error);
  }, delay);

  return () => clearTimeout(timeoutId);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelRefresh: (() => void) | null = null;

    const syncCookies = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.access_token) {
        document.cookie = `sb-access-token=${session.access_token}; Path=/; SameSite=Lax`;
        // Schedule automatic refresh
        cancelRefresh = scheduleTokenRefresh(session.access_token);
      }
      if (session?.refresh_token) {
        document.cookie = `sb-refresh-token=${session.refresh_token}; Path=/; SameSite=Lax`;
      }
    };

    void syncCookies();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Cancel any pending refresh
      cancelRefresh?.();
      cancelRefresh = null;

      if (session?.access_token) {
        document.cookie = `sb-access-token=${session.access_token}; Path=/; SameSite=Lax`;
        // Schedule automatic refresh for the new token
        cancelRefresh = scheduleTokenRefresh(session.access_token);
      } else {
        document.cookie = "sb-access-token=; Path=/; Max-Age=0; SameSite=Lax";
      }

      if (session?.refresh_token) {
        document.cookie = `sb-refresh-token=${session.refresh_token}; Path=/; SameSite=Lax`;
      } else {
        document.cookie = "sb-refresh-token=; Path=/; Max-Age=0; SameSite=Lax";
      }
    });

    return () => {
      cancelRefresh?.();
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthStoreProvider
      supabaseUrl={env.supabaseUrl}
      supabaseKey={env.supabaseAnonKey}
      supabaseClient={supabase}
      onUserFetch={onAuthUserFetch}
    >
      {children}
    </AuthStoreProvider>
  );
}
