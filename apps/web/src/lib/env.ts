// Helper to get env var from both import.meta.env (Vite/Astro) and process.env (Node/Bun)
const getEnv = (key: string): string | undefined => {
  // Try import.meta.env first (Vite/Astro environment)
  const importMetaEnv = (import.meta as any).env;
  if (importMetaEnv?.[key] !== undefined) {
    return importMetaEnv[key] as string;
  }
  // Fallback to process.env (Node/Bun test environment)
  return process.env[key];
};

const required = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  supabaseUrl: required(getEnv("PUBLIC_SUPABASE_URL"), "PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: required(
    getEnv("PUBLIC_SUPABASE_ANON_KEY"),
    "PUBLIC_SUPABASE_ANON_KEY",
  ),
  graphqlUrl: required(getEnv("PUBLIC_GRAPHQL_URL"), "PUBLIC_GRAPHQL_URL"),
  graphqlWsUrl:
    getEnv("PUBLIC_GRAPHQL_WS_URL") ??
    required(getEnv("PUBLIC_GRAPHQL_URL"), "PUBLIC_GRAPHQL_URL")
      .replace(/^https:/, "wss:")
      .replace(/^http:/, "ws:"),
};
