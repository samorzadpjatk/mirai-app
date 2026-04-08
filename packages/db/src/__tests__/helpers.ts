import { createDb } from "../index.ts";
import type { PrismaClient } from "../src/prisma/lib/client.ts";

const db = createDb(
  process.env.DATABASE_URL ??
    "postgresql://test:test@localhost:5433/mirai_test",
);

export { db };

export async function withTestTransaction<T>(
  fn: (client: PrismaClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(async (tx) => {
    try {
      return await fn(tx as PrismaClient);
    } finally {
      await tx.$rollBack();
    }
  });
}

export async function createTestUser(
  overrides: Partial<{
    authUserId: string;
    firstName: string;
    lastName: string;
  }> = {},
) {
  const { faker } = await import("@faker-js/faker");
  return db.user.create({
    data: {
      authUserId: overrides.authUserId ?? faker.string.uuid(),
      firstName: overrides.firstName ?? faker.person.firstName(),
      lastName: overrides.lastName ?? faker.person.lastName(),
    },
  });
}

export async function createTestTrip(
  overrides: Partial<{
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }> = {},
) {
  const { faker } = await import("@faker-js/faker");
  const now = new Date();
  const startDate =
    overrides.startDate ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endDate =
    overrides.endDate ?? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  return db.trip.create({
    data: {
      name: overrides.name ?? faker.lorem.words(3),
      description: overrides.description ?? faker.lorem.sentence(),
      startDate,
      endDate,
    },
  });
}

export async function createTestGroup(
  tripId: string,
  organizerId: string,
  overrides: Partial<{
    name: string;
    description: string;
    code: string;
  }> = {},
) {
  const { faker } = await import("@faker-js/faker");
  return db.group.create({
    data: {
      tripId,
      organizerId,
      name: overrides.name ?? faker.lorem.words(2),
      description: overrides.description ?? faker.lorem.sentence(),
      code: overrides.code ?? faker.string.alphanumeric(6).toUpperCase(),
    },
  });
}

export async function createTestChallenge(
  tripId: string,
  overrides: Partial<{
    name: string;
    description: string;
    submissionType: "IMAGE" | "TEXT" | "VIDEO";
    scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF";
    status: "HIDDEN" | "VISIBLE" | "ACTIVE" | "COMPLETED";
  }> = {},
) {
  const { faker } = await import("@faker-js/faker");
  return db.challenge.create({
    data: {
      tripId,
      name: overrides.name ?? faker.lorem.words(3),
      description: overrides.description ?? faker.lorem.sentence(),
      submissionType: overrides.submissionType ?? "IMAGE",
      scoringCategory: overrides.scoringCategory ?? "SPEED",
      status: overrides.status ?? "HIDDEN",
    },
  });
}
