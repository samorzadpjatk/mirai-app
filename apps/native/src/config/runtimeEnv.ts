const getEnvString = (value: unknown, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
};

export const SUPABASE_URL = getEnvString(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  "SUPABASE_URL",
);

export const SUPABASE_ANON_KEY = getEnvString(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  "SUPABASE_ANON_KEY",
);

export const TRPC_HTTP_URL = getEnvString(
  process.env.EXPO_PUBLIC_TRPC_API_URL,
  "TRPC_HTTP_URL",
);

export const TRPC_WS_URL = TRPC_HTTP_URL.replace(/^http/, "ws");
