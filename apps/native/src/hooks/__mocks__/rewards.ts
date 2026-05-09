import { jest } from "@jest/globals";

export const mockUseRewards = jest.fn((_tripId: string) => ({
  data: [] as {
    id: string;
    name: string;
    description?: string;
    coinCost: number;
    availableQuantity: number;
    image?: string | null;
    images?: string[];
    signedImageUrls?: string[];
    isOutOfStock?: boolean;
    canAfford?: boolean;
    isEligibleToBuy?: boolean;
    purchasedCount?: number;
  }[],
  isLoading: false,
  error: null as Error | null,
  refetch: jest.fn(() => Promise.resolve()),
}));

export const mockUseAdminRewards = jest.fn((_tripId?: string | null) => ({
  data: [] as {
    id: string;
    name: string;
    description?: string;
    coinCost: number;
    availableQuantity: number;
    image?: string | null;
    isHidden?: boolean;
    createdBy?: { id: string; firstName: string; lastName: string };
    createdAt?: Date;
    updatedAt?: Date;
    tripId?: string;
  }[],
  isLoading: false,
  error: null as Error | null,
  isRefetching: false,
  refetch: jest.fn(() => Promise.resolve()),
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(() => Promise.resolve()),
}));

export const mockUseReward = jest.fn((_id: string | null) => ({
  data: null as {
    id: string;
    name: string;
    description?: string;
    coinCost: number;
    availableQuantity: number;
    image?: string | null;
    images?: string[];
    signedImageUrls?: string[];
    isHidden?: boolean;
    createdBy?: { id: string; firstName: string; lastName: string };
    createdAt?: Date;
    updatedAt?: Date;
    tripId?: string;
  } | null,
  isLoading: false,
  error: null as Error | null,
}));

export const mockUseCreateReward = jest.fn(() => ({
  mutateAsync: jest.fn(() => Promise.resolve({ id: "new-reward-id" })),
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

export const mockUseUpdateReward = jest.fn(() => ({
  mutateAsync: jest.fn(() => Promise.resolve({ id: "updated-reward-id" })),
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

export const mockUseSetRewardHidden = jest.fn(() => ({
  mutateAsync: jest.fn(() => Promise.resolve({ id: "hidden-reward-id", isHidden: true })),
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

export const mockUseDeleteReward = jest.fn(() => ({
  mutateAsync: jest.fn(() => Promise.resolve()),
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

export const mockUsePurchaseReward = jest.fn(() => ({
  mutateAsync: jest.fn(() => Promise.resolve({ success: true })),
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

export const mockUseRewardPurchaseHistory = jest.fn((_tripId: string) => ({
  data: [] as {
    id: string;
    rewardId: string;
    rewardName: string;
    groupId: string;
    groupName: string;
    status: "pending" | "completed" | "cancelled";
    purchasedAt: Date;
    completedAt?: Date | null;
    coinCost: number;
  }[],
  isLoading: false,
  error: null as Error | null,
  isRefetching: false,
  refetch: jest.fn(() => Promise.resolve()),
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(() => Promise.resolve()),
}));

export const mockUseUpdateRewardPurchaseStatus = jest.fn(() => ({
  mutateAsync: jest.fn(() => Promise.resolve({ success: true })),
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

export const mockUseUpdateMyRewardPurchaseStatus = jest.fn(() => ({
  mutateAsync: jest.fn(() => Promise.resolve({ success: true })),
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

export const useRewards = mockUseRewards;
export const useAdminRewards = mockUseAdminRewards;
export const useReward = mockUseReward;
export const useCreateReward = mockUseCreateReward;
export const useUpdateReward = mockUseUpdateReward;
export const useSetRewardHidden = mockUseSetRewardHidden;
export const useDeleteReward = mockUseDeleteReward;
export const usePurchaseReward = mockUsePurchaseReward;
export const useRewardPurchaseHistory = mockUseRewardPurchaseHistory;
export const useUpdateRewardPurchaseStatus = mockUseUpdateRewardPurchaseStatus;
export const useUpdateMyRewardPurchaseStatus = mockUseUpdateMyRewardPurchaseStatus;
