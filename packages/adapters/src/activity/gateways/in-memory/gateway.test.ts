import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryActivityFeedGateway } from "./gateway";
import type {
  ActivityFeedDTO,
  ActivityReactionDTO,
} from "@mirai-app/use-cases";
import type { ActivityId } from "@mirai-app/domain";

describe("[UNIT] InMemoryActivityFeedGateway", () => {
  let gateway: InMemoryActivityFeedGateway;

  beforeEach(async () => {
    gateway = new InMemoryActivityFeedGateway();
    await Effect.runPromise(gateway.reset());
  });

  const createMockActivity = (
    id: string,
    overrides: Partial<ActivityFeedDTO> = {},
  ): ActivityFeedDTO => ({
    id: id as ActivityId,
    tripId: "trip-1",
    userId: "user-1",
    content: `Activity ${id}`,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(`2024-01-${id.padStart(2, "0")}T10:00:00Z`),
    updatedAt: new Date(`2024-01-${id.padStart(2, "0")}T10:00:00Z`),
    ...overrides,
  });

  const createMockReaction = (
    id: string,
    activityId: string,
    userId: string,
    reactionType: string,
  ): ActivityReactionDTO => ({
    id: id as ActivityId,
    activityId: activityId as ActivityId,
    userId,
    reactionType,
    createdAt: new Date(),
  });

  describe("create", () => {
    it("creates a new activity", async () => {
      const activity = createMockActivity("1");

      const result = await Effect.runPromise(gateway.create(activity));

      expect(result.id).toBe(activity.id);
      expect(result.content).toBe(activity.content);
    });

    it("stores activity in storage", async () => {
      const activity = createMockActivity("1");

      await Effect.runPromise(gateway.create(activity));
      const found = await Effect.runPromise(gateway.findById(activity.id));

      expect(found).not.toBeNull();
      expect(found?.id).toBe(activity.id);
    });
  });

  describe("findById", () => {
    it("returns activity when found", async () => {
      const activity = createMockActivity("1");
      await Effect.runPromise(gateway.create(activity));

      const result = await Effect.runPromise(gateway.findById(activity.id));

      expect(result).not.toBeNull();
      expect(result?.id).toBe(activity.id);
    });

    it("returns null when not found", async () => {
      const result = await Effect.runPromise(
        gateway.findById("nonexistent" as ActivityId),
      );

      expect(result).toBeNull();
    });
  });

  describe("findByTripId", () => {
    it("returns activities for trip", async () => {
      const activities = [
        createMockActivity("1", { tripId: "trip-1" }),
        createMockActivity("2", { tripId: "trip-1" }),
        createMockActivity("3", { tripId: "trip-2" }),
      ];
      for (const activity of activities) {
        await Effect.runPromise(gateway.create(activity));
      }

      const result = await Effect.runPromise(gateway.findByTripId("trip-1"));

      expect(result.items).toHaveLength(2);
      expect(result.items.every((a) => a.tripId === "trip-1")).toBe(true);
    });

    it("excludes hidden activities by default", async () => {
      const activities = [
        createMockActivity("1", { isHidden: false }),
        createMockActivity("2", { isHidden: true }),
      ];
      for (const activity of activities) {
        await Effect.runPromise(gateway.create(activity));
      }

      const result = await Effect.runPromise(gateway.findByTripId("trip-1"));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.isHidden).toBe(false);
    });

    it("includes hidden activities when specified", async () => {
      const activities = [
        createMockActivity("1", { isHidden: false }),
        createMockActivity("2", { isHidden: true }),
      ];
      for (const activity of activities) {
        await Effect.runPromise(gateway.create(activity));
      }

      const result = await Effect.runPromise(
        gateway.findByTripId("trip-1", { includeHidden: true }),
      );

      expect(result.items).toHaveLength(2);
    });

    it("sorts by isPinned first, then createdAt", async () => {
      const activities = [
        createMockActivity("1", {
          isPinned: false,
          createdAt: new Date("2024-01-03"),
        }),
        createMockActivity("2", {
          isPinned: true,
          createdAt: new Date("2024-01-01"),
        }),
        createMockActivity("3", {
          isPinned: false,
          createdAt: new Date("2024-01-02"),
        }),
      ];
      for (const activity of activities) {
        await Effect.runPromise(gateway.create(activity));
      }

      const result = await Effect.runPromise(gateway.findByTripId("trip-1"));

      // Pinned should come first, regardless of date
      expect(result.items[0]?.id).toBe("2");
      expect(result.items[0]?.isPinned).toBe(true);
    });

    it("respects limit", async () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        createMockActivity(String(i + 1)),
      );
      for (const activity of activities) {
        await Effect.runPromise(gateway.create(activity));
      }

      const result = await Effect.runPromise(
        gateway.findByTripId("trip-1", { limit: 5 }),
      );

      expect(result.items).toHaveLength(5);
    });

    it("returns hasMore when more items exist", async () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        createMockActivity(String(i + 1)),
      );
      for (const activity of activities) {
        await Effect.runPromise(gateway.create(activity));
      }

      const result = await Effect.runPromise(
        gateway.findByTripId("trip-1", { limit: 5 }),
      );

      expect(result.hasMore).toBe(true);
    });
  });

  describe("findByTripIdPaged", () => {
    it("returns paginated results", async () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        createMockActivity(String(i + 1)),
      );
      for (const activity of activities) {
        await Effect.runPromise(gateway.create(activity));
      }

      const result = await Effect.runPromise(
        gateway.findByTripIdPaged("trip-1", { page: 1, pageSize: 5 }),
      );

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(5);
      expect(result.totalPages).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it("returns correct page", async () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        createMockActivity(String(i + 1), {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      for (const activity of activities) {
        await Effect.runPromise(gateway.create(activity));
      }

      const page1 = await Effect.runPromise(
        gateway.findByTripIdPaged("trip-1", { page: 1, pageSize: 3 }),
      );
      const page2 = await Effect.runPromise(
        gateway.findByTripIdPaged("trip-1", { page: 2, pageSize: 3 }),
      );

      expect(page1.items).toHaveLength(3);
      expect(page2.items).toHaveLength(3);
      expect(page1.page).toBe(1);
      expect(page2.page).toBe(2);
    });
  });

  describe("update", () => {
    it("updates existing activity", async () => {
      const activity = createMockActivity("1", { content: "Original" });
      await Effect.runPromise(gateway.create(activity));

      const updated = { ...activity, content: "Updated" };
      const result = await Effect.runPromise(gateway.update(updated));

      expect(result.content).toBe("Updated");
      const found = await Effect.runPromise(gateway.findById(activity.id));
      expect(found?.content).toBe("Updated");
    });
  });

  describe("delete", () => {
    it("removes activity from storage", async () => {
      const activity = createMockActivity("1");
      await Effect.runPromise(gateway.create(activity));

      await Effect.runPromise(gateway.delete(activity.id));
      const found = await Effect.runPromise(gateway.findById(activity.id));

      expect(found).toBeNull();
    });

    it("removes associated reactions", async () => {
      const activity = createMockActivity("1");
      await Effect.runPromise(gateway.create(activity));
      const reaction = createMockReaction("r1", activity.id, "user-1", "heart");
      await Effect.runPromise(gateway.addReaction(reaction));

      await Effect.runPromise(gateway.delete(activity.id));
      const reactions = await Effect.runPromise(
        gateway.findReactionsByActivityId(activity.id),
      );

      expect(reactions).toHaveLength(0);
    });
  });

  describe("exists", () => {
    it("returns true when activity exists", async () => {
      const activity = createMockActivity("1");
      await Effect.runPromise(gateway.create(activity));

      const exists = await Effect.runPromise(gateway.exists(activity.id));

      expect(exists).toBe(true);
    });

    it("returns false when activity does not exist", async () => {
      const exists = await Effect.runPromise(
        gateway.exists("nonexistent" as ActivityId),
      );

      expect(exists).toBe(false);
    });
  });

  describe("reactions", () => {
    describe("addReaction", () => {
      it("adds reaction to activity", async () => {
        const activity = createMockActivity("1");
        await Effect.runPromise(gateway.create(activity));
        const reaction = createMockReaction(
          "r1",
          activity.id,
          "user-1",
          "heart",
        );

        const result = await Effect.runPromise(gateway.addReaction(reaction));

        expect(result.activityId).toBe(activity.id);
        expect(result.reactionType).toBe("heart");
      });

      it("updates existing reaction from same user with same type", async () => {
        const activity = createMockActivity("1");
        await Effect.runPromise(gateway.create(activity));
        const reaction1 = createMockReaction(
          "r1",
          activity.id,
          "user-1",
          "heart",
        );
        const reaction2 = createMockReaction(
          "r2",
          activity.id,
          "user-1",
          "heart",
        );

        await Effect.runPromise(gateway.addReaction(reaction1));
        await Effect.runPromise(gateway.addReaction(reaction2));

        const reactions = await Effect.runPromise(
          gateway.findReactionsByActivityId(activity.id),
        );

        expect(reactions).toHaveLength(1);
        expect(reactions[0]?.id).toBe("r2");
      });

      it("allows multiple reactions from same user with different types", async () => {
        const activity = createMockActivity("1");
        await Effect.runPromise(gateway.create(activity));
        const reaction1 = createMockReaction(
          "r1",
          activity.id,
          "user-1",
          "heart",
        );
        const reaction2 = createMockReaction(
          "r2",
          activity.id,
          "user-1",
          "fire",
        );

        await Effect.runPromise(gateway.addReaction(reaction1));
        await Effect.runPromise(gateway.addReaction(reaction2));

        const reactions = await Effect.runPromise(
          gateway.findReactionsByActivityId(activity.id),
        );

        expect(reactions).toHaveLength(2);
      });
    });

    describe("removeReaction", () => {
      it("removes reaction from activity", async () => {
        const activity = createMockActivity("1");
        await Effect.runPromise(gateway.create(activity));
        const reaction = createMockReaction(
          "r1",
          activity.id,
          "user-1",
          "heart",
        );
        await Effect.runPromise(gateway.addReaction(reaction));

        await Effect.runPromise(
          gateway.removeReaction(activity.id, "user-1", "heart"),
        );
        const reactions = await Effect.runPromise(
          gateway.findReactionsByActivityId(activity.id),
        );

        expect(reactions).toHaveLength(0);
      });

      it("only removes matching reaction", async () => {
        const activity = createMockActivity("1");
        await Effect.runPromise(gateway.create(activity));
        const reaction1 = createMockReaction(
          "r1",
          activity.id,
          "user-1",
          "heart",
        );
        const reaction2 = createMockReaction(
          "r2",
          activity.id,
          "user-1",
          "fire",
        );
        await Effect.runPromise(gateway.addReaction(reaction1));
        await Effect.runPromise(gateway.addReaction(reaction2));

        await Effect.runPromise(
          gateway.removeReaction(activity.id, "user-1", "heart"),
        );
        const reactions = await Effect.runPromise(
          gateway.findReactionsByActivityId(activity.id),
        );

        expect(reactions).toHaveLength(1);
        expect(reactions[0]?.reactionType).toBe("fire");
      });
    });

    describe("findReactionsByActivityId", () => {
      it("returns all reactions for activity", async () => {
        const activity = createMockActivity("1");
        await Effect.runPromise(gateway.create(activity));
        const reaction1 = createMockReaction(
          "r1",
          activity.id,
          "user-1",
          "heart",
        );
        const reaction2 = createMockReaction(
          "r2",
          activity.id,
          "user-2",
          "fire",
        );
        await Effect.runPromise(gateway.addReaction(reaction1));
        await Effect.runPromise(gateway.addReaction(reaction2));

        const reactions = await Effect.runPromise(
          gateway.findReactionsByActivityId(activity.id),
        );

        expect(reactions).toHaveLength(2);
      });

      it("returns empty array when no reactions", async () => {
        const activity = createMockActivity("1");
        await Effect.runPromise(gateway.create(activity));

        const reactions = await Effect.runPromise(
          gateway.findReactionsByActivityId(activity.id),
        );

        expect(reactions).toHaveLength(0);
      });
    });

    describe("findUserReactions", () => {
      it("returns reactions by specific user", async () => {
        const activity = createMockActivity("1");
        await Effect.runPromise(gateway.create(activity));
        const reaction1 = createMockReaction(
          "r1",
          activity.id,
          "user-1",
          "heart",
        );
        const reaction2 = createMockReaction(
          "r2",
          activity.id,
          "user-2",
          "fire",
        );
        await Effect.runPromise(gateway.addReaction(reaction1));
        await Effect.runPromise(gateway.addReaction(reaction2));

        const reactions = await Effect.runPromise(
          gateway.findUserReactions(activity.id, "user-1"),
        );

        expect(reactions).toHaveLength(1);
        expect(reactions[0]?.userId).toBe("user-1");
      });
    });

    describe("getReactionCounts", () => {
      it("returns correct counts for each reaction type", async () => {
        const activity = createMockActivity("1");
        await Effect.runPromise(gateway.create(activity));
        const reactions = [
          createMockReaction("r1", activity.id, "user-1", "heart"),
          createMockReaction("r2", activity.id, "user-2", "heart"),
          createMockReaction("r3", activity.id, "user-3", "fire"),
          createMockReaction("r4", activity.id, "user-4", "clap"),
        ];
        for (const reaction of reactions) {
          await Effect.runPromise(gateway.addReaction(reaction));
        }

        const counts = await Effect.runPromise(
          gateway.getReactionCounts(activity.id),
        );

        expect(counts.total).toBe(4);
        expect(counts.counts.heart).toBe(2);
        expect(counts.counts.fire).toBe(1);
        expect(counts.counts.clap).toBe(1);
        expect(counts.counts.star).toBe(0);
      });
    });
  });

  describe("reset", () => {
    it("clears reactions storage", async () => {
      const activity = createMockActivity("1");
      await Effect.runPromise(gateway.create(activity));
      const reaction = createMockReaction("r1", activity.id, "user-1", "heart");
      await Effect.runPromise(gateway.addReaction(reaction));

      await Effect.runPromise(gateway.reset());

      // Note: reactions storage is cleared
      const reactions = await Effect.runPromise(
        gateway.findReactionsByActivityId(activity.id),
      );
      expect(reactions).toHaveLength(0);
    });
  });
});
