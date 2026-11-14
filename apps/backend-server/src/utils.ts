export const TEN_MB = 10 * 1024 * 1024;

export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// The IP bucket counts HTTP requests, and the client batches up to ten procedures
// into each one. It is a flood guard, not a per-person quota: a trip group shares
// one hotel or coach Wi-Fi address (and mobile carriers put whole cities behind
// CGNAT), so when a push notification lands, everyone opens the app at once from
// the same IP. The per-token bucket below is the one that tracks a single person.
export const DEFAULT_IP_BUCKET_CAPACITY = 3000;
export const DEFAULT_IP_REFILL_INTERVAL_MS = Math.ceil(
  RATE_LIMIT_WINDOW_MS / DEFAULT_IP_BUCKET_CAPACITY,
);

// Counts procedures, not HTTP requests: the per-token interceptor runs once per
// item in a batch. A cold start is about 30 procedures, and every image on screen
// costs one more (`storage.createDownloadUrl`), so a few pages of the community
// feed used to drain 400 and leave the rest of the photos blank.
export const DEFAULT_USER_BUCKET_CAPACITY = 1200;
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

interface BucketConfig {
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

// https://www.cloudflare.com/ips/ -- the ranges Cloudflare connects to origins from.
const CLOUDFLARE_IPV4_RANGES = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
];

const CLOUDFLARE_IPV6_RANGES = [
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

function parseIpv4(ip: string): bigint | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }

  let value = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const octet = Number(part);
    if (octet > 255) {
      return null;
    }
    value = (value << 8n) | BigInt(octet);
  }
  return value;
}

function parseIpv6(ip: string): bigint | null {
  const halves = ip.toLowerCase().split("::");
  if (halves.length > 2) {
    return null;
  }

  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;

  if (halves.length === 1 ? missing !== 0 : missing < 1) {
    return null;
  }

  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) {
      return null;
    }
    value = (value << 16n) | BigInt(Number.parseInt(group, 16));
  }
  return value;
}

interface ParsedRange {
  bits: 32 | 128;
  network: bigint;
  prefix: number;
}

function parseRanges(ranges: string[], bits: 32 | 128): ParsedRange[] {
  const parse = bits === 32 ? parseIpv4 : parseIpv6;
  return ranges.map((range) => {
    const [address = "", prefix = ""] = range.split("/");
    const network = parse(address);
    if (network === null) {
      throw new Error(`Invalid CIDR range: ${range}`);
    }
    return { bits, network, prefix: Number(prefix) };
  });
}

const CLOUDFLARE_RANGES = [
  ...parseRanges(CLOUDFLARE_IPV4_RANGES, 32),
  ...parseRanges(CLOUDFLARE_IPV6_RANGES, 128),
];

export function isCloudflareIp(ip: string): boolean {
  const host = stripPort(ip);
  const v4 = parseIpv4(host);
  const value = v4 ?? parseIpv6(host);
  if (value === null) {
    return false;
  }
  const bits = v4 === null ? 128 : 32;

  return CLOUDFLARE_RANGES.some((range) => {
    if (range.bits !== bits) {
      return false;
    }
    const shift = BigInt(bits - range.prefix);
    return value >> shift === range.network >> shift;
  });
}

function getProxyPeerIp(headers: Record<string, string | undefined>): string | null {
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

  const realIp = headers["x-real-ip"]?.trim();
  return realIp || null;
}

/**
 * Production traffic arrives client -> Cloudflare -> Caddy -> this server, so the
 * nearest public hop our proxy reports is a Cloudflare edge address, not the user.
 * Keying the IP bucket on it put every user routed through the same edge (all of
 * Poland goes through WAW) into one shared bucket, and a busy minute throttled
 * people who had sent a handful of requests. When that hop is Cloudflare, the
 * client is in `CF-Connecting-IP`; trusting the header only in that case keeps a
 * request that skipped Cloudflare from choosing its own bucket.
 */
export function getClientIp(headers: Record<string, string | undefined>): string {
  const peer = getProxyPeerIp(headers);

  if (!peer) {
    return "unknown";
  }

  const cloudflareClient = headers["cf-connecting-ip"]?.trim();
  if (cloudflareClient && isCloudflareIp(peer)) {
    return cloudflareClient;
  }

  return peer;
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

// How often idle buckets are dropped. Every access token gets its own bucket and
// tokens rotate hourly, so without a sweep the maps only ever grow.
export const RATE_LIMIT_SWEEP_INTERVAL_MS = RATE_LIMIT_WINDOW_MS;

export class RateLimiter {
  private readonly buckets = new Map<BucketType, Map<string, BucketState>>();
  private lastSweep: number | null = null;

  constructor(private readonly options: RateLimiterOptions) {}

  /** Number of buckets currently held in memory, across all bucket types. */
  get size(): number {
    let total = 0;
    for (const typeBuckets of this.buckets.values()) {
      total += typeBuckets.size;
    }
    return total;
  }

  check(type: BucketType, key: string, now = Date.now()): RateLimitResult {
    const config = this.options[type];

    if (!config) {
      return { allowed: true, retryAfter: 0 };
    }

    this.sweep(now);

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

  // A bucket that has refilled to capacity behaves exactly like one that was never
  // created, so dropping it changes no decision.
  private sweep(now: number): void {
    if (this.lastSweep === null) {
      this.lastSweep = now;
      return;
    }

    if (now - this.lastSweep < RATE_LIMIT_SWEEP_INTERVAL_MS) {
      return;
    }

    this.lastSweep = now;

    for (const [type, typeBuckets] of this.buckets) {
      const config = this.options[type];
      if (!config) {
        continue;
      }

      for (const [key, bucket] of typeBuckets) {
        const refilled = Math.floor((now - bucket.lastRefill) / config.refillInterval);
        if (bucket.tokens + refilled >= config.capacity) {
          typeBuckets.delete(key);
        }
      }
    }
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
