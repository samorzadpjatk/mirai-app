import { Reward, RewardListItem, CreateRewardInput, UpdateRewardInput, RewardPurchase } from "../../rewards/types";

describe("Rewards Types", () => {
  describe("Reward interface", () => {
    it("should accept valid Reward object", () => {
      const reward: Reward = {
        id: "reward-1",
        name: "Test Reward",
        description: "A test reward",
        availableQuantity: 10,
        coinCost: 100,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        tripId: "trip-1",
      };

      expect(reward.id).toBe("reward-1");
      expect(reward.name).toBe("Test Reward");
      expect(reward.coinCost).toBe(100);
    });

    it("should accept Reward with optional image", () => {
      const reward: Reward = {
        id: "reward-1",
        name: "Test Reward",
        description: "A test reward",
        availableQuantity: 10,
        image: "https://example.com/image.jpg",
        coinCost: 100,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        tripId: "trip-1",
      };

      expect(reward.image).toBe("https://example.com/image.jpg");
    });

    it("should accept Reward with multiple images", () => {
      const reward: Reward = {
        id: "reward-1",
        name: "Test Reward",
        description: "A test reward",
        availableQuantity: 10,
        images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
        signedImageUrls: ["https://cdn.example.com/signed1.jpg", "https://cdn.example.com/signed2.jpg"],
        coinCost: 100,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        tripId: "trip-1",
      };

      expect(reward.images).toHaveLength(2);
      expect(reward.signedImageUrls).toHaveLength(2);
    });
  });

  describe("RewardListItem interface", () => {
    it("should accept valid RewardListItem object", () => {
      const item: RewardListItem = {
        id: "reward-1",
        name: "Test Reward",
        description: "A test reward",
        availableQuantity: 10,
        image: null,
        coinCost: 100,
        createdBy: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tripId: "trip-1",
        canAfford: true,
        isEligibleToBuy: true,
        isOutOfStock: false,
        purchasedCount: 5,
      };

      expect(item.canAfford).toBe(true);
      expect(item.isEligibleToBuy).toBe(true);
      expect(item.isOutOfStock).toBe(false);
      expect(item.purchasedCount).toBe(5);
    });

    it("should accept RewardListItem with signedImageUrl", () => {
      const item: RewardListItem = {
        id: "reward-1",
        name: "Test Reward",
        description: "A test reward",
        availableQuantity: 10,
        image: "image.jpg",
        signedImageUrl: "https://cdn.example.com/signed.jpg",
        coinCost: 100,
        createdBy: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tripId: "trip-1",
        canAfford: true,
        isEligibleToBuy: true,
        isOutOfStock: false,
        purchasedCount: 0,
      };

      expect(item.signedImageUrl).toBe("https://cdn.example.com/signed.jpg");
    });

    it("should accept RewardListItem with originalCoinCost", () => {
      const item: RewardListItem = {
        id: "reward-1",
        name: "Test Reward",
        description: "A test reward",
        availableQuantity: 10,
        image: null,
        coinCost: 50,
        originalCoinCost: 25,
        createdBy: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tripId: "trip-1",
        canAfford: true,
        isEligibleToBuy: true,
        isOutOfStock: false,
        purchasedCount: 0,
      };

      expect(item.originalCoinCost).toBe(25);
    });

    it("should handle out of stock reward", () => {
      const item: RewardListItem = {
        id: "reward-1",
        name: "Test Reward",
        description: "A test reward",
        availableQuantity: 0,
        image: null,
        coinCost: 100,
        createdBy: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tripId: "trip-1",
        canAfford: true,
        isEligibleToBuy: true,
        isOutOfStock: true,
        purchasedCount: 10,
      };

      expect(item.isOutOfStock).toBe(true);
      expect(item.availableQuantity).toBe(0);
    });

    it("should handle reward user cannot afford", () => {
      const item: RewardListItem = {
        id: "reward-1",
        name: "Expensive Reward",
        description: "A very expensive reward",
        availableQuantity: 5,
        image: null,
        coinCost: 10000,
        createdBy: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tripId: "trip-1",
        canAfford: false,
        isEligibleToBuy: true,
        isOutOfStock: false,
        purchasedCount: 0,
      };

      expect(item.canAfford).toBe(false);
    });

    it("should handle reward user is not eligible to buy", () => {
      const item: RewardListItem = {
        id: "reward-1",
        name: "Leader Only Reward",
        description: "Only for group leaders",
        availableQuantity: 5,
        image: null,
        coinCost: 100,
        createdBy: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tripId: "trip-1",
        canAfford: true,
        isEligibleToBuy: false,
        isOutOfStock: false,
        purchasedCount: 0,
      };

      expect(item.isEligibleToBuy).toBe(false);
    });
  });

  describe("CreateRewardInput interface", () => {
    it("should accept valid CreateRewardInput", () => {
      const input: CreateRewardInput = {
        name: "New Reward",
        description: "A new reward",
        availableQuantity: 10,
        coinCost: 100,
        tripId: "trip-1",
      };

      expect(input.name).toBe("New Reward");
      expect(input.isHidden).toBeUndefined();
    });

    it("should accept CreateRewardInput with optional fields", () => {
      const input: CreateRewardInput = {
        name: "New Reward",
        description: "A new reward",
        availableQuantity: 10,
        image: "https://example.com/image.jpg",
        images: ["https://example.com/image1.jpg"],
        coinCost: 100,
        isHidden: true,
        tripId: "trip-1",
      };

      expect(input.image).toBe("https://example.com/image.jpg");
      expect(input.isHidden).toBe(true);
    });
  });

  describe("UpdateRewardInput interface", () => {
    it("should accept partial update", () => {
      const input: UpdateRewardInput = {
        name: "Updated Name",
      };

      expect(input.name).toBe("Updated Name");
      expect(input.description).toBeUndefined();
    });

    it("should accept full update", () => {
      const input: UpdateRewardInput = {
        name: "Updated Name",
        description: "Updated description",
        availableQuantity: 20,
        image: "https://example.com/new-image.jpg",
        images: ["https://example.com/new-image.jpg"],
        coinCost: 150,
      };

      expect(input.availableQuantity).toBe(20);
      expect(input.coinCost).toBe(150);
    });
  });

  describe("RewardPurchase interface", () => {
    it("should accept valid RewardPurchase", () => {
      const purchase: RewardPurchase = {
        id: "purchase-1",
        rewardId: "reward-1",
        groupId: "group-1",
        quantity: 2,
        totalCost: 200,
        status: "BOUGHT",
        purchasedAt: new Date(),
        purchasedBy: "user-1",
        reward: {
          id: "reward-1",
          name: "Test Reward",
          description: "A test reward",
          availableQuantity: 10,
          coinCost: 100,
          createdBy: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          tripId: "trip-1",
        },
        group: {
          id: "group-1",
          name: "Team A",
        },
      };

      expect(purchase.status).toBe("BOUGHT");
      expect(purchase.quantity).toBe(2);
      expect(purchase.totalCost).toBe(200);
    });

    it("should accept all status types", () => {
      const statuses: Array<RewardPurchase["status"]> = ["BOUGHT", "ACCEPTED", "IN_DELIVERY", "CANCELLED", "DELIVERED"];

      statuses.forEach((status) => {
        const purchase: RewardPurchase = {
          id: `purchase-${status}`,
          rewardId: "reward-1",
          groupId: "group-1",
          quantity: 1,
          totalCost: 100,
          status,
          purchasedAt: new Date(),
          purchasedBy: "user-1",
          reward: {
            id: "reward-1",
            name: "Test Reward",
            description: "A test reward",
            availableQuantity: 10,
            coinCost: 100,
            createdBy: "user-1",
            createdAt: new Date(),
            updatedAt: new Date(),
            tripId: "trip-1",
          },
          group: {
            id: "group-1",
            name: "Team A",
          },
        };

        expect(purchase.status).toBe(status);
      });
    });

    it("should accept RewardPurchase with collection method", () => {
      const purchase: RewardPurchase = {
        id: "purchase-1",
        rewardId: "reward-1",
        groupId: "group-1",
        quantity: 1,
        totalCost: 100,
        status: "IN_DELIVERY",
        collectionMethod: "Pickup at reception",
        purchasedAt: new Date(),
        purchasedBy: "user-1",
        reward: {
          id: "reward-1",
          name: "Test Reward",
          description: "A test reward",
          availableQuantity: 10,
          coinCost: 100,
          createdBy: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          tripId: "trip-1",
        },
        group: {
          id: "group-1",
          name: "Team A",
        },
      };

      expect(purchase.collectionMethod).toBe("Pickup at reception");
    });

    it("should accept RewardPurchase with status update info", () => {
      const purchase: RewardPurchase = {
        id: "purchase-1",
        rewardId: "reward-1",
        groupId: "group-1",
        quantity: 1,
        totalCost: 100,
        status: "DELIVERED",
        statusUpdatedAt: new Date(),
        statusUpdatedBy: {
          id: "admin-1",
          firstName: "Admin",
          lastName: "User",
        },
        purchasedAt: new Date(),
        purchasedBy: "user-1",
        reward: {
          id: "reward-1",
          name: "Test Reward",
          description: "A test reward",
          availableQuantity: 10,
          coinCost: 100,
          createdBy: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          tripId: "trip-1",
        },
        group: {
          id: "group-1",
          name: "Team A",
        },
      };

      expect(purchase.statusUpdatedBy?.firstName).toBe("Admin");
    });
  });
});
