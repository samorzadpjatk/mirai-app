import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_AUTH_BUCKET_CAPACITY,
  DEFAULT_AUTH_REFILL_INTERVAL_MS,
  DEFAULT_IP_BUCKET_CAPACITY,
  DEFAULT_IP_REFILL_INTERVAL_MS,
  DEFAULT_USER_BUCKET_CAPACITY,
  DEFAULT_USER_REFILL_INTERVAL_MS,
  RATE_LIMIT_WINDOW_MS,
  RateLimiter,
  TEN_MB,
  buildSecurityHeaders,
  createCorsOrigin,
  createRateLimiter,
  getAllowedOrigins,
  getClientIp,
  getWsEnvConfig,
  hashAccessToken,
  parseWsAuthMessage,
} from "../utils";

describe("getClientIp", () => {
  it("should pick the rightmost non-internal IP from x-forwarded-for", () => {
    const headers = {
      "x-forwarded-for": "192.168.1.1, 10.0.0.1, 203.0.113.5",
    };
    expect(getClientIp(headers)).toBe("203.0.113.5");
  });

  it("should skip private ranges and loopback", () => {
    const headers = {
      "x-forwarded-for": "127.0.0.1, 10.0.0.2, 203.0.113.7, 192.168.0.1",
    };
    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("should fall back to x-real-ip when x-forwarded-for is all internal", () => {
    const headers = {
      "x-forwarded-for": "192.168.1.1, 10.0.0.1",
      "x-real-ip": "203.0.113.7",
    };
    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("should return unknown when both headers are missing", () => {
    expect(getClientIp({})).toBe("unknown");
  });

  it("should return unknown for empty x-forwarded-for", () => {
    const headers = { "x-forwarded-for": "" };
    expect(getClientIp(headers)).toBe("unknown");
  });

  it("should trim whitespace and ignore ports", () => {
    const headers = { "x-forwarded-for": "  192.168.1.1:8080 , 203.0.113.9  " };
    expect(getClientIp(headers)).toBe("203.0.113.9");
  });

  it("should treat ::1 as internal", () => {
    const headers = { "x-forwarded-for": "::1, 203.0.113.10" };
    expect(getClientIp(headers)).toBe("203.0.113.10");
  });
});

describe("RateLimiter", () => {
  it("should allow requests up to capacity in a burst", () => {
    const limiter = new RateLimiter({
      ip: { capacity: 3, refillInterval: 1000 },
    });

    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: false, retryAfter: 1 });
  });

  it("should refill tokens over time", () => {
    const limiter = new RateLimiter({
      ip: { capacity: 2, refillInterval: 1000 },
    });

    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: false, retryAfter: 1 });

    expect(limiter.check("ip", "1.1.1.1", 1000)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("ip", "1.1.1.1", 1000)).toEqual({ allowed: false, retryAfter: 1 });
  });

  it("should report correct retryAfter in seconds until next refill tick", () => {
    const limiter = new RateLimiter({
      ip: { capacity: 1, refillInterval: 5000 },
    });

    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("ip", "1.1.1.1", 500)).toEqual({ allowed: false, retryAfter: 5 });
  });

  it("should isolate per-user and per-IP buckets", () => {
    const limiter = new RateLimiter({
      ip: { capacity: 1, refillInterval: 1000 },
      user: { capacity: 1, refillInterval: 1000 },
    });

    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: false, retryAfter: 1 });

    expect(limiter.check("user", "user-a", 0)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("user", "user-b", 0)).toEqual({ allowed: true, retryAfter: 0 });

    expect(limiter.check("user", "user-a", 0)).toEqual({ allowed: false, retryAfter: 1 });
  });

  it("should support a separate auth bucket keyed by IP", () => {
    const limiter = new RateLimiter({
      ip: { capacity: 10, refillInterval: 1000 },
      auth: { capacity: 2, refillInterval: 2000 },
    });

    expect(limiter.check("auth", "1.1.1.1", 0)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("auth", "1.1.1.1", 0)).toEqual({ allowed: true, retryAfter: 0 });
    expect(limiter.check("auth", "1.1.1.1", 0)).toEqual({ allowed: false, retryAfter: 2 });

    expect(limiter.check("ip", "1.1.1.1", 0)).toEqual({ allowed: true, retryAfter: 0 });
  });

  it("should allow missing bucket type without limits", () => {
    const limiter = new RateLimiter({ ip: { capacity: 1, refillInterval: 1000 } });
    expect(limiter.check("user", "user-a", 0)).toEqual({ allowed: true, retryAfter: 0 });
  });
});

describe("createRateLimiter", () => {
  it("should create a RateLimiter with production defaults", () => {
    const limiter = createRateLimiter();

    for (let index = 0; index < DEFAULT_IP_BUCKET_CAPACITY; index++) {
      expect(limiter.check("ip", "1.1.1.1").allowed).toBe(true);
    }
    expect(limiter.check("ip", "1.1.1.1").allowed).toBe(false);

    for (let index = 0; index < DEFAULT_USER_BUCKET_CAPACITY; index++) {
      expect(limiter.check("user", "user-1").allowed).toBe(true);
    }
    expect(limiter.check("user", "user-1").allowed).toBe(false);
  });
});

describe("hashAccessToken", () => {
  it("should return a hex sha256 hash for a token", async () => {
    const token = "any-token-value";
    const result = await hashAccessToken(token);
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]+$/);
    expect(await hashAccessToken(token)).toBe(result);
  });

  it("should return different hashes for different tokens", async () => {
    expect(await hashAccessToken("token-a")).not.toBe(await hashAccessToken("token-b"));
  });

  it("should return null for a missing token", async () => {
    expect(await hashAccessToken(null)).toBeNull();
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
    expect(DEFAULT_IP_BUCKET_CAPACITY).toBe(1200);
    expect(DEFAULT_USER_BUCKET_CAPACITY).toBe(400);
    expect(DEFAULT_AUTH_BUCKET_CAPACITY).toBe(30);
  });
});
