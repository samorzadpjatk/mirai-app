export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

export const TEN_MB = 10 * 1024 * 1024;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const GLOBAL_RATE_LIMIT = 600;
export const AUTH_RATE_LIMIT = 30;

export function getClientIp(headers: Record<string, string | undefined>): string {
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return headers["x-real-ip"] ?? "unknown";
}

export function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  ip: string,
  isAuthEndpoint: boolean,
  now: number = Date.now(),
  windowMs: number = RATE_LIMIT_WINDOW_MS,
  globalLimit: number = GLOBAL_RATE_LIMIT,
  authLimit: number = AUTH_RATE_LIMIT,
): RateLimitResult {
  const globalKey = `${ip}:global`;
  const globalEntry = store.get(globalKey);

  if (!globalEntry || now > globalEntry.resetTime) {
    store.set(globalKey, { count: 1, resetTime: now + windowMs });
  } else if (globalEntry.count >= globalLimit) {
    const retryAfter = Math.ceil((globalEntry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  } else {
    globalEntry.count++;
  }

  if (isAuthEndpoint) {
    const authKey = `${ip}:auth`;
    const authEntry = store.get(authKey);

    if (!authEntry || now > authEntry.resetTime) {
      store.set(authKey, { count: 1, resetTime: now + windowMs });
    } else if (authEntry.count >= authLimit) {
      return { allowed: false, retryAfter: Math.ceil((authEntry.resetTime - now) / 1000) };
    } else {
      authEntry.count++;
    }
  }

  return { allowed: true, retryAfter: 0 };
}

export function createRateLimiter() {
  const store = new Map<string, RateLimitEntry>();
  return {
    checkRateLimit: (ip: string, isAuthEndpoint: boolean) =>
      checkRateLimit(store, ip, isAuthEndpoint),
  };
}

export function buildSecurityHeaders(): Record<string, string> {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'self'",
  };
}

export interface WsAuthPayload {
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
