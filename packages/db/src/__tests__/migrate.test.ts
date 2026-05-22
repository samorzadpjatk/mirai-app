import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "@mirai-app/shared";

const mockEnd = vi.fn().mockResolvedValue(undefined);
const mockPostgresClient = { end: mockEnd };
const mockDb = {};
const mockMigrate = vi.fn().mockResolvedValue(undefined);

vi.mock("postgres", () => ({
  default: vi.fn(() => mockPostgresClient),
}));

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: vi.fn(() => mockDb),
}));

vi.mock("drizzle-orm/postgres-js/migrator", () => ({
  migrate: mockMigrate,
}));

vi.mock("@mirai-app/shared", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.MIGRATIONS_FOLDER;
});

describe("migrate", () => {
  describe("runMigrations", () => {
    it("should run migrations with default folder", async () => {
      const { runMigrations } = await import("../migrate");
      const { default: postgres } = await import("postgres");
      const { drizzle } = await import("drizzle-orm/postgres-js");
      const { migrate } = await import("drizzle-orm/postgres-js/migrator");

      await runMigrations("postgresql://localhost/test");

      expect(postgres).toHaveBeenCalledWith("postgresql://localhost/test", { max: 1 });
      expect(drizzle).toHaveBeenCalledWith(mockPostgresClient);
      expect(migrate).toHaveBeenCalledWith(mockDb, { migrationsFolder: "/drizzle" });
      expect(logger.info).toHaveBeenCalledWith(
        { folder: "/drizzle" },
        "Starting database migrations",
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ elapsed: expect.any(Number) }),
        "Database migrations completed",
      );
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it("should run migrations with provided folder", async () => {
      const { runMigrations } = await import("../migrate");
      const { migrate } = await import("drizzle-orm/postgres-js/migrator");

      await runMigrations("postgresql://localhost/test", "/custom/migrations");

      expect(migrate).toHaveBeenCalledWith(mockDb, { migrationsFolder: "/custom/migrations" });
      expect(logger.info).toHaveBeenCalledWith(
        { folder: "/custom/migrations" },
        "Starting database migrations",
      );
    });

    it("should run migrations with MIGRATIONS_FOLDER env var", async () => {
      process.env.MIGRATIONS_FOLDER = "/env/migrations";
      const { runMigrations } = await import("../migrate");
      const { migrate } = await import("drizzle-orm/postgres-js/migrator");

      await runMigrations("postgresql://localhost/test");

      expect(migrate).toHaveBeenCalledWith(mockDb, { migrationsFolder: "/env/migrations" });
      expect(logger.info).toHaveBeenCalledWith(
        { folder: "/env/migrations" },
        "Starting database migrations",
      );
    });

    it("should prefer argument over env var", async () => {
      process.env.MIGRATIONS_FOLDER = "/env/migrations";
      const { runMigrations } = await import("../migrate");
      const { migrate } = await import("drizzle-orm/postgres-js/migrator");

      await runMigrations("postgresql://localhost/test", "/arg/migrations");

      expect(migrate).toHaveBeenCalledWith(mockDb, { migrationsFolder: "/arg/migrations" });
    });

    it("should log error and throw on migration failure", async () => {
      const error = new Error("Migration failed");
      mockMigrate.mockRejectedValueOnce(error);

      const { runMigrations } = await import("../migrate");

      await expect(runMigrations("postgresql://localhost/test")).rejects.toThrow("Migration failed");

      expect(logger.error).toHaveBeenCalledWith(error, "Database migrations failed");
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it("should close client even on error", async () => {
      const error = new Error("Migration failed");
      mockMigrate.mockRejectedValueOnce(error);

      const { runMigrations } = await import("../migrate");

      await expect(runMigrations("postgresql://localhost/test")).rejects.toThrow();

      expect(mockEnd).toHaveBeenCalledTimes(1);
    });
  });
});
