import { describe, it, expect, beforeEach } from "@jest/globals";

interface RuntimeEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  TRPC_HTTP_URL: string;
  TRPC_WS_URL: string;
  PRIVACY_POLICY_PUBLIC_URL: string;
}

describe("runtimeEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // Helper to import runtimeEnv in an isolated context
  const importRuntimeEnv = async (): Promise<RuntimeEnv> => {
    let module: RuntimeEnv | undefined;
    jest.isolateModules(() => {
      module = require("../runtimeEnv") as RuntimeEnv;
    });
    if (!module) {
      throw new Error("Failed to load runtimeEnv module");
    }
    return module;
  };

  describe("SUPABASE_URL", () => {
    it("should throw error when EXPO_PUBLIC_SUPABASE_URL is missing", async () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      await expect(importRuntimeEnv()).rejects.toThrow("Missing SUPABASE_URL environment variable");
    });

    it("should throw error when EXPO_PUBLIC_SUPABASE_URL is empty string", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      await expect(importRuntimeEnv()).rejects.toThrow("Missing SUPABASE_URL environment variable");
    });

    it("should successfully parse valid SUPABASE_URL", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = await importRuntimeEnv();
      expect(runtimeEnv.SUPABASE_URL).toBe("https://test.supabase.co");
    });
  });

  describe("SUPABASE_ANON_KEY", () => {
    it("should throw error when EXPO_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      await expect(importRuntimeEnv()).rejects.toThrow(
        "Missing SUPABASE_ANON_KEY environment variable",
      );
    });

    it("should throw error when EXPO_PUBLIC_SUPABASE_ANON_KEY is empty string", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      await expect(importRuntimeEnv()).rejects.toThrow(
        "Missing SUPABASE_ANON_KEY environment variable",
      );
    });

    it("should successfully parse valid SUPABASE_ANON_KEY", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key-123";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = await importRuntimeEnv();
      expect(runtimeEnv.SUPABASE_ANON_KEY).toBe("test-anon-key-123");
    });
  });

  describe("TRPC_HTTP_URL", () => {
    it("should throw error when EXPO_PUBLIC_TRPC_API_URL is missing", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      delete process.env.EXPO_PUBLIC_TRPC_API_URL;
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      await expect(importRuntimeEnv()).rejects.toThrow(
        "Missing TRPC_HTTP_URL environment variable",
      );
    });

    it("should throw error when EXPO_PUBLIC_TRPC_API_URL is empty string", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      await expect(importRuntimeEnv()).rejects.toThrow(
        "Missing TRPC_HTTP_URL environment variable",
      );
    });

    it("should successfully parse valid TRPC_HTTP_URL", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = await importRuntimeEnv();
      expect(runtimeEnv.TRPC_HTTP_URL).toBe("http://localhost:3000");
    });
  });

  describe("TRPC_WS_URL", () => {
    it("should convert http URL to ws URL", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = await importRuntimeEnv();
      expect(runtimeEnv.TRPC_WS_URL).toBe("ws://localhost:3000");
    });

    it("should convert https URL to wss URL", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "https://api.example.com";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = await importRuntimeEnv();
      expect(runtimeEnv.TRPC_WS_URL).toBe("wss://api.example.com");
    });

    it("should handle URLs with paths", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "https://api.example.com/trpc";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = await importRuntimeEnv();
      expect(runtimeEnv.TRPC_WS_URL).toBe("wss://api.example.com/trpc");
    });

    it("should handle URLs with ports", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:2022/api";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = await importRuntimeEnv();
      expect(runtimeEnv.TRPC_WS_URL).toBe("ws://localhost:2022/api");
    });
  });

  describe("PRIVACY_POLICY_PUBLIC_URL", () => {
    it("should throw error when EXPO_PUBLIC_PRIVACY_POLICY_URL is missing", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      delete process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;

      await expect(importRuntimeEnv()).rejects.toThrow(
        "Missing PRIVACY_POLICY_PUBLIC_URL environment variable",
      );
    });

    it("should throw error when EXPO_PUBLIC_PRIVACY_POLICY_URL is empty string", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "";

      await expect(importRuntimeEnv()).rejects.toThrow(
        "Missing PRIVACY_POLICY_PUBLIC_URL environment variable",
      );
    });

    it("should successfully parse valid PRIVACY_POLICY_PUBLIC_URL", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "https://example.com/privacy";

      const runtimeEnv = await importRuntimeEnv();
      expect(runtimeEnv.PRIVACY_POLICY_PUBLIC_URL).toBe("https://example.com/privacy");
    });
  });

  describe("getEnvString helper", () => {
    it("should throw error for non-string values", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).EXPO_PUBLIC_SUPABASE_URL = 123;
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      await expect(importRuntimeEnv()).rejects.toThrow("Missing SUPABASE_URL environment variable");
    });

    it("should throw error for undefined values", async () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      await expect(importRuntimeEnv()).rejects.toThrow("Missing SUPABASE_URL environment variable");
    });
  });

  describe("all environment variables valid", () => {
    it("should export all constants when all env vars are valid", async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "https://api.example.com/trpc";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "https://example.com/privacy";

      const runtimeEnv = await importRuntimeEnv();

      expect(runtimeEnv.SUPABASE_URL).toBe("https://test.supabase.co");
      expect(runtimeEnv.SUPABASE_ANON_KEY).toBe("test-anon-key");
      expect(runtimeEnv.TRPC_HTTP_URL).toBe("https://api.example.com/trpc");
      expect(runtimeEnv.TRPC_WS_URL).toBe("wss://api.example.com/trpc");
      expect(runtimeEnv.PRIVACY_POLICY_PUBLIC_URL).toBe("https://example.com/privacy");
    });
  });
});
