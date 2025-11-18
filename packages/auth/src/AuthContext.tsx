"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import createSupabaseClient from "./supabaseClient";
import type { AuthContextValue, AuthUser, SignInOptions } from "./types";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export interface AuthProviderProps {
  children: ReactNode;
  supabaseUrl: string;
  supabaseKey: string;
  supabaseClient?: SupabaseClient;
  storageOptions?: {
    storage?: {
      getItem: (key: string) => Promise<string | null> | string | null;
      setItem: (key: string, value: string) => Promise<void> | void;
      removeItem: (key: string) => Promise<void> | void;
    };
  };
  onUserFetch?: (authUserId: string) => Promise<AuthUser | null>;
}

export function AuthProvider({
  children,
  supabaseUrl,
  supabaseKey,
  supabaseClient,
  storageOptions,
  onUserFetch,
}: AuthProviderProps) {
  const [client] = useState<SupabaseClient>(
    () =>
      supabaseClient ??
      createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: storageOptions,
      }),
  );

  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user && onUserFetch) {
        onUserFetch(session.user.id)
          .then(setUser)
          .catch(console.error)
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session?.user && onUserFetch) {
        setIsLoading(true);
        onUserFetch(session.user.id)
          .then(setUser)
          .catch(console.error)
          .finally(() => setIsLoading(false));
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, onUserFetch]);

  const signIn = async ({ provider, redirectTo }: SignInOptions) => {
    const { error } = await client.auth.signInWithOAuth({
      provider: provider as never,
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setSession(null);
  };

  const refreshSession = async () => {
    const { data, error } = await client.auth.refreshSession();

    if (error) {
      throw error;
    }

    setSession(data.session);
  };

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
