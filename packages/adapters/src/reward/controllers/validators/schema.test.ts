import { describe, it, expect } from "bun:test";
import {
  validateGetByIdInput,
  validateGetByTripInput,
  validateGetByTripAdminInput,
  validateCreateInput,
  validateUpdateInput,
  validateSetHiddenInput,
  validateDeleteInput,
  validatePurchaseInput,
  validateUpdatePurchaseStatusInput,
  validateUpdateMyPurchaseStatusInput,
  validateGetPurchaseHistoryInput,
} from "./schema";
import { UserRole, RewardPurchaseStatus } from "@mirai-app/domain";

describe("[UNIT] Reward Validators", () => {
  const validRewardId = "reward-123";
  const validTripId = "550e8400-e29b-41d4-a716-446655440000";
  const validUserId = "550e8400-e29b-41d4-a716-446655440001";
  const validPurchaseId = "purchase-456";

  describe("validateGetByIdInput", () => {
    it("should validate valid reward ID", () => {
      const input = { id: validRewardId };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validRewardId);
      }
    });

    it("should reject empty id", () => {
      const input = { id: "" };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const input = {};
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetByTripInput", () => {
    it("should validate minimal input", () => {
      const input = { tripId: validTripId };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with groupCoins", () => {
      const input = {
        tripId: validTripId,
        groupCoins: 500,
      };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with groupCoins = 0", () => {
      const input = {
        tripId: validTripId,
        groupCoins: 0,
      };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty tripId", () => {
      const input = { tripId: "" };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetByTripAdminInput", () => {
    it("should validate minimal input", () => {
      const input = { tripId: validTripId };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with pagination", () => {
      const input = {
        tripId: validTripId,
        pagination: {
          limit: 20,
          offset: 0,
        },
      };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit only", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 50 },
      };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset only", () => {
      const input = {
        tripId: validTripId,
        pagination: { offset: 10 },
      };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 1 (minimum)", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 1 },
      };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 100 (maximum)", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 100 },
      };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid pagination limit", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 0 },
      };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject pagination limit > 100", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 101 },
      };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative pagination offset", () => {
      const input = {
        tripId: validTripId,
        pagination: { offset: -1 },
      };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer pagination limit", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 10.5 },
      };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty tripId", () => {
      const input = { tripId: "" };
      const result = validateGetByTripAdminInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        name: "T-Shirt",
        description: "Comfortable cotton t-shirt with logo",
        availableQuantity: 50,
        coinCostPercentage: 50,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const input = {
        name: "Premium Hoodie",
        description: "High-quality hoodie with embroidered logo",
        availableQuantity: 25,
        coinCostPercentage: 75,
        images: [
          "https://example.com/hoodie1.jpg",
          "https://example.com/hoodie2.jpg",
        ],
        isHidden: false,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.MODERATOR,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with single image", () => {
      const input = {
        name: "Mug",
        description: "Coffee mug",
        availableQuantity: 100,
        coinCostPercentage: 30,
        images: ["https://example.com/mug.jpg"],
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.USER,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with maximum images (10)", () => {
      const input = {
        name: "Gallery Item",
        description: "Item with many photos",
        availableQuantity: 10,
        coinCostPercentage: 50,
        images: Array(10).fill("https://example.com/image.jpg"),
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.SERVICE,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with isHidden = true", () => {
      const input = {
        name: "Secret Reward",
        description: "Hidden reward for special users",
        availableQuantity: 5,
        coinCostPercentage: 100,
        isHidden: true,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate availableQuantity = 0", () => {
      const input = {
        name: "Out of Stock",
        description: "Currently unavailable",
        availableQuantity: 0,
        coinCostPercentage: 50,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate availableQuantity = 1000000 (maximum)", () => {
      const input = {
        name: "Mass Produced",
        description: "Abundant item",
        availableQuantity: 1000000,
        coinCostPercentage: 10,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate coinCostPercentage = 1 (minimum)", () => {
      const input = {
        name: "Cheap Item",
        description: "Low cost item",
        availableQuantity: 100,
        coinCostPercentage: 1,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate coinCostPercentage = 100 (maximum)", () => {
      const input = {
        name: "Expensive Item",
        description: "Full cost item",
        availableQuantity: 10,
        coinCostPercentage: 100,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const input = {
        name: "",
        description: "Description",
        availableQuantity: 50,
        coinCostPercentage: 50,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject name exceeding 200 characters", () => {
      const input = {
        name: "A".repeat(201),
        description: "Description",
        availableQuantity: 50,
        coinCostPercentage: 50,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty description", () => {
      const input = {
        name: "Item",
        description: "",
        availableQuantity: 50,
        coinCostPercentage: 50,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject description exceeding 2000 characters", () => {
      const input = {
        name: "Item",
        description: "A".repeat(2001),
        availableQuantity: 50,
        coinCostPercentage: 50,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative availableQuantity", () => {
      const input = {
        name: "Item",
        description: "Description",
        availableQuantity: -1,
        coinCostPercentage: 50,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject availableQuantity > 1000000", () => {
      const input = {
        name: "Item",
        description: "Description",
        availableQuantity: 1000001,
        coinCostPercentage: 50,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject coinCostPercentage = 0", () => {
      const input = {
        name: "Item",
        description: "Description",
        availableQuantity: 50,
        coinCostPercentage: 0,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject coinCostPercentage > 100", () => {
      const input = {
        name: "Item",
        description: "Description",
        availableQuantity: 50,
        coinCostPercentage: 101,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject more than 10 images", () => {
      const input = {
        name: "Item",
        description: "Description",
        availableQuantity: 50,
        coinCostPercentage: 50,
        images: Array(11).fill("https://example.com/image.jpg"),
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty image URLs", () => {
      const input = {
        name: "Item",
        description: "Description",
        availableQuantity: 50,
        coinCostPercentage: 50,
        images: [""],
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long image URLs", () => {
      const input = {
        name: "Item",
        description: "Description",
        availableQuantity: 50,
        coinCostPercentage: 50,
        images: ["https://example.com/" + "a".repeat(2000)],
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty tripId", () => {
      const input = {
        name: "Item",
        description: "Description",
        availableQuantity: 50,
        coinCostPercentage: 50,
        tripId: "",
        createdById: validUserId,
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty createdById", () => {
      const input = {
        name: "Item",
        description: "Description",
        availableQuantity: 50,
        coinCostPercentage: 50,
        tripId: validTripId,
        createdById: "",
        creatorRole: UserRole.ADMIN,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid creatorRole", () => {
      const input = {
        name: "Item",
        description: "Description",
        availableQuantity: 50,
        coinCostPercentage: 50,
        tripId: validTripId,
        createdById: validUserId,
        creatorRole: "INVALID_ROLE",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateInput", () => {
    it("should validate with rewardId only", () => {
      const input = { rewardId: validRewardId };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with name update", () => {
      const input = {
        rewardId: validRewardId,
        name: "Updated Name",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with description update", () => {
      const input = {
        rewardId: validRewardId,
        description: "Updated description",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with availableQuantity update", () => {
      const input = {
        rewardId: validRewardId,
        availableQuantity: 75,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with images update", () => {
      const input = {
        rewardId: validRewardId,
        images: ["https://example.com/new.jpg"],
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with coinCostPercentage update", () => {
      const input = {
        rewardId: validRewardId,
        coinCostPercentage: 60,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all fields updated", () => {
      const input = {
        rewardId: validRewardId,
        name: "Completely Updated",
        description: "New description",
        availableQuantity: 100,
        images: [],
        coinCostPercentage: 80,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty rewardId", () => {
      const input = {
        rewardId: "",
        name: "Updated",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name in update", () => {
      const input = {
        rewardId: validRewardId,
        name: "",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long name in update", () => {
      const input = {
        rewardId: validRewardId,
        name: "A".repeat(201),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty description in update", () => {
      const input = {
        rewardId: validRewardId,
        description: "",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long description in update", () => {
      const input = {
        rewardId: validRewardId,
        description: "A".repeat(2001),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative availableQuantity in update", () => {
      const input = {
        rewardId: validRewardId,
        availableQuantity: -5,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject availableQuantity > 1000000 in update", () => {
      const input = {
        rewardId: validRewardId,
        availableQuantity: 1000001,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject coinCostPercentage = 0 in update", () => {
      const input = {
        rewardId: validRewardId,
        coinCostPercentage: 0,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject coinCostPercentage > 100 in update", () => {
      const input = {
        rewardId: validRewardId,
        coinCostPercentage: 150,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject more than 10 images in update", () => {
      const input = {
        rewardId: validRewardId,
        images: Array(11).fill("https://example.com/img.jpg"),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing rewardId", () => {
      const input = { name: "Updated" };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateSetHiddenInput", () => {
    it("should validate with isHidden = true", () => {
      const input = {
        rewardId: validRewardId,
        isHidden: true,
      };
      const result = validateSetHiddenInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with isHidden = false", () => {
      const input = {
        rewardId: validRewardId,
        isHidden: false,
      };
      const result = validateSetHiddenInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty rewardId", () => {
      const input = {
        rewardId: "",
        isHidden: true,
      };
      const result = validateSetHiddenInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-boolean isHidden", () => {
      const input = {
        rewardId: validRewardId,
        isHidden: "true",
      };
      const result = validateSetHiddenInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing rewardId", () => {
      const input = { isHidden: true };
      const result = validateSetHiddenInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing isHidden", () => {
      const input = { rewardId: validRewardId };
      const result = validateSetHiddenInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateDeleteInput", () => {
    it("should validate valid reward ID", () => {
      const input = { rewardId: validRewardId };
      const result = validateDeleteInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty rewardId", () => {
      const input = { rewardId: "" };
      const result = validateDeleteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing rewardId", () => {
      const input = {};
      const result = validateDeleteInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validatePurchaseInput", () => {
    it("should validate minimal purchase", () => {
      const input = {
        rewardId: validRewardId,
        quantity: 1,
        userId: validUserId,
      };
      const result = validatePurchaseInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with quantity > 1", () => {
      const input = {
        rewardId: validRewardId,
        quantity: 5,
        userId: validUserId,
      };
      const result = validatePurchaseInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject quantity = 0", () => {
      const input = {
        rewardId: validRewardId,
        quantity: 0,
        userId: validUserId,
      };
      const result = validatePurchaseInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const input = {
        rewardId: validRewardId,
        quantity: -1,
        userId: validUserId,
      };
      const result = validatePurchaseInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer quantity", () => {
      const input = {
        rewardId: validRewardId,
        quantity: 1.5,
        userId: validUserId,
      };
      const result = validatePurchaseInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty rewardId", () => {
      const input = {
        rewardId: "",
        quantity: 1,
        userId: validUserId,
      };
      const result = validatePurchaseInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty userId", () => {
      const input = {
        rewardId: validRewardId,
        quantity: 1,
        userId: "",
      };
      const result = validatePurchaseInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing rewardId", () => {
      const input = {
        quantity: 1,
        userId: validUserId,
      };
      const result = validatePurchaseInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing quantity", () => {
      const input = {
        rewardId: validRewardId,
        userId: validUserId,
      };
      const result = validatePurchaseInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = {
        rewardId: validRewardId,
        quantity: 1,
      };
      const result = validatePurchaseInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdatePurchaseStatusInput", () => {
    it("should validate status update for admin", () => {
      const input = {
        purchaseId: validPurchaseId,
        status: RewardPurchaseStatus.ACCEPTED,
        updatedById: validUserId,
      };
      const result = validateUpdatePurchaseStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with collectionMethod", () => {
      const input = {
        purchaseId: validPurchaseId,
        status: RewardPurchaseStatus.IN_DELIVERY,
        updatedById: validUserId,
        collectionMethod: "Will be delivered to group leader",
      };
      const result = validateUpdatePurchaseStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate all status transitions", () => {
      const statuses = [
        RewardPurchaseStatus.BOUGHT,
        RewardPurchaseStatus.ACCEPTED,
        RewardPurchaseStatus.IN_DELIVERY,
        RewardPurchaseStatus.CANCELLED,
        RewardPurchaseStatus.DELIVERED,
      ];
      for (const status of statuses) {
        const input = {
          purchaseId: validPurchaseId,
          status,
          updatedById: validUserId,
        };
        const result = validateUpdatePurchaseStatusInput(input);
        expect(result.success).toBe(true);
      }
    });

    it("should reject empty purchaseId", () => {
      const input = {
        purchaseId: "",
        status: RewardPurchaseStatus.ACCEPTED,
        updatedById: validUserId,
      };
      const result = validateUpdatePurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const input = {
        purchaseId: validPurchaseId,
        status: "INVALID_STATUS",
        updatedById: validUserId,
      };
      const result = validateUpdatePurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty updatedById", () => {
      const input = {
        purchaseId: validPurchaseId,
        status: RewardPurchaseStatus.ACCEPTED,
        updatedById: "",
      };
      const result = validateUpdatePurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing purchaseId", () => {
      const input = {
        status: RewardPurchaseStatus.ACCEPTED,
        updatedById: validUserId,
      };
      const result = validateUpdatePurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing status", () => {
      const input = {
        purchaseId: validPurchaseId,
        updatedById: validUserId,
      };
      const result = validateUpdatePurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing updatedById", () => {
      const input = {
        purchaseId: validPurchaseId,
        status: RewardPurchaseStatus.ACCEPTED,
      };
      const result = validateUpdatePurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateMyPurchaseStatusInput", () => {
    it("should validate my status update", () => {
      const input = {
        purchaseId: validPurchaseId,
        status: RewardPurchaseStatus.DELIVERED,
        userId: validUserId,
      };
      const result = validateUpdateMyPurchaseStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty purchaseId", () => {
      const input = {
        purchaseId: "",
        status: RewardPurchaseStatus.DELIVERED,
        userId: validUserId,
      };
      const result = validateUpdateMyPurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const input = {
        purchaseId: validPurchaseId,
        status: "INVALID",
        userId: validUserId,
      };
      const result = validateUpdateMyPurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty userId", () => {
      const input = {
        purchaseId: validPurchaseId,
        status: RewardPurchaseStatus.DELIVERED,
        userId: "",
      };
      const result = validateUpdateMyPurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing purchaseId", () => {
      const input = {
        status: RewardPurchaseStatus.DELIVERED,
        userId: validUserId,
      };
      const result = validateUpdateMyPurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing status", () => {
      const input = {
        purchaseId: validPurchaseId,
        userId: validUserId,
      };
      const result = validateUpdateMyPurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = {
        purchaseId: validPurchaseId,
        status: RewardPurchaseStatus.DELIVERED,
      };
      const result = validateUpdateMyPurchaseStatusInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetPurchaseHistoryInput", () => {
    it("should validate minimal input", () => {
      const input = {
        tripId: validTripId,
        userId: validUserId,
      };
      const result = validateGetPurchaseHistoryInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with isStaff", () => {
      const input = {
        tripId: validTripId,
        userId: validUserId,
        isStaff: true,
      };
      const result = validateGetPurchaseHistoryInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with pagination", () => {
      const input = {
        tripId: validTripId,
        userId: validUserId,
        isStaff: false,
        pagination: {
          limit: 20,
          offset: 10,
        },
      };
      const result = validateGetPurchaseHistoryInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty tripId", () => {
      const input = {
        tripId: "",
        userId: validUserId,
      };
      const result = validateGetPurchaseHistoryInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty userId", () => {
      const input = {
        tripId: validTripId,
        userId: "",
      };
      const result = validateGetPurchaseHistoryInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = { userId: validUserId };
      const result = validateGetPurchaseHistoryInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = { tripId: validTripId };
      const result = validateGetPurchaseHistoryInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetByIdInput: rewardId (string, non-empty)
 * - validateGetByTripInput: tripId (string, non-empty) + optional groupCoins (number)
 * - validateGetByTripAdminInput: tripId (string) + optional pagination with limit (1-100) and offset (>=0, both integers)
 * - validateCreateInput: comprehensive validation including:
 *   - Required: name (1-200), description (1-2000), availableQuantity (0-1000000, int),
 *              coinCostPercentage (1-100, int), tripId, createdById (both non-empty strings),
 *              creatorRole (UserRole enum)
 *   - Optional: images (array of 0-10 URLs, each 1-2000 chars), isHidden (boolean)
 * - validateUpdateInput: rewardId (string) + optional fields with same constraints as create
 * - validateSetHiddenInput: rewardId (string) + isHidden (boolean)
 * - validateDeleteInput: rewardId (string, non-empty)
 * - validatePurchaseInput: rewardId (string) + quantity (>=1, int) + userId (string)
 * - validateUpdatePurchaseStatusInput: purchaseId (string) + status (RewardPurchaseStatus enum) +
 *                                   updatedById (string) + optional collectionMethod (1-500 chars)
 * - validateUpdateMyPurchaseStatusInput: purchaseId (string) + status (RewardPurchaseStatus enum) +
 *                                     userId (string)
 * - validateGetPurchaseHistoryInput: tripId (string) + userId (string) + optional isStaff (boolean) +
 *                                 optional pagination
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Boundary values for numeric fields (availableQuantity, coinCostPercentage, quantity, pagination)
 * - Integer validation for numeric fields
 * - Enum validation (UserRole, RewardPurchaseStatus)
 * - Array validation (images max 10 items, each URL 1-2000 chars)
 * - Missing required vs optional fields
 */
