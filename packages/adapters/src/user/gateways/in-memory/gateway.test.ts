import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { InMemoryUserGateway } from "./gateway";
import type { UserDTO } from "@mirai-app/use-cases";
import { UserRole } from "@mirai-app/domain";

describe("[UNIT] InMemoryUserGateway Cursor Pagination", () => {
  const createMockUser = (
    id: string,
    createdAt: Date,
    role: UserRole = UserRole.USER,
  ): UserDTO => ({
    id,
    authUserId: `auth-${id}`,
    firstName: `First${id}`,
    lastName: `Last${id}`,
    nickname: null,
    email: `user${id}@example.com`,
    phone: null,
    avatarUrl: null,
    role,
    status: "ACTIVE" as const,
    groupId: null,
    bio: null,
    birthDate: null,
    shirtSize: null,
    dietaryRequirements: null,
    medicalInfo: null,
    createdAt,
    updatedAt: createdAt,
  });

  describe("findAllConnection", () => {
    it("returns empty connection when no users exist", async () => {
      const gateway = new InMemoryUserGateway();
      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns first page with hasNextPage when more items exist", async () => {
      const gateway = new InMemoryUserGateway();
      const users = Array.from({ length: 25 }, (_, i) =>
        createMockUser(
          `user-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(users));

      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns subsequent page using cursor", async () => {
      const gateway = new InMemoryUserGateway();
      const users = Array.from({ length: 25 }, (_, i) =>
        createMockUser(
          `user-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(users));

      // Get second page using cursor pointing to user-010 (Jan 11)
      // Since sort is createdAt DESC, cursor points to Jan 11,
      // so we get users 009-000 (10 items with earlier dates)
      const secondPage = await Effect.runPromise(
        gateway.findAllConnection({
          first: 10,
          after: {
            id: "user-010",
            createdAt: new Date(2024, 0, 11).toISOString(),
          },
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.nodes).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it("returns hasNextPage=false on last page", async () => {
      const gateway = new InMemoryUserGateway();
      const users = Array.from({ length: 15 }, (_, i) =>
        createMockUser(
          `user-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(users));

      // Get all items
      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe("findByRoleConnection", () => {
    it("filters users by role with pagination", async () => {
      const gateway = new InMemoryUserGateway();
      const adminUsers = Array.from({ length: 15 }, (_, i) =>
        createMockUser(
          `admin-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          UserRole.ADMIN,
        ),
      );
      const regularUsers = Array.from({ length: 5 }, (_, i) =>
        createMockUser(
          `user-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 16),
          UserRole.USER,
        ),
      );
      await Effect.runPromise(gateway.seed([...adminUsers, ...regularUsers]));

      const result = await Effect.runPromise(
        gateway.findByRoleConnection(UserRole.ADMIN, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.nodes.every((u) => u.role === UserRole.ADMIN)).toBe(true);
    });

    it("returns empty result when no users match role", async () => {
      const gateway = new InMemoryUserGateway();
      const users = Array.from({ length: 5 }, (_, i) =>
        createMockUser(
          `user-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          UserRole.USER,
        ),
      );
      await Effect.runPromise(gateway.seed(users));

      const result = await Effect.runPromise(
        gateway.findByRoleConnection(UserRole.MODERATOR, { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe("cursor encoding", () => {
    it("produces valid cursors that can be used for pagination", async () => {
      const gateway = new InMemoryUserGateway();
      const users = Array.from({ length: 30 }, (_, i) =>
        createMockUser(
          `user-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(users));

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      // Verify cursors exist
      const firstEdge = firstPage.edges[0];
      expect(firstEdge).toBeTruthy();
      expect(firstEdge?.cursor).toBeTruthy();
      expect(firstEdge?.cursor.length).toBeGreaterThan(0);

      // Use endCursor to fetch next page
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      if (lastEdge) {
        const result = await Effect.runPromise(
          gateway.findAllConnection({
            first: 10,
            after: {
              id: lastEdge.node.id,
              createdAt: lastEdge.node.createdAt.toISOString(),
            },
          }),
        );

        expect(result.edges).toHaveLength(10);
        expect(result.pageInfo.hasPreviousPage).toBe(true);
      }
    });
  });
});
