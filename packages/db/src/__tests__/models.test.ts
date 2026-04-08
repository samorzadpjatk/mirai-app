import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db, withTestTransaction } from "./helpers.ts";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://test:test@localhost:5433/mirai_test";

let isDatabaseConnected = false;

beforeAll(async () => {
  try {
    await db.$connect();
    isDatabaseConnected = true;
  } catch {
    isDatabaseConnected = false;
    console.warn("Database not available, skipping integration tests");
  }
});

afterAll(async () => {
  await db.$disconnect();
});

describe("User Model", () => {
  test("should create a user", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-123",
          firstName: "John",
          lastName: "Doe",
        },
      });

      expect(user.id).toBeDefined();
      expect(user.authUserId).toBe("auth-123");
      expect(user.firstName).toBe("John");
      expect(user.lastName).toBe("Doe");
      expect(user.role).toBe("USER");
      expect(user.hasAvatar).toBe(false);
    });
  });

  test("should read a user by id", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          authUserId: "auth-456",
          firstName: "Jane",
          lastName: "Smith",
        },
      });

      const found = await tx.user.findUnique({
        where: { id: created.id },
      });

      expect(found).not.toBeNull();
      expect(found?.firstName).toBe("Jane");
    });
  });

  test("should update a user", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-789",
          firstName: "Bob",
          lastName: "Wilson",
        },
      });

      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          firstName: "Robert",
          role: "ADMIN",
        },
      });

      expect(updated.firstName).toBe("Robert");
      expect(updated.role).toBe("ADMIN");
      expect(updated.lastName).toBe("Wilson");
    });
  });

  test("should delete a user", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-delete",
          firstName: "Delete",
          lastName: "Me",
        },
      });

      await tx.user.delete({ where: { id: user.id } });

      const found = await tx.user.findUnique({ where: { id: user.id } });
      expect(found).toBeNull();
    });
  });

  test("should enforce unique authUserId constraint", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      await tx.user.create({
        data: {
          authUserId: "auth-unique",
          firstName: "First",
          lastName: "User",
        },
      });

      await expect(
        tx.user.create({
          data: {
            authUserId: "auth-unique",
            firstName: "Second",
            lastName: "User",
          },
        }),
      ).rejects.toThrow();
    });
  });
});

describe("Trip Model", () => {
  test("should create a trip", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Summer Adventure",
          description: "A summer trip",
          startDate: now,
          endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      expect(trip.id).toBeDefined();
      expect(trip.name).toBe("Summer Adventure");
      expect(trip.description).toBe("A summer trip");
    });
  });

  test("should read a trip by id", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const created = await tx.trip.create({
        data: {
          name: "Winter Trip",
          startDate: now,
          endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      });

      const found = await tx.trip.findUnique({
        where: { id: created.id },
      });

      expect(found).not.toBeNull();
      expect(found?.name).toBe("Winter Trip");
    });
  });

  test("should update a trip", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Old Name",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const updated = await tx.trip.update({
        where: { id: trip.id },
        data: {
          name: "New Name",
          description: "Updated description",
        },
      });

      expect(updated.name).toBe("New Name");
      expect(updated.description).toBe("Updated description");
    });
  });

  test("should delete a trip", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "To Delete",
          startDate: now,
          endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.trip.delete({ where: { id: trip.id } });

      const found = await tx.trip.findUnique({ where: { id: trip.id } });
      expect(found).toBeNull();
    });
  });

  test("should have required name and date fields", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      await expect(
        tx.trip.create({
          data: {
            name: "Trip without dates",
          },
        }),
      ).rejects.toThrow();
    });
  });
});

describe("Group Model", () => {
  test("should create a group", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-group-user",
          firstName: "Organizer",
          lastName: "User",
        },
      });

      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Group",
          startDate: now,
          endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const group = await tx.group.create({
        data: {
          tripId: trip.id,
          organizerId: user.id,
          name: "Red Team",
          code: "RED01",
        },
      });

      expect(group.id).toBeDefined();
      expect(group.name).toBe("Red Team");
      expect(group.code).toBe("RED01");
      expect(group.coins).toBe(0);
      expect(group.isDeleted).toBe(false);
    });
  });

  test("should read a group by id with relations", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-group-read",
          firstName: "Read",
          lastName: "Organizer",
        },
      });

      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Read",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const created = await tx.group.create({
        data: {
          tripId: trip.id,
          organizerId: user.id,
          name: "Blue Team",
          code: "BLU01",
        },
      });

      const found = await tx.group.findUnique({
        where: { id: created.id },
        include: { trip: true, organizer: true },
      });

      expect(found).not.toBeNull();
      expect(found?.name).toBe("Blue Team");
      expect(found?.trip.name).toBe("Trip for Read");
      expect(found?.organizer.firstName).toBe("Read");
    });
  });

  test("should update a group", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-group-update",
          firstName: "Update",
          lastName: "Organizer",
        },
      });

      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Update",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const group = await tx.group.create({
        data: {
          tripId: trip.id,
          organizerId: user.id,
          name: "Green Team",
          code: "GRN01",
          coins: 100,
        },
      });

      const updated = await tx.group.update({
        where: { id: group.id },
        data: {
          name: "Green Team Updated",
          coins: 150,
        },
      });

      expect(updated.name).toBe("Green Team Updated");
      expect(updated.coins).toBe(150);
    });
  });

  test("should delete a group", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-group-delete",
          firstName: "Delete",
          lastName: "Organizer",
        },
      });

      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Delete",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const group = await tx.group.create({
        data: {
          tripId: trip.id,
          organizerId: user.id,
          name: "Yellow Team",
          code: "YLW01",
        },
      });

      await tx.group.delete({ where: { id: group.id } });

      const found = await tx.group.findUnique({ where: { id: group.id } });
      expect(found).toBeNull();
    });
  });

  test("should enforce unique group code", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user1 = await tx.user.create({
        data: {
          authUserId: "auth-group-code-1",
          firstName: "Code",
          lastName: "Organizer1",
        },
      });

      const user2 = await tx.user.create({
        data: {
          authUserId: "auth-group-code-2",
          firstName: "Code",
          lastName: "Organizer2",
        },
      });

      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Code",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.group.create({
        data: {
          tripId: trip.id,
          organizerId: user1.id,
          name: "First Group",
          code: "SAME01",
        },
      });

      await expect(
        tx.group.create({
          data: {
            tripId: trip.id,
            organizerId: user2.id,
            name: "Second Group",
            code: "SAME01",
          },
        }),
      ).rejects.toThrow();
    });
  });

  test("should require organizerId", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip without organizer",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      await expect(
        tx.group.create({
          data: {
            tripId: trip.id,
            name: "Group without Organizer",
            code: "NOORG",
          },
        }),
      ).rejects.toThrow();
    });
  });
});

describe("Challenge Model", () => {
  test("should create a challenge", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Challenge",
          startDate: now,
          endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const challenge = await tx.challenge.create({
        data: {
          tripId: trip.id,
          name: "Photo Challenge",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          status: "HIDDEN",
        },
      });

      expect(challenge.id).toBeDefined();
      expect(challenge.name).toBe("Photo Challenge");
      expect(challenge.basePoints).toBe(0);
      expect(challenge.isRecurring).toBe(false);
    });
  });

  test("should read a challenge with trip relation", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Challenge Read",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const created = await tx.challenge.create({
        data: {
          tripId: trip.id,
          name: "Text Challenge",
          submissionType: "TEXT",
          scoringCategory: "UNLIMITED",
          status: "VISIBLE",
        },
      });

      const found = await tx.challenge.findUnique({
        where: { id: created.id },
        include: { trip: true },
      });

      expect(found).not.toBeNull();
      expect(found?.name).toBe("Text Challenge");
      expect(found?.trip.name).toBe("Trip for Challenge Read");
    });
  });

  test("should update a challenge", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Challenge Update",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const challenge = await tx.challenge.create({
        data: {
          tripId: trip.id,
          name: "Old Challenge",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          status: "HIDDEN",
          basePoints: 10,
        },
      });

      const updated = await tx.challenge.update({
        where: { id: challenge.id },
        data: {
          name: "Updated Challenge",
          status: "ACTIVE",
          basePoints: 20,
          startTime: now,
          endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      expect(updated.name).toBe("Updated Challenge");
      expect(updated.status).toBe("ACTIVE");
      expect(updated.basePoints).toBe(20);
    });
  });

  test("should delete a challenge", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Challenge Delete",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const challenge = await tx.challenge.create({
        data: {
          tripId: trip.id,
          name: "Challenge to Delete",
          submissionType: "VIDEO",
          scoringCategory: "JUDGED_STAFF",
          status: "CANCELLED",
        },
      });

      await tx.challenge.delete({ where: { id: challenge.id } });

      const found = await tx.challenge.findUnique({
        where: { id: challenge.id },
      });
      expect(found).toBeNull();
    });
  });

  test("should require tripId foreign key", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      await expect(
        tx.challenge.create({
          data: {
            name: "Challenge without trip",
            submissionType: "IMAGE",
            scoringCategory: "SPEED",
          },
        }),
      ).rejects.toThrow();
    });
  });

  test("should cascade delete submissions when challenge is deleted", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-cascade-user",
          firstName: "Cascade",
          lastName: "User",
        },
      });

      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Cascade",
          startDate: now,
          endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const group = await tx.group.create({
        data: {
          tripId: trip.id,
          organizerId: user.id,
          name: "Cascade Team",
          code: "CAS01",
        },
      });

      const challenge = await tx.challenge.create({
        data: {
          tripId: trip.id,
          name: "Cascade Challenge",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          status: "COMPLETED",
        },
      });

      await tx.challengeSubmission.create({
        data: {
          challengeId: challenge.id,
          groupId: group.id,
          imageIds: ["img-1"],
          status: "APPROVED",
        },
      });

      await tx.challenge.delete({ where: { id: challenge.id } });

      const submissions = await tx.challengeSubmission.findMany({
        where: { challengeId: challenge.id },
      });
      expect(submissions).toHaveLength(0);
    });
  });
});

describe("Model Relations", () => {
  test("should link group to trip and user as organizer", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const organizer = await tx.user.create({
        data: {
          authUserId: "auth-relation-org",
          firstName: "Relation",
          lastName: "Organizer",
        },
      });

      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Relation Test Trip",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const group = await tx.group.create({
        data: {
          tripId: trip.id,
          organizerId: organizer.id,
          name: "Relation Group",
          code: "REL01",
        },
      });

      const found = await tx.group.findUnique({
        where: { id: group.id },
        include: { trip: true, organizer: true },
      });

      expect(found?.tripId).toBe(trip.id);
      expect(found?.organizerId).toBe(organizer.id);
      expect(found?.trip.id).toBe(trip.id);
      expect(found?.organizer.id).toBe(organizer.id);
    });
  });

  test("should link challenge to trip", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Challenge Relation Trip",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const challenge = await tx.challenge.create({
        data: {
          tripId: trip.id,
          name: "Challenge Relation Test",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
        },
      });

      const found = await tx.challenge.findUnique({
        where: { id: challenge.id },
        include: { trip: true },
      });

      expect(found?.tripId).toBe(trip.id);
      expect(found?.trip.id).toBe(trip.id);
    });
  });

  test("should cascade delete groups when trip is deleted", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-cascade-trip",
          firstName: "Cascade",
          lastName: "Trip",
        },
      });

      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Cascade Test",
          startDate: now,
          endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.group.create({
        data: {
          tripId: trip.id,
          organizerId: user.id,
          name: "Cascade Group",
          code: "CASC1",
        },
      });

      await tx.trip.delete({ where: { id: trip.id } });

      const groups = await tx.group.findMany({
        where: { tripId: trip.id },
      });
      expect(groups).toHaveLength(0);
    });
  });
});

describe("Constraint Violations", () => {
  test("should enforce unique trip participant (userId, tripId)", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-unique-participant",
          firstName: "Unique",
          lastName: "Participant",
        },
      });

      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Unique Participant",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.tripParticipant.create({
        data: {
          userId: user.id,
          tripId: trip.id,
          role: "MEMBER",
        },
      });

      await expect(
        tx.tripParticipant.create({
          data: {
            userId: user.id,
            tripId: trip.id,
            role: "LEADER",
          },
        }),
      ).rejects.toThrow();
    });
  });

  test("should enforce unique challenge submission (challengeId, groupId)", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authUserId: "auth-unique-submission",
          firstName: "Unique",
          lastName: "Submission",
        },
      });

      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Unique Submission",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const group = await tx.group.create({
        data: {
          tripId: trip.id,
          organizerId: user.id,
          name: "Unique Submission Group",
          code: "UNIQ1",
        },
      });

      const challenge = await tx.challenge.create({
        data: {
          tripId: trip.id,
          name: "Unique Submission Challenge",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
        },
      });

      await tx.challengeSubmission.create({
        data: {
          challengeId: challenge.id,
          groupId: group.id,
          imageIds: ["img-1"],
        },
      });

      await expect(
        tx.challengeSubmission.create({
          data: {
            challengeId: challenge.id,
            groupId: group.id,
            imageIds: ["img-2"],
          },
        }),
      ).rejects.toThrow();
    });
  });

  test("should enforce required fields on User", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      await expect(
        tx.user.create({
          data: {
            authUserId: "auth-missing-name",
          },
        }),
      ).rejects.toThrow();
    });
  });

  test("should enforce required fields on Group", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Required Group",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      await expect(
        tx.group.create({
          data: {
            tripId: trip.id,
            name: "Group without code",
          },
        }),
      ).rejects.toThrow();
    });
  });

  test("should enforce required fields on Challenge", async () => {
    if (!isDatabaseConnected) return;

    await withTestTransaction(async (tx) => {
      const now = new Date();
      const trip = await tx.trip.create({
        data: {
          name: "Trip for Required Challenge",
          startDate: now,
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      await expect(
        tx.challenge.create({
          data: {
            tripId: trip.id,
            submissionType: "IMAGE",
          },
        }),
      ).rejects.toThrow();
    });
  });
});
