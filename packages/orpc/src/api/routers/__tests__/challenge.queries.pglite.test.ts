import {
  challengeLocationMatch,
  challengeRecurrence,
  challenges,
  trips,
  users,
} from "@mirai-app/db";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { createChallenge } from "../challenge/mutations";
import { getAllByTrip, getById } from "../challenge/queries";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
const now = () => new Date();

const mockSupabase = {
  storage: {
    from: (bucket: string) => ({
      createSignedUrl: async (path: string, _expiresIn: number) => ({
        data: { signedUrl: `https://example.com/${bucket}/${path}` },
        error: null as unknown,
      }),
    }),
  },
};

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
  await testDb.db.insert(users).values({
    id: "admin-1",
    authUserId: "auth-admin-1",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
    createdAt: now(),
    updatedAt: now(),
  });
  await testDb.db.insert(users).values({
    id: "user-1",
    authUserId: "auth-user-1",
    firstName: "Participant",
    lastName: "User",
    role: "USER",
    createdAt: now(),
    updatedAt: now(),
  });
  await testDb.db.insert(trips).values({
    id: "trip-1",
    name: "Test Trip",
    description: "",
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-06-07"),
    createdAt: now(),
    updatedAt: now(),
  });
});

afterAll(async () => {
  await testDb.cleanup();
});

const adminContext = () => ({
  db: testDb.db,
  supabase: mockSupabase,
  dbUser: { id: "admin-1", role: "ADMIN" },
});

const participantContext = () => ({
  db: testDb.db,
  supabase: mockSupabase,
  dbUser: { id: "user-1", role: "USER" },
});

const countChallenges = async () => {
  const [row] = await testDb.db.select({ value: sql<number>`count(*)::int` }).from(challenges);
  return row?.value ?? 0;
};

/** A visible recurring template plus the instances `createChallenge` generates for it. */
async function seedRecurringTemplate(name = "Daily Quiz", recurringDays = 2) {
  const template = await createChallenge(
    { db: testDb.db, supabase: mockSupabase, dbUser: { id: "admin-1" } },
    {
      tripId: "trip-1",
      name,
      submissionType: "IMAGE",
      scoringCategory: "SPEED",
      status: "VISIBLE",
      isRecurring: true,
      recurringDays,
      dailyStartTime: "09:00",
      dailyEndTime: "18:00",
    },
  );

  const instances = await testDb.db
    .select({ id: challenges.id, name: challenges.name })
    .from(challenges)
    .innerJoin(challengeRecurrence, eq(challenges.id, challengeRecurrence.challengeId))
    .where(eq(challengeRecurrence.isRecurring, false));

  return { templateId: template.id, instances };
}

describe("challenge queries — PGLite integration", () => {
  describe("reads never write", () => {
    it("keeps the challenge count stable across repeated getAllByTrip calls", async () => {
      await seedRecurringTemplate();
      const before = await countChallenges();

      await getAllByTrip(adminContext(), { tripId: "trip-1" });
      await getAllByTrip(adminContext(), { tripId: "trip-1" });
      await getAllByTrip(participantContext(), { tripId: "trip-1" });

      expect(await countChallenges()).toBe(before);
    });

    it("keeps the challenge count stable across repeated getById calls", async () => {
      const { templateId } = await seedRecurringTemplate();
      const before = await countChallenges();

      await getById(adminContext(), { id: templateId, tripId: "trip-1" });
      await getById(adminContext(), { id: templateId, tripId: "trip-1" });

      expect(await countChallenges()).toBe(before);
    });

    it("does not resurrect a deleted recurring instance", async () => {
      const { instances } = await seedRecurringTemplate();
      const victim = instances[0];
      expect(victim).toBeDefined();

      await testDb.db.delete(challenges).where(eq(challenges.id, victim!.id));
      const afterDelete = await countChallenges();

      // Both the admin list and the participant list used to re-create it here.
      // The replacement carries a fresh id, so assert on the name, not the id.
      await getAllByTrip(adminContext(), { tripId: "trip-1" });
      await getAllByTrip(participantContext(), { tripId: "trip-1" });

      expect(await countChallenges()).toBe(afterDelete);
      const byName = await testDb.db
        .select({ id: challenges.id })
        .from(challenges)
        .where(eq(challenges.name, victim!.name));
      expect(byName).toHaveLength(0);
    });
  });

  describe("recurring templates in the admin list", () => {
    it("hides templates from everyone when the flag is absent", async () => {
      const { templateId } = await seedRecurringTemplate();

      const result = await getAllByTrip(adminContext(), { tripId: "trip-1" });

      expect(result.challenges.map((challenge) => challenge.id)).not.toContain(templateId);
      expect(result.pagination.total).toBe(result.challenges.length);
    });

    it("shows templates to an admin that asks for them", async () => {
      const { templateId } = await seedRecurringTemplate();

      const result = await getAllByTrip(adminContext(), {
        tripId: "trip-1",
        includeRecurringTemplates: true,
      });

      const template = result.challenges.find((challenge) => challenge.id === templateId);
      expect(template).toBeDefined();
      expect(template?.isRecurring).toBe(true);
      expect(result.pagination.total).toBe(result.challenges.length);
    });

    it("ignores the flag for a participant", async () => {
      const { templateId } = await seedRecurringTemplate();

      const result = await getAllByTrip(participantContext(), {
        tripId: "trip-1",
        includeRecurringTemplates: true,
      });

      expect(result.challenges.map((challenge) => challenge.id)).not.toContain(templateId);
    });
  });

  describe("a hidden recurring challenge is still reachable", () => {
    it("returns the template to the admin even though it generated no instances", async () => {
      const created = await createChallenge(
        { db: testDb.db, supabase: mockSupabase, dbUser: { id: "admin-1" } },
        {
          tripId: "trip-1",
          name: "Hidden Daily",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          status: "HIDDEN",
          isRecurring: true,
          recurringDays: 3,
          dailyStartTime: "09:00",
          dailyEndTime: "18:00",
        },
      );

      expect(await countChallenges()).toBe(1);

      const result = await getAllByTrip(adminContext(), {
        tripId: "trip-1",
        includeRecurringTemplates: true,
      });

      expect(result.challenges.map((challenge) => challenge.id)).toContain(created.id);
    });
  });

  describe("challenges without a recurrence row", () => {
    it("still lists a challenge that has no challenge_recurrence row", async () => {
      await testDb.db.insert(challenges).values({
        id: "legacy-1",
        tripId: "trip-1",
        name: "Legacy Challenge",
        description: "",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "HIDDEN",
        basePoints: 10,
        autoApprove: false,
        createdAt: now(),
        updatedAt: now(),
      });
      await testDb.db
        .insert(challengeLocationMatch)
        .values({ challengeId: "legacy-1", targetLatitude: 0, targetLongitude: 0 });

      const result = await getAllByTrip(adminContext(), { tripId: "trip-1" });

      expect(result.challenges.map((challenge) => challenge.id)).toContain("legacy-1");
    });
  });
});
