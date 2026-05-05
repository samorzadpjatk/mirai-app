import { describe, it, expect, beforeEach, jest } from "@jest/globals";

describe("runtimeEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("SUPABASE_URL", () => {
    it("should throw error when EXPO_PUBLIC_SUPABASE_URL is missing", () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      expect(() => {
        require("../runtimeEnv");
      }).toThrow("Missing SUPABASE_URL environment variable");
    });

    it("should throw error when EXPO_PUBLIC_SUPABASE_URL is empty string", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      expect(() => {
        require("../runtimeEnv");
      }).toThrow("Missing SUPABASE_URL environment variable");
    });

    it("should successfully parse valid SUPABASE_URL", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = require("../runtimeEnv");
      expect(runtimeEnv.SUPABASE_URL).toBe("https://test.supabase.co");
    });
  });

  describe("SUPABASE_ANON_KEY", () => {
    it("should throw error when EXPO_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      expect(() => {
        require("../runtimeEnv");
      }).toThrow("Missing SUPABASE_ANON_KEY environment variable");
    });

    it("should throw error when EXPO_PUBLIC_SUPABASE_ANON_KEY is empty string", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      expect(() => {
        require("../runtimeEnv");
      }).toThrow("Missing SUPABASE_ANON_KEY environment variable");
    });

    it("should successfully parse valid SUPABASE_ANON_KEY", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key-123";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = require("../runtimeEnv");
      expect(runtimeEnv.SUPABASE_ANON_KEY).toBe("test-anon-key-123");
    });
  });

  describe("TRPC_HTTP_URL", () => {
    it("should throw error when EXPO_PUBLIC_TRPC_API_URL is missing", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      delete process.env.EXPO_PUBLIC_TRPC_API_URL;
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      expect(() => {
        require("../runtimeEnv");
      }).toThrow("Missing TRPC_HTTP_URL environment variable");
    });

    it("should throw error when EXPO_PUBLIC_TRPC_API_URL is empty string", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      expect(() => {
        require("../runtimeEnv");
      }).toThrow("Missing TRPC_HTTP_URL environment variable");
    });

    it("should successfully parse valid TRPC_HTTP_URL", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = require("../runtimeEnv");
      expect(runtimeEnv.TRPC_HTTP_URL).toBe("http://localhost:3000");
    });
  });

  describe("TRPC_WS_URL", () => {
    it("should convert http URL to ws URL", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = require("../runtimeEnv");
      expect(runtimeEnv.TRPC_WS_URL).toBe("ws://localhost:3000");
    });

    it("should convert https URL to wss URL", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "https://api.example.com";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = require("../runtimeEnv");
      expect(runtimeEnv.TRPC_WS_URL).toBe("wss://api.example.com");
    });

    it("should handle URLs with paths", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "https://api.example.com/trpc";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = require("../runtimeEnv");
      expect(runtimeEnv.TRPC_WS_URL).toBe("wss://api.example.com/trpc");
    });

    it("should handle URLs with ports", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:2022/api";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      const runtimeEnv = require("../runtimeEnv");
      expect(runtimeEnv.TRPC_WS_URL).toBe("ws://localhost:2022/api");
    });
  });

  describe("PRIVACY_POLICY_PUBLIC_URL", () => {
    it("should throw error when EXPO_PUBLIC_PRIVACY_POLICY_URL is missing", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      delete process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;

      expect(() => {
        require("../runtimeEnv");
      }).toThrow("Missing PRIVACY_POLICY_PUBLIC_URL environment variable");
    });

    it("should throw error when EXPO_PUBLIC_PRIVACY_POLICY_URL is empty string", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "";

      expect(() => {
        require("../runtimeEnv");
      }).toThrow("Missing PRIVACY_POLICY_PUBLIC_URL environment variable");
    });

    it("should successfully parse valid PRIVACY_POLICY_PUBLIC_URL", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "https://example.com/privacy";

      const runtimeEnv = require("../runtimeEnv");
      expect(runtimeEnv.PRIVACY_POLICY_PUBLIC_URL).toBe("https://example.com/privacy");
    });
  });

  describe("getEnvString helper", () => {
    it("should throw error for non-string values", () => {
      // @ts-expect-error - Testing invalid type
      process.env.EXPO_PUBLIC_SUPABASE_URL = 123;
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      expect(() => {
        require("../runtimeEnv");
      }).toThrow("Missing SUPABASE_URL environment variable");
    });

    it("should throw error for undefined values", () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3000";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "http://localhost/privacy";

      expect(() => {
        require("../runtimeEnv");
      }).toThrow("Missing SUPABASE_URL environment variable");
    });
  });

  describe("all environment variables valid", () => {
    it("should export all constants when all env vars are valid", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.EXPO_PUBLIC_TRPC_API_URL = "https://api.example.com/trpc";
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "https://example.com/privacy";

      const runtimeEnv = require("../runtimeEnv");

      expect(runtimeEnv.SUPABASE_URL).toBe("https://test.supabase.co");
      expect(runtimeEnv.SUPABASE_ANON_KEY).toBe("test-anon-key");
      expect(runtimeEnv.TRPC_HTTP_URL).toBe("https://api.example.com/trpc");
      expect(runtimeEnv.TRPC_WS_URL).toBe("wss://api.example.com/trpc");
      expect(runtimeEnv.PRIVACY_POLICY_PUBLIC_URL).toBe("https://example.com/privacy");
    });
  });
});
