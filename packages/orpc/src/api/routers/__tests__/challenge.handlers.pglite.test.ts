import {
  challengeLocationMatch,
  challengeQrCode,
  challengeRecurrence,
  challengeSubmissions,
  challengeText,
  challenges,
  groups,
  trips,
  users,
} from "@mirai-app/db";
import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import {
  createChallenge,
  deleteChallenge,
  forceCloseVoting,
  updateChallenge,
} from "../challenge/mutations";

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
});

afterAll(async () => {
  await testDb.cleanup();
});

async function seedUser(id: string, authUserId: string, firstName: string, lastName: string) {
  await testDb.db
    .insert(users)
    .values({ id, authUserId, firstName, lastName, createdAt: now(), updatedAt: now() });
}

async function seedTrip(id: string, name: string) {
  await testDb.db.insert(trips).values({
    id,
    name,
    description: "",
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-06-07"),
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedGroup(
  id: string,
  tripId: string,
  name: string,
  organizerId: string,
  code: string,
) {
  await testDb.db.insert(groups).values({
    id,
    tripId,
    name,
    description: "",
    organizerId,
    code,
    createdAt: now(),
    updatedAt: now(),
  });
}

type ChallengeSeed = Partial<typeof challenges.$inferInsert> & {
  isRecurring?: boolean;
  dailyStartTime?: string;
  dailyEndTime?: string;
  recurringDays?: number;
  targetLatitude?: number;
  targetLongitude?: number;
  textExpectedPhrase?: string | null;
  qrCodeValue?: string | null;
};

async function seedChallenge(id: string, tripId: string, overrides: ChallengeSeed = {}) {
  await testDb.db.insert(challenges).values({
    id,
    tripId,
    name: overrides.name ?? "Test Challenge",
    description: overrides.description ?? "",
    submissionType: overrides.submissionType ?? "IMAGE",
    scoringCategory: overrides.scoringCategory ?? "SPEED",
    status: overrides.status ?? "HIDDEN",
    basePoints: overrides.basePoints ?? 100,
    autoApprove: overrides.autoApprove ?? false,
    startTime: overrides.startTime ?? null,
    endTime: overrides.endTime ?? null,
    votingStartTime: overrides.votingStartTime ?? null,
    votingEndTime: overrides.votingEndTime ?? null,
    createdAt: overrides.createdAt ?? now(),
    updatedAt: overrides.updatedAt ?? now(),
  });

  await testDb.db.insert(challengeRecurrence).values({
    challengeId: id,
    isRecurring: overrides.isRecurring ?? false,
    dailyStartTime: overrides.dailyStartTime ?? "",
    dailyEndTime: overrides.dailyEndTime ?? "",
    recurringDays: overrides.recurringDays ?? 0,
    type: "DAILY",
  });

  await testDb.db.insert(challengeLocationMatch).values({
    challengeId: id,
    targetLatitude: overrides.targetLatitude ?? 0,
    targetLongitude: overrides.targetLongitude ?? 0,
  });

  if (overrides.textExpectedPhrase !== undefined && overrides.textExpectedPhrase !== null) {
    await testDb.db.insert(challengeText).values({
      challengeId: id,
      expectedPhrase: overrides.textExpectedPhrase,
    });
  }

  if (overrides.qrCodeValue !== undefined && overrides.qrCodeValue !== null) {
    await testDb.db.insert(challengeQrCode).values({
      challengeId: id,
      expectedValue: overrides.qrCodeValue,
    });
  }
}

async function seedSubmission(
  id: string,
  challengeId: string,
  groupId: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
) {
  await testDb.db.insert(challengeSubmissions).values({
    id,
    challengeId,
    groupId,
    imageIds: [],
    status,
    awardedPoints: 0,
    createdAt: now(),
    updatedAt: now(),
  });
}

const baseContext = () => ({
  db: testDb.db,
  supabase: mockSupabase,
  dbUser: { id: "admin-1" },
});

describe("challenge handlers — PGLite integration", () => {
  beforeEach(async () => {
    await seedUser("admin-1", "auth-admin-1", "Admin", "User");
    await seedTrip("trip-1", "Test Trip");
  });

  describe("createChallenge", () => {
    it("creates a basic IMAGE challenge", async () => {
      const result = await createChallenge(baseContext(), {
        tripId: "trip-1",
        name: "Basic Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
      });

      expect(result.name).toBe("Basic Challenge");
      expect(result.submissionType).toBe("IMAGE");

      const rows = await testDb.db.select().from(challenges).where(eq(challenges.id, result.id));
      expect(rows).toHaveLength(1);
      expect(rows[0].status).toBe("HIDDEN");
    });

    it("creates an ACTIVE challenge when VISIBLE with active time window", async () => {
      const result = await createChallenge(baseContext(), {
        tripId: "trip-1",
        name: "Active Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "VISIBLE",
        startTime: new Date(now().getTime() - 60_000),
        endTime: new Date(now().getTime() + 60_000),
      });

      expect(result.status).toBe("ACTIVE");

      const activities = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(challenges)
        .where(eq(challenges.id, result.id));
      expect(activities[0].count).toBe(1);
    });

    it("creates a recurring TEXT challenge with expected phrase (covers line 188 left branch)", async () => {
      const result = await createChallenge(baseContext(), {
        tripId: "trip-1",
        name: "Recurring Text Challenge",
        submissionType: "TEXT",
        scoringCategory: "SPEED",
        isRecurring: true,
        recurringDays: 3,
        dailyStartTime: "09:00",
        dailyEndTime: "18:00",
        textExpectedPhrase: "secret phrase",
        startTime: now(),
      });

      expect(result.name).toBe("Recurring Text Challenge");
      expect(result.textExpectedPhrase).toBe("secret phrase");
      expect(result.isRecurring).toBe(true);

      const textRows = await testDb.db
        .select()
        .from(challengeText)
        .where(eq(challengeText.challengeId, result.id));
      expect(textRows).toHaveLength(1);
      expect(textRows[0].expectedPhrase).toBe("secret phrase");
    });

    it("places the daily window on the Polish wall clock, not the server's", async () => {
      // The staff picks 09:00-18:00 on a phone in Poland. September is CEST
      // (UTC+2), so those are 07:00Z and 16:00Z. The deployed image runs in UTC,
      // where `Date#setHours` would have produced 09:00Z and 18:00Z -- two hours
      // late for everyone on the trip.
      const template = await createChallenge(baseContext(), {
        tripId: "trip-1",
        name: "Poranna zbiorka",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "VISIBLE",
        isRecurring: true,
        recurringDays: 2,
        dailyStartTime: "09:00",
        dailyEndTime: "18:00",
        startTime: new Date("2026-09-16T12:00:00Z"),
      });

      // The template spans whole Polish days: 16.09 00:00 through 17.09 23:59:59.999.
      expect(template.startTime?.toISOString()).toBe("2026-09-15T22:00:00.000Z");
      expect(template.endTime?.toISOString()).toBe("2026-09-17T21:59:59.999Z");

      const instances = await testDb.db
        .select({
          name: challenges.name,
          startTime: challenges.startTime,
          endTime: challenges.endTime,
        })
        .from(challenges)
        .innerJoin(challengeRecurrence, eq(challenges.id, challengeRecurrence.challengeId))
        .where(eq(challengeRecurrence.isRecurring, false))
        .orderBy(challenges.startTime);

      expect(
        instances.map((instance) => [
          instance.name,
          instance.startTime?.toISOString(),
          instance.endTime?.toISOString(),
        ]),
      ).toEqual([
        ["Poranna zbiorka #1", "2026-09-16T07:00:00.000Z", "2026-09-16T16:00:00.000Z"],
        ["Poranna zbiorka #2", "2026-09-17T07:00:00.000Z", "2026-09-17T16:00:00.000Z"],
      ]);
    });

    it("creates a recurring QR_CODE challenge with expected value (covers line 189 left branch)", async () => {
      const result = await createChallenge(baseContext(), {
        tripId: "trip-1",
        name: "Recurring QR Challenge",
        submissionType: "QR_CODE",
        scoringCategory: "SPEED",
        isRecurring: true,
        recurringDays: 2,
        dailyStartTime: "09:00",
        dailyEndTime: "18:00",
        qrCodeValue: "qr-value-123",
        startTime: now(),
      });

      expect(result.qrCodeValue).toBe("qr-value-123");
      expect(result.isRecurring).toBe(true);
    });

    it("creates a non-recurring TEXT challenge with text row", async () => {
      const result = await createChallenge(baseContext(), {
        tripId: "trip-1",
        name: "Text Challenge",
        submissionType: "TEXT",
        scoringCategory: "SPEED",
        textExpectedPhrase: "hello world",
      });

      expect(result.textExpectedPhrase).toBe("hello world");

      const textRows = await testDb.db
        .select()
        .from(challengeText)
        .where(eq(challengeText.challengeId, result.id));
      expect(textRows).toHaveLength(1);
      expect(textRows[0].expectedPhrase).toBe("hello world");
    });

    it("creates a QR_CODE challenge with qr code row", async () => {
      const result = await createChallenge(baseContext(), {
        tripId: "trip-1",
        name: "QR Challenge",
        submissionType: "QR_CODE",
        scoringCategory: "SPEED",
        qrCodeValue: "scan-me",
      });

      expect(result.qrCodeValue).toBe("scan-me");

      const qrRows = await testDb.db
        .select()
        .from(challengeQrCode)
        .where(eq(challengeQrCode.challengeId, result.id));
      expect(qrRows).toHaveLength(1);
      expect(qrRows[0].expectedValue).toBe("scan-me");
    });

    it("throws when recurring challenge has 0 days", async () => {
      await expect(
        createChallenge(baseContext(), {
          tripId: "trip-1",
          name: "Bad Recurring",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          isRecurring: true,
        }),
      ).rejects.toThrow("Recurring challenge requires number of days");
    });

    it("throws when IMAGE_LOCATION challenge uses auto-approve", async () => {
      await expect(
        createChallenge(baseContext(), {
          tripId: "trip-1",
          name: "Bad Location Challenge",
          submissionType: "IMAGE_LOCATION",
          scoringCategory: "SPEED",
          autoApprove: true,
        }),
      ).rejects.toThrow("Image + Location challenges cannot use auto-approve");
    });

    it("throws when TEXT challenge uses auto-approve without expected phrase", async () => {
      await expect(
        createChallenge(baseContext(), {
          tripId: "trip-1",
          name: "Bad Text Challenge",
          submissionType: "TEXT",
          scoringCategory: "SPEED",
          autoApprove: true,
        }),
      ).rejects.toThrow("Text auto-approve requires an expected phrase, or disable auto-approve");
    });

    it("throws when peer voting challenge has no end time", async () => {
      await expect(
        createChallenge(baseContext(), {
          tripId: "trip-1",
          name: "Bad Peer Voting",
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
          votingDurationHours: 24,
        }),
      ).rejects.toThrow("Peer voting challenge requires submission end time");
    });

    it("throws when recurring challenge has no daily start/end time", async () => {
      await expect(
        createChallenge(baseContext(), {
          tripId: "trip-1",
          name: "Bad Recurring Timeline",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          isRecurring: true,
          recurringDays: 7,
        }),
      ).rejects.toThrow("Recurring challenge requires daily start and end time");
    });

    it("creates a valid peer voting challenge", async () => {
      const result = await createChallenge(baseContext(), {
        tripId: "trip-1",
        name: "Peer Voting Challenge",
        submissionType: "IMAGE",
        scoringCategory: "PEER_VOTING",
        endTime: new Date(now().getTime() + 7 * 24 * 60 * 60 * 1000),
        votingDurationHours: 48,
      });

      expect(result.scoringCategory).toBe("PEER_VOTING");
      expect(result.votingStartTime).toBeTruthy();
      expect(result.votingEndTime).toBeTruthy();
    });
  });

  describe("updateChallenge", () => {
    beforeEach(async () => {
      await seedChallenge("challenge-1", "trip-1", {
        name: "Original Challenge",
        description: "Original description",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "HIDDEN",
        basePoints: 100,
        autoApprove: false,
      });
    });

    it("updates challenge name and status", async () => {
      const result = await updateChallenge(baseContext(), {
        id: "challenge-1",
        tripId: "trip-1",
        name: "Updated Challenge",
        status: "VISIBLE",
      });

      expect(result.name).toBe("Updated Challenge");
      expect(result.status).toBe("VISIBLE");
    });

    it("throws NOT_FOUND when challenge does not exist", async () => {
      await expect(
        updateChallenge(baseContext(), {
          id: "nonexistent",
          tripId: "trip-1",
          name: "Updated",
        }),
      ).rejects.toThrow("Challenge not found");
    });

    it("throws when updating to TEXT + auto-approve without expected phrase (line 398)", async () => {
      // Seed a TEXT challenge without a textExpectedPhrase row
      await seedChallenge("challenge-text", "trip-1", {
        name: "Text Challenge No Phrase",
        submissionType: "TEXT",
        scoringCategory: "SPEED",
        status: "HIDDEN",
        autoApprove: false,
        // No textExpectedPhrase → left join returns null
      });

      await expect(
        updateChallenge(baseContext(), {
          id: "challenge-text",
          tripId: "trip-1",
          autoApprove: true,
        }),
      ).rejects.toThrow("Text auto-approve requires an expected phrase, or disable auto-approve");
    });

    it("throws when updating to IMAGE_LOCATION + auto-approve", async () => {
      await seedChallenge("challenge-loc", "trip-1", {
        name: "Location Challenge",
        submissionType: "IMAGE_LOCATION",
        scoringCategory: "SPEED",
        status: "HIDDEN",
        autoApprove: false,
      });

      await expect(
        updateChallenge(baseContext(), {
          id: "challenge-loc",
          tripId: "trip-1",
          autoApprove: true,
        }),
      ).rejects.toThrow("Image + Location challenges cannot use auto-approve");
    });

    it("throws when transitioning to VOTING_PHASE with no submissions", async () => {
      await seedChallenge("challenge-pv", "trip-1", {
        name: "Peer Voting Challenge",
        submissionType: "IMAGE",
        scoringCategory: "PEER_VOTING",
        status: "ACTIVE",
        autoApprove: false,
        endTime: new Date(now().getTime() + 7 * 24 * 60 * 60 * 1000),
        votingStartTime: new Date(now().getTime() - 24 * 60 * 60 * 1000),
        votingEndTime: new Date(now().getTime() + 24 * 60 * 60 * 1000),
      });

      await expect(
        updateChallenge(baseContext(), {
          id: "challenge-pv",
          tripId: "trip-1",
          status: "VOTING_PHASE",
        }),
      ).rejects.toThrow("Peer voting can start only after staff reviews all submitted photos");
    });

    it("throws when transitioning to VOTING_PHASE with pending submissions", async () => {
      await seedGroup("group-1", "trip-1", "Test Group", "admin-1", "1234");
      await seedChallenge("challenge-pv2", "trip-1", {
        name: "Peer Voting Challenge 2",
        submissionType: "IMAGE",
        scoringCategory: "PEER_VOTING",
        status: "ACTIVE",
        autoApprove: false,
        endTime: new Date(now().getTime() + 7 * 24 * 60 * 60 * 1000),
        votingStartTime: new Date(now().getTime() - 24 * 60 * 60 * 1000),
        votingEndTime: new Date(now().getTime() + 24 * 60 * 60 * 1000),
      });
      await seedSubmission("sub-1", "challenge-pv2", "group-1", "PENDING");

      await expect(
        updateChallenge(baseContext(), {
          id: "challenge-pv2",
          tripId: "trip-1",
          status: "VOTING_PHASE",
        }),
      ).rejects.toThrow("Peer voting can start only after staff reviews all submitted photos");
    });

    it("transitions to VOTING_PHASE when all submissions are approved", async () => {
      await seedGroup("group-1", "trip-1", "Test Group", "admin-1", "1234");
      await seedChallenge("challenge-pv3", "trip-1", {
        name: "Peer Voting Challenge 3",
        submissionType: "IMAGE",
        scoringCategory: "PEER_VOTING",
        status: "ACTIVE",
        autoApprove: false,
        endTime: new Date(now().getTime() + 7 * 24 * 60 * 60 * 1000),
        votingStartTime: new Date(now().getTime() - 24 * 60 * 60 * 1000),
        votingEndTime: new Date(now().getTime() + 24 * 60 * 60 * 1000),
      });
      await seedSubmission("sub-1", "challenge-pv3", "group-1", "APPROVED");

      const result = await updateChallenge(baseContext(), {
        id: "challenge-pv3",
        tripId: "trip-1",
        status: "VOTING_PHASE",
      });

      expect(result.status).toBe("VOTING_PHASE");
    });

    it("throws when making challenge recurring without days and no inferrable window", async () => {
      await expect(
        updateChallenge(baseContext(), {
          id: "challenge-1",
          tripId: "trip-1",
          isRecurring: true,
          dailyStartTime: "09:00",
          dailyEndTime: "18:00",
          // No recurringDays, no startTime/endTime on existing → inferred null
        }),
      ).rejects.toThrow("Recurring challenge requires number of days");
    });

    it("updates to recurring with days and daily times", async () => {
      const result = await updateChallenge(baseContext(), {
        id: "challenge-1",
        tripId: "trip-1",
        isRecurring: true,
        recurringDays: 5,
        dailyStartTime: "08:00",
        dailyEndTime: "20:00",
        startTime: now(),
      });

      expect(result.isRecurring).toBe(true);
      expect(result.recurringDays).toBe(5);
    });

    it("updates TEXT challenge with expected phrase via onConflict", async () => {
      await seedChallenge("challenge-text2", "trip-1", {
        name: "Text Challenge",
        submissionType: "TEXT",
        scoringCategory: "SPEED",
        status: "HIDDEN",
        autoApprove: false,
        textExpectedPhrase: "old phrase",
      });

      const result = await updateChallenge(baseContext(), {
        id: "challenge-text2",
        tripId: "trip-1",
        textExpectedPhrase: "new phrase",
      });

      expect(result.textExpectedPhrase).toBe("new phrase");

      const textRows = await testDb.db
        .select()
        .from(challengeText)
        .where(eq(challengeText.challengeId, "challenge-text2"));
      expect(textRows[0].expectedPhrase).toBe("new phrase");
    });

    it("updates QR_CODE challenge with expected value via onConflict", async () => {
      await seedChallenge("challenge-qr", "trip-1", {
        name: "QR Challenge",
        submissionType: "QR_CODE",
        scoringCategory: "SPEED",
        status: "HIDDEN",
        autoApprove: false,
        qrCodeValue: "old-qr",
      });

      const result = await updateChallenge(baseContext(), {
        id: "challenge-qr",
        tripId: "trip-1",
        qrCodeValue: "new-qr",
      });

      expect(result.qrCodeValue).toBe("new-qr");

      const qrRows = await testDb.db
        .select()
        .from(challengeQrCode)
        .where(eq(challengeQrCode.challengeId, "challenge-qr"));
      expect(qrRows[0].expectedValue).toBe("new-qr");
    });
  });

  describe("deleteChallenge", () => {
    beforeEach(async () => {
      await seedChallenge("challenge-1", "trip-1", {
        name: "To Delete",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "HIDDEN",
      });
    });

    it("deletes an existing challenge", async () => {
      const result = await deleteChallenge(
        { db: testDb.db },
        { id: "challenge-1", tripId: "trip-1" },
      );

      expect(result.success).toBe(true);

      const rows = await testDb.db
        .select()
        .from(challenges)
        .where(eq(challenges.id, "challenge-1"));
      expect(rows).toHaveLength(0);
    });

    it("throws NOT_FOUND when challenge does not exist", async () => {
      await expect(
        deleteChallenge({ db: testDb.db }, { id: "nonexistent", tripId: "trip-1" }),
      ).rejects.toThrow("Challenge not found");
    });
  });

  describe("forceCloseVoting", () => {
    beforeEach(async () => {
      await seedGroup("group-1", "trip-1", "Test Group", "admin-1", "1234");
    });

    it("throws NOT_FOUND when challenge does not exist", async () => {
      await expect(
        forceCloseVoting(baseContext(), { id: "nonexistent", tripId: "trip-1" }),
      ).rejects.toThrow("Challenge not found");
    });

    it("throws when challenge is not peer voting", async () => {
      await seedChallenge("challenge-speed", "trip-1", {
        name: "Speed Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "ACTIVE",
      });

      await expect(
        forceCloseVoting(baseContext(), { id: "challenge-speed", tripId: "trip-1" }),
      ).rejects.toThrow("Force close voting is only available for peer voting challenges");
    });

    it("throws when challenge is not in voting phase", async () => {
      await seedChallenge("challenge-pv", "trip-1", {
        name: "Peer Voting Challenge",
        submissionType: "IMAGE",
        scoringCategory: "PEER_VOTING",
        status: "ACTIVE",
      });

      await expect(
        forceCloseVoting(baseContext(), { id: "challenge-pv", tripId: "trip-1" }),
      ).rejects.toThrow("Challenge is not in voting phase");
    });

    it("force closes voting and transitions to COMPLETED", async () => {
      await seedChallenge("challenge-voting", "trip-1", {
        name: "Voting Challenge",
        submissionType: "IMAGE",
        scoringCategory: "PEER_VOTING",
        status: "VOTING_PHASE",
        votingStartTime: new Date(now().getTime() - 24 * 60 * 60 * 1000),
        votingEndTime: new Date(now().getTime() + 24 * 60 * 60 * 1000),
      });
      await seedSubmission("sub-1", "challenge-voting", "group-1", "APPROVED");

      const result = await forceCloseVoting(baseContext(), {
        id: "challenge-voting",
        tripId: "trip-1",
      });

      expect(result.status).toBe("COMPLETED");

      const rows = await testDb.db
        .select()
        .from(challenges)
        .where(eq(challenges.id, "challenge-voting"));
      expect(rows[0].status).toBe("COMPLETED");
    });
  });
});
