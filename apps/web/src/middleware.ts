/// <reference types="astro/client" />

declare module "astro" {
  interface Locals {
    user?: {
      id: string;
      email: string;
      role: string;
      sessionId: string;
    };
    csrfToken?: string;
  }
}

/**
 * Astro Middleware for Authentication and Authorization
 *
 * Protects all admin routes with Better Auth session validation.
 * Implements role-based access control (ADMIN role required).
 *
 * Features:
 * - Session validation via Better Auth /session endpoint
 * - Role-based access control (ADMIN role enforcement)
 * - Redirect unauthenticated users to /login
 * - Redirect authenticated users away from /login to dashboard
 * - Return URL preservation for post-login redirect
 *
 * Routes:
 * - /login - Public (redirects to / if already authenticated)
 * - /api/* - Public (API endpoints handle their own auth)
 * - /_astro/* - Public (Astro internal assets)
 * - /* - Protected (requires valid session + ADMIN role)
 *
 * @module @mirai-app/web/middleware
 */

import { defineMiddleware } from "astro:middleware";
import type { AstroIntegrationLogger } from "astro";
import { env, ENV } from "./lib/env";

// =============================================================================
// Type Declarations
// =============================================================================

// Note: Type declarations for Locals are in env.d.ts to avoid conflicts

// =============================================================================
// Types
// =============================================================================

/**
 * Better Auth user from session endpoint
 */
interface BetterAuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
}

/**
 * Better Auth session from session endpoint
 */
interface BetterAuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

/**
 * Session response from Better Auth
 */
interface SessionResponse {
  user: BetterAuthUser | null;
  session: BetterAuthSession | null;
}

/**
 * GraphQL user role response
 */
interface UserRoleResponse {
  data?: {
    userByAuthId?: {
      role: string;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

// =============================================================================
// Configuration
// =============================================================================

/** Public routes that don't require authentication */
const PUBLIC_ROUTES = new Set([
  "/login",
  "/api/auth/*", // Let Better Auth endpoints through
  "/_astro/*", // Astro internal assets
  "/favicon.ico",
  "/robots.txt",
]);

/** GraphQL query to fetch user role */
const GET_USER_ROLE_QUERY = `
  query GetUserRole($authUserId: String!) {
    userByAuthId(authUserId: $authUserId) {
      role
    }
  }
`;

// =============================================================================
// Session Refresh Configuration
// =============================================================================

/** Time before expiry to trigger refresh (5 minutes) */
const SESSION_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Check if session needs refresh
 */
function shouldRefreshSession(expiresAt: string): boolean {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const timeUntilExpiry = expiry.getTime() - now.getTime();
  return timeUntilExpiry > 0 && timeUntilExpiry < SESSION_REFRESH_THRESHOLD_MS;
}

/**
 * Refresh session before expiry
 */
async function refreshSession(
  cookieHeader: string | null
): Promise<{ success: boolean; newExpiresAt?: string }> {
  try {
    const response = await fetch(ENV.GRAPHQL.HTTP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({
        query: `
          mutation RefreshSession {
            refreshSession {
              success
              session {
                id
                expiresAt
              }
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const result = await response.json();
    
    if (result.errors || !result.data?.refreshSession?.success) {
      return { success: false };
    }

    return { 
      success: true, 
      newExpiresAt: result.data.refreshSession.session?.expiresAt 
    };
  } catch (error) {
    console.error("[Middleware] Session refresh error:", error);
    return { success: false };
  }
}

// =============================================================================
// Session Validation
// =============================================================================

/**
 * Validate session with Better Auth backend
 * Uses the /api/auth/session endpoint with cookies
 * Automatically refreshes session if nearing expiry
 */
async function validateSession(
  request: Request
): Promise<{ user: BetterAuthUser; token: string; expiresAt: string } | null> {
  try {
    // Forward the cookies from the original request
    const cookieHeader = request.headers.get("cookie");

    const response = await fetch(
      `${ENV.BETTER_AUTH.URL}${ENV.BETTER_AUTH.ENDPOINTS.SESSION}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      }
    );

    if (!response.ok) {
      console.log("[Middleware] Session validation failed:", response.status);
      return null;
    }

    const data = (await response.json()) as SessionResponse;

    if (!data.session || !data.user) {
      console.log("[Middleware] No active session");
      return null;
    }

    // Check if session needs refresh
    if (shouldRefreshSession(data.session.expiresAt)) {
      console.log("[Middleware] Session nearing expiry, attempting refresh...");
      const refreshResult = await refreshSession(cookieHeader);
      
      if (refreshResult.success && refreshResult.newExpiresAt) {
        console.log("[Middleware] Session refreshed successfully");
        return {
          user: data.user,
          token: data.session.token,
          expiresAt: refreshResult.newExpiresAt,
        };
      }
      
      console.warn("[Middleware] Session refresh failed, using existing session");
    }

    return {
      user: data.user,
      token: data.session.token,
      expiresAt: data.session.expiresAt,
    };
  } catch (error) {
    console.error("[Middleware] Session validation error:", error);
    return null;
  }
}

// =============================================================================
// Role Fetching
// =============================================================================

/**
 * Fetch user role from GraphQL API
 */
async function fetchUserRole(
  authUserId: string,
  requestCookieHeader: string | null
): Promise<string | null> {
  try {
    const response = await fetch(ENV.GRAPHQL.HTTP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(requestCookieHeader ? { Cookie: requestCookieHeader } : {}),
      },
      body: JSON.stringify({
        query: GET_USER_ROLE_QUERY,
        variables: { authUserId },
      }),
    });

    if (!response.ok) {
      console.error("[Middleware] GraphQL role fetch failed:", response.status);
      return null;
    }

    const result = (await response.json()) as UserRoleResponse;

    if (result.errors) {
      console.error("[Middleware] GraphQL errors:", result.errors);
      return null;
    }

    return result.data?.userByAuthId?.role ?? null;
  } catch (error) {
    console.error("[Middleware] Failed to fetch user role:", error);
    return null;
  }
}

// =============================================================================
// Route Helpers
// =============================================================================

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }

  // Check wildcards
  for (const route of PUBLIC_ROUTES) {
    if (route.endsWith("/*")) {
      const prefix = route.slice(0, -1);
      if (pathname.startsWith(prefix)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Build redirect URL with return URL parameter
 */
function buildLoginRedirectUrl(context: {
  url: { pathname: string; search: string };
}): string {
  const returnUrl = encodeURIComponent(
    context.url.pathname + context.url.search
  );
  return `/login?returnUrl=${returnUrl}`;
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * Auth middleware for protecting admin routes
 *
 * Flow:
 * 1. Check if route is public - if yes, allow
 * 2. Validate session with Better Auth
 * 3. If no session, redirect to /login with return URL
 * 4. Fetch user role from database
 * 5. If role is not ADMIN, return 403 Forbidden
 * 6. If accessing /login with valid session, redirect to /
 * 7. Otherwise, allow access
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const request = context.request;

  console.log(`[Middleware] Request: ${pathname}`);

  // Allow public routes
  if (isPublicRoute(pathname)) {
    console.log(`[Middleware] Public route allowed: ${pathname}`);
    return next();
  }

  // Skip static assets
  if (
    pathname.startsWith("/_astro") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)
  ) {
    return next();
  }

  // Validate session with Better Auth
  const session = await validateSession(request);

  // No valid session - redirect to login
  if (!session) {
    // If already on login page, let them stay
    if (pathname === "/login") {
      return next();
    }

    console.log(`[Middleware] No session, redirecting to login`);
    return context.redirect(buildLoginRedirectUrl(context));
  }

  // Valid session - check role
  const cookieHeader = request.headers.get("cookie");
  const role = await fetchUserRole(session.user.id, cookieHeader);

  console.log(`[Middleware] User role: ${role}`);

  // No role found - treat as unauthenticated
  if (!role) {
    console.log(`[Middleware] No role found, redirecting to login`);
    return context.redirect(buildLoginRedirectUrl(context));
  }

  // Check for ADMIN role
  if (role.toUpperCase() !== "ADMIN") {
    console.log(`[Middleware] Forbidden: role is ${role}, required ADMIN`);

    // If on login page, allow them to see the error
    if (pathname === "/login") {
      return next();
    }

    // Return 403 Forbidden
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 Forbidden</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    h1 { color: #d32f2f; margin-bottom: 1rem; }
    p { color: #666; margin-bottom: 1.5rem; line-height: 1.5; }
    a {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Access Denied</h1>
    <p>You don't have permission to access the admin area.</p>
    <p>Current role: <strong>${role}</strong></p>
    <p>Please contact your administrator or <a href="/login">sign in with a different account</a>.</p>
  </div>
</body>
</html>`,
      {
        status: 403,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  // Valid ADMIN session

  // If on login page with valid admin session, redirect to dashboard
  if (pathname === "/login") {
    console.log(`[Middleware] Admin on login page, redirecting to dashboard`);
    const returnUrl = context.url.searchParams.get("returnUrl");
    if (returnUrl) {
      try {
        const decoded = decodeURIComponent(returnUrl);
        // Validate it's a relative URL (prevent open redirect)
        if (decoded.startsWith("/") && !decoded.startsWith("//")) {
          return context.redirect(decoded);
        }
      } catch {
        // Invalid returnUrl, fall through to default
      }
    }
    return context.redirect("/");
  }

  // Store auth context in locals for use in pages/components
  // Use proper Astro.locals typing - no token (stored in httpOnly cookie)
  (context.locals as { user?: { id: string; email: string; role: string; sessionId: string }; csrfToken?: string }).user = {
    id: session.user.id,
    email: session.user.email,
    role: role,
    sessionId: session.token, // sessionId for tracking, not the actual token
  };
  
  // Generate CSRF token for the session
  (context.locals as { user?: { id: string; email: string; role: string; sessionId: string }; csrfToken?: string }).csrfToken = generateCsrfToken();

  console.log(`[Middleware] Access granted for ${session.user.email}`);
  return next();
});

/**
 * Generate a CSRF token for session protection
 */
function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

// Default export for Astro
export default onRequest;
