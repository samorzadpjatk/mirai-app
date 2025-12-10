import { describe, it, expect, vi, beforeEach } from "vitest";
import { groupRouter } from "~/api/routers/group";

vi.mock("@integral-2025-app/db");

describe("groupRouter", () => {
  const createMockContext = () => {
    const dbUser = {
      id: "db-user-1",
      authUserId: "supabase-mock-user",
      email: "user1@test.com",
      name: "User 1",
      isAdmin: false,
      isModerator: true,
      isServiceAccount: false,
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
        user: {
          findUnique: vi.fn(),
          findFirst: vi.fn().mockResolvedValue(dbUser),
        },
      },
      session: {
        user: {
          id: dbUser.id,
          dbUser,
          isAdmin: dbUser.isAdmin,
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
      const result = await caller.getAllNames();

      expect(result).toEqual(mockGroups);
      expect(mockContext.db.group.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
      });
    });
  });

  describe("getMy", () => {
    it("should return user's group with details", async () => {
      const mockUser = {
        group: { id: "group-1", name: "My Group" },
        organizerGroup: null,
      };

      const mockGroup = {
        id: "group-1",
        name: "My Group",
        code: "ABC123",
        coins: 100,
        members: [
          { id: "user-1", name: "User 1", email: "user1@test.com" },
        ],
        organizer: [
          { id: "org-1", name: "Organizer", email: "org@test.com" },
        ],
        coinTransactions: [],
      };

      mockContext.db.user.findUnique.mockResolvedValue(mockUser);
      mockContext.db.group.findUnique.mockResolvedValue(mockGroup);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getMy();

      expect(result).toEqual(mockGroup);
    });

    it("should return null if user has no group", async () => {
      const mockUser = {
        group: null,
        organizerGroup: null,
      };

      mockContext.db.user.findUnique.mockResolvedValue(mockUser);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getMy();

      expect(result).toBeNull();
    });

    it("should return null if user not found", async () => {
      mockContext.db.user.findUnique.mockResolvedValue(null);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getMy();

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
      const result = await caller.getAll();

      expect(result).toEqual(mockGroups);
      expect(mockContext.db.group.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        })
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
          organizer: { id: "org-1", name: "Organizer 1" },
          _count: { members: 5 },
        },
      ];

      mockContext.db.group.findMany.mockResolvedValue(mockGroups);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getGroupList();

      expect(result).toEqual(mockGroups);
      expect(mockContext.db.group.findMany).toHaveBeenCalledWith({
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
        _count: { members: 5 },
        organizer: { id: "org-1", name: "Organizer" },
      };

      mockContext.db.group.findUnique.mockResolvedValue(mockGroup);

      const caller = groupRouter.createCaller(mockContext);
      const result = await caller.getByIdWithOrganizer({ groupId: "group-1" });

      expect(result).toEqual(mockGroup);
    });
  });
});
