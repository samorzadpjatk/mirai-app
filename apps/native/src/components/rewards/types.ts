export interface Reward {
  id: string;
  name: string;
  description: string;
  availableQuantity: number;
  image?: string;
  images?: string[];
  signedImageUrls?: string[];
  coinCost: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tripId: string;
}

export interface CreateRewardInput {
  name: string;
  description: string;
  availableQuantity: number;
  image?: string;
  images?: string[];
  coinCost: number;
  isHidden?: boolean;
  tripId: string;
}

export interface UpdateRewardInput {
  name?: string;
  description?: string;
  availableQuantity?: number;
  image?: string;
  images?: string[];
  coinCost?: number;
}

export interface RewardPurchase {
  id: string;
  rewardId: string;
  groupId: string;
  quantity: number;
  totalCost: number;
  status: "BOUGHT" | "ACCEPTED" | "IN_DELIVERY" | "CANCELLED" | "DELIVERED";
  collectionMethod?: string | null;
  statusUpdatedAt?: Date | string;
  statusUpdatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  purchasedAt: Date;
  purchasedBy: string;
  reward: Reward;
  group: {
    id: string;
    name: string;
  };
}

export interface RewardListItem {
  id: string;
  name: string;
  description: string;
  availableQuantity: number;
  image: string | null;
  signedImageUrl?: string | null;
  images?: string[];
  signedImageUrls?: string[];
  coinCost: number;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
  updatedAt: Date;
  tripId: string;
  canAfford: boolean;
  isEligibleToBuy: boolean;
  isOutOfStock: boolean;
  purchasedCount: number;
}
