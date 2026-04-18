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

export const GRAPHQL_HTTP_URL = getEnvString(
  process.env.EXPO_PUBLIC_GRAPHQL_URL,
  "GRAPHQL_HTTP_URL",
);

export const GRAPHQL_WS_URL = GRAPHQL_HTTP_URL.replace(/^http/, "ws");

// Better Auth API base URL (same as GraphQL endpoint base)
export const BETTER_AUTH_URL = GRAPHQL_HTTP_URL.replace(/\/graphql$/, "");

export const PRIVACY_POLICY_PUBLIC_URL = getEnvString(
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL,
  "PRIVACY_POLICY_PUBLIC_URL",
);
