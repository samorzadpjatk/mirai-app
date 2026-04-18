import type { Effect } from "effect";
import type { IPortError } from "../errors/ports";
import type { Role } from "../../user/entities/User";

/**
 * Resource types that support access control
 */
export type ResourceType =
  | "trip"
  | "group"
  | "challenge"
  | "user"
  | "activity"
  | "notification"
  | "reward"
  | "sponsor"
  | "coin"
  | "challengeSubmission";

/**
 * Permission levels for access control
 */
export type PermissionLevel = "read" | "write" | "admin";

/**
 * TripRole - Role of a user within a specific trip
 * Used in tripRoles map to track user's permissions per trip
 */
export type TripRole = "MEMBER" | "LEADER";

/**
 * Creates a safe, loggable version of AccessCheckRequest.
 * All fields are safe to log since no token is present.
 *
 * @param request - The original AccessCheckRequest
 * @returns Sanitized object safe for logging
 */
export const sanitizeAccessCheckRequest = (
  request: AccessCheckRequest,
): AccessCheckRequest => ({
  ...request,
});

/**
 * Creates a summary string for logging.
 * All fields are safe to log since AuthContext data is used instead of token.
 *
 * @param request - The AccessCheckRequest to summarize
 * @returns Safe string representation for logging
 */
export const accessCheckRequestToString = (
  request: AccessCheckRequest,
): string => {
  return `AccessCheckRequest{userId:${request.userId}, role:${request.role}, resourceType:${request.resourceType}, resourceId:${request.resourceId}, requiredPermission:${request.requiredPermission}${request.requireOwnership !== undefined ? ", requireOwnership:" + request.requireOwnership : ""}}`;
};

/**
 * Request to verify access to a resource
 *
 * Uses AuthContext data (userId, role, tripRoles) instead of raw token
 * for clean separation between AuthN (authentication) and AuthZ (authorization).
 * The token validation is assumed to be done before AuthContext is created.
 *
 * SECURITY: All fields are safe to log (no token present).
 */
export interface AccessCheckRequest {
  /** User ID from AuthContext (already authenticated) */
  userId: string;

  /** User's global role from AuthContext */
  role: Role;

  /** Map of tripId to user's role within that trip from AuthContext */
  tripRoles: Record<string, TripRole>;

  /** Type of resource being accessed */
  resourceType: ResourceType;

  /** Unique identifier of the resource */
  resourceId: string;

  /** Required permission level for the operation */
  requiredPermission: PermissionLevel;

  /** Whether to require resource ownership (user must be owner/creator) */
  requireOwnership?: boolean;
}

/**
 * Interface for authentication operations
 *
 * This interface defines the contract for authentication and authorization
 * operations. It can be implemented by Supabase Auth, Better Auth, or other
 * authentication providers.
 *
 * PERFORMANCE TARGET: < 50ms for local operations (excluding external auth service calls)
 */
export interface IAuthPort {
  /** Sign in with email and password */
  signInWithPassword(
    email: string,
    password: string,
  ): Effect.Effect<
    { user: { id: string; email: string }; session: { accessToken: string } },
    IPortError,
    never
  >;

  /** Sign in with OTP code (magic link/one-time password) */
  signInWithOtp(
    email: string,
    otp: string,
  ): Effect.Effect<
    { user: { id: string; email: string }; session: { accessToken: string } },
    IPortError,
    never
  >;

  /**
   * Send a sign-in OTP (one-time password) to the user's email
   *
   * This method initiates the OTP-based authentication flow by sending
   * a verification code to the specified email address. The user can
   * then use this code with `signInWithOtp` to complete authentication.
   *
   * @param email - The email address to send the OTP to
   * @returns Effect that succeeds when OTP is sent, fails with IPortError otherwise
   */
  sendSignInOtp(email: string): Effect.Effect<void, IPortError, never>;

  /** Sign up with email and password */
  signUp(
    email: string,
    password: string,
  ): Effect.Effect<
    { user: { id: string; email: string } | null },
    IPortError,
    never
  >;

  /** Sign out the current user */
  signOut(): Effect.Effect<void, IPortError, never>;

  /** Get the current session */
  getSession(): Effect.Effect<
    { user: { id: string; email: string } | null; accessToken: string | null },
    IPortError,
    never
  >;

  /** Refresh the current session */
  refreshSession(): Effect.Effect<
    { session: { accessToken: string } | null },
    IPortError,
    never
  >;

  /**
   * Verify access to a resource
   *
   * Validates the user's role and checks if they have the required permissions
   * for the specified resource. Uses AuthContext data (userId, role, tripRoles)
   * which assumes authentication has already been performed.
   *
   * PERFORMANCE TARGET: < 50ms for local operations (excluding external auth service calls)
   *
   * @param request - Access check request containing AuthContext data (userId, role, tripRoles),
   *                   resource info, and required permissions
   * @returns Effect that succeeds if access is granted, fails with IPortError otherwise
   */
  verifyAccess(
    request: AccessCheckRequest,
  ): Effect.Effect<void, IPortError, never>;
}

/**
 * Input for creating a signed upload URL
 */
export interface CreateSignedUploadUrlInput {
  bucket: string;
  path: string;
  upsert: boolean;
  expiresInSeconds: number;
}

/**
 * Result of creating a signed upload URL
 */
export interface CreateSignedUploadUrlResult {
  token: string;
  uploadUrl: string;
  expiresIn: number;
}

/**
 * Input for creating a signed download URL
 */
export interface CreateSignedDownloadUrlInput {
  bucket: string;
  path: string;
  expiresInSeconds: number;
}

/**
 * Result of creating a signed download URL
 */
export interface CreateSignedDownloadUrlResult {
  signedUrl: string;
}

/**
 * Interface for storage operations via Supabase Storage
 */
export interface IStoragePort {
  /** Upload a file to storage */
  upload(
    bucket: string,
    path: string,
    file: File | Blob,
  ): Effect.Effect<
    { path: string; publicUrl: string | null },
    IPortError,
    never
  >;

  /** Download a file from storage */
  download(
    bucket: string,
    path: string,
  ): Effect.Effect<Blob, IPortError, never>;

  /** Get a public URL for a file */
  getPublicUrl(bucket: string, path: string): string;

  /** Delete a file from storage */
  delete(bucket: string, path: string): Effect.Effect<void, IPortError, never>;

  /** List files in a bucket */
  list(
    bucket: string,
    path?: string,
  ): Effect.Effect<string[], IPortError, never>;

  /** Create a signed upload URL for resumable uploads */
  createSignedUploadUrl(
    input: CreateSignedUploadUrlInput,
  ): Effect.Effect<CreateSignedUploadUrlResult, IPortError, never>;

  /** Create a signed download URL for temporary access */
  createSignedDownloadUrl(
    input: CreateSignedDownloadUrlInput,
  ): Effect.Effect<CreateSignedDownloadUrlResult, IPortError, never>;
}

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
 * Interface for interacting with the external authentication service (Supabase Auth)
 */
export interface IAuthServicePort {
  getCurrentUserBanStatus(
    accessToken: string,
  ): Effect.Effect<BanStatus, IPortError, never>;
  getBanStatusByEmail(email: string): Effect.Effect<
    {
      exists: boolean;
    } & BanStatus,
    IPortError,
    never
  >;
  getUserInfoByAuthId(
    authUserId: string,
  ): Effect.Effect<AuthUserInfo | null, IPortError, never>;
  getUserInfosByAuthIds(
    authUserIds: string[],
  ): Effect.Effect<Map<string, AuthUserInfo>, IPortError, never>;
  createAuthUser(params: {
    email: string;
    firstName: string;
    lastName: string;
  }): Effect.Effect<{ id: string; email: string }, IPortError, never>;
  deleteAuthUser(authUserId: string): Effect.Effect<void, IPortError, never>;
  banUser(params: {
    authUserId: string;
    bannedUntilMs: number;
    reason?: string;
  }): Effect.Effect<{ bannedUntil: string }, IPortError, never>;
}

/**
 * Valid storage buckets
 */
export type StorageBucket = "images" | "files" | "files-public" | "avatar";

/**
 * Result of resolving a storage path
 */
export interface ResolvedStoragePath {
  bucket: StorageBucket;
  path: string;
  storagePath: string;
}

/**
 * Storage Path Resolver Port
 * Parses and validates storage path references
 */
export interface IStoragePathResolverPort {
  resolvePath(
    storagePath: string,
  ): Effect.Effect<ResolvedStoragePath, never, never>;
}

// ThrottleService exports
export {
  makeThrottleService,
  type Coordinates,
} from "./ThrottleService";
