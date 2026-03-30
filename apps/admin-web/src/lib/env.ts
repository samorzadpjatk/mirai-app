const required = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  supabaseUrl: required(
    import.meta.env.PUBLIC_SUPABASE_URL,
    "PUBLIC_SUPABASE_URL",
  ),
  supabaseAnonKey: required(
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    "PUBLIC_SUPABASE_ANON_KEY",
  ),
  trpcUrl: required(import.meta.env.PUBLIC_TRPC_API_URL, "PUBLIC_TRPC_API_URL"),
  trpcWsUrl:
    import.meta.env.PUBLIC_TRPC_WS_URL ||
    required(import.meta.env.PUBLIC_TRPC_API_URL, "PUBLIC_TRPC_API_URL")
      .replace(/^https:/, "wss:")
      .replace(/^http:/, "ws:"),
};
