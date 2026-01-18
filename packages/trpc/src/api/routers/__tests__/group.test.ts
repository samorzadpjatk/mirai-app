import { describe, it, expect, vi, beforeEach } from "vitest";
import { groupRouter } from "~/api/routers/group";

vi.mock("@integral-2025-app/db");

describe("groupRouter", () => {
  const createMockContext = () => {
    const dbUser = {
      id: "db-user-1",
      authUserId: "supabase-mock-user",
      email: "user1@test.com",
      firstName: "User",
      lastName: "One",
      role: "MODERATOR",
    };

    return {
      headers: new Headers(),
      db: {
        group: {
          findUnique: vi.fn(),
          findMany: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
        tripParticipant: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          upsert: vi.fn(),
          updateMany: vi.fn(),
        },
        user: {
          findUnique: vi.fn(),
          findFirst: vi.fn().mockResolvedValue(dbUser),
        },
      },
      dbUser,
      session: {
        user: {
          id: dbUser.id,
          dbUser,
          role: dbUser.role,
        },
      },
      supabase: {} as any,
    } as any;
  };

  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    vi.clearAllMocks();
  });

  describe("getAllNames", () => {
    it("should return all group names", async () => {
      const mockGroups = [
        { id: "group-1", name: "Group 1" },
        { id: "group-2", name: "Group 2" },
      ];

      mockContext.db.group.findMany.mockResolvedValue(mockGroups);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getAllNames({ tripId: "trip-1" });

      expect(result).toEqual(mockGroups);
      expect(mockContext.db.group.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        where: { tripId: "trip-1" },
      });
    });
  });

  describe("getMy", () => {
    it("should return user's group with details", async () => {
      const mockParticipant = {
        groupId: "group-1",
      };

      const mockGroup = {
        id: "group-1",
        name: "My Group",
        code: "ABC123",
        coins: 100,
        participants: [
          {
            user: {
              id: "user-1",
              firstName: "User",
              lastName: "One",
              email: "user1@test.com",
            },
          },
        ],
        organizer: [
          {
            id: "org-1",
            firstName: "Org",
            lastName: "One",
            email: "org@test.com",
          },
        ],
        coinTransactions: [],
      };

      mockContext.db.tripParticipant.findUnique.mockResolvedValue(
        mockParticipant,
      );
      mockContext.db.group.findUnique.mockResolvedValue(mockGroup);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getMy({ tripId: "trip-1" });

      expect(result).toEqual(mockGroup);
    });

    it("should return null if user has no group", async () => {
      mockContext.db.tripParticipant.findUnique.mockResolvedValue(null);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getMy({ tripId: "trip-1" });

      expect(result).toBeNull();
    });

    it("should return null if user not found", async () => {
      mockContext.db.tripParticipant.findUnique.mockResolvedValue(null);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getMy({ tripId: "trip-1" });

      expect(result).toBeNull();
    });
  });

  describe("getAll", () => {
    it("should return all groups with details", async () => {
      const mockGroups = [
        {
          id: "group-1",
          name: "Group 1",
          code: "ABC",
          coins: 100,
          members: [],
          organizer: [],
          coinTransactions: [],
        },
      ];

      mockContext.db.group.findMany.mockResolvedValue(mockGroups);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getAll({ tripId: "trip-1" });

      expect(result).toEqual(mockGroups);
      expect(mockContext.db.group.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        }),
      );
    });
  });

  describe("getById", () => {
    it("should return group by id", async () => {
      const mockGroup = {
        id: "group-1",
        name: "Test Group",
        code: "TEST",
        coins: 50,
      };

      mockContext.db.group.findUnique.mockResolvedValue(mockGroup);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getById({ id: "group-1" });

      expect(result).toEqual(mockGroup);
      expect(mockContext.db.group.findUnique).toHaveBeenCalledWith({
        where: { id: "group-1" },
      });
    });
  });

  describe("getGroupList", () => {
    it("should return simplified group list", async () => {
      const mockGroups = [
        {
          id: "group-1",
          name: "Group 1",
          code: "G1",
          coins: 100,
          organizer: { id: "org-1", firstName: "Organizer", lastName: "One" },
          _count: { participants: 5 },
        },
      ];

      mockContext.db.group.findMany.mockResolvedValue(mockGroups);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getGroupList({ tripId: "trip-1" });

      expect(result).toEqual(mockGroups);
      expect(mockContext.db.group.findMany).toHaveBeenCalledWith({
        where: { tripId: "trip-1" },
        select: expect.objectContaining({
          id: true,
          name: true,
          code: true,
          coins: true,
        }),
      });
    });
  });

  describe("getByIdWithOrganizer", () => {
    it("should return group with organizer info", async () => {
      const mockGroup = {
        id: "group-1",
        name: "Group 1",
        code: "G1",
        coins: 100,
        _count: { participants: 5 },
        organizer: { id: "org-1", firstName: "Organizer", lastName: "Lead" },
      };

      mockContext.db.group.findUnique.mockResolvedValue(mockGroup);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getByIdWithOrganizer({ groupId: "group-1" });

      expect(result).toEqual(mockGroup);
    });
  });
});
