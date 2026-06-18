const getEnvString = (value: unknown, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
};

export type RuntimeEnvInput = Record<string, unknown>;

export const createRuntimeEnv = (env: RuntimeEnvInput) => {
  const SUPABASE_URL = getEnvString(env.EXPO_PUBLIC_SUPABASE_URL, "SUPABASE_URL");
  const SUPABASE_ANON_KEY = getEnvString(env.EXPO_PUBLIC_SUPABASE_ANON_KEY, "SUPABASE_ANON_KEY");
  const TRPC_HTTP_URL = getEnvString(env.EXPO_PUBLIC_TRPC_API_URL, "TRPC_HTTP_URL");
  const TRPC_WS_URL = TRPC_HTTP_URL.replace(/^http/, "ws");
  const PRIVACY_POLICY_PUBLIC_URL = getEnvString(
    env.EXPO_PUBLIC_PRIVACY_POLICY_URL,
    "PRIVACY_POLICY_PUBLIC_URL",
  );
  return { SUPABASE_URL, SUPABASE_ANON_KEY, TRPC_HTTP_URL, TRPC_WS_URL, PRIVACY_POLICY_PUBLIC_URL };
};

// EXPO_PUBLIC_* vars are inlined by babel-preset-expo ONLY when referenced as
// static `process.env.EXPO_PUBLIC_X` dot-notation. Passing `process.env` into a
// function (env.EXPO_PUBLIC_X) defeats inlining -> undefined in release builds
// -> throw at import -> RCTFatal startup crash. Reference each var statically here.
const runtimeEnv = createRuntimeEnv({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_TRPC_API_URL: process.env.EXPO_PUBLIC_TRPC_API_URL,
  EXPO_PUBLIC_PRIVACY_POLICY_URL: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL,
});

export const SUPABASE_URL = runtimeEnv.SUPABASE_URL;
export const SUPABASE_ANON_KEY = runtimeEnv.SUPABASE_ANON_KEY;
export const TRPC_HTTP_URL = runtimeEnv.TRPC_HTTP_URL;
export const TRPC_WS_URL = runtimeEnv.TRPC_WS_URL;
export const PRIVACY_POLICY_PUBLIC_URL = runtimeEnv.PRIVACY_POLICY_PUBLIC_URL;
