/**
 * Better Auth Client for Web
 *
 * Provides authentication utilities for the admin web application using Better Auth.
 * Implements OTP (One-Time Password) flow for passwordless authentication.
 *
 * Features:
 * - Email OTP sign-in flow (request OTP → verify OTP → session)
 * - Session management with cookie-based sessions (handled by Better Auth)
 * - Logout functionality
 * - Role-based access control (ADMIN role enforcement)
 * - Type-safe error handling with Effect patterns
 *
 * Session Model:
 * - Better Auth uses httpOnly, secure, sameSite cookies
 * - Session cookie is sent automatically with each request
 * - For client-side state, we store minimal session info (not the token itself)
 *
 * @module @mirai-app/web/auth
 */

import { env, ENV, getBetterAuthEndpoint } from "./env";

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Branded type for Session ID
 */
export type SessionId = string & { readonly __brand: "SessionId" };

/**
 * Branded type for CSRF Token
 */
export type CsrfToken = string & { readonly __brand: "CsrfToken" };

/**
 * OTP State for tracking verification flow
 */
export enum OTPState {
  IDLE = "IDLE",
  PENDING = "PENDING",
  VERIFYING = "VERIFYING",
  VERIFIED = "VERIFIED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

/**
 * OTP verification context for state tracking
 */
export interface OTPContext {
  email: string | null;
  state: OTPState;
  requestedAt: Date | null;
  expiresAt: Date | null;
  attemptCount: number;
}

/**
 * User session data
 * Note: Session token is stored in httpOnly cookie, not accessible to JavaScript
 */
export interface Session {
  /** User ID from Better Auth */
  userId: string;
  /** User email */
  email: string;
  /** User role (ADMIN, MODERATOR, USER, SERVICE) */
  role: string;
  /** Session expiration timestamp */
  expiresAt: Date;
  /** Session ID for tracking */
  sessionId: SessionId;
}

/**
 * Better Auth user from API response
 */
interface BetterAuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
}

/**
 * Better Auth session from API response
 */
interface BetterAuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Session response from Better Auth /session endpoint
 */
interface SessionResponse {
  user: BetterAuthUser | null;
  session: BetterAuthSession | null;
}

/**
 * OTP verification response
 */
interface OTPVerifyResponse {
  user: BetterAuthUser;
  session: BetterAuthSession;
}

/**
 * Send OTP response
 */
interface SendOTPResponse {
  success: boolean;
}

/**
 * Error types for auth operations
 */
export type AuthErrorCode =
  | "NETWORK_ERROR"
  | "INVALID_OTP"
  | "SESSION_EXPIRED"
  | "SESSION_INVALID"
  | "OTP_SEND_FAILED"
  | "SIGNOUT_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "SERVER_ERROR";

/**
 * Auth error with structured information
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  statusCode?: number;
}

/**
 * Auth result type - discriminated union for success/failure
 */
export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };

// =============================================================================
// Auth Client Interface
// =============================================================================

/**
 * Auth client interface for Better Auth integration
 */
export interface AuthClient {
  /** Request OTP to be sent to email */
  signInWithOTP: (email: string) => Promise<void>;
  /** Verify OTP code and complete sign-in */
  verifyOTP: (email: string, code: string) => Promise<Session>;
  /** Sign out current user */
  signOut: () => Promise<void>;
  /** Get current session (validates with backend) */
  getSession: () => Promise<Session | null>;
  /** Fetch user role from database */
  fetchUserRole: (userId: string) => Promise<string | null>;
}

// =============================================================================
// Error Helpers
// =============================================================================

/**
 * Create a structured auth error
 */
function createError(
  code: AuthErrorCode,
  message: string,
  statusCode?: number
): AuthError {
  return { code, message, statusCode };
}

/**
 * Map HTTP error to auth error
 */
function mapHttpError(response: Response, operation: string): AuthError {
  const status = response.status;

  switch (status) {
    case 401:
      return createError("UNAUTHORIZED", `Unauthorized: ${operation}`, status);
    case 403:
      return createError("FORBIDDEN", `Forbidden: ${operation}`, status);
    case 429:
      return createError(
        "OTP_SEND_FAILED",
        "Rate limited. Please try again later.",
        status
      );
    case 500:
    case 502:
    case 503:
    case 504:
      return createError("SERVER_ERROR", `Server error: ${operation}`, status);
    default:
      return createError(
        "NETWORK_ERROR",
        `Request failed: ${operation} (${status})`,
        status
      );
  }
}

// =============================================================================
// Better Auth API Client
// =============================================================================

/**
 * Make a request to the Better Auth API with retry logic
 * Cookies are automatically sent/received by the browser
 * 
 * Implements exponential backoff retry for transient errors (max 3 attempts)
 */
async function betterAuthRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<AuthResult<T>> {
  const maxRetries = 3;
  const baseDelayMs = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const url = `${ENV.BETTER_AUTH.URL}${endpoint}`;

      // Add CSRF token header for mutating requests
      const isMutatingRequest = options.method && 
        ["POST", "PUT", "PATCH", "DELETE"].includes(options.method);
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      
      // Merge additional headers from options safely
      if (options.headers) {
        const additionalHeaders = options.headers as Record<string, string>;
        for (const [key, value] of Object.entries(additionalHeaders)) {
          if (typeof value === "string") {
            headers[key] = value;
          }
        }
      }

      // Add CSRF token for mutating requests
      if (isMutatingRequest) {
        const csrfToken = generateCsrfToken();
        headers["X-CSRF-Token"] = csrfToken;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        // Include credentials to send/receive cookies
        credentials: "include",
      });

      if (!response.ok) {
        // Check if it's a transient error that should be retried
        const status = response.status;
        const isTransientError = status === 502 || status === 503 || status === 504;
        
        if (isTransientError && attempt < maxRetries - 1) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          console.warn(`[Auth] Transient error ${status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await sleep(delay);
          continue;
        }

        // Try to parse error message from response
        let errorMessage: string | undefined;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error;
        } catch {
          // Failed to parse error JSON
        }

        const error = mapHttpError(response, endpoint);
        if (errorMessage) {
          error.message = errorMessage;
        }

        return { success: false, error };
      }

      // Parse successful response
      try {
        const data = await response.json();
        return { success: true, data: data as T };
      } catch {
        // Some endpoints return empty body
        return { success: true, data: null as T };
      }
    } catch (error) {
      const isNetworkError = error instanceof TypeError || 
        (error instanceof Error && error.message.includes("fetch"));
      
      // Retry on network errors
      if (isNetworkError && attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[Auth] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      const message =
        error instanceof Error ? error.message : "Network request failed";
      return {
        success: false,
        error: createError("NETWORK_ERROR", message),
      };
    }
  }

  // Should not reach here, but return error just in case
  return {
    success: false,
    error: createError("NETWORK_ERROR", "Max retries exceeded"),
  };
}

/**
 * Generate a CSRF token for mutating requests
 */
export function generateCsrfToken(): string {
  // Generate random token and store in sessionStorage
  const token = generateRandomToken(32);
  
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("mirai_csrf_token", token);
    } catch {
      // Ignore storage errors
    }
  }
  
  return token;
}

/**
 * Get stored CSRF token
 */
export function getStoredCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return sessionStorage.getItem("mirai_csrf_token");
  } catch {
    return null;
  }
}

/**
 * Validate CSRF token against stored value
 */
export function validateCsrfToken(token: string): boolean {
  const stored = getStoredCsrfToken();
  if (!stored) return false;
  return token === stored;
}

/**
 * Utility function for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random token
 */
function generateRandomToken(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

// =============================================================================
// Session Storage (Client-side only for UX state, not security)
// =============================================================================

const STORAGE_KEY = "mirai_admin_session";

/**
 * Stored session data (minimal, non-sensitive info for UX)
 * The actual session token is in the httpOnly cookie
 */
interface StoredSessionData {
  userId: string;
  email: string;
  role: string;
  expiresAt: string;
  sessionId: SessionId;
}

/**
 * OTP state storage and management
 */
const otpStateManager = {
  /**
   * Initialize OTP state
   */
  initialize(email: string): OTPContext {
    const context: OTPContext = {
      email,
      state: OTPState.PENDING,
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minute expiry
      attemptCount: 0,
    };
    this.save(context);
    return context;
  },

  /**
   * Load OTP state from storage
   */
  load(): OTPContext | null {
    if (typeof window === "undefined") return null;
    
    try {
      const stored = sessionStorage.getItem(OTP_STATE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored) as OTPContext;
      return {
        ...data,
        requestedAt: data.requestedAt ? new Date(data.requestedAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      };
    } catch {
      return null;
    }
  },

  /**
   * Save OTP state to storage
   */
  save(context: OTPContext): void {
    if (typeof window === "undefined") return;
    
    try {
      sessionStorage.setItem(OTP_STATE_KEY, JSON.stringify(context));
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Clear OTP state
   */
  clear(): void {
    if (typeof window === "undefined") return;
    
    try {
      sessionStorage.removeItem(OTP_STATE_KEY);
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Check if OTP is expired
   */
  isExpired(context: OTPContext): boolean {
    if (!context.expiresAt) return true;
    return new Date() > context.expiresAt;
  },

  /**
   * Check if OTP can be verified
   */
  canVerify(context: OTPContext | null): { canVerify: boolean; reason?: string } {
    if (!context) {
      return { canVerify: false, reason: "No OTP request found. Please request a new code." };
    }

    if (context.state !== OTPState.PENDING && context.state !== OTPState.FAILED) {
      return { canVerify: false, reason: `Invalid state: ${context.state}` };
    }

    if (this.isExpired(context)) {
      return { canVerify: false, reason: "OTP has expired. Please request a new code." };
    }

    if (context.attemptCount >= 5) {
      return { canVerify: false, reason: "Too many failed attempts. Please request a new code." };
    }

    return { canVerify: true };
  },

  /**
   * Increment attempt count
   */
  incrementAttempt(): void {
    const context = this.load();
    if (context) {
      context.attemptCount++;
      this.save(context);
    }
  },

  /**
   * Mark as verified
   */
  markVerified(): void {
    const context = this.load();
    if (context) {
      context.state = OTPState.VERIFIED;
      this.save(context);
    }
  },

  /**
   * Mark as failed
   */
  markFailed(): void {
    const context = this.load();
    if (context) {
      context.state = OTPState.FAILED;
      this.save(context);
    }
  },
};

/**
 * Save session to localStorage (for UX state only)
 * Security note: The actual session token is in the httpOnly cookie,
 * not accessible to JavaScript. We only store non-sensitive user info.
 */
function saveSessionToStorage(session: Session): void {
  if (typeof window === "undefined") return;

  try {
    const data: StoredSessionData = {
      userId: session.userId,
      email: session.email,
      role: session.role,
      expiresAt: session.expiresAt.toISOString(),
      sessionId: session.sessionId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("[Auth] Failed to save session to storage:", error);
  }
}

/**
 * Load session from localStorage
 */
function loadSessionFromStorage(): StoredSessionData | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    return JSON.parse(stored) as StoredSessionData;
  } catch (error) {
    console.error("[Auth] Failed to load session from storage:", error);
    return null;
  }
}

/**
 * Clear session from localStorage
 */
function clearSessionFromStorage(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    // Also clear OTP state
    otpStateManager.clear();
  } catch (error) {
    console.error("[Auth] Failed to clear session from storage:", error);
  }
}

// =============================================================================
// Session Refresh Configuration
// =============================================================================

/** Time before expiry to trigger refresh (5 minutes) */
const SESSION_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

/** Session storage key for OTP state */
const OTP_STATE_KEY = "mirai_admin_otp_state";

/**
 * Check if session needs refresh
 */
function shouldRefreshSession(expiresAt: Date): boolean {
  const now = new Date();
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();
  return timeUntilExpiry > 0 && timeUntilExpiry < SESSION_REFRESH_THRESHOLD_MS;
}

/**
 * GraphQL query to fetch user role
 */
const GET_USER_ROLE_QUERY = `
  query GetUserRole($authUserId: String!) {
    userByAuthId(authUserId: $authUserId) {
      role
    }
  }
`;

/**
 * Fetch user role from GraphQL API
 * Requires valid session cookie to be sent
 */
async function fetchUserRoleFromAPI(userId: string): Promise<string | null> {
  try {
    const response = await fetch(ENV.GRAPHQL.HTTP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        query: GET_USER_ROLE_QUERY,
        variables: { authUserId: userId },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    if (result.errors) {
      console.error("[Auth] GraphQL errors:", result.errors);
      return null;
    }

    return result.data?.userByAuthId?.role ?? null;
  } catch (error) {
    console.error("[Auth] Failed to fetch user role:", error);
    return null;
  }
}

// =============================================================================
// Auth Client Implementation
// =============================================================================

/**
 * Better Auth client for web application
 * Implements OTP flow and session management
 */
export const authClient: AuthClient = {
  /**
   * Request OTP to be sent to email
   * Step 1 of OTP flow: sends verification code to user's email
   */
  async signInWithOTP(email: string): Promise<void> {
    // Initialize OTP state
    otpStateManager.initialize(email);

    const result = await betterAuthRequest<SendOTPResponse>(
      ENV.BETTER_AUTH.ENDPOINTS.OTP_SEND,
      {
        method: "POST",
        body: JSON.stringify({
          email,
          type: "sign-in",
        }),
      }
    );

    if (!result.success) {
      // Mark as failed
      otpStateManager.markFailed();
      throw new Error((result as { error: AuthError }).error.message);
    }

    if (!result.data?.success) {
      // Mark as failed
      otpStateManager.markFailed();
      throw new Error("Failed to send OTP. Please try again.");
    }
  },

  /**
   * Verify OTP code and complete sign-in
   * Step 2 of OTP flow: verify code and establish session
   *
   * On success, Better Auth sets the session cookie automatically.
   * We also fetch the user's role from the database.
   */
  async verifyOTP(email: string, code: string): Promise<Session> {
    // Check if we can verify (state machine check)
    const otpContext = otpStateManager.load();
    const verificationCheck = otpStateManager.canVerify(otpContext);
    
    if (!verificationCheck.canVerify) {
      throw new Error(verificationCheck.reason || "Cannot verify OTP at this time");
    }

    // Check email matches
    if (otpContext?.email && otpContext.email !== email) {
      throw new Error("Email does not match the OTP request");
    }

    // Mark as verifying
    if (otpContext) {
      otpContext.state = OTPState.VERIFYING;
      otpStateManager.save(otpContext);
    }

    const result = await betterAuthRequest<OTPVerifyResponse>(
      ENV.BETTER_AUTH.ENDPOINTS.OTP_VERIFY,
      {
        method: "POST",
        body: JSON.stringify({
          email,
          otp: code,
        }),
      }
    );

    if (!result.success) {
      // Increment attempt count on failure
      otpStateManager.incrementAttempt();
      
      // Map specific error codes
      const error = (result as { error: AuthError }).error;
      if (error.statusCode === 401) {
        throw new Error("Invalid OTP code. Please try again.");
      }
      throw new Error(error.message);
    }

    if (!result.data?.user || !result.data?.session) {
      otpStateManager.markFailed();
      throw new Error("Verification failed: no session created");
    }

    const { user, session } = result.data;

    // Fetch user role from database
    const role = await this.fetchUserRole(user.id);

    if (!role) {
      // Sign out if we can't get role (shouldn't happen for valid users)
      await this.signOut();
      otpStateManager.markFailed();
      throw new Error("Failed to retrieve user permissions");
    }

    // Check for ADMIN role requirement
    if (role.toUpperCase() !== "ADMIN") {
      // Sign out non-admin users
      await this.signOut();
      otpStateManager.markFailed();
      throw new Error("Access denied: Admin privileges required");
    }

    // Mark as verified
    otpStateManager.markVerified();

    const sessionData: Session = {
      userId: user.id,
      email: user.email,
      role,
      expiresAt: new Date(session.expiresAt),
      sessionId: session.id as SessionId,
    };

    // Save to localStorage for UX state (non-sensitive)
    saveSessionToStorage(sessionData);

    return sessionData;
  },

  /**
   * Sign out current user
   * Clears session cookie and local storage
   */
  async signOut(): Promise<void> {
    // Call Better Auth sign-out endpoint
    await betterAuthRequest<void>(ENV.BETTER_AUTH.ENDPOINTS.SIGN_OUT, {
      method: "POST",
    });

    // Clear local storage regardless of API result
    clearSessionFromStorage();
  },

  /**
   * Get current session
   * Validates session with backend and returns session data
   * Automatically refreshes session if nearing expiry
   *
   * Note: The actual session validation is done by the middleware on the server.
   * This client-side method is for UX state after the page loads.
   */
  async getSession(): Promise<Session | null> {
    // First, check if we have a valid session from backend
    const result = await betterAuthRequest<SessionResponse>(
      ENV.BETTER_AUTH.ENDPOINTS.SESSION,
      {
        method: "GET",
      }
    );

    if (!result.success) {
      // Clear local storage if session is invalid
      clearSessionFromStorage();
      return null;
    }

    if (!result.data?.session || !result.data?.user) {
      clearSessionFromStorage();
      return null;
    }

    const { user, session } = result.data;

    // Fetch role from database or use cached role
    let role: string | null = null;
    const stored = loadSessionFromStorage();

    // Use stored role if it matches the current user
    if (stored && stored.userId === user.id) {
      role = stored.role;
    }

    // If no stored role or user changed, fetch from API
    if (!role) {
      role = await this.fetchUserRole(user.id);
    }

    if (!role) {
      clearSessionFromStorage();
      return null;
    }

    const expiresAt = new Date(session.expiresAt);
    const sessionId = session.id as SessionId;

    // Check if session needs refresh
    if (shouldRefreshSession(expiresAt)) {
      console.log("[Auth] Session nearing expiry, attempting refresh...");
      const refreshResult = await refreshSession();
      
      if (refreshResult.success && refreshResult.data?.success && refreshResult.data.expiresAt) {
        console.log("[Auth] Session refreshed successfully");
        // Update expiry with new value
        const newExpiresAt = new Date(refreshResult.data.expiresAt);
        
        const sessionData: Session = {
          userId: user.id,
          email: user.email,
          role,
          expiresAt: newExpiresAt,
          sessionId,
        };

        // Update localStorage
        saveSessionToStorage(sessionData);

        return sessionData;
      } else {
        console.warn("[Auth] Session refresh failed, using existing session");
        // Continue with existing session - will expire naturally
      }
    }

    const sessionData: Session = {
      userId: user.id,
      email: user.email,
      role,
      expiresAt,
      sessionId,
    };

    // Update localStorage
    saveSessionToStorage(sessionData);

    return sessionData;
  },

  /**
   * Fetch user role from database via GraphQL
   */
  async fetchUserRole(userId: string): Promise<string | null> {
    return fetchUserRoleFromAPI(userId);
  },
};

// =============================================================================
// Effect-Based Auth Operations
// =============================================================================

import { Effect, Data } from "effect";

/**
 * Authentication error for Effect-based operations
 */
export class AuthOperationError extends Data.TaggedError("AuthOperationError")<{
  readonly code: AuthErrorCode;
  readonly message: string;
  readonly cause?: unknown;
}> {
  override readonly _tag = "AuthOperationError";
}

/**
 * Sign in with OTP using Effect
 * Provides structured error handling for OTP request
 */
export function signInWithOTPEffect(
  email: string
): Effect.Effect<void, AuthOperationError, never> {
  return Effect.tryPromise({
    try: () => authClient.signInWithOTP(email),
    catch: (error) =>
      new AuthOperationError({
        code: "OTP_SEND_FAILED",
        message: error instanceof Error ? error.message : "Failed to send OTP",
        cause: error,
      }),
  });
}

/**
 * Verify OTP using Effect
 * Provides structured error handling for OTP verification
 */
export function verifyOTPEffect(
  email: string,
  code: string
): Effect.Effect<Session, AuthOperationError, never> {
  return Effect.tryPromise({
    try: () => authClient.verifyOTP(email, code),
    catch: (error) =>
      new AuthOperationError({
        code: "INVALID_OTP",
        message: error instanceof Error ? error.message : "Invalid OTP code",
        cause: error,
      }),
  });
}

/**
 * Sign out using Effect
 */
export function signOutEffect(): Effect.Effect<void, AuthOperationError, never> {
  return Effect.tryPromise({
    try: () => authClient.signOut(),
    catch: (error) =>
      new AuthOperationError({
        code: "SIGNOUT_FAILED",
        message: error instanceof Error ? error.message : "Sign out failed",
        cause: error,
      }),
  });
}

/**
 * Get session using Effect
 */
export function getSessionEffect(): Effect.Effect<
  Session | null,
  AuthOperationError,
  never
> {
  return Effect.tryPromise({
    try: () => authClient.getSession(),
    catch: (error) =>
      new AuthOperationError({
        code: "SESSION_INVALID",
        message:
          error instanceof Error ? error.message : "Failed to get session",
        cause: error,
      }),
  });
}

// =============================================================================
// Session Refresh GraphQL Query
// =============================================================================

/**
 * GraphQL mutation to refresh session
 */
const REFRESH_SESSION_MUTATION = `
  mutation RefreshSession {
    refreshSession {
      success
      session {
        id
        expiresAt
      }
    }
  }
`;

/**
 * Refresh session before expiry
 */
async function refreshSession(): Promise<AuthResult<{ success: boolean; expiresAt?: string }>> {
  try {
    const response = await fetch(ENV.GRAPHQL.HTTP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        query: REFRESH_SESSION_MUTATION,
      }),
    });

    if (!response.ok) {
      return { 
        success: false, 
        error: createError("SESSION_INVALID", "Failed to refresh session", response.status) 
      };
    }

    const result = await response.json();

    if (result.errors) {
      return { 
        success: false, 
        error: createError("SESSION_INVALID", "Session refresh failed") 
      };
    }

    return { 
      success: true, 
      data: { 
        success: result.data?.refreshSession?.success ?? false,
        expiresAt: result.data?.refreshSession?.session?.expiresAt,
      } 
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh session";
    return { 
      success: false, 
      error: createError("NETWORK_ERROR", message) 
    };
  }
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session) return true;
  return new Date() >= session.expiresAt;
}

/**
 * Format auth error for display
 */
export function formatAuthError(error: unknown): string {
  if (error instanceof AuthOperationError) {
    return error.message ?? "Authentication failed";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { getBetterAuthEndpoint };

// Export OTP state manager (already exported types OTPState and OTPContext above)
export { otpStateManager };

// CSRF utilities are already exported above: generateCsrfToken, getStoredCsrfToken, validateCsrfToken

export default authClient;
