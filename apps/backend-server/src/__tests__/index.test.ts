import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@mirai-app/db", () => ({
  runMigrations: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@mirai-app/shared/utils", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../config", () => ({
  serverConfig: { dev: true, port: 3000, prefix: "/api/trpc", host: "127.0.0.1" },
}));

const createServerMock = vi.fn(() => ({
  app: {},
  start: vi.fn(),
  stop: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server", () => ({
  createServer: createServerMock,
}));

describe("main entry point", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.MIGRATIONS_FOLDER;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    createServerMock.mockClear();
  });

  it("should run migrations and start server", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    delete process.env.MIGRATIONS_FOLDER;
    const { runMigrations } = await import("@mirai-app/db");
    const { main } = await import("../index");

    await main();

    expect(runMigrations).toHaveBeenCalledWith(
      "postgresql://localhost:5432/test",
      undefined,
      expect.any(Object),
    );
    const server = createServerMock.mock.results[0]?.value;
    expect(server?.start).toHaveBeenCalled();
  });

  it("should throw when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", undefined);
    vi.stubEnv("TRPC_SERVER_PORT", "3000");
    vi.stubEnv("TRPC_SERVER_HOST", "127.0.0.1");
    delete process.env.MIGRATIONS_FOLDER;

    const { main } = await import("../index");
    await expect(main()).rejects.toThrow("Missing DATABASE_URL");
  });

  it("should pass migrations folder from env", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    vi.stubEnv("MIGRATIONS_FOLDER", "/custom/migrations");
    const { runMigrations } = await import("@mirai-app/db");
    const { main } = await import("../index");

    await main();

    expect(runMigrations).toHaveBeenCalledWith(
      "postgresql://localhost:5432/test",
      "/custom/migrations",
      expect.any(Object),
    );
  });
});
