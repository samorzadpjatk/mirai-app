import { describe, expect, it, vi } from "vitest";
import {
  AUTH_RATE_LIMIT,
  GLOBAL_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
  TEN_MB,
  buildSecurityHeaders,
  checkRateLimit,
  createCorsOrigin,
  createRateLimiter,
  getAllowedOrigins,
  getClientIp,
  getWsEnvConfig,
  parseWsAuthMessage,
} from "../utils";

describe("getClientIp", () => {
  it("should return first IP from x-forwarded-for", () => {
    const headers = { "x-forwarded-for": "192.168.1.1, 10.0.0.1" };
    expect(getClientIp(headers)).toBe("192.168.1.1");
  });

  it("should return x-real-ip when x-forwarded-for is missing", () => {
    const headers = { "x-real-ip": "192.168.1.2" };
    expect(getClientIp(headers)).toBe("192.168.1.2");
  });

  it("should return unknown when both headers are missing", () => {
    expect(getClientIp({})).toBe("unknown");
  });

  it("should handle empty x-forwarded-for", () => {
    const headers = { "x-forwarded-for": "" };
    expect(getClientIp(headers)).toBe("unknown");
  });

  it("should trim whitespace from forwarded IP", () => {
    const headers = { "x-forwarded-for": "  192.168.1.3  " };
    expect(getClientIp(headers)).toBe("192.168.1.3");
  });
});

describe("checkRateLimit", () => {
  it("should allow first request", () => {
    const store = new Map();
    const result = checkRateLimit(store, "192.168.1.1", false, 1000);
    expect(result).toEqual({ allowed: true, retryAfter: 0 });
    expect(store.get("192.168.1.1:global")).toEqual({
      count: 1,
      resetTime: 1000 + RATE_LIMIT_WINDOW_MS,
    });
  });

  it("should allow requests under global limit", () => {
    const store = new Map();
    for (let i = 0; i < GLOBAL_RATE_LIMIT - 1; i++) {
      checkRateLimit(store, "192.168.1.1", false, 1000);
    }
    const result = checkRateLimit(store, "192.168.1.1", false, 1000);
    expect(result).toEqual({ allowed: true, retryAfter: 0 });
  });

  it("should block requests over global limit", () => {
    const store = new Map();
    for (let i = 0; i < GLOBAL_RATE_LIMIT; i++) {
      checkRateLimit(store, "192.168.1.1", false, 1000);
    }
    const result = checkRateLimit(store, "192.168.1.1", false, 1000);
    expect(result).toEqual({ allowed: false, retryAfter: 60 });
  });

  it("should reset counter after window expires", () => {
    const store = new Map();
    checkRateLimit(store, "192.168.1.1", false, 1000);
    const result = checkRateLimit(store, "192.168.1.1", false, 1000 + RATE_LIMIT_WINDOW_MS + 1);
    expect(result).toEqual({ allowed: true, retryAfter: 0 });
    expect(store.get("192.168.1.1:global")?.count).toBe(1);
  });

  it("should allow auth requests under auth limit", () => {
    const store = new Map();
    for (let i = 0; i < AUTH_RATE_LIMIT - 1; i++) {
      checkRateLimit(store, "192.168.1.1", true, 1000);
    }
    const result = checkRateLimit(store, "192.168.1.1", true, 1000);
    expect(result).toEqual({ allowed: true, retryAfter: 0 });
  });

  it("should block auth requests over auth limit", () => {
    const store = new Map();
    for (let i = 0; i < AUTH_RATE_LIMIT; i++) {
      checkRateLimit(store, "192.168.1.1", true, 1000);
    }
    const result = checkRateLimit(store, "192.168.1.1", true, 1000);
    expect(result).toEqual({ allowed: false, retryAfter: 60 });
  });

  it("should track global and auth limits separately", () => {
    const store = new Map();
    for (let i = 0; i < AUTH_RATE_LIMIT; i++) {
      checkRateLimit(store, "192.168.1.1", true, 1000);
    }
    const authResult = checkRateLimit(store, "192.168.1.1", true, 1000);
    expect(authResult.allowed).toBe(false);

    const nonAuthResult = checkRateLimit(store, "192.168.1.1", false, 1000);
    expect(nonAuthResult.allowed).toBe(true);
  });

  it("should use custom limits", () => {
    const store = new Map();
    const result = checkRateLimit(store, "192.168.1.1", false, 1000, 10000, 5, 2);
    expect(result).toEqual({ allowed: true, retryAfter: 0 });

    const blocked = checkRateLimit(store, "192.168.1.1", false, 1000, 10000, 1, 2);
    expect(blocked).toEqual({ allowed: false, retryAfter: 10 });
  });
});

describe("createRateLimiter", () => {
  it("should create rate limiter with state", () => {
    const limiter = createRateLimiter();
    expect(limiter.checkRateLimit("192.168.1.1", false)).toEqual({ allowed: true, retryAfter: 0 });
  });

  it("should block after limit is reached", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < GLOBAL_RATE_LIMIT; i++) {
      limiter.checkRateLimit("192.168.1.1", false);
    }
    const result = limiter.checkRateLimit("192.168.1.1", false);
    expect(result.allowed).toBe(false);
  });
});

describe("buildSecurityHeaders", () => {
  it("should return all security headers", () => {
    const headers = buildSecurityHeaders();
    expect(headers).toEqual({
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "Content-Security-Policy": "default-src 'self'",
    });
  });
});

describe("parseWsAuthMessage", () => {
  it("should handle connection_init with authorization", () => {
    const data = { authProcessed: false };
    const message = JSON.stringify({
      type: "connection_init",
      payload: { authorization: "Bearer token" },
    });
    const result = parseWsAuthMessage(message, data);
    expect(result).toEqual({
      connectionParams: { authorization: "Bearer token" },
      authProcessed: true,
      ackSent: true,
    });
  });

  it("should handle already processed auth", () => {
    const data = { authProcessed: true, connectionParams: { authorization: "Bearer token" } };
    const result = parseWsAuthMessage("{}", data);
    expect(result).toEqual({
      connectionParams: { authorization: "Bearer token" },
      authProcessed: true,
      ackSent: false,
    });
  });

  it("should handle invalid JSON", () => {
    const data = { authProcessed: false };
    const result = parseWsAuthMessage("invalid json", data);
    expect(result).toEqual({
      connectionParams: undefined,
      authProcessed: true,
      ackSent: false,
    });
  });

  it("should handle non-connection_init message", () => {
    const data = { authProcessed: false };
    const result = parseWsAuthMessage(JSON.stringify({ type: "ping" }), data);
    expect(result).toEqual({
      connectionParams: undefined,
      authProcessed: true,
      ackSent: false,
    });
  });

  it("should handle Uint8Array message", () => {
    const data = { authProcessed: false };
    const message = new TextEncoder().encode(
      JSON.stringify({ type: "connection_init", payload: { authorization: "Bearer token" } }),
    );
    const result = parseWsAuthMessage(message, data);
    expect(result).toEqual({
      connectionParams: { authorization: "Bearer token" },
      authProcessed: true,
      ackSent: true,
    });
  });

  it("should handle missing authorization in connection_init", () => {
    const data = { authProcessed: false };
    const result = parseWsAuthMessage(
      JSON.stringify({ type: "connection_init", payload: {} }),
      data,
    );
    expect(result).toEqual({
      connectionParams: undefined,
      authProcessed: true,
      ackSent: false,
    });
  });

  it("should handle missing payload in connection_init", () => {
    const data = { authProcessed: false };
    const result = parseWsAuthMessage(JSON.stringify({ type: "connection_init" }), data);
    expect(result).toEqual({
      connectionParams: undefined,
      authProcessed: true,
      ackSent: false,
    });
  });
});

describe("getWsEnvConfig", () => {
  it("should return env config when all vars are set", () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    const result = getWsEnvConfig();
    expect(result).toEqual({
      supabaseUrl: "http://localhost:8000",
      supabaseKey: "test-key",
      databaseUrl: "postgresql://localhost:5432/test",
    });

    vi.unstubAllEnvs();
  });

  it("should throw when SUPABASE_URL is missing", () => {
    vi.stubEnv("SUPABASE_URL", undefined);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    expect(() => getWsEnvConfig()).toThrow("Missing Supabase credentials");
    vi.unstubAllEnvs();
  });

  it("should throw when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    expect(() => getWsEnvConfig()).toThrow("Missing Supabase credentials");
    vi.unstubAllEnvs();
  });

  it("should throw when both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing", () => {
    vi.stubEnv("SUPABASE_URL", undefined);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    expect(() => getWsEnvConfig()).toThrow("Missing Supabase credentials");
    vi.unstubAllEnvs();
  });

  it("should throw when DATABASE_URL is missing", () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", undefined);

    expect(() => getWsEnvConfig()).toThrow("Missing database credentials");
    vi.unstubAllEnvs();
  });
});

describe("createCorsOrigin", () => {
  it("should allow origin from allowed list", () => {
    const result = createCorsOrigin(["http://localhost:8081"], "http://localhost:8081");
    expect(result).toEqual({ origin: "http://localhost:8081", credentials: true });
  });

  it("should reject origin not in allowed list", () => {
    const result = createCorsOrigin(["http://localhost:8081"], "http://localhost:3000");
    expect(result).toEqual({ origin: null, credentials: true });
  });

  it("should allow null origin", () => {
    const result = createCorsOrigin(["http://localhost:8081"], null);
    expect(result).toEqual({ origin: null, credentials: true });
  });

  it("should allow undefined origin", () => {
    const result = createCorsOrigin(["http://localhost:8081"], undefined);
    expect(result).toEqual({ origin: null, credentials: true });
  });
});

describe("getAllowedOrigins", () => {
  it("should return default origin when ALLOWED_ORIGINS is not set", () => {
    vi.unstubAllEnvs();
    delete process.env.ALLOWED_ORIGINS;
    const result = getAllowedOrigins();
    expect(result).toEqual(["http://localhost:8081"]);
  });

  it("should parse comma-separated origins from env", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8081");
    const result = getAllowedOrigins();
    expect(result).toEqual(["http://localhost:3000", "http://localhost:8081"]);
    vi.unstubAllEnvs();
  });
});

describe("constants", () => {
  it("should have correct constant values", () => {
    expect(TEN_MB).toBe(10 * 1024 * 1024);
    expect(RATE_LIMIT_WINDOW_MS).toBe(60000);
    expect(GLOBAL_RATE_LIMIT).toBe(600);
    expect(AUTH_RATE_LIMIT).toBe(30);
  });
});
