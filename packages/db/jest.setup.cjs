// Mock server-only module for testing
jest.mock("server-only", () => ({}));

// Mock Prisma Client
jest.mock("@prisma/client", () => {
  const mockPrismaClient = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(),
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    group: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    coinTransaction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    Prisma: {
      ModelName: {},
    },
  };
});
