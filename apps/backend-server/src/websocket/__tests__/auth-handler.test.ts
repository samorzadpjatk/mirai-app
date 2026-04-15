/**
 * WebSocket Auth Handler Tests
 *
 * Tests for the WebSocket authentication handler including:
 * - Token extraction from cookies
 * - Token validation
 * - Auth context creation
 * - Error handling
 *
 * @module websocket/auth-handler.test
 */

import { describe, it, expect, beforeEach } from "bun:test";
import {
  extractAuthToken,
  validateAuthToken,
  handleWebSocketAuth,
  createWebSocketContext,
  AUTH_TOKEN_COOKIE,
  ALTERNATIVE_COOKIE_NAMES,
  type WebSocketAuthResult,
} from "../auth-handler";
import type { AuthPort, AuthContext } from "@mirai-app/use-cases";

// =============================================================================
// Mock Request Factory
// =============================================================================

/**
 * Create a mock Request with proper cookie header support for testing.
 * Bun's native Request doesn't expose cookie headers via headers.get()
 * for security reasons, so we need to create a mock for testing.
 */
function createMockRequest(
  url: string,
  headers?: Record<string, string>,
): Request {
  const headersMap = new Map<string, string>();

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      headersMap.set(key.toLowerCase(), value);
    }
  }

  const mockHeaders = {
    get: (name: string): string | null => {
      return headersMap.get(name.toLowerCase()) ?? null;
    },
    entries: function* () {
      for (const [key, value] of headersMap) {
        yield [key, value] as [string, string];
      }
    },
    has: (name: string): boolean => headersMap.has(name.toLowerCase()),
  } as unknown as Headers;

  // Create a minimal mock Request
  const mockRequest = {
    url,
    headers: mockHeaders,
  } as Request;

  return mockRequest;
}

// =============================================================================
// Mock Types and Factories
// =============================================================================

class MockAuthPort implements AuthPort {
  private shouldSucceed: boolean;
  private mockContext: AuthContext;

  constructor(
    shouldSucceed = true,
    mockContext: AuthContext = {
      userId: "user-123",
      role: "USER",
      permissions: ["read"],
    },
  ) {
    this.shouldSucceed = shouldSucceed;
    this.mockContext = mockContext;
  }

  async validateToken(
    _token: string,
  ): Promise<
    | { kind: "ok"; value: AuthContext }
    | { kind: "err"; error: { message: string } }
  > {
    if (this.shouldSucceed) {
      return { kind: "ok", value: this.mockContext };
    } else {
      return { kind: "err", error: { message: "Invalid token" } };
    }
  }

  async authenticateUser(_credentials: {
    email: string;
    password: string;
  }): Promise<
    | { kind: "ok"; value: AuthContext }
    | { kind: "err"; error: { message: string } }
  > {
    throw new Error("Method not implemented");
  }

  async refreshToken(
    _token: string,
  ): Promise<
    | { kind: "ok"; value: AuthContext }
    | { kind: "err"; error: { message: string } }
  > {
    throw new Error("Method not implemented");
  }
}

// =============================================================================
// Tests
// =============================================================================

describe("[UNIT] WebSocket Auth Handler", () => {
  describe("[UNIT] extractAuthToken", () => {
    it("should extract token from auth-token cookie", () => {
      const request = createMockRequest("http://localhost:4000/graphql/ws", {
        cookie: `${AUTH_TOKEN_COOKIE}=valid-token-123`,
      });

      const token = extractAuthToken(request);
      expect(token).toBe("valid-token-123");
    });

    it("should extract token from sb-access-token cookie (Supabase default)", () => {
      const request = createMockRequest("http://localhost:4000/graphql/ws", {
        cookie: "sb-access-token=supabase-token-456",
      });

      const token = extractAuthToken(request);
      expect(token).toBe("supabase-token-456");
    });

    it("should extract token from alternative cookie names", () => {
      for (const cookieName of ALTERNATIVE_COOKIE_NAMES) {
        const request = createMockRequest("http://localhost:4000/graphql/ws", {
          cookie: `${cookieName}=token-${cookieName}`,
        });

        const token = extractAuthToken(request);
        expect(token).toBe(`token-${cookieName}`);
      }
    });

    it("should extract token from query parameter (for dev/testing)", () => {
      const request = new Request(
        "http://localhost:4000/graphql/ws?token=query-token-789",
      );

      const token = extractAuthToken(request);
      expect(token).toBe("query-token-789");
    });

    it("should prefer cookie over query parameter", () => {
      const request = createMockRequest(
        "http://localhost:4000/graphql/ws?token=query-token",
        {
          cookie: `${AUTH_TOKEN_COOKIE}=cookie-token`,
        },
      );

      const token = extractAuthToken(request);
      expect(token).toBe("cookie-token");
    });

    it("should return null when no token present", () => {
      const request = new Request("http://localhost:4000/graphql/ws");

      const token = extractAuthToken(request);
      expect(token).toBeNull();
    });

    it("should return null for empty cookie header", () => {
      const request = createMockRequest("http://localhost:4000/graphql/ws", {
        cookie: "",
      });

      const token = extractAuthToken(request);
      expect(token).toBeNull();
    });

    it("should handle multiple cookies", () => {
      const request = createMockRequest("http://localhost:4000/graphql/ws", {
        cookie: `other-cookie=value; ${AUTH_TOKEN_COOKIE}=multi-cookie-token; another-cookie=value2`,
      });

      const token = extractAuthToken(request);
      expect(token).toBe("multi-cookie-token");
    });

    it("should handle URL-encoded cookie values", () => {
      const request = createMockRequest("http://localhost:4000/graphql/ws", {
        cookie: `${AUTH_TOKEN_COOKIE}=encoded%20token%2Bvalue`,
      });

      const token = extractAuthToken(request);
      expect(token).toBe("encoded token+value");
    });
  });

  describe("[UNIT] validateAuthToken", () => {
    it("should return success for valid token", async () => {
      const mockContext: AuthContext = {
        userId: "user-123",
        role: "USER",
        permissions: ["read", "write"],
      };
      const authPort = new MockAuthPort(true, mockContext);

      const result: WebSocketAuthResult = await validateAuthToken(
        "valid-token",
        authPort,
      );

      expect(result.success).toBe(true);
      expect(result.authContext).toEqual(mockContext);
      expect(result.statusCode).toBe(200);
      expect(result.error).toBeUndefined();
    });

    it("should return failure for invalid token", async () => {
      const authPort = new MockAuthPort(false);

      const result: WebSocketAuthResult = await validateAuthToken(
        "invalid-token",
        authPort,
      );

      expect(result.success).toBe(false);
      expect(result.authContext).toBeUndefined();
      expect(result.statusCode).toBe(401);
      expect(result.error).toBe("Invalid or expired token");
    });

    it("should return failure when auth port throws", async () => {
      const authPort = {
        validateToken: async () => {
          return { kind: "err", error: { message: "Connection error" } };
        },
      } as unknown as AuthPort;

      const result: WebSocketAuthResult = await validateAuthToken(
        "any-token",
        authPort,
      );

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.error).toBe("Authentication failed");
    });
  });

  describe("[UNIT] handleWebSocketAuth", () => {
    it("should return error when no token provided", async () => {
      const request = new Request("http://localhost:4000/graphql/ws");
      const authPort = new MockAuthPort();

      const result = await handleWebSocketAuth(request, authPort);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toBe("No authentication token provided");
    });

    it("should validate token and return success", async () => {
      const mockContext: AuthContext = {
        userId: "user-123",
        role: "USER",
        permissions: ["read"],
      };
      const request = createMockRequest("http://localhost:4000/graphql/ws", {
        cookie: `${AUTH_TOKEN_COOKIE}=valid-token`,
      });
      const authPort = new MockAuthPort(true, mockContext);

      const result = await handleWebSocketAuth(request, authPort);

      expect(result.success).toBe(true);
      expect(result.authContext).toEqual(mockContext);
      expect(result.statusCode).toBe(200);
    });

    it("should return error for invalid token", async () => {
      const request = createMockRequest("http://localhost:4000/graphql/ws", {
        cookie: `${AUTH_TOKEN_COOKIE}=invalid-token`,
      });
      const authPort = new MockAuthPort(false);

      const result = await handleWebSocketAuth(request, authPort);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
    });
  });

  describe("[UNIT] createWebSocketContext", () => {
    it("should create context from successful auth result", () => {
      const mockContext: AuthContext = {
        userId: "user-123",
        role: "USER",
        permissions: ["read"],
      };
      const authResult: WebSocketAuthResult = {
        success: true,
        authContext: mockContext,
        statusCode: 200,
      };

      const context = createWebSocketContext("conn-123", authResult);

      expect(context.connectionId).toBe("conn-123");
      expect(context.authContext).toEqual(mockContext);
      expect(context.connectedAt).toBeInstanceOf(Date);
    });

    it("should throw for failed auth result", () => {
      const authResult: WebSocketAuthResult = {
        success: false,
        statusCode: 401,
        error: "Invalid token",
      };

      expect(() => createWebSocketContext("conn-123", authResult)).toThrow(
        "Cannot create context from failed auth result",
      );
    });

    it("should throw for successful result without auth context", () => {
      const authResult: WebSocketAuthResult = {
        success: true,
        statusCode: 200,
        // Missing authContext
      };

      expect(() => createWebSocketContext("conn-123", authResult)).toThrow(
        "Cannot create context from failed auth result",
      );
    });
  });
});

// =============================================================================
// Export
// =============================================================================

export {};
