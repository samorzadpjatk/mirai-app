const getEnvString = (value: unknown, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
};

export const createRuntimeEnv = (env: NodeJS.ProcessEnv) => {
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

const runtimeEnv = createRuntimeEnv(process.env);

export const SUPABASE_URL = runtimeEnv.SUPABASE_URL;
export const SUPABASE_ANON_KEY = runtimeEnv.SUPABASE_ANON_KEY;
export const TRPC_HTTP_URL = runtimeEnv.TRPC_HTTP_URL;
export const TRPC_WS_URL = runtimeEnv.TRPC_WS_URL;
export const PRIVACY_POLICY_PUBLIC_URL = runtimeEnv.PRIVACY_POLICY_PUBLIC_URL;
