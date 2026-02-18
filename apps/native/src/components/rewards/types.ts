export interface Reward {
  id: string;
  name: string;
  description: string;
  availableQuantity: number;
  image?: string;
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
  coinCost: number;
  tripId: string;
}

export interface UpdateRewardInput {
  name?: string;
  description?: string;
  availableQuantity?: number;
  image?: string;
  coinCost?: number;
}

export interface RewardPurchase {
  id: string;
  rewardId: string;
  groupId: string;
  quantity: number;
  totalCost: number;
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
  isOutOfStock: boolean;
  purchasedCount: number;
}
