describe("env utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("environment variable validation", () => {
    it("should validate DATABASE_URL as a URL", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN = "test-token";
      process.env.AUTHENTIK_ISSUER = "http://localhost:9000";
      process.env.ADMIN_ROLE = "admin";
      process.env.MODERATOR_ROLE = "moderator";
      process.env.TECH_ROLE = "tech";
      process.env.SERVICE_ACCOUNT_ROLE = "service";

      const { env } = require("../utils/env");
      
      expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
    });

    it("should throw error when DATABASE_URL is not a valid URL", () => {
      process.env.DATABASE_URL = "not-a-url";
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN = "test-token";
      process.env.AUTHENTIK_ISSUER = "http://localhost:9000";
      process.env.ADMIN_ROLE = "admin";
      process.env.MODERATOR_ROLE = "moderator";
      process.env.TECH_ROLE = "tech";
      process.env.SERVICE_ACCOUNT_ROLE = "service";

      expect(() => {
        require("../utils/env");
      }).toThrow();
    });

    it("should validate AUTHENTIK_ISSUER as a URL", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN = "test-token";
      process.env.AUTHENTIK_ISSUER = "http://localhost:9000";
      process.env.ADMIN_ROLE = "admin";
      process.env.MODERATOR_ROLE = "moderator";
      process.env.TECH_ROLE = "tech";
      process.env.SERVICE_ACCOUNT_ROLE = "service";

      const { env } = require("../utils/env");
      
      expect(env.AUTHENTIK_ISSUER).toBe("http://localhost:9000");
    });

    it("should require AUTHENTIK_SERVICE_ACCOUNT_TOKEN as a string", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN = "test-token-123";
      process.env.AUTHENTIK_ISSUER = "http://localhost:9000";
      process.env.ADMIN_ROLE = "admin";
      process.env.MODERATOR_ROLE = "moderator";
      process.env.TECH_ROLE = "tech";
      process.env.SERVICE_ACCOUNT_ROLE = "service";

      const { env } = require("../utils/env");
      
      expect(env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN).toBe("test-token-123");
    });

    it("should default NODE_ENV to development", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN = "test-token";
      process.env.AUTHENTIK_ISSUER = "http://localhost:9000";
      process.env.ADMIN_ROLE = "admin";
      process.env.MODERATOR_ROLE = "moderator";
      process.env.TECH_ROLE = "tech";
      process.env.SERVICE_ACCOUNT_ROLE = "service";
      delete process.env.NODE_ENV;

      const { env } = require("../utils/env");
      
      expect(env.NODE_ENV).toBe("development");
    });

    it("should validate NODE_ENV as enum", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN = "test-token";
      process.env.AUTHENTIK_ISSUER = "http://localhost:9000";
      process.env.NODE_ENV = "production";
      process.env.ADMIN_ROLE = "admin";
      process.env.MODERATOR_ROLE = "moderator";
      process.env.TECH_ROLE = "tech";
      process.env.SERVICE_ACCOUNT_ROLE = "service";

      const { env } = require("../utils/env");
      
      expect(env.NODE_ENV).toBe("production");
    });

    it("should validate all role environment variables", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN = "test-token";
      process.env.AUTHENTIK_ISSUER = "http://localhost:9000";
      process.env.ADMIN_ROLE = "admin-role";
      process.env.MODERATOR_ROLE = "mod-role";
      process.env.TECH_ROLE = "tech-role";
      process.env.SERVICE_ACCOUNT_ROLE = "service-role";

      const { env } = require("../utils/env");
      
      expect(env.ADMIN_ROLE).toBe("admin-role");
      expect(env.MODERATOR_ROLE).toBe("mod-role");
      expect(env.TECH_ROLE).toBe("tech-role");
      expect(env.SERVICE_ACCOUNT_ROLE).toBe("service-role");
    });

    it("should throw error when required environment variables are missing", () => {
      delete process.env.DATABASE_URL;
      delete process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN;
      delete process.env.AUTHENTIK_ISSUER;
      delete process.env.ADMIN_ROLE;

      expect(() => {
        require("../utils/env");
      }).toThrow();
    });

    it("should skip validation when SKIP_ENV_VALIDATION is set", () => {
      process.env.SKIP_ENV_VALIDATION = "1";
      delete process.env.DATABASE_URL;
      delete process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN;

      // Should not throw even with missing required variables
      expect(() => {
        require("../utils/env");
      }).not.toThrow();
    });

    it("should treat empty strings as undefined when emptyStringAsUndefined is true", () => {
      process.env.DATABASE_URL = "";
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN = "test-token";
      process.env.AUTHENTIK_ISSUER = "http://localhost:9000";
      process.env.ADMIN_ROLE = "admin";
      process.env.MODERATOR_ROLE = "moderator";
      process.env.TECH_ROLE = "tech";
      process.env.SERVICE_ACCOUNT_ROLE = "service";

      expect(() => {
        require("../utils/env");
      }).toThrow();
    });
  });

  describe("environment variable structure", () => {
    beforeEach(() => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN = "test-token";
      process.env.AUTHENTIK_ISSUER = "http://localhost:9000";
      process.env.ADMIN_ROLE = "admin";
      process.env.MODERATOR_ROLE = "moderator";
      process.env.TECH_ROLE = "tech";
      process.env.SERVICE_ACCOUNT_ROLE = "service";
    });

    it("should export env object with all required properties", () => {
      const { env } = require("../utils/env");
      
      expect(env).toHaveProperty("DATABASE_URL");
      expect(env).toHaveProperty("NODE_ENV");
      expect(env).toHaveProperty("AUTHENTIK_SERVICE_ACCOUNT_TOKEN");
      expect(env).toHaveProperty("AUTHENTIK_ISSUER");
      expect(env).toHaveProperty("ADMIN_ROLE");
      expect(env).toHaveProperty("MODERATOR_ROLE");
      expect(env).toHaveProperty("TECH_ROLE");
      expect(env).toHaveProperty("SERVICE_ACCOUNT_ROLE");
    });

    it("should have correct types for environment variables", () => {
      const { env } = require("../utils/env");
      
      expect(typeof env.DATABASE_URL).toBe("string");
      expect(typeof env.NODE_ENV).toBe("string");
      expect(typeof env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN).toBe("string");
      expect(typeof env.AUTHENTIK_ISSUER).toBe("string");
      expect(typeof env.ADMIN_ROLE).toBe("string");
      expect(typeof env.MODERATOR_ROLE).toBe("string");
      expect(typeof env.TECH_ROLE).toBe("string");
      expect(typeof env.SERVICE_ACCOUNT_ROLE).toBe("string");
    });
  });
});
