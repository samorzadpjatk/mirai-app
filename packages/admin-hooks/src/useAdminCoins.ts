"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/trpc/client";

export interface Group {
  id: string;
  name: string;
  coins: number;
  organizer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  _count: { participants: number };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function useAdminCoins(tripId: string) {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ["coins", "groups", tripId],
    enabled: Boolean(tripId),
    queryFn: () => trpc.group.getGroupList.query({ tripId }),
  });

  const groups = useMemo(() => {
    if (!Array.isArray(groupsQuery.data)) {
      return [] as Group[];
    }

    return groupsQuery.data
      .map((group) => {
        if (
          !isObject(group) ||
          typeof group.id !== "string" ||
          typeof group.name !== "string"
        ) {
          return null;
        }

        const organizer = isObject(group.organizer)
          ? {
              id:
                typeof group.organizer.id === "string"
                  ? group.organizer.id
                  : "",
              firstName:
                typeof group.organizer.firstName === "string"
                  ? group.organizer.firstName
                  : null,
              lastName:
                typeof group.organizer.lastName === "string"
                  ? group.organizer.lastName
                  : null,
            }
          : null;

        const count = isObject(group._count) ? group._count : null;

        return {
          id: group.id,
          name: group.name,
          coins: typeof group.coins === "number" ? group.coins : 0,
          organizer,
          _count: {
            participants:
              count && typeof count.participants === "number"
                ? count.participants
                : 0,
          },
        } as Group;
      })
      .filter((group): group is Group => group !== null);
  }, [groupsQuery.data]);

  const mutateCoins = useMutation({
    mutationFn: (input: { groupId: string; amount: number; tripId: string }) =>
      trpc.group.addCoins.mutate(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["coins", "groups", tripId],
        }),
        queryClient.invalidateQueries({ queryKey: ["transactions", tripId] }),
        queryClient.invalidateQueries({ queryKey: ["groups", tripId] }),
      ]);
    },
  });

  const addCoins = (groupId: string, amount: number, _reason: string) => {
    if (amount <= 0) {
      throw new Error("Amount must be positive for adding coins.");
    }

    return mutateCoins.mutateAsync({
      groupId,
      amount,
      tripId,
    });
  };

  const removeCoins = (groupId: string, amount: number, _reason: string) => {
    if (amount <= 0) {
      throw new Error("Amount must be positive for removing coins.");
    }

    return mutateCoins.mutateAsync({
      groupId,
      amount: -amount,
      tripId,
    });
  };

  return {
    groups,
    groupsLoading: groupsQuery.isLoading,
    addCoins,
    removeCoins,
    isAddingCoins: mutateCoins.isPending,
    isRemovingCoins: mutateCoins.isPending,
  };
}
