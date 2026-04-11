import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  UpdateMyPurchaseStatusUseCase,
  type UpdateMyPurchaseStatusInput,
} from "./UpdateMyPurchaseStatus";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  GroupCoinsService,
  TripAccessChecker,
} from "../ports/RewardRepository";
import { RewardPurchaseStatus } from "@mirai-app/domain";
import type { RewardPurchase } from "@mirai-app/domain";

// Mock RewardPurchase domain object
const createMockPurchase = (
  overrides?: Partial<RewardPurchase>,
): RewardPurchase =>
  ({
    id: "purchase-123",
    rewardId: "reward-123",
    groupId: "group-123",
    quantity: 2,
    totalCost: 100,
    status: RewardPurchaseStatus.BOUGHT,
    collectionMethod: null,
    purchasedById: "user-123",
    statusUpdatedById: null,
    purchasedAt: new Date("2024-01-01"),
    statusUpdatedAt: new Date("2024-01-01"),
    ...overrides,
  }) as RewardPurchase;

describe("[UNIT] UpdateMyPurchaseStatusUseCase", () => {
  let useCase: UpdateMyPurchaseStatusUseCase;
  let mockRewardRepository: RewardRepository;
  let mockPurchaseRepository: RewardPurchaseRepository;
  let mockCoinsService: GroupCoinsService;
  let mockAccessChecker: TripAccessChecker;

  beforeEach(() => {
    mockRewardRepository = {
      incrementQuantity: mock(() =>
        Promise.resolve({} as unknown as import("@mirai-app/domain").Reward),
      ),
    } as unknown as RewardRepository;

    mockPurchaseRepository = {
      findById: mock(() => Promise.resolve(createMockPurchase())),
      updateStatus: mock(() =>
        Promise.resolve(
          createMockPurchase({
            status: RewardPurchaseStatus.CANCELLED,
            statusUpdatedAt: new Date("2024-01-02"),
          }),
        ),
      ),
    } as unknown as RewardPurchaseRepository;

    mockCoinsService = {
      addCoins: mock(() => Promise.resolve()),
    } as unknown as GroupCoinsService;

    mockAccessChecker = {
      isGroupLeader: mock(() =>
        Promise.resolve({ isLeader: true, groupId: "group-123" }),
      ),
    } as unknown as TripAccessChecker;

    useCase = new UpdateMyPurchaseStatusUseCase(
      mockRewardRepository,
      mockPurchaseRepository,
      mockCoinsService,
      mockAccessChecker,
    );
  });

  describe("execute", () => {
    it("should cancel purchase with refund when transitioning from BOUGHT to CANCELLED", async () => {
      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.CANCELLED,
        updatedById: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe(RewardPurchaseStatus.CANCELLED);
        expect(result.value.refunded).toBe(true);
      }

      // Verify coins were refunded
      expect(mockCoinsService.addCoins).toHaveBeenCalledWith(
        "group-123",
        100,
        expect.stringContaining("Cancelled"),
        "user-123",
      );

      // Verify reward quantity was restored
      expect(mockRewardRepository.incrementQuantity).toHaveBeenCalled();
    });

    it("should return error when purchase not found", async () => {
      mockPurchaseRepository.findById = mock(() => Promise.resolve(null));

      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "nonexistent",
        newStatus: RewardPurchaseStatus.CANCELLED,
        updatedById: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Purchase not found");
      }
    });

    it("should return error when user is not group leader for purchase", async () => {
      mockAccessChecker.isGroupLeader = mock(() =>
        Promise.resolve({ isLeader: false, groupId: "different-group" }),
      );

      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.CANCELLED,
        updatedById: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe(
          "Only the group leader can update this purchase",
        );
      }
    });

    it("should transition from ACCEPTED to IN_DELIVERY", async () => {
      mockPurchaseRepository.findById = mock(() =>
        Promise.resolve(
          createMockPurchase({ status: RewardPurchaseStatus.ACCEPTED }),
        ),
      );

      mockPurchaseRepository.updateStatus = mock(() =>
        Promise.resolve(
          createMockPurchase({
            status: RewardPurchaseStatus.IN_DELIVERY,
            statusUpdatedAt: new Date("2024-01-02"),
          }),
        ),
      );

      mockAccessChecker.isGroupLeader = mock(() =>
        Promise.resolve({ isLeader: true, groupId: "group-123" }),
      );

      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.IN_DELIVERY,
        updatedById: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe(RewardPurchaseStatus.IN_DELIVERY);
        expect(result.value.refunded).toBe(false); // No refund for this transition
      }

      // No coins refunded or quantity restored
      expect(mockCoinsService.addCoins).not.toHaveBeenCalled();
      expect(mockRewardRepository.incrementQuantity).not.toHaveBeenCalled();
    });

    it("should return error for invalid status transition", async () => {
      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.DELIVERED, // Not allowed from BOUGHT
        updatedById: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Cannot change status");
      }
    });

    it("should return error when cancelling non-BOUGHT purchase", async () => {
      mockPurchaseRepository.findById = mock(() =>
        Promise.resolve(
          createMockPurchase({ status: RewardPurchaseStatus.ACCEPTED }),
        ),
      );

      mockAccessChecker.isGroupLeader = mock(() =>
        Promise.resolve({ isLeader: true, groupId: "group-123" }),
      );

      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.CANCELLED,
        updatedById: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe(
          "Cannot change status from ACCEPTED to CANCELLED",
        );
      }
    });

    it("should return error when moving to IN_DELIVERY from non-ACCEPTED", async () => {
      mockPurchaseRepository.findById = mock(() =>
        Promise.resolve(
          createMockPurchase({ status: RewardPurchaseStatus.BOUGHT }),
        ),
      );

      mockAccessChecker.isGroupLeader = mock(() =>
        Promise.resolve({ isLeader: true, groupId: "group-123" }),
      );

      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.IN_DELIVERY,
        updatedById: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe(
          "Cannot change status from BOUGHT to IN_DELIVERY",
        );
      }
    });

    it("should update purchase status in repository", async () => {
      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.CANCELLED,
        updatedById: "user-123",
      };

      await useCase.execute(input);

      expect(mockPurchaseRepository.updateStatus).toHaveBeenCalledWith(
        "purchase-123",
        RewardPurchaseStatus.CANCELLED,
        "user-123",
        null,
      );
    });

    it("should return correct output fields", async () => {
      mockPurchaseRepository.updateStatus = mock(() =>
        Promise.resolve(
          createMockPurchase({
            id: "purchase-123",
            rewardId: "reward-456",
            groupId: "group-789",
            quantity: 3,
            totalCost: 150,
            status: RewardPurchaseStatus.CANCELLED,
            statusUpdatedAt: new Date("2024-01-02"),
          }),
        ),
      );

      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.CANCELLED,
        updatedById: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.purchaseId).toBe("purchase-123");
        expect(result.value.rewardId).toBe("reward-456");
        expect(result.value.groupId).toBe("group-789");
        expect(result.value.quantity).toBe(3);
        expect(result.value.totalCost).toBe(150);
        expect(result.value.status).toBe(RewardPurchaseStatus.CANCELLED);
        expect(result.value.statusUpdatedAt).toBeInstanceOf(Date);
      }
    });

    it("should call isGroupLeader with updatedById", async () => {
      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.CANCELLED,
        updatedById: "user-789",
      };

      await useCase.execute(input);

      expect(mockAccessChecker.isGroupLeader).toHaveBeenCalledWith(
        "user-789",
        "",
      );
    });
  });
});
