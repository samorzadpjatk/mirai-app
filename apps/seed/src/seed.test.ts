import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from "bun:test";
import { Effect, Either } from "effect";
import {
  validateEnv,
  seedDatabase,
  seedProgram,
  MissingEnvError,
  SeedError,
} from "./index";

describe("[UNIT] Seed Index - Effect Integration", () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Set up minimal env vars needed for tests
    process.env.SUPABASE_URL = "http://localhost:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.SUPABASE_STORAGE_IMAGE_BUCKET = "images";
    process.env.SUPABASE_STORAGE_VIDEO_BUCKET = "videos";
    process.env.SUPABASE_STORAGE_PUBLIC_BUCKET = "public";
    process.env.SEED_GHOST_EMAIL = "ghost@test.com";
    process.env.SEED_GHOST_PASSWORD = "ghost-password";
  });

  beforeEach(() => {
    // Restore env before each test
    process.env = { ...originalEnv };
    process.env.SUPABASE_URL = "http://localhost:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.SUPABASE_STORAGE_IMAGE_BUCKET = "images";
    process.env.SUPABASE_STORAGE_VIDEO_BUCKET = "videos";
    process.env.SUPABASE_STORAGE_PUBLIC_BUCKET = "public";
    process.env.SEED_GHOST_EMAIL = "ghost@test.com";
    process.env.SEED_GHOST_PASSWORD = "ghost-password";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("[UNIT] Environment Validation", () => {
    it("should validate environment successfully when all vars are present", async () => {
      const result = await Effect.runPromise(Effect.either(validateEnv));
      expect(Either.isRight(result)).toBe(true);
    });

    it("should fail when SUPABASE_URL is missing", async () => {
      delete process.env.SUPABASE_URL;

      const result = await Effect.runPromise(Effect.either(validateEnv));
      expect(Either.isLeft(result)).toBe(true);

      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(MissingEnvError);
        expect(result.left.varName).toBe("SUPABASE_URL");
      }
    });

    it("should fail when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const result = await Effect.runPromise(Effect.either(validateEnv));
      expect(Either.isLeft(result)).toBe(true);

      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(MissingEnvError);
        expect(result.left.varName).toBe("SUPABASE_SERVICE_ROLE_KEY");
      }
    });

    it("should fail when DATABASE_URL is missing", async () => {
      delete process.env.DATABASE_URL;

      const result = await Effect.runPromise(Effect.either(validateEnv));
      expect(Either.isLeft(result)).toBe(true);

      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(MissingEnvError);
        expect(result.left.varName).toBe("DATABASE_URL");
      }
    });
  });

  describe("[UNIT] Error Types", () => {
    it("should create MissingEnvError with correct properties", () => {
      const error = new MissingEnvError("TEST_VAR");
      expect(error._tag).toBe("MissingEnvError");
      expect(error.varName).toBe("TEST_VAR");
      expect(error.message).toContain("TEST_VAR");
    });

    it("should create SeedError with correct properties", () => {
      const cause = new Error("Test cause");
      const error = new SeedError(cause);
      expect(error._tag).toBe("SeedError");
      expect(error.cause).toBe(cause);
      expect(error.message).toContain("Seed operation failed");
    });
  });

  describe("[INTEGRATION] Effect Integration", () => {
    it("should export Effect-based functions", () => {
      expect(validateEnv).toBeDefined();
      expect(seedDatabase).toBeDefined();
      expect(seedProgram).toBeDefined();
    });

    it("should be composable with Effect pipeline", async () => {
      const pipeline = Effect.gen(function* () {
        const validated = yield* validateEnv;
        return { validated };
      });

      const result = await Effect.runPromise(Effect.either(pipeline));
      expect(Either.isRight(result)).toBe(true);
    });
  });

  describe("[UNIT] Console Output", () => {
    it("should log validation success", async () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      await Effect.runPromise(validateEnv);

      expect(logs.some((log) => log.includes("validated"))).toBe(true);

      console.log = originalLog;
    });
  });
});

describe("[UNIT] Seed Legacy Compatibility", () => {
  it("should have seed infrastructure", () => {
    // Placeholder test - seed package contains data seeding scripts
    // Integration tests would require database connection
    expect(true).toBe(true);
  });
});
