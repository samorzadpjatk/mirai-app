import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetRewardDocument,
  GetRewardsByTripDocument,
  GetRewardsByTripAdminDocument,
  CreateRewardDocument,
  UpdateRewardDocument,
  DeleteRewardDocument,
  PurchaseRewardDocument,
  SetRewardHiddenDocument,
  GetPurchaseHistoryDocument,
  UpdatePurchaseStatusDocument,
  UpdateMyPurchaseStatusDocument,
} from "@mirai-app/frameworks";

const PAGE_SIZE = 30;

export const useRewards = (tripId: string) => {
  return useQuery({
    query: GetRewardsByTripDocument,
    variables: { tripId },
    pause: !tripId,
  });
};

export const useAdminRewards = (tripId?: string | null) => {
  const client = useClient();
  const [offset, setOffset] = useState(0);

  const [{ data, fetching, error }] = useQuery({
    query: GetRewardsByTripAdminDocument,
    variables: {
      tripId: tripId ?? "",
      pagination: { limit: PAGE_SIZE, offset },
    },
    pause: !tripId,
  });

  const rewards = useMemo(
    () => data?.rewardsByTripAdmin?.rewards ?? [],
    [data],
  );

  const hasNextPage = useMemo(
    () => data?.rewardsByTripAdmin?.pagination?.hasMore ?? false,
    [data],
  );

  const fetchNextPage = useCallback(() => {
    if (hasNextPage) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [hasNextPage]);

  const refetch = useCallback(() => {
    setOffset(0);
    client.invalidate(GetRewardsByTripAdminDocument, {
      tripId: tripId ?? "",
      pagination: { limit: PAGE_SIZE, offset: 0 },
    });
  }, [client, tripId]);

  return {
    data: rewards,
    isLoading: fetching && offset === 0,
    error,
    isRefetching: false,
    refetch,
    hasNextPage,
    isFetchingNextPage: fetching && offset > 0,
    fetchNextPage,
  };
};

export const useReward = (id: string | null) => {
  return useQuery({
    query: GetRewardDocument,
    variables: { id: id ?? "" },
    pause: !id,
  });
};

export const useCreateReward = () => {
  const client = useClient();
  const [, createReward] = useMutation(CreateRewardDocument);

  return async (input: {
    tripId: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    quantity?: number | null;
    imageUrl?: string | null;
  }) => {
    const result = await createReward({ input });

    if (result.error) {
      throw result.error;
    }

    // Invalidate rewards queries
    client.invalidate(GetRewardsByTripDocument, { tripId: input.tripId });
    client.invalidate(GetRewardsByTripAdminDocument, {
      tripId: input.tripId,
      pagination: { limit: PAGE_SIZE, offset: 0 },
    });

    return result.data;
  };
};

export const useUpdateReward = () => {
  const client = useClient();
  const [, updateReward] = useMutation(UpdateRewardDocument);

  return async (input: {
    id: string;
    tripId: string;
    name?: string;
    description?: string | null;
    pointsCost?: number;
    quantity?: number | null;
    imageUrl?: string | null;
  }) => {
    const result = await updateReward({ input });

    if (result.error) {
      throw result.error;
    }

    // Invalidate rewards queries
    client.invalidate(GetRewardDocument, { id: input.id });
    client.invalidate(GetRewardsByTripDocument, { tripId: input.tripId });
    client.invalidate(GetRewardsByTripAdminDocument, {
      tripId: input.tripId,
      pagination: { limit: PAGE_SIZE, offset: 0 },
    });

    return result.data;
  };
};

export const useSetRewardHidden = () => {
  const client = useClient();
  const [, setHidden] = useMutation(SetRewardHiddenDocument);

  return async (input: { id: string; tripId: string; isHidden: boolean }) => {
    const result = await setHidden({ input });

    if (result.error) {
      throw result.error;
    }

    // Invalidate rewards queries
    client.invalidate(GetRewardDocument, { id: input.id });
    client.invalidate(GetRewardsByTripDocument, { tripId: input.tripId });
    client.invalidate(GetRewardsByTripAdminDocument, {
      tripId: input.tripId,
      pagination: { limit: PAGE_SIZE, offset: 0 },
    });

    return result.data;
  };
};

export const useDeleteReward = () => {
  const client = useClient();
  const [, deleteReward] = useMutation(DeleteRewardDocument);

  return async (input: { id: string; tripId: string }) => {
    const result = await deleteReward({ input });

    if (result.error) {
      throw result.error;
    }

    // Invalidate rewards queries
    client.invalidate(GetRewardsByTripDocument, { tripId: input.tripId });
    client.invalidate(GetRewardsByTripAdminDocument, {
      tripId: input.tripId,
      pagination: { limit: PAGE_SIZE, offset: 0 },
    });

    return result.data;
  };
};

export const usePurchaseReward = () => {
  const client = useClient();
  const [, purchaseReward] = useMutation(PurchaseRewardDocument);

  return async (input: { rewardId: string; tripId: string }) => {
    const result = await purchaseReward({ input });

    if (result.error) {
      throw result.error;
    }

    // Invalidate queries
    client.invalidate(GetRewardsByTripDocument, { tripId: input.tripId });
    client.invalidate(GetPurchaseHistoryDocument, {
      tripId: input.tripId,
      pagination: { limit: PAGE_SIZE, offset: 0 },
    });

    return result.data;
  };
};

export const useRewardPurchaseHistory = (tripId: string) => {
  const client = useClient();
  const [offset, setOffset] = useState(0);

  const [{ data, fetching, error }] = useQuery({
    query: GetPurchaseHistoryDocument,
    variables: {
      tripId,
      pagination: { limit: PAGE_SIZE, offset },
    },
    pause: !tripId,
  });

  const purchases = useMemo(
    () => data?.purchaseHistory?.purchases ?? [],
    [data],
  );

  const hasNextPage = useMemo(
    () => data?.purchaseHistory?.pagination?.hasMore ?? false,
    [data],
  );

  const fetchNextPage = useCallback(() => {
    if (hasNextPage) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [hasNextPage]);

  const refetch = useCallback(() => {
    setOffset(0);
    client.invalidate(GetPurchaseHistoryDocument, {
      tripId,
      pagination: { limit: PAGE_SIZE, offset: 0 },
    });
  }, [client, tripId]);

  return {
    data: purchases,
    isLoading: fetching && offset === 0,
    error,
    isRefetching: false,
    refetch,
    hasNextPage,
    isFetchingNextPage: fetching && offset > 0,
    fetchNextPage,
  };
};

export const useUpdateRewardPurchaseStatus = () => {
  const client = useClient();
  const [, updateStatus] = useMutation(UpdatePurchaseStatusDocument);

  return async (input: {
    purchaseId: string;
    rewardId: string;
    tripId: string;
    status: string;
  }) => {
    const result = await updateStatus({ input });

    if (result.error) {
      throw result.error;
    }

    // Invalidate queries
    client.invalidate(GetPurchaseHistoryDocument, {
      tripId: input.tripId,
      pagination: { limit: PAGE_SIZE, offset: 0 },
    });
    client.invalidate(GetRewardDocument, { id: input.rewardId });
    client.invalidate(GetRewardsByTripDocument, { tripId: input.tripId });
    client.invalidate(GetRewardsByTripAdminDocument, {
      tripId: input.tripId,
      pagination: { limit: PAGE_SIZE, offset: 0 },
    });

    return result.data;
  };
};

export const useUpdateMyRewardPurchaseStatus = () => {
  const client = useClient();
  const [, updateStatus] = useMutation(UpdateMyPurchaseStatusDocument);

  return async (input: {
    purchaseId: string;
    tripId: string;
    status: string;
  }) => {
    const result = await updateStatus({ input });

    if (result.error) {
      throw result.error;
    }

    // Invalidate queries
    client.invalidate(GetPurchaseHistoryDocument, {
      tripId: input.tripId,
      pagination: { limit: PAGE_SIZE, offset: 0 },
    });
    client.invalidate(GetRewardsByTripDocument, { tripId: input.tripId });

    return result.data;
  };
};
