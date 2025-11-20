import { vi } from "vitest";

// Mock server-only module for testing
vi.mock("server-only", () => ({}));

// Mock Prisma Client
vi.mock("@prisma/client", () => {
  class MockPrismaClient {
    $connect = vi.fn().mockResolvedValue(undefined);
    $disconnect = vi.fn().mockResolvedValue(undefined);
    $transaction = vi.fn();
    user = {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    };
    group = {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    event = {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    coinTransaction = {
      findMany: vi.fn(),
      create: vi.fn(),
    };
    notification = {
      findMany: vi.fn(),
      create: vi.fn(),
    };
  }

  return {
    PrismaClient: MockPrismaClient,
    Prisma: {
      ModelName: {},
    },
  };
});
