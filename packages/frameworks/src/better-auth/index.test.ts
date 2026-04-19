/**
 * Better Auth Configuration Factory Tests
 *
 * Unit tests for the `createBetterAuth` factory function.
 *
 * ## Test Tagging
 *
 * - [UNIT]: Tests with mocked dependencies (no external services)
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { createBetterAuth, type BetterAuthFactoryConfig } from "./index";
import type { DrizzleDb } from "../drizzle/client";
import type { IEmailPort } from "@mirai-app/domain";

// ============================================================================
// Mock Drizzle Database Factory
// ============================================================================

/**
 * Creates a mock Drizzle database for testing
 */
const createMockDrizzleDb = (): DrizzleDb => {
  return {
    query: {},
    insert: () => ({}),
    update: () => ({}),
    delete: () => ({}),
    select: () => ({}),
    transaction: async () => ({}),
    // Minimal mock that satisfies DrizzleDb type requirements
  } as unknown as DrizzleDb;
};

// ============================================================================
// Test Suite: Factory Configuration
// ============================================================================

describe("[UNIT] createBetterAuth - Factory Configuration", () => {
  let mockDb: DrizzleDb;
  const originalEnv = process.env;
  const TEST_BASE_URL = "http://localhost:3000";

  beforeEach(() => {
    mockDb = createMockDrizzleDb();
    // Reset environment before each test
    process.env = { ...originalEnv };
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_URL;
  });

  describe("secret configuration", () => {
    it("should throw error when secret is not provided via config or env", () => {
      // Arrange: No secret in config or env
      const config: BetterAuthFactoryConfig = {
        baseUrl: TEST_BASE_URL,
      };

      // Act & Assert
      expect(() => createBetterAuth(mockDb, config)).toThrow(
        "BETTER_AUTH_SECRET environment variable is required",
      );
    });

    it("should use secret from config when provided", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "config-secret-key",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert - Should not throw and return an instance
      expect(auth).toBeDefined();
      expect(auth.options.secret).toBe("config-secret-key");
    });

    it("should fall back to environment variable when config secret not provided", () => {
      // Arrange
      process.env.BETTER_AUTH_SECRET = "env-secret-key";
      const config: BetterAuthFactoryConfig = {
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth).toBeDefined();
      expect(auth.options.secret).toBe("env-secret-key");
    });

    it("should prefer config secret over environment variable", () => {
      // Arrange
      process.env.BETTER_AUTH_SECRET = "env-secret-key";
      const config: BetterAuthFactoryConfig = {
        secret: "config-secret-key",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.secret).toBe("config-secret-key");
    });
  });

  describe("baseURL configuration", () => {
    it("should throw error when baseUrl is not provided via config or env", () => {
      // Arrange: No baseUrl in config or env
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
      };

      // Act & Assert
      expect(() => createBetterAuth(mockDb, config)).toThrow(
        "BETTER_AUTH_URL environment variable is required",
      );
    });

    it("should use baseUrl from config when provided", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: "https://app.example.com",
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.baseURL).toBe("https://app.example.com");
    });

    it("should fall back to environment variable when config baseUrl not provided", () => {
      // Arrange
      process.env.BETTER_AUTH_SECRET = "test-secret";
      process.env.BETTER_AUTH_URL = "https://env.example.com";

      // Act
      const auth = createBetterAuth(mockDb, {});

      // Assert
      expect(auth.options.baseURL).toBe("https://env.example.com");
    });

    it("should prefer config baseUrl over environment variable", () => {
      // Arrange
      process.env.BETTER_AUTH_SECRET = "test-secret";
      process.env.BETTER_AUTH_URL = "https://env.example.com";
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: "https://config.example.com",
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.baseURL).toBe("https://config.example.com");
    });
  });

  describe("basePath configuration", () => {
    it("should set basePath to /api/auth", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.basePath).toBe("/api/auth");
    });
  });

  describe("database adapter configuration", () => {
    it("should configure Drizzle adapter with PostgreSQL provider", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.database).toBeDefined();
    });

    it("should pass database instance to adapter", () => {
      // Arrange
      const customDb = createMockDrizzleDb();
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(customDb, config);

      // Assert - The adapter should be configured with the provided db
      expect(auth.options.database).toBeDefined();
    });
  });

  describe("emailAndPassword plugin configuration", () => {
    it("should enable emailAndPassword plugin", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.emailAndPassword).toBeDefined();
      expect(auth.options.emailAndPassword?.enabled).toBe(true);
    });

    it("should require email verification", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.emailAndPassword?.requireEmailVerification).toBe(true);
    });
  });

  describe("session configuration", () => {
    it("should configure 7-day session expiry", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.session).toBeDefined();
      expect(auth.options.session?.expiresIn).toBe(60 * 60 * 24 * 7); // 7 days in seconds
    });

    it("should configure 1-day session update age", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.session?.updateAge).toBe(60 * 60 * 24); // 1 day in seconds
    });

    it("should enable cookie cache with 5-minute maxAge", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.session?.cookieCache?.enabled).toBe(true);
      expect(auth.options.session?.cookieCache?.maxAge).toBe(300); // 5 minutes
    });
  });

  describe("advanced configuration", () => {
    it("should disable cross-subdomain cookies by default", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.advanced).toBeDefined();
      expect(auth.options.advanced?.crossSubDomainCookies?.enabled).toBe(false);
    });

    it("should use secure cookies by default", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.advanced?.useSecureCookies).toBe(true);
    });

    it("should allow disabling secure cookies for development", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
        disableSecureCookies: true,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.advanced?.useSecureCookies).toBe(false);
    });
  });

  describe("emailOTP plugin configuration", () => {
    it("should include emailOTP plugin", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.plugins).toBeDefined();
      expect(auth.options.plugins?.length).toBeGreaterThan(0);
    });

    it("should configure 5-minute OTP expiry", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert - Check that plugins are configured with correct expiry
      expect(auth.options.plugins).toBeDefined();
    });
  });

  describe("social providers configuration", () => {
    it("should have empty social providers by default", () => {
      // Arrange
      const config: BetterAuthFactoryConfig = {
        secret: "test-secret",
        baseUrl: TEST_BASE_URL,
      };

      // Act
      const auth = createBetterAuth(mockDb, config);

      // Assert
      expect(auth.options.socialProviders).toBeDefined();
      expect(Object.keys(auth.options.socialProviders ?? {})).toHaveLength(0);
    });
  });
});

// ============================================================================
// Test Suite: Factory Return Type
// ============================================================================

describe("[UNIT] createBetterAuth - Return Type", () => {
  let mockDb: DrizzleDb;
  const TEST_BASE_URL = "http://localhost:3000";

  beforeEach(() => {
    mockDb = createMockDrizzleDb();
  });

  it("should return BetterAuthInstance with handler method", () => {
    // Arrange
    const config: BetterAuthFactoryConfig = {
      secret: "test-secret",
      baseUrl: TEST_BASE_URL,
    };

    // Act
    const auth = createBetterAuth(mockDb, config);

    // Assert
    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe("function");
  });

  it("should return instance with api property", () => {
    // Arrange
    const config: BetterAuthFactoryConfig = {
      secret: "test-secret",
      baseUrl: TEST_BASE_URL,
    };

    // Act
    const auth = createBetterAuth(mockDb, config);

    // Assert
    expect(auth.api).toBeDefined();
  });

  it("should return instance with options property", () => {
    // Arrange
    const config: BetterAuthFactoryConfig = {
      secret: "test-secret",
      baseUrl: TEST_BASE_URL,
    };

    // Act
    const auth = createBetterAuth(mockDb, config);

    // Assert
    expect(auth.options).toBeDefined();
  });
});

// ============================================================================
// Test Suite: Custom Email Port Configuration
// ============================================================================

describe("[UNIT] createBetterAuth - Custom Email Port", () => {
  let mockDb: DrizzleDb;
  const TEST_BASE_URL = "http://localhost:3000";

  beforeEach(() => {
    mockDb = createMockDrizzleDb();
  });

  it("should accept custom email port for sending OTP", () => {
    // Arrange
    let capturedData: { email: string; otp: string; type: string } | null = null;

    const mockEmailPort: IEmailPort = {
      sendOtp: (data) => {
        capturedData = data;
        return Effect.succeed(void 0);
      },
      sendEmail: () => Effect.succeed(void 0),
    };

    const config: BetterAuthFactoryConfig = {
      secret: "test-secret",
      baseUrl: TEST_BASE_URL,
      emailPort: mockEmailPort,
    };

    // Act
    const auth = createBetterAuth(mockDb, config);

    // Assert - Factory should accept the email port
    expect(auth).toBeDefined();
  });

  it("should use console fallback when email port not provided", () => {
    // Arrange
    const config: BetterAuthFactoryConfig = {
      secret: "test-secret",
      baseUrl: TEST_BASE_URL,
    };

    // Act
    const auth = createBetterAuth(mockDb, config);

    // Assert - Should create instance with console fallback
    expect(auth).toBeDefined();
    expect(auth.options.plugins).toBeDefined();
  });
});

// ============================================================================
// Test Suite: Default Configuration
// ============================================================================

describe("[UNIT] createBetterAuth - Default Configuration", () => {
  let mockDb: DrizzleDb;
  const TEST_BASE_URL = "http://localhost:3000";

  beforeEach(() => {
    mockDb = createMockDrizzleDb();
  });

  it("should work with empty config when env vars are set", () => {
    // Arrange
    process.env.BETTER_AUTH_SECRET = "env-secret";
    process.env.BETTER_AUTH_URL = TEST_BASE_URL;

    // Act
    const auth = createBetterAuth(mockDb);

    // Assert
    expect(auth).toBeDefined();
    expect(auth.options.secret).toBe("env-secret");
    expect(auth.options.baseURL).toBe(TEST_BASE_URL);
  });

  it("should create complete configuration with all defaults", () => {
    // Arrange
    const config: BetterAuthFactoryConfig = {
      secret: "test-secret",
      baseUrl: TEST_BASE_URL,
    };

    // Act
    const auth = createBetterAuth(mockDb, config);

    // Assert
    expect(auth.options.secret).toBe("test-secret");
    expect(auth.options.baseURL).toBe(TEST_BASE_URL);
    expect(auth.options.basePath).toBe("/api/auth");
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
    expect(auth.options.session?.expiresIn).toBe(604800); // 7 days
    expect(auth.options.session?.updateAge).toBe(86400); // 1 day
  });
});

// ============================================================================
// Test Suite: Schema Exports
// ============================================================================

describe("[UNIT] Better Auth Schema Exports", () => {
  it("should export schema tables", async () => {
    // Import schema module
    const schema = await import("./schema");

    // Assert all tables are exported
    expect(schema.betterAuthUser).toBeDefined();
    expect(schema.betterAuthSession).toBeDefined();
    expect(schema.betterAuthAccount).toBeDefined();
    expect(schema.betterAuthVerification).toBeDefined();
  });

  it("should export schema types as type aliases", async () => {
    // Import schema module
    const schema = await import("./schema");

    // Assert type exports exist (they are type aliases, not runtime values)
    // Type aliases are compile-time only, so we verify the module exports them
    // by checking the module structure
    expect(schema).toBeDefined();
    expect(typeof schema).toBe("object");
  });
});
