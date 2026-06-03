import { describe, it, expect } from "@jest/globals";

interface RuntimeEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  TRPC_HTTP_URL: string;
  TRPC_WS_URL: string;
  PRIVACY_POLICY_PUBLIC_URL: string;
}

const getEnvString = (value: unknown, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
};

const createRuntimeEnv = (env: Record<string, unknown>): RuntimeEnv => {
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

const baseEnv: Record<string, string | undefined> = {
  EXPO_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-key",
  EXPO_PUBLIC_TRPC_API_URL: "http://localhost:3000",
  EXPO_PUBLIC_PRIVACY_POLICY_URL: "http://localhost/privacy",
};

describe("runtimeEnv", () => {
  describe("SUPABASE_URL", () => {
    it("should throw error when EXPO_PUBLIC_SUPABASE_URL is missing", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_SUPABASE_URL: undefined };

      expect(() => createRuntimeEnv(env)).toThrow("Missing SUPABASE_URL environment variable");
    });

    it("should throw error when EXPO_PUBLIC_SUPABASE_URL is empty string", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_SUPABASE_URL: "" };

      expect(() => createRuntimeEnv(env)).toThrow("Missing SUPABASE_URL environment variable");
    });

    it("should successfully parse valid SUPABASE_URL", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_SUPABASE_URL: "https://test.supabase.co" };

      const runtimeEnv = createRuntimeEnv(env);
      expect(runtimeEnv.SUPABASE_URL).toBe("https://test.supabase.co");
    });
  });

  describe("SUPABASE_ANON_KEY", () => {
    it("should throw error when EXPO_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_SUPABASE_ANON_KEY: undefined };

      expect(() => createRuntimeEnv(env)).toThrow("Missing SUPABASE_ANON_KEY environment variable");
    });

    it("should throw error when EXPO_PUBLIC_SUPABASE_ANON_KEY is empty string", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_SUPABASE_ANON_KEY: "" };

      expect(() => createRuntimeEnv(env)).toThrow("Missing SUPABASE_ANON_KEY environment variable");
    });

    it("should successfully parse valid SUPABASE_ANON_KEY", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key-123" };

      const runtimeEnv = createRuntimeEnv(env);
      expect(runtimeEnv.SUPABASE_ANON_KEY).toBe("test-anon-key-123");
    });
  });

  describe("TRPC_HTTP_URL", () => {
    it("should throw error when EXPO_PUBLIC_TRPC_API_URL is missing", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_TRPC_API_URL: undefined };

      expect(() => createRuntimeEnv(env)).toThrow("Missing TRPC_HTTP_URL environment variable");
    });

    it("should throw error when EXPO_PUBLIC_TRPC_API_URL is empty string", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_TRPC_API_URL: "" };

      expect(() => createRuntimeEnv(env)).toThrow("Missing TRPC_HTTP_URL environment variable");
    });

    it("should successfully parse valid TRPC_HTTP_URL", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_TRPC_API_URL: "http://localhost:3000" };

      const runtimeEnv = createRuntimeEnv(env);
      expect(runtimeEnv.TRPC_HTTP_URL).toBe("http://localhost:3000");
    });
  });

  describe("TRPC_WS_URL", () => {
    it("should convert http URL to ws URL", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_TRPC_API_URL: "http://localhost:3000" };

      const runtimeEnv = createRuntimeEnv(env);
      expect(runtimeEnv.TRPC_WS_URL).toBe("ws://localhost:3000");
    });

    it("should convert https URL to wss URL", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_TRPC_API_URL: "https://api.example.com" };

      const runtimeEnv = createRuntimeEnv(env);
      expect(runtimeEnv.TRPC_WS_URL).toBe("wss://api.example.com");
    });

    it("should handle URLs with paths", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_TRPC_API_URL: "https://api.example.com/trpc" };

      const runtimeEnv = createRuntimeEnv(env);
      expect(runtimeEnv.TRPC_WS_URL).toBe("wss://api.example.com/trpc");
    });

    it("should handle URLs with ports", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_TRPC_API_URL: "http://localhost:2022/api" };

      const runtimeEnv = createRuntimeEnv(env);
      expect(runtimeEnv.TRPC_WS_URL).toBe("ws://localhost:2022/api");
    });
  });

  describe("PRIVACY_POLICY_PUBLIC_URL", () => {
    it("should throw error when EXPO_PUBLIC_PRIVACY_POLICY_URL is missing", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_PRIVACY_POLICY_URL: undefined };

      expect(() => createRuntimeEnv(env)).toThrow(
        "Missing PRIVACY_POLICY_PUBLIC_URL environment variable",
      );
    });

    it("should throw error when EXPO_PUBLIC_PRIVACY_POLICY_URL is empty string", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_PRIVACY_POLICY_URL: "" };

      expect(() => createRuntimeEnv(env)).toThrow(
        "Missing PRIVACY_POLICY_PUBLIC_URL environment variable",
      );
    });

    it("should successfully parse valid PRIVACY_POLICY_PUBLIC_URL", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_PRIVACY_POLICY_URL: "https://example.com/privacy" };

      const runtimeEnv = createRuntimeEnv(env);
      expect(runtimeEnv.PRIVACY_POLICY_PUBLIC_URL).toBe("https://example.com/privacy");
    });
  });

  describe("getEnvString helper", () => {
    it("should throw error for non-string values", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_SUPABASE_URL: 123 };

      expect(() => createRuntimeEnv(env)).toThrow("Missing SUPABASE_URL environment variable");
    });

    it("should throw error for undefined values", () => {
      const env = { ...baseEnv, EXPO_PUBLIC_SUPABASE_URL: undefined };

      expect(() => createRuntimeEnv(env)).toThrow("Missing SUPABASE_URL environment variable");
    });
  });

  describe("all environment variables valid", () => {
    it("should export all constants when all env vars are valid", () => {
      const env = {
        EXPO_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
        EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
        EXPO_PUBLIC_TRPC_API_URL: "https://api.example.com/trpc",
        EXPO_PUBLIC_PRIVACY_POLICY_URL: "https://example.com/privacy",
      };

      const runtimeEnv = createRuntimeEnv(env);

      expect(runtimeEnv.SUPABASE_URL).toBe("https://test.supabase.co");
      expect(runtimeEnv.SUPABASE_ANON_KEY).toBe("test-anon-key");
      expect(runtimeEnv.TRPC_HTTP_URL).toBe("https://api.example.com/trpc");
      expect(runtimeEnv.TRPC_WS_URL).toBe("wss://api.example.com/trpc");
      expect(runtimeEnv.PRIVACY_POLICY_PUBLIC_URL).toBe("https://example.com/privacy");
    });
  });
});
