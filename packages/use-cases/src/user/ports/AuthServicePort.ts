import { Context, Effect } from "effect";
import type { ApplicationError } from "@mirai-app/domain";

/**
 * Auth User Info returned from external auth service
 */
export interface AuthUserInfo {
  id: string;
  email: string | null;
  bannedUntil: string | null;
  banReason: string | null;
  isBanned: boolean;
  role: string | null;
}

/**
 * Ban status returned from auth service
 */
export interface BanStatus {
  banned: boolean;
  bannedUntil: string | null;
  reason: string | null;
}

/**
 * Auth Service Port
 *
 * Interface for interacting with the external authentication service (Supabase Auth).
 * Handles user ban status, metadata, and auth user lifecycle.
 */
export interface IAuthServicePort {
  /**
   * Get current user ban status from access token
   */
  getCurrentUserBanStatus(
    accessToken: string,
  ): Effect.Effect<BanStatus, ApplicationError, never>;

  /**
   * Get ban status by email
   */
  getBanStatusByEmail(email: string): Effect.Effect<
    {
      exists: boolean;
    } & BanStatus,
    ApplicationError,
    never
  >;

  /**
   * Get user info by auth user ID
   */
  getUserInfoByAuthId(
    authUserId: string,
  ): Effect.Effect<AuthUserInfo | null, ApplicationError, never>;

  /**
   * Get multiple user infos by auth user IDs
   */
  getUserInfosByAuthIds(
    authUserIds: string[],
  ): Effect.Effect<Map<string, AuthUserInfo>, ApplicationError, never>;

  /**
   * Create auth user
   */
  createAuthUser(params: {
    email: string;
    firstName: string;
    lastName: string;
  }): Effect.Effect<{ id: string; email: string }, ApplicationError, never>;

  /**
   * Delete auth user
   */
  deleteAuthUser(authUserId: string): Effect.Effect<void, ApplicationError, never>;

  /**
   * Ban user until specific date
   */
  banUser(params: {
    authUserId: string;
    bannedUntilMs: number;
    reason?: string;
  }): Effect.Effect<{ bannedUntil: string }, ApplicationError, never>;
}

/**
 * Context.Tag for AuthServicePort
 */
export class AuthServicePortTag extends Context.Tag("AuthServicePort")<
  AuthServicePortTag,
  IAuthServicePort
>() {}
