import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  SetRewardHiddenUseCase,
  type SetRewardHiddenInput,
} from "./SetRewardHidden";
import type { RewardRepository } from "../ports/RewardRepository";
import type { Reward, RewardId } from "@mirai-app/domain";

// Mock Reward domain object
const createMockReward = (overrides?: Partial<Reward>): Reward =>
  ({
    id: "reward-123",
    name: "Test Reward",
    isHidden: false,
    updatedAt: new Date("2024-01-01"),
    hide: function () {
      return { ...this, isHidden: true, updatedAt: new Date("2024-01-02") };
    },
    unhide: function () {
      return { ...this, isHidden: false, updatedAt: new Date("2024-01-02") };
    },
    ...overrides,
  }) as unknown as Reward;

describe("[UNIT] SetRewardHiddenUseCase", () => {
  let useCase: SetRewardHiddenUseCase;
  let mockRewardRepository: RewardRepository;

  beforeEach(() => {
    mockRewardRepository = {
      findById: mock(() => Promise.resolve(createMockReward())),
      update: mock((reward: Reward) => Promise.resolve(reward)),
    } as unknown as RewardRepository;

    useCase = new SetRewardHiddenUseCase(mockRewardRepository);
  });

  describe("execute", () => {
    it("should hide a reward", async () => {
      const input: SetRewardHiddenInput = {
        rewardId: "reward-123" as RewardId,
        isHidden: true,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("reward-123");
        expect(result.value.name).toBe("Test Reward");
        expect(result.value.isHidden).toBe(true);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should unhide a reward", async () => {
      mockRewardRepository.findById = mock(() =>
        Promise.resolve(createMockReward({ isHidden: true })),
      );

      const input: SetRewardHiddenInput = {
        rewardId: "reward-123" as RewardId,
        isHidden: false,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isHidden).toBe(false);
      }
    });

    it("should return error when reward not found", async () => {
      mockRewardRepository.findById = mock(() => Promise.resolve(null));

      const input: SetRewardHiddenInput = {
        rewardId: "nonexistent" as RewardId,
        isHidden: true,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Reward not found");
      }
    });

    it("should persist changes to repository", async () => {
      const hiddenReward = createMockReward({ isHidden: true });
      mockRewardRepository.update = mock(() => Promise.resolve(hiddenReward));

      const input: SetRewardHiddenInput = {
        rewardId: "reward-123" as RewardId,
        isHidden: true,
      };

      await useCase.execute(input);

      expect(mockRewardRepository.update).toHaveBeenCalled();
    });

    it("should call findById with correct rewardId", async () => {
      const input: SetRewardHiddenInput = {
        rewardId: "reward-456" as RewardId,
        isHidden: true,
      };

      await useCase.execute(input);

      expect(mockRewardRepository.findById).toHaveBeenCalledWith("reward-456");
    });

    it("should toggle from hidden to visible", async () => {
      const hiddenReward = createMockReward({
        isHidden: true,
        unhide: function () {
          return {
            ...this,
            isHidden: false,
            updatedAt: new Date("2024-01-03"),
          };
        },
      });
      mockRewardRepository.findById = mock(() => Promise.resolve(hiddenReward));

      const input: SetRewardHiddenInput = {
        rewardId: "reward-123" as RewardId,
        isHidden: false,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isHidden).toBe(false);
      }
    });

    it("should return updatedAt timestamp", async () => {
      const updatedReward = createMockReward({
        updatedAt: new Date("2024-06-15"),
      });
      mockRewardRepository.update = mock(() => Promise.resolve(updatedReward));

      const input: SetRewardHiddenInput = {
        rewardId: "reward-123" as RewardId,
        isHidden: true,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.updatedAt).toEqual(new Date("2024-06-15"));
      }
    });
  });
});
