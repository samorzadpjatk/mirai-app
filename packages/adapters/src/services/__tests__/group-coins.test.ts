import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GroupCoinsService } from "../group-coins";
import type {
  GroupRepository,
  CoinTransactionRepository,
} from "@mirai-app/use-cases";
import type { Group, CoinTransaction } from "@mirai-app/domain";

// Mock Group
const createMockGroup = (overrides?: Partial<Group>): Group =>
  ({
    id: "group-123",
    name: "Test Group",
    coins: 100,
    addCoins: function (amount: number) {
      return { kind: "ok", value: { ...this, coins: this.coins + amount } };
    },
    deductCoins: function (amount: number) {
      return { kind: "ok", value: { ...this, coins: this.coins - amount } };
    },
    ...overrides,
  }) as unknown as Group;

describe("[UNIT] GroupCoinsService", () => {
  let service: GroupCoinsService;
  let mockGroupRepository: GroupRepository;
  let mockCoinTransactionRepository: CoinTransactionRepository;

  beforeEach(() => {
    mockGroupRepository = {
      findById: mock(() => Promise.resolve(createMockGroup())),
      update: mock((group: Group) => Promise.resolve(group)),
    } as unknown as GroupRepository;

    mockCoinTransactionRepository = {
      create: mock(() => Promise.resolve({} as CoinTransaction)),
    } as unknown as CoinTransactionRepository;

    service = new GroupCoinsService(
      mockGroupRepository,
      mockCoinTransactionRepository,
    );
  });

  describe("getBalance", () => {
    it("should return group balance", async () => {
      const result = await service.getBalance("group-123");

      expect(result).toBe(100);
    });

    it("should return 0 for non-existent group", async () => {
      mockGroupRepository.findById = mock(() => Promise.resolve(null));

      const result = await service.getBalance("group-123");

      expect(result).toBe(0);
    });
  });

  describe("deductCoins", () => {
    it("should deduct coins and create transaction", async () => {
      await service.deductCoins("group-123", 50, "Test reason", "admin-123");

      expect(mockGroupRepository.update).toHaveBeenCalled();
      expect(mockCoinTransactionRepository.create).toHaveBeenCalled();
    });

    it("should throw error for insufficient funds", async () => {
      await expect(
        service.deductCoins("group-123", 200, "Test", "admin-123"),
      ).rejects.toThrow();
    });

    it("should throw error when group not found", async () => {
      mockGroupRepository.findById = mock(() => Promise.resolve(null));

      await expect(
        service.deductCoins("group-123", 50, "Test", "admin-123"),
      ).rejects.toThrow("Group not found");
    });
  });

  describe("addCoins", () => {
    it("should add coins and create transaction", async () => {
      await service.addCoins("group-123", 50, "Test reason", "admin-123");

      expect(mockGroupRepository.update).toHaveBeenCalled();
      expect(mockCoinTransactionRepository.create).toHaveBeenCalled();
    });

    it("should throw error when group not found", async () => {
      mockGroupRepository.findById = mock(() => Promise.resolve(null));

      await expect(
        service.addCoins("group-123", 50, "Test", "admin-123"),
      ).rejects.toThrow("Group not found");
    });
  });
});
