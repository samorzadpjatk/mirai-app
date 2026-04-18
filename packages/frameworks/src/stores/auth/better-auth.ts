/**
 * Better Auth Mobile Store
 *
 * React Native authentication store using expo-secure-store for session persistence.
 * Implements cookie jar pattern for Better Auth cookie-based session management.
 *
 * Features:
 * - SecureStore integration (iOS Keychain / Android Keystore)
 * - Cookie extraction and storage from HTTP responses
 * - Cookie restoration for HTTP requests
 * - Auto-persistence on session changes
 * - Session refresh with Better Auth client
 * - App lifecycle handling (background/foreground)
 *
 * @module @mirai-app/frameworks/stores/auth/better-auth
 */

import { createStore } from "zustand/vanilla";

// =============================================================================
// AppState Integration (React Native)
// =============================================================================

// AppState type for type safety
export type AppStateStatus = "active" | "inactive" | "background" | "unknown";

// AppState listener interface
interface AppStateEventListener {
  remove: () => void;
}

// Background session tracking
let lastBackgroundTime: number | null = null;
let appStateListener: AppStateEventListener | null = null;
const BACKGROUND_SESSION_CHECK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// SecureStore Integration (with fallback for testing/web environments)
// =============================================================================

// In-memory fallback for testing or when SecureStore is unavailable
const inMemoryStorage: Map<string, string> = new Map();

// SecureStore interface
interface SecureStoreInterface {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}

// Dynamic import with fallback
let SecureStore: SecureStoreInterface;
let isSecureStoreAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expoSecureStore = require("expo-secure-store");
  SecureStore = expoSecureStore;
  isSecureStoreAvailable = true;
} catch {
  // Fallback to in-memory storage for testing or web environments
  SecureStore = {
    getItemAsync: async (key: string) => inMemoryStorage.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => {
      inMemoryStorage.set(key, value);
    },
    deleteItemAsync: async (key: string) => {
      inMemoryStorage.delete(key);
    },
  };
  isSecureStoreAvailable = false;
}

/**
 * iOS Keychain accessibility options
 * Determines when the stored session is accessible on iOS devices
 */
export type KeychainAccessibility =
  | "afterFirstUnlock"  // Session accessible after first device unlock (default, recommended)
  | "whenUnlocked"    // Session only accessible when device is unlocked
  | "always";          // Session accessible even when device is locked (least secure)

/**
 * SecureStore configuration options
 */
export interface SecureStoreConfig {
  /** iOS Keychain accessibility level (default: 'afterFirstUnlock') */
  keychainAccessible?: KeychainAccessibility;
}

/** Default SecureStore configuration */
const DEFAULT_SECURE_STORE_CONFIG: SecureStoreConfig = {
  keychainAccessible: "afterFirstUnlock",
};

/**
 * Check if SecureStore is available (native environment)
 */
export function isSecureStorageAvailable(): boolean {
  return isSecureStoreAvailable;
}

// =============================================================================
// Constants
// =============================================================================

/** SecureStore key for session token */
const SESSION_TOKEN_KEY = "better_auth_session_token";

/** SecureStore key for cookie jar */
const COOKIE_JAR_KEY = "better_auth_cookie_jar";

/** SecureStore key for session metadata */
const SESSION_METADATA_KEY = "better_auth_session_metadata";

/** Maximum size per SecureStore entry (2KB) */
const SECURE_STORE_MAX_SIZE = 2048;

/** Session refresh interval (5 minutes before expiry) */
const SESSION_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// =============================================================================
// Error Types
// =============================================================================

/**
 * Structured error type for auth store operations
 * Replaces the weak string-based lastError with a structured format
 */
export interface AuthStoreError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Predefined error codes for auth operations
 */
export const AuthErrorCodes = {
  // Initialization errors
  NOT_INITIALIZED: "NOT_INITIALIZED",
  INITIALIZATION_FAILED: "INITIALIZATION_FAILED",

  // Authentication errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_INVALID: "SESSION_INVALID",
  OTP_INVALID: "OTP_INVALID",
  OTP_SEND_FAILED: "OTP_SEND_FAILED",
  SIGNUP_FAILED: "SIGNUP_FAILED",
  SIGNOUT_FAILED: "SIGNOUT_FAILED",

  // Session errors
  SESSION_REFRESH_FAILED: "SESSION_REFRESH_FAILED",
  NO_SESSION: "NO_SESSION",
  SESSION_STORAGE_FAILED: "SESSION_STORAGE_FAILED",
  SESSION_LOAD_FAILED: "SESSION_LOAD_FAILED",

  // Network/server errors
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  RATE_LIMITED: "RATE_LIMITED",

  // Unknown errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

/**
 * Create a structured auth error
 */
export function createAuthError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): AuthStoreError {
  return {
    code,
    message,
    details,
  };
}

// =============================================================================
// Return Types (Discriminated Unions)
// =============================================================================

/**
 * Success result type
 */
export interface AuthSuccessResult<T> {
  success: true;
  data: T;
}

/**
 * Error result type
 */
export interface AuthErrorResult {
  success: false;
  error: AuthStoreError;
}

/**
 * Auth operation result type (discriminated union)
 * Usage: AuthResult<UserData> = { success: true, data: {...} } | { success: false, error: {...} }
 */
export type AuthResult<T> = AuthSuccessResult<T> | AuthErrorResult;

/**
 * Sign in result data
 */
export interface SignInResultData {
  user: BetterAuthUser;
  session: BetterAuthSession;
}

/**
 * Sign up result data
 */
export interface SignUpResultData {
  user: BetterAuthUser;
}

/**
 * Session result data
 */
export interface SessionResultData {
  user: BetterAuthUser | null;
  session: BetterAuthSession | null;
}

// =============================================================================
// Types
// =============================================================================

/**
 * Better Auth session user
 */
export interface BetterAuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
}

/**
 * Better Auth session data
 */
export interface BetterAuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Stored session with metadata
 */
export interface StoredSession {
  user: BetterAuthUser;
  session: BetterAuthSession;
  expiresAt: number;
}

/**
 * Cookie jar entry
 */
export interface CookieJarEntry {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

/**
 * Cookie jar - stores cookies by domain
 */
export type CookieJar = Record<string, CookieJarEntry[]>;

/**
 * Auth state
 */
export interface BetterAuthState {
  user: BetterAuthUser | null;
  session: BetterAuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastError: AuthStoreError | null;
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
}

/**
 * OTP verification data
 */
export interface OtpVerificationData {
  email: string;
  otp: string;
}

/**
 * Better Auth API client configuration
 */
export interface BetterAuthClientConfig {
  baseURL: string;
  basePath?: string;
}

/**
 * Better Auth API client
 */
export interface BetterAuthClient {
  config: BetterAuthClientConfig;
  signIn: {
    email: (credentials: SignInCredentials) => Promise<{
      data: { user: BetterAuthUser; session: BetterAuthSession } | null;
      error: { message: string } | null;
    }>;
  };
  signUp: {
    email: (credentials: SignUpCredentials) => Promise<{
      data: { user: BetterAuthUser } | null;
      error: { message: string } | null;
    }>;
  };
  signOut: () => Promise<{ error: { message: string } | null }>;
  getSession: () => Promise<{
    data: { user: BetterAuthUser | null; session: BetterAuthSession | null } | null;
    error: { message: string } | null;
  }>;
  emailOtp: {
    sendVerificationOtp: (email: string, type: "sign-in" | "email-verification") => Promise<{
      data: { success: boolean } | null;
      error: { message: string } | null;
    }>;
    verifyEmail: (data: OtpVerificationData) => Promise<{
      data: { user: BetterAuthUser; session: BetterAuthSession } | null;
      error: { message: string } | null;
    }>;
  };
}

/**
 * Auth actions
 */
export interface BetterAuthActions {
  /** Initialize the store with a Better Auth client */
  initialize: (options: {
    client: BetterAuthClient;
    onUserFetch?: (authUserId: string) => Promise<BetterAuthUser | null>;
  }) => () => void;

  /** Sign in with email and password */
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<AuthResult<SignInResultData>>;

  /** Sign in with OTP */
  signInWithOtp: (
    email: string,
    otp: string,
  ) => Promise<AuthResult<SignInResultData>>;

  /** Send sign-in OTP */
  sendSignInOtp: (email: string) => Promise<AuthResult<void>>;

  /** Sign up with email and password */
  signUp: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<AuthResult<SignUpResultData>>;

  /** Sign out */
  signOut: () => Promise<AuthResult<void>>;

  /** Refresh the session */
  refreshSession: () => Promise<AuthResult<SignInResultData>>;

  /** Get current session from SecureStore */
  getSession: () => Promise<SessionResultData>;

  /** Set session manually (for external auth flows) */
  setSession: (session: {
    user: BetterAuthUser;
    session: BetterAuthSession;
  }) => Promise<AuthResult<void>>;

  /** Clear session from SecureStore */
  clearSession: () => Promise<void>;

  /** Set user manually */
  setUser: (user: BetterAuthUser | null) => void;

  /** Set loading state */
  setLoading: (isLoading: boolean) => void;

  /** Extract cookies from response headers */
  extractCookies: (headers: Headers) => Promise<void>;

  /** Get cookies for request headers */
  getCookiesForRequest: (url: string) => Promise<string>;
}

/**
 * Better Auth store type
 */
export type BetterAuthStore = BetterAuthState & BetterAuthActions;

// =============================================================================
// URL Parsing (with fallback for React Native edge cases)
// =============================================================================

/**
 * Safely parse a URL with fallback for React Native edge cases
 * @param url - URL string to parse
 * @returns Parsed URL object or null if parsing fails
 */
export function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    // Fallback for React Native edge cases with malformed URLs
    // Try to handle common issues like missing protocol
    try {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return new URL(`https://${url}`);
      }
    } catch {
      // Both attempts failed
    }
    return null;
  }
}

// =============================================================================
// Cookie Jar Operations
// =============================================================================

/**
 * Parse Set-Cookie header value into CookieJarEntry
 */
function parseSetCookie(cookieString: string, defaultDomain?: string): CookieJarEntry | null {
  const parts = cookieString.split(";").map((p) => p.trim());
  if (parts.length === 0) return null;

  const [nameValue, ...attributes] = parts;
  if (!nameValue) return null;

  const [name, value] = nameValue.split("=");

  if (!name || !value) return null;

  const entry: CookieJarEntry = {
    name: name.trim(),
    value: value.trim(),
    domain: defaultDomain,
    path: "/",
  };

  for (const attr of attributes) {
    const [attrName, attrValue] = attr.split("=").map((s) => s.trim().toLowerCase());

    switch (attrName) {
      case "domain":
        entry.domain = attrValue;
        break;
      case "path":
        entry.path = attrValue;
        break;
      case "expires":
        if (attrValue) {
          entry.expires = new Date(attrValue).getTime();
        }
        break;
      case "secure":
        entry.secure = true;
        break;
      case "httponly":
        entry.httpOnly = true;
        break;
      case "samesite":
        entry.sameSite = attrValue as "strict" | "lax" | "none";
        break;
    }
  }

  return entry;
}

/**
 * Extract cookies from HTTP response headers
 */
async function extractCookiesFromHeaders(headers: Headers): Promise<CookieJar> {
  const cookieJar: CookieJar = {};
  const setCookieHeaders = headers.getSetCookie ? headers.getSetCookie() : [];

  // Fallback for environments without getSetCookie
  if (setCookieHeaders.length === 0) {
    const setCookie = headers.get("set-cookie");
    if (setCookie) {
      setCookieHeaders.push(...setCookie.split(","));
    }
  }

  for (const cookieString of setCookieHeaders) {
    const entry = parseSetCookie(cookieString);
    if (entry?.domain) {
      const domain = entry.domain;
      if (!cookieJar[domain]) {
        cookieJar[domain] = [];
      }
      cookieJar[domain].push(entry);
    }
  }

  return cookieJar;
}

/**
 * Format cookies for Cookie header
 */
function formatCookiesForRequest(cookies: CookieJarEntry[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

/**
 * Get applicable cookies for a URL
 * Uses safeParseUrl for React Native compatibility
 */
function getApplicableCookies(cookieJar: CookieJar, url: string): CookieJarEntry[] {
  const urlObj = safeParseUrl(url);
  if (!urlObj) {
    console.error("[BetterAuthStore] Failed to parse URL:", url);
    return [];
  }

  const domain = urlObj.hostname;
  const path = urlObj.pathname;

  const allCookies: CookieJarEntry[] = [];

  for (const [cookieDomain, cookies] of Object.entries(cookieJar)) {
    // Check if cookie domain matches or is a parent domain
    if (domain === cookieDomain || domain.endsWith(`.${cookieDomain}`)) {
      for (const cookie of cookies) {
        // Check if cookie path matches
        if (path.startsWith(cookie.path || "/")) {
          // Check if cookie is not expired
          if (!cookie.expires || cookie.expires > Date.now()) {
            allCookies.push(cookie);
          }
        }
      }
    }
  }

  return allCookies;
}

// =============================================================================
// AppState Session Management
// =============================================================================

/**
 * Check if session needs refresh after returning from background
 */
function shouldRefreshAfterBackground(): boolean {
  if (!lastBackgroundTime) return false;

  const timeInBackground = Date.now() - lastBackgroundTime;
  return timeInBackground >= BACKGROUND_SESSION_CHECK_THRESHOLD_MS;
}

/**
 * Setup AppState listener for session refresh on foreground
 */
async function setupAppStateListener(
  refreshSessionFn: () => Promise<AuthResult<SignInResultData>>,
): Promise<void> {
  try {
    // Dynamic import of AppState to avoid issues in non-React Native environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reactNative = require("react-native") as { AppState: { addEventListener: (event: "change", callback: (status: string) => void) => AppStateEventListener } };
    const { AppState } = reactNative;

    appStateListener = AppState.addEventListener("change", (nextAppState: string) => {
      if (nextAppState === "active") {
        // App came to foreground
        if (shouldRefreshAfterBackground()) {
          console.log("[BetterAuthStore] App returned from extended background, refreshing session");
          void refreshSessionFn();
        }
        lastBackgroundTime = null;
      } else if (nextAppState === "background") {
        // App went to background
        lastBackgroundTime = Date.now();
      }
    });
  } catch {
    // AppState not available (non-React Native environment)
    console.log("[BetterAuthStore] AppState not available, skipping background/foreground handling");
  }
}

/**
 * Cleanup AppState listener
 */
function cleanupAppStateListener(): void {
  if (appStateListener) {
    appStateListener.remove();
    appStateListener = null;
  }
  lastBackgroundTime = null;
}

// =============================================================================
// SecureStore Operations
// =============================================================================

/**
 * Save session to SecureStore
 */
async function saveSessionToSecureStore(session: StoredSession): Promise<void> {
  try {
    const sessionJson = JSON.stringify(session);

    // Check size limit (2KB per entry)
    if (sessionJson.length > SECURE_STORE_MAX_SIZE) {
      // Store minimal data if session is too large
      const minimalSession: StoredSession = {
        user: {
          id: session.user.id,
          email: session.user.email,
          emailVerified: session.user.emailVerified,
        },
        session: {
          id: session.session.id,
          userId: session.session.userId,
          token: session.session.token,
          expiresAt: session.session.expiresAt,
        },
        expiresAt: session.expiresAt,
      };
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, JSON.stringify(minimalSession));
    } else {
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, sessionJson);
    }
  } catch (error) {
    console.error("[BetterAuthStore] Failed to save session:", error);
    throw new Error("Failed to save session to secure storage");
  }
}

/**
 * Load session from SecureStore
 */
async function loadSessionFromSecureStore(): Promise<StoredSession | null> {
  try {
    const sessionJson = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    if (!sessionJson) return null;

    const session = JSON.parse(sessionJson) as StoredSession;

    // Convert expiresAt back to Date object
    // When loaded from JSON, expiresAt is a string that needs reconstruction
    if (session.session && typeof session.session.expiresAt === "string") {
      const parsedDate = new Date(session.session.expiresAt);
      // Validate the date is valid before assignment
      if (!Number.isNaN(parsedDate.getTime())) {
        session.session.expiresAt = parsedDate;
      }
    }

    return session;
  } catch (error) {
    console.error("[BetterAuthStore] Failed to load session:", error);
    return null;
  }
}

/**
 * Clear session from SecureStore
 */
async function clearSessionFromSecureStore(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    await SecureStore.deleteItemAsync(COOKIE_JAR_KEY);
    await SecureStore.deleteItemAsync(SESSION_METADATA_KEY);
  } catch (error) {
    console.error("[BetterAuthStore] Failed to clear session:", error);
    throw new Error("Failed to clear session from secure storage");
  }
}

/**
 * Save cookie jar to SecureStore
 */
async function saveCookieJarToSecureStore(cookieJar: CookieJar): Promise<void> {
  try {
    const cookieJarJson = JSON.stringify(cookieJar);
    await SecureStore.setItemAsync(COOKIE_JAR_KEY, cookieJarJson);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[BetterAuthStore] Failed to save cookie jar:", error);
    throw new Error(`Failed to save cookie jar to secure storage: ${message}`);
  }
}

/**
 * Load cookie jar from SecureStore
 */
async function loadCookieJarFromSecureStore(): Promise<CookieJar> {
  try {
    const cookieJarJson = await SecureStore.getItemAsync(COOKIE_JAR_KEY);
    if (!cookieJarJson) return {};

    return JSON.parse(cookieJarJson) as CookieJar;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[BetterAuthStore] Failed to load cookie jar:", error);
    throw new Error(`Failed to load cookie jar from secure storage: ${message}`);
  }
}

// =============================================================================
// Store Implementation
// =============================================================================

/**
 * Internal state not exposed in the store type but used within actions.
 */
let _betterAuthClient: BetterAuthClient | null = null;
let _onUserFetch:
  | ((authUserId: string) => Promise<BetterAuthUser | null>)
  | undefined;
let _currentCookieJar: CookieJar = {};

/**
 * Fetch and set user from external source
 */
const fetchAndSetUser = async (
  authUserId: string,
  set: (partial: Partial<BetterAuthState>) => void,
) => {
  if (!_onUserFetch) {
    set({ isLoading: false });
    return;
  }

  set({ isLoading: true });
  try {
    const user = await _onUserFetch(authUserId);
    set({ user, isAuthenticated: !!user, isLoading: false });
  } catch {
    set({ isLoading: false });
  }
};

/**
 * Better Auth store implementation
 */
export const betterAuthStore = createStore<BetterAuthStore>()((set, _get) => ({
  // State
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  lastError: null,

  // Actions
  initialize: ({ client, onUserFetch }) => {
    _betterAuthClient = client;
    _onUserFetch = onUserFetch;

    // Load session from SecureStore on init
    void (async () => {
      try {
        const storedSession = await loadSessionFromSecureStore();
        try {
          _currentCookieJar = await loadCookieJarFromSecureStore();
        } catch (error) {
          console.error("[BetterAuthStore] Failed to load cookie jar on init:", error);
          _currentCookieJar = {};
        }

        if (storedSession) {
          // Check if session is expired
          if (storedSession.expiresAt > Date.now()) {
            set({
              user: storedSession.user,
              session: storedSession.session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Session expired, try to refresh
            set({ isLoading: true });
            try {
              const { data, error } = await client.getSession();
              if (error || !data?.session) {
                await clearSessionFromSecureStore();
                set({
                  user: null,
                  session: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              } else {
                const newSession: StoredSession = {
                  user: data.user!,
                  session: data.session,
                  expiresAt: new Date(data.session.expiresAt).getTime(),
                };
                await saveSessionToSecureStore(newSession);
                set({
                  user: data.user,
                  session: data.session,
                  isAuthenticated: true,
                  isLoading: false,
                });
              }
            } catch {
              await clearSessionFromSecureStore();
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }
        } else {
          // No stored session, try to get from client
          try {
            const { data, error } = await client.getSession();
            if (!error && data?.session && data?.user) {
              const session: StoredSession = {
                user: data.user,
                session: data.session,
                expiresAt: new Date(data.session.expiresAt).getTime(),
              };
              await saveSessionToSecureStore(session);
              set({
                user: data.user,
                session: data.session,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              set({ isLoading: false });
            }
          } catch {
            set({ isLoading: false });
          }
        }
      } catch {
        set({ isLoading: false });
      }
    })();

    // Setup AppState listener for background/foreground handling
    void setupAppStateListener(() => _get().refreshSession());

    // Return cleanup function
    return () => {
      _betterAuthClient = null;
      _onUserFetch = undefined;
      cleanupAppStateListener();
    };
  },

  signInWithPassword: async (email, password) => {
    if (!_betterAuthClient) {
      const error = createAuthError(
        AuthErrorCodes.NOT_INITIALIZED,
        "BetterAuthStore not initialized. Call initialize() first.",
      );
      set({ lastError: error });
      return { success: false, error };
    }

    set({ isLoading: true, lastError: null });

    try {
      const { data, error } = await _betterAuthClient.signIn.email({ email, password });

      if (error) {
        const authError = createAuthError(
          AuthErrorCodes.INVALID_CREDENTIALS,
          error.message,
          { email },
        );
        set({ isLoading: false, lastError: authError });
        return { success: false, error: authError };
      }

      if (!data?.user || !data?.session) {
        const authError = createAuthError(
          AuthErrorCodes.SESSION_INVALID,
          "Sign in failed: no user or session returned",
          { email },
        );
        set({ isLoading: false, lastError: authError });
        return { success: false, error: authError };
      }

      // Save session to SecureStore
      const session: StoredSession = {
        user: data.user,
        session: data.session,
        expiresAt: new Date(data.session.expiresAt).getTime(),
      };
      await saveSessionToSecureStore(session);

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: true,
        isLoading: false,
      });

      // Fetch full user data if callback provided
      if (_onUserFetch) {
        await fetchAndSetUser(data.user.id, set);
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      const authError = createAuthError(AuthErrorCodes.UNKNOWN_ERROR, message, { email });
      set({ isLoading: false, lastError: authError });
      return { success: false, error: authError };
    }
  },

  signInWithOtp: async (email, otp) => {
    if (!_betterAuthClient) {
      const error = createAuthError(
        AuthErrorCodes.NOT_INITIALIZED,
        "BetterAuthStore not initialized. Call initialize() first.",
      );
      set({ lastError: error });
      return { success: false, error };
    }

    set({ isLoading: true, lastError: null });

    try {
      const { data, error } = await _betterAuthClient.emailOtp.verifyEmail({ email, otp });

      if (error) {
        const authError = createAuthError(AuthErrorCodes.OTP_INVALID, error.message, {
          email,
        });
        set({ isLoading: false, lastError: authError });
        return { success: false, error: authError };
      }

      if (!data?.user || !data?.session) {
        const authError = createAuthError(
          AuthErrorCodes.SESSION_INVALID,
          "OTP verification failed: no user or session returned",
          { email },
        );
        set({ isLoading: false, lastError: authError });
        return { success: false, error: authError };
      }

      // Save session to SecureStore
      const session: StoredSession = {
        user: data.user,
        session: data.session,
        expiresAt: new Date(data.session.expiresAt).getTime(),
      };
      await saveSessionToSecureStore(session);

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: true,
        isLoading: false,
      });

      // Fetch full user data if callback provided
      if (_onUserFetch) {
        await fetchAndSetUser(data.user.id, set);
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "OTP verification failed";
      const authError = createAuthError(AuthErrorCodes.UNKNOWN_ERROR, message, { email });
      set({ isLoading: false, lastError: authError });
      return { success: false, error: authError };
    }
  },

  sendSignInOtp: async (email) => {
    if (!_betterAuthClient) {
      const error = createAuthError(
        AuthErrorCodes.NOT_INITIALIZED,
        "BetterAuthStore not initialized. Call initialize() first.",
      );
      set({ lastError: error });
      return { success: false, error };
    }

    set({ isLoading: true, lastError: null });

    try {
      const { error } = await _betterAuthClient.emailOtp.sendVerificationOtp(email, "sign-in");

      if (error) {
        const authError = createAuthError(AuthErrorCodes.OTP_SEND_FAILED, error.message, {
          email,
        });
        set({ isLoading: false, lastError: authError });
        return { success: false, error: authError };
      }

      set({ isLoading: false });
      return { success: true, data: undefined };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send OTP";
      const authError = createAuthError(AuthErrorCodes.UNKNOWN_ERROR, message, { email });
      set({ isLoading: false, lastError: authError });
      return { success: false, error: authError };
    }
  },

  signUp: async (email, password, name) => {
    if (!_betterAuthClient) {
      const error = createAuthError(
        AuthErrorCodes.NOT_INITIALIZED,
        "BetterAuthStore not initialized. Call initialize() first.",
      );
      set({ lastError: error });
      return { success: false, error };
    }

    set({ isLoading: true, lastError: null });

    try {
      const { data, error } = await _betterAuthClient.signUp.email({ email, password, name });

      if (error) {
        const authError = createAuthError(AuthErrorCodes.SIGNUP_FAILED, error.message, {
          email,
        });
        set({ isLoading: false, lastError: authError });
        return { success: false, error: authError };
      }

      set({ isLoading: false });

      // Note: Better Auth may require email verification before sign-in
      // The session might not be returned immediately after sign-up
      return {
        success: true,
        data: {
          user: data?.user ?? { id: "", email, emailVerified: false, name },
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign up failed";
      const authError = createAuthError(AuthErrorCodes.UNKNOWN_ERROR, message, { email });
      set({ isLoading: false, lastError: authError });
      return { success: false, error: authError };
    }
  },

  signOut: async () => {
    if (!_betterAuthClient) {
      const error = createAuthError(
        AuthErrorCodes.NOT_INITIALIZED,
        "BetterAuthStore not initialized. Call initialize() first.",
      );
      set({ lastError: error });
      return { success: false, error };
    }

    set({ isLoading: true });

    try {
      const { error } = await _betterAuthClient.signOut();

      if (error) {
        console.error("[BetterAuthStore] Sign out error:", error.message);
      }

      // Clear session regardless of API result
      await clearSessionFromSecureStore();
      _currentCookieJar = {};

      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });

      return { success: true, data: undefined };
    } catch (error) {
      // Still clear local session even if API call fails
      await clearSessionFromSecureStore();
      _currentCookieJar = {};

      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });

      const message = error instanceof Error ? error.message : "Sign out failed";
      const authError = createAuthError(AuthErrorCodes.SIGNOUT_FAILED, message);
      return { success: false, error: authError };
    }
  },

  refreshSession: async () => {
    if (!_betterAuthClient) {
      const error = createAuthError(
        AuthErrorCodes.NOT_INITIALIZED,
        "BetterAuthStore not initialized. Call initialize() first.",
      );
      return { success: false, error };
    }

    const currentSession = _get().session;
    if (!currentSession) {
      const error = createAuthError(
        AuthErrorCodes.NO_SESSION,
        "No session to refresh",
      );
      return { success: false, error };
    }

    // Check if refresh is needed (within threshold of expiry)
    const expiresAt = new Date(currentSession.expiresAt).getTime();
    const shouldRefresh = expiresAt - Date.now() < SESSION_REFRESH_THRESHOLD_MS;

    if (!shouldRefresh) {
      // Session still fresh, return current
      return {
        success: true,
        data: {
          user: _get().user!,
          session: currentSession,
        },
      };
    }

    set({ isLoading: true });

    try {
      const { data, error } = await _betterAuthClient.getSession();

      if (error || !data?.session) {
        // Session expired or invalid, clear it
        await clearSessionFromSecureStore();
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
        const authError = createAuthError(
          AuthErrorCodes.SESSION_EXPIRED,
          error?.message || "Session expired",
        );
        return { success: false, error: authError };
      }

      // Update session
      const newSession: StoredSession = {
        user: data.user!,
        session: data.session,
        expiresAt: new Date(data.session.expiresAt).getTime(),
      };
      await saveSessionToSecureStore(newSession);

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: true,
        isLoading: false,
      });

      return {
        success: true,
        data: {
          user: data.user!,
          session: data.session,
        },
      };
    } catch (error) {
      set({ isLoading: false });
      const message = error instanceof Error ? error.message : "Session refresh failed";
      const authError = createAuthError(AuthErrorCodes.SESSION_REFRESH_FAILED, message);
      return { success: false, error: authError };
    }
  },

  getSession: async () => {
    const storedSession = await loadSessionFromSecureStore();

    if (!storedSession) {
      return { user: null, session: null };
    }

    // Check if session is expired
    if (storedSession.expiresAt <= Date.now()) {
      await clearSessionFromSecureStore();
      return { user: null, session: null };
    }

    return {
      user: storedSession.user,
      session: storedSession.session,
    };
  },

  setSession: async (sessionData) => {
    try {
      const session: StoredSession = {
        user: sessionData.user,
        session: sessionData.session,
        expiresAt: new Date(sessionData.session.expiresAt).getTime(),
      };

      await saveSessionToSecureStore(session);

      set({
        user: sessionData.user,
        session: sessionData.session,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, data: undefined };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to set session";
      const authError = createAuthError(AuthErrorCodes.SESSION_STORAGE_FAILED, message);
      set({ lastError: authError });
      return { success: false, error: authError };
    }
  },

  clearSession: async () => {
    await clearSessionFromSecureStore();
    _currentCookieJar = {};

    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (isLoading) => set({ isLoading }),

  extractCookies: async (headers) => {
    try {
      const newCookies = await extractCookiesFromHeaders(headers);

      // Merge with existing cookie jar - properly merge arrays for each domain
      const mergedCookieJar: CookieJar = { ..._currentCookieJar };
      for (const [domain, cookies] of Object.entries(newCookies)) {
        if (mergedCookieJar[domain]) {
          // Merge cookies, replacing existing cookies with same name
          const existingNames = new Set(mergedCookieJar[domain].map((c) => c.name));
          const newCookiesToAdd = cookies.filter((c) => !existingNames.has(c.name));
          const updatedExisting = mergedCookieJar[domain].map((existing) => {
            const replacement = cookies.find((c) => c.name === existing.name);
            return replacement || existing;
          });
          mergedCookieJar[domain] = [...updatedExisting, ...newCookiesToAdd];
        } else {
          mergedCookieJar[domain] = cookies;
        }
      }
      _currentCookieJar = mergedCookieJar;

      // Save to SecureStore
      await saveCookieJarToSecureStore(_currentCookieJar);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to extract cookies";
      console.error("[BetterAuthStore] Failed to extract and save cookies:", error);
      set({
        lastError: createAuthError(AuthErrorCodes.SESSION_STORAGE_FAILED, message),
      });
    }
  },

  getCookiesForRequest: async (url) => {
    try {
      _currentCookieJar = await loadCookieJarFromSecureStore();
      const cookies = getApplicableCookies(_currentCookieJar, url);
      return formatCookiesForRequest(cookies);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get cookies for request";
      console.error("[BetterAuthStore] Failed to get cookies for request:", error);
      // Return empty cookies on error - this is a graceful degradation
      return "";
    }
  },
}));

// =============================================================================
// Utility Exports
// =============================================================================

/**
 * Check if session needs refresh
 */
export function shouldRefreshSession(session: BetterAuthSession): boolean {
  const expiresAt = new Date(session.expiresAt).getTime();
  return expiresAt - Date.now() < SESSION_REFRESH_THRESHOLD_MS;
}

/**
 * Get session expiry status
 */
export function getSessionExpiryStatus(session: BetterAuthSession): {
  isExpired: boolean;
  expiresInMs: number;
} {
  const expiresAt = new Date(session.expiresAt).getTime();
  const expiresInMs = expiresAt - Date.now();
  return {
    isExpired: expiresInMs <= 0,
    expiresInMs,
  };
}

// =============================================================================
// Test Utilities (Internal - not for production use)
// =============================================================================

/**
 * Reset internal state for testing purposes only.
 * This function should only be called in tests.
 * @internal
 */
export function __resetInternalState(): void {
  _betterAuthClient = null;
  _onUserFetch = undefined;
  _currentCookieJar = {};
  cleanupAppStateListener();
  lastBackgroundTime = null;
}
