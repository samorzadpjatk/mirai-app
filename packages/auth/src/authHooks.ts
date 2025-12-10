"use client";

import { useContext } from "react";
import type { AuthUser, AuthContextValue } from "./types";
import { AuthContext } from "./AuthContext";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth hook cannot be used outside of AuthProvider");
  }

  return context;
}

export function useUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}

export function useSession() {
  const { session } = useAuth();
  return session;
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
