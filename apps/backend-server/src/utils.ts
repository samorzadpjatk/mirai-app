export const TEN_MB = 10 * 1024 * 1024;

export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export const DEFAULT_IP_BUCKET_CAPACITY = 1200;
export const DEFAULT_IP_REFILL_INTERVAL_MS = Math.ceil(
  RATE_LIMIT_WINDOW_MS / DEFAULT_IP_BUCKET_CAPACITY,
);

export const DEFAULT_USER_BUCKET_CAPACITY = 400;
export const DEFAULT_USER_REFILL_INTERVAL_MS = Math.ceil(
  RATE_LIMIT_WINDOW_MS / DEFAULT_USER_BUCKET_CAPACITY,
);

export const DEFAULT_AUTH_BUCKET_CAPACITY = 30;
export const DEFAULT_AUTH_REFILL_INTERVAL_MS = Math.ceil(
  RATE_LIMIT_WINDOW_MS / DEFAULT_AUTH_BUCKET_CAPACITY,
);

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

export interface BucketConfig {
  capacity: number;
  refillInterval: number;
}

export interface RateLimiterOptions {
  ip?: BucketConfig;
  user?: BucketConfig;
  auth?: BucketConfig;
}

export type BucketType = "ip" | "user" | "auth";

interface BucketState {
  tokens: number;
  lastRefill: number;
}

function stripPort(ip: string): string {
  const trimmed = ip.trim();

  if (trimmed.startsWith("[") && trimmed.includes("]")) {
    const closingBracketIndex = trimmed.indexOf("]");
    return trimmed.slice(1, closingBracketIndex);
  }

  const lastColonIndex = trimmed.lastIndexOf(":");
  const firstColonIndex = trimmed.indexOf(":");

  if (lastColonIndex !== -1 && firstColonIndex === lastColonIndex) {
    const candidate = trimmed.slice(0, lastColonIndex);
    if (/^[0-9.]+$/.test(candidate)) {
      return candidate;
    }
  }

  return trimmed;
}

function isInternalIp(ip: string): boolean {
  const host = stripPort(ip).toLowerCase();

  if (host === "::1" || host === "localhost" || host.startsWith("127.")) {
    return true;
  }

  if (host.startsWith("10.")) {
    return true;
  }

  if (host.startsWith("192.168.")) {
    return true;
  }

  if (host.startsWith("172.")) {
    const secondOctet = Number(host.split(".")[1]);
    if (!Number.isNaN(secondOctet) && secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  if (host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }

  return false;
}

export function getClientIp(headers: Record<string, string | undefined>): string {
  const forwarded = headers["x-forwarded-for"];

  if (forwarded) {
    const ips = forwarded
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);

    for (let index = ips.length - 1; index >= 0; index--) {
      const ip = ips[index];
      if (ip && !isInternalIp(ip)) {
        return ip;
      }
    }
  }

  const realIp = headers["x-real-ip"];
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export async function hashAccessToken(token: string | null): Promise<string | null> {
  if (!token) {
    return null;
  }

  // Rate-limit by token hash instead of decoded `sub` so we never rely on
  // unverified JWT contents. Each token gets its own stable bucket.
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  const bytes = new Uint8Array(buffer);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export class RateLimiter {
  private readonly buckets = new Map<BucketType, Map<string, BucketState>>();

  constructor(private readonly options: RateLimiterOptions) {}

  check(type: BucketType, key: string, now = Date.now()): RateLimitResult {
    const config = this.options[type];

    if (!config) {
      return { allowed: true, retryAfter: 0 };
    }

    let typeBuckets = this.buckets.get(type);

    if (!typeBuckets) {
      typeBuckets = new Map<string, BucketState>();
      this.buckets.set(type, typeBuckets);
    }

    let bucket = typeBuckets.get(key);

    if (!bucket) {
      bucket = { tokens: config.capacity - 1, lastRefill: now };
      typeBuckets.set(key, bucket);
      return { allowed: true, retryAfter: 0 };
    }

    const elapsed = now - bucket.lastRefill;

    if (elapsed > 0 && bucket.tokens < config.capacity) {
      const tokensToAdd = Math.floor(elapsed / config.refillInterval);

      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(config.capacity, bucket.tokens + tokensToAdd);
        bucket.lastRefill += tokensToAdd * config.refillInterval;
      }
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, retryAfter: 0 };
    }

    const deficit = 1 - bucket.tokens;
    const waitMs = deficit * config.refillInterval;
    const retryAfter = Math.max(1, Math.ceil(waitMs / 1000));

    return { allowed: false, retryAfter };
  }
}

export function createRateLimiter() {
  return new RateLimiter({
    ip: {
      capacity: DEFAULT_IP_BUCKET_CAPACITY,
      refillInterval: DEFAULT_IP_REFILL_INTERVAL_MS,
    },
    user: {
      capacity: DEFAULT_USER_BUCKET_CAPACITY,
      refillInterval: DEFAULT_USER_REFILL_INTERVAL_MS,
    },
    auth: {
      capacity: DEFAULT_AUTH_BUCKET_CAPACITY,
      refillInterval: DEFAULT_AUTH_REFILL_INTERVAL_MS,
    },
  });
}

export function buildSecurityHeaders(): Record<string, string> {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'self'",
  };
}

interface WsAuthPayload {
  type?: string;
  payload?: { authorization?: string };
}

export interface WsAuthResult {
  connectionParams?: Record<string, string>;
  authProcessed: boolean;
  ackSent: boolean;
}

export function parseWsAuthMessage(
  message: string | Uint8Array,
  data: { authProcessed?: boolean; connectionParams?: Record<string, string> },
): WsAuthResult {
  const msgString = typeof message === "string" ? message : new TextDecoder().decode(message);

  if (data.authProcessed) {
    return {
      connectionParams: data.connectionParams,
      authProcessed: true,
      ackSent: false,
    };
  }

  try {
    const msg = JSON.parse(msgString) as WsAuthPayload;
    if (msg.type === "connection_init" && msg.payload?.authorization) {
      return {
        connectionParams: { authorization: msg.payload.authorization },
        authProcessed: true,
        ackSent: true,
      };
    }
  } catch {
    // Ignore parse errors
  }

  return {
    connectionParams: data.connectionParams,
    authProcessed: true,
    ackSent: false,
  };
}

export interface WsEnvConfig {
  supabaseUrl: string;
  supabaseKey: string;
  databaseUrl: string;
}

export function getWsEnvConfig(): WsEnvConfig {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (!databaseUrl) {
    throw new Error("Missing database credentials. Set DATABASE_URL.");
  }

  return { supabaseUrl, supabaseKey, databaseUrl };
}

export interface CorsOriginResult {
  origin: string | null;
  credentials: boolean;
}

export function createCorsOrigin(
  allowedOrigins: string[],
  origin?: string | null,
): CorsOriginResult {
  if (!origin || allowedOrigins.includes(origin)) {
    return { origin: origin ?? null, credentials: true };
  }
  return { origin: null, credentials: true };
}

export function getAllowedOrigins(): string[] {
  return process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:8081"];
}
