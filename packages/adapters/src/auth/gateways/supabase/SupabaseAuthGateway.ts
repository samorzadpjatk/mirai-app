import { Effect } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type { IAuthNPort } from "@mirai-app/domain";
import { ApplicationError } from "@mirai-app/domain";

/**
 * Supabase Auth Gateway
 *
 * Implements IAuthNPort using Supabase Auth client for authentication operations.
 *
 * Note: Authorization (verifyAccess) has been moved to UserDrizzleGateway which
 * implements IAuthZPort. This gateway focuses solely on authentication (AuthN):
 * - signInWithPassword, signInWithOtp, signUp
 * - signOut
 * - getSession, refreshSession
 *
 * Backward Compatibility: This class also satisfies IAuthPort structure for
 * transition period (has all 6 AuthN methods). To use as IAuthPort, combine
 * with an IAuthZPort implementation at the application layer.
 */
export class SupabaseAuthGateway implements IAuthNPort {
  constructor(private readonly supabase: SupabaseClient) {}

  signInWithPassword(email: string, password: string) {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (!data || !data.user || !data.session) {
          throw new Error("Sign in failed: no user or session returned");
        }
        return {
          user: { id: data.user.id, email: data.user.email ?? "" },
          session: { accessToken: data.session.access_token },
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.signInWithPassword",
          cause: error,
        }),
    });
  }

  signInWithOtp(email: string, otp: string) {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.auth.verifyOtp({
          email,
          token: otp,
          type: "email",
        });
        if (error) throw error;
        if (!data || !data.user || !data.session) {
          throw new Error(
            "OTP verification failed: no user or session returned",
          );
        }
        return {
          user: { id: data.user.id, email: data.user.email ?? "" },
          session: { accessToken: data.session.access_token },
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.signInWithOtp",
          cause: error,
        }),
    });
  }

  signUp(email: string, password: string) {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        return {
          user: data && data.user
            ? { id: data.user.id, email: data.user.email ?? "" }
            : null,
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.signUp",
          cause: error,
        }),
    });
  }

  signOut() {
    return Effect.tryPromise({
      try: async () => {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.signOut",
          cause: error,
        }),
    });
  }

  getSession() {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.auth.getSession();
        if (error) throw error;
        return {
          user: data && data.session && data.session.user
            ? { id: data.session.user.id, email: data.session.user.email ?? "" }
            : null,
          accessToken: data && data.session ? data.session.access_token : null,
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.getSession",
          cause: error,
        }),
    });
  }

  refreshSession() {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.auth.refreshSession();
        if (error) throw error;
        return {
          session: data && data.session
            ? { accessToken: data.session.access_token }
            : null,
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.refreshSession",
          cause: error,
        }),
    });
  }
}
