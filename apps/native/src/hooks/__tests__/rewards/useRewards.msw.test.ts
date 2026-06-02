import { describe, it, expect } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import {
  useRewards,
  useAdminRewards,
  useReward,
  useCreateReward,
  useUpdateReward,
  useSetRewardHidden,
  useDeleteReward,
  usePurchaseReward,
  useRewardPurchaseHistory,
  useUpdateRewardPurchaseStatus,
  useUpdateMyRewardPurchaseStatus,
} from "../../rewards";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler } from "../../../test-utils/msw/server";

describe("useRewards (MSW)", () => {
  it("should return rewards for a trip", async () => {
    const mockRewards = [
      { id: "reward-1", name: "Reward One", cost: 100 },
      { id: "reward-2", name: "Reward Two", cost: 200 },
    ];

    server.use(createORPCHandler(["reward", "getByTrip"], () => mockRewards));

    const { result } = renderHookWithMSW(() => useRewards("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockRewards);
  });

  it("should not fetch when tripId is empty", async () => {
    const { result } = renderHookWithMSW(() => useRewards(""));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});

describe("useAdminRewards (MSW)", () => {
  it("should return paginated admin rewards for a trip", async () => {
    const mockRewards = [
      { id: "reward-1", name: "Admin Reward One", coinCost: 100 },
      { id: "reward-2", name: "Admin Reward Two", coinCost: 200 },
    ];

    server.use(
      createORPCHandler(["reward", "getByTripAdmin"], () => ({
        rewards: mockRewards,
        pagination: { total: 2, limit: 30, offset: 0, hasMore: false },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminRewards("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0]!.id).toBe("reward-1");
    expect(result.current.data![1]!.name).toBe("Admin Reward Two");
    expect(result.current.hasNextPage).toBe(false);
  });

  it("should indicate hasNextPage when more pages exist", async () => {
    const mockRewards = [{ id: "reward-1", name: "Reward One", coinCost: 100 }];

    server.use(
      createORPCHandler(["reward", "getByTripAdmin"], () => ({
        rewards: mockRewards,
        pagination: { total: 5, limit: 30, offset: 0, hasMore: true },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminRewards("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("should not fetch when tripId is null", async () => {
    const { result } = renderHookWithMSW(() => useAdminRewards(null));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it("should not fetch when tripId is undefined", async () => {
    const { result } = renderHookWithMSW(() => useAdminRewards(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
  });
});

describe("useReward (MSW)", () => {
  it("should return reward by ID", async () => {
    const mockReward = {
      id: "reward-1",
      name: "Specific Reward",
      description: "A detailed reward",
      cost: 150,
    };

    server.use(createORPCHandler(["reward", "getById"], () => mockReward));

    const { result } = renderHookWithMSW(() => useReward("reward-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockReward);
  });

  it("should not fetch when id is null", async () => {
    const { result } = renderHookWithMSW(() => useReward(null));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});

describe("useCreateReward (MSW)", () => {
  it("should create reward via mutation", async () => {
    const createdReward = { id: "new-reward", name: "New Reward", cost: 100, tripId: "trip-1" };

    server.use(createORPCHandler(["reward", "create"], () => createdReward));

    const { result } = renderHookWithMSW(() => useCreateReward());

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const response = await result.current.mutateAsync({
      name: "New Reward",
      description: "A new reward description",
      availableQuantity: 10,
      coinCost: 100,
      tripId: "trip-1",
    });

    expect(response).toEqual(createdReward);
  });
});

describe("useUpdateReward (MSW)", () => {
  it("should update reward via mutation", async () => {
    const updatedReward = {
      id: "reward-1",
      name: "Updated Reward",
      description: "Updated description",
      coinCost: 200,
    };

    server.use(createORPCHandler(["reward", "update"], () => updatedReward));

    const { result } = renderHookWithMSW(() => useUpdateReward());

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const response = await result.current.mutateAsync({
      id: "reward-1",
      name: "Updated Reward",
      description: "Updated description",
      coinCost: 200,
    });

    expect(response).toEqual(updatedReward);
  });
});

describe("useSetRewardHidden (MSW)", () => {
  it("should set reward hidden status via mutation", async () => {
    const updatedReward = {
      id: "reward-1",
      name: "Reward One",
      isHidden: true,
    };

    server.use(createORPCHandler(["reward", "setHidden"], () => updatedReward));

    const { result } = renderHookWithMSW(() => useSetRewardHidden());

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const response = await result.current.mutateAsync({
      id: "reward-1",
      isHidden: true,
    });

    expect(response).toEqual(updatedReward);
  });
});

describe("useDeleteReward (MSW)", () => {
  it("should delete reward via mutation", async () => {
    server.use(createORPCHandler(["reward", "delete"], () => ({ success: true })));

    const { result } = renderHookWithMSW(() => useDeleteReward());

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const response = await result.current.mutateAsync({ id: "reward-1" });

    expect(response).toEqual({ success: true });
  });
});

describe("usePurchaseReward (MSW)", () => {
  it("should purchase reward via mutation", async () => {
    const purchase = {
      id: "purchase-1",
      rewardId: "reward-1",
      quantity: 2,
      totalCost: 200,
      status: "BOUGHT",
    };

    server.use(createORPCHandler(["reward", "purchase"], () => purchase));

    const { result } = renderHookWithMSW(() => usePurchaseReward());

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const response = await result.current.mutateAsync({
      rewardId: "reward-1",
      quantity: 2,
    });

    expect(response).toEqual(purchase);
  });
});

describe("useRewardPurchaseHistory (MSW)", () => {
  it("should return paginated purchase history for a trip", async () => {
    const mockPurchases = [
      {
        id: "purchase-1",
        rewardId: "reward-1",
        quantity: 1,
        totalCost: 100,
        status: "BOUGHT",
      },
      {
        id: "purchase-2",
        rewardId: "reward-2",
        quantity: 2,
        totalCost: 400,
        status: "ACCEPTED",
      },
    ];

    server.use(
      createORPCHandler(["reward", "getPurchaseHistory"], () => ({
        purchases: mockPurchases,
        pagination: { total: 2, limit: 30, offset: 0, hasMore: false },
      })),
    );

    const { result } = renderHookWithMSW(() => useRewardPurchaseHistory("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0]!.id).toBe("purchase-1");
    expect(result.current.data![1]!.status).toBe("ACCEPTED");
    expect(result.current.hasNextPage).toBe(false);
  });

  it("should indicate hasNextPage when more purchase history pages exist", async () => {
    const mockPurchases = [
      { id: "purchase-1", rewardId: "reward-1", quantity: 1, totalCost: 100, status: "BOUGHT" },
    ];

    server.use(
      createORPCHandler(["reward", "getPurchaseHistory"], () => ({
        purchases: mockPurchases,
        pagination: { total: 5, limit: 30, offset: 0, hasMore: true },
      })),
    );

    const { result } = renderHookWithMSW(() => useRewardPurchaseHistory("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("should not fetch when tripId is empty", async () => {
    const { result } = renderHookWithMSW(() => useRewardPurchaseHistory(""));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
  });
});

describe("useUpdateRewardPurchaseStatus (MSW)", () => {
  it("should update purchase status via mutation", async () => {
    const updatedPurchase = {
      id: "purchase-1",
      rewardId: "reward-1",
      status: "ACCEPTED",
      collectionMethod: "Pickup at front desk",
    };

    server.use(createORPCHandler(["reward", "updatePurchaseStatus"], () => updatedPurchase));

    const { result } = renderHookWithMSW(() => useUpdateRewardPurchaseStatus());

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const response = await result.current.mutateAsync({
      purchaseId: "purchase-1",
      status: "ACCEPTED",
      collectionMethod: "Pickup at front desk",
    });

    expect(response).toEqual(updatedPurchase);
  });
});

describe("useUpdateMyRewardPurchaseStatus (MSW)", () => {
  it("should update my purchase status via mutation", async () => {
    const updatedPurchase = {
      id: "purchase-1",
      rewardId: "reward-1",
      status: "CANCELLED",
    };

    server.use(createORPCHandler(["reward", "updateMyPurchaseStatus"], () => updatedPurchase));

    const { result } = renderHookWithMSW(() => useUpdateMyRewardPurchaseStatus());

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const response = await result.current.mutateAsync({
      purchaseId: "purchase-1",
      status: "CANCELLED",
    });

    expect(response).toEqual(updatedPurchase);
  });
});
