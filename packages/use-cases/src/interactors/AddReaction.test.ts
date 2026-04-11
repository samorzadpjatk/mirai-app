import { describe, it, expect, mock, beforeEach } from "bun:test";
import { AddReactionUseCase, type AddReactionInput } from "./AddReaction";
import type { ActivityFeedRepository } from "../ports/ActivityFeedRepository";
import type {
  ActivityFeed,
  ActivityId,
  ActivityReaction,
  ReactionType,
} from "@mirai-app/domain";

// Mock domain objects
const createMockActivity = (overrides?: Partial<ActivityFeed>): ActivityFeed =>
  ({
    id: "activity-123" as ActivityId,
    isHidden: false,
    ...overrides,
  }) as ActivityFeed;

const createMockReaction = (
  overrides?: Partial<ActivityReaction>,
): ActivityReaction =>
  ({
    activityId: "activity-123" as ActivityId,
    userId: "user-123",
    reactionType: "heart" as ReactionType,
    ...overrides,
  }) as ActivityReaction;

describe("[UNIT] AddReactionUseCase", () => {
  let useCase: AddReactionUseCase;
  let mockActivityFeedRepository: ActivityFeedRepository;

  beforeEach(() => {
    mockActivityFeedRepository = {
      findById: mock(() => Promise.resolve(createMockActivity())),
      findUserReactions: mock(() => Promise.resolve([])),
      removeReaction: mock(() => Promise.resolve()),
      addReaction: mock(() => Promise.resolve(createMockReaction())),
      getReactionCounts: mock(() =>
        Promise.resolve({
          total: 1,
          counts: { heart: 1, fire: 0, clap: 0, star: 0 },
        }),
      ),
    } as unknown as ActivityFeedRepository;

    useCase = new AddReactionUseCase(mockActivityFeedRepository);
  });

  describe("execute", () => {
    it("should add new reaction when user has no existing reaction of same type", async () => {
      const input: AddReactionInput = {
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.activityId).toBe("activity-123");
        expect(result.value.reactionType).toBe("heart");
        expect(result.value.isActive).toBe(true);
        expect(result.value.reactionsSummary.total).toBe(1);
      }
    });

    it("should remove reaction when user already has same reaction type", async () => {
      mockActivityFeedRepository.findUserReactions = mock(() =>
        Promise.resolve([
          createMockReaction({ reactionType: "heart" as ReactionType }),
        ]),
      );

      const input: AddReactionInput = {
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isActive).toBe(false);
      }
      expect(mockActivityFeedRepository.removeReaction).toHaveBeenCalledWith(
        "activity-123",
        "user-123",
        "heart",
      );
    });

    it("should return error when activity not found", async () => {
      mockActivityFeedRepository.findById = mock(() => Promise.resolve(null));

      const input: AddReactionInput = {
        activityId: "nonexistent" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Activity not found");
      }
    });

    it("should return error when activity is hidden", async () => {
      mockActivityFeedRepository.findById = mock(() =>
        Promise.resolve(createMockActivity({ isHidden: true })),
      );

      const input: AddReactionInput = {
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Activity is hidden");
      }
    });

    it("should add different reaction type even if user has other reaction", async () => {
      mockActivityFeedRepository.findUserReactions = mock(() =>
        Promise.resolve([
          createMockReaction({ reactionType: "fire" as ReactionType }),
        ]),
      );

      const input: AddReactionInput = {
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isActive).toBe(true);
        expect(result.value.reactionType).toBe("heart");
      }
      expect(mockActivityFeedRepository.addReaction).toHaveBeenCalled();
    });

    it("should return updated reaction counts", async () => {
      mockActivityFeedRepository.getReactionCounts = mock(() =>
        Promise.resolve({
          total: 5,
          counts: { heart: 2, fire: 1, clap: 1, star: 1 },
        }),
      );
      mockActivityFeedRepository.findUserReactions = mock(() =>
        Promise.resolve([
          createMockReaction({ reactionType: "heart" as ReactionType }),
          createMockReaction({ reactionType: "fire" as ReactionType }),
        ]),
      );

      const input: AddReactionInput = {
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.reactionsSummary.total).toBe(5);
        expect(result.value.reactionsSummary.counts).toEqual({
          heart: 2,
          fire: 1,
          clap: 1,
          star: 1,
        });
        expect(result.value.reactionsSummary.myReactions).toEqual([
          "heart",
          "fire",
        ]);
      }
    });

    it("should handle different reaction types", async () => {
      const reactionTypes: ReactionType[] = ["heart", "fire", "clap", "star"];

      for (const reactionType of reactionTypes) {
        mockActivityFeedRepository.findUserReactions = mock(() =>
          Promise.resolve([]),
        );

        const input: AddReactionInput = {
          activityId: "activity-123" as ActivityId,
          userId: "user-123",
          reactionType,
        };

        const result = await useCase.execute(input);

        expect(result.kind).toBe("ok");
        if (result.kind === "ok") {
          expect(result.value.reactionType).toBe(reactionType);
        }
      }
    });
  });
});
