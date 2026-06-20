import { ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChallenge, forceCloseVoting, updateChallenge } from "../challenge/mutations";

vi.mock("../challenge/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../challenge/utils")>();
  return {
    ...actual,
    fetchChallengeWithRelations: vi.fn(),
  };
});

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

const mockExistingChallenge = {
  id: "challenge-1",
  tripId: "trip-1",
  name: "Existing Challenge",
  description: "",
  image: null,
  submissionType: "IMAGE",
  scoringCategory: "SPEED",
  basePoints: 100,
  firstPlacePoints: null,
  secondPlacePoints: null,
  thirdPlacePoints: null,
  status: "HIDDEN",
  startTime: null,
  endTime: null,
  votingStartTime: null,
  votingEndTime: null,
  autoApprove: false,
  isRecurring: false,
  dailyStartTime: "",
  dailyEndTime: "",
  recurringDays: 0,
  targetLatitude: 0,
  targetLongitude: 0,
  textExpectedPhrase: null,
  qrCodeValue: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("challenge mutations — defensive branches (mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createChallenge throws INTERNAL_SERVER_ERROR when insert returns no rows (line 148)", async () => {
    const mockTx = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(async () => []),
        })),
      })),
    };
    const mockDb = {
      transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    };

    await expect(
      createChallenge(
        { db: mockDb as never, supabase: mockSupabase, dbUser: { id: "admin-1" } },
        {
          tripId: "trip-1",
          name: "Test Challenge",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
        },
      ),
    ).rejects.toThrow("Failed to create challenge");

    expect(mockTx.insert).toHaveBeenCalled();
  });

  it("updateChallenge throws INTERNAL_SERVER_ERROR when update returns no rows (line 435)", async () => {
    const { fetchChallengeWithRelations } = await import("../challenge/utils");
    vi.mocked(fetchChallengeWithRelations).mockResolvedValue(mockExistingChallenge);

    const mockTx = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(async () => []),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoUpdate: vi.fn(async () => undefined),
        })),
      })),
    };
    const mockDb = {
      transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    };

    await expect(
      updateChallenge(
        { db: mockDb as never, supabase: mockSupabase, dbUser: { id: "admin-1" } },
        { id: "challenge-1", tripId: "trip-1", name: "Updated" },
      ),
    ).rejects.toThrow("Failed to update challenge");

    expect(mockTx.update).toHaveBeenCalled();
  });

  it("forceCloseVoting throws INTERNAL_SERVER_ERROR when update returns no rows (line 609)", async () => {
    const mockDb = {
      query: {
        challenges: {
          findFirst: vi.fn(async () => ({
            id: "challenge-1",
            status: "VOTING_PHASE",
            scoringCategory: "PEER_VOTING",
          })),
        },
      },
      transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const mockTx = {
          update: () => ({
            set: () => ({
              where: () => ({
                returning: async () => [],
              }),
            }),
          }),
        };
        return fn(mockTx);
      }),
    };

    await expect(
      forceCloseVoting(
        { db: mockDb as never, supabase: mockSupabase, dbUser: { id: "admin-1" } },
        { id: "challenge-1", tripId: "trip-1" },
      ),
    ).rejects.toThrow("Failed to update challenge");

    expect(mockDb.query.challenges.findFirst).toHaveBeenCalled();
  });

  it("createChallenge throws ORPCError with INTERNAL_SERVER_ERROR code for empty insert", async () => {
    const mockTx = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(async () => []),
        })),
      })),
    };
    const mockDb = {
      transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    };

    let caughtError: unknown;
    try {
      await createChallenge(
        { db: mockDb as never, supabase: mockSupabase, dbUser: { id: "admin-1" } },
        {
          tripId: "trip-1",
          name: "Test",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
        },
      );
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError!).toBeInstanceOf(ORPCError);
    expect((caughtError! as ORPCError).code).toBe("INTERNAL_SERVER_ERROR");
  });
});
