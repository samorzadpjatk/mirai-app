import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import type { GroupListItem } from "~/components/trips/groups/types";

export function useGroups(tripId?: string | null) {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: groups, isLoading } = useQuery({
    ...trpc.group.getAll.queryOptions({ tripId: tripId ?? "" }),
    enabled: !!tripId,
  });

  const filteredGroups: GroupListItem[] = useMemo(() => {
    const safeGroups = groups ?? [];
    return safeGroups
      .filter((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .map((group) => ({
        id: group.id,
        name: group.name,
        code: group.code,
        image: group.image,
        updatedAt: group.updatedAt,
        participantCount: group.participants.length,
      }));
  }, [groups, searchQuery]);

  return {
    groups,
    filteredGroups,
    isLoading,
    searchQuery,
    setSearchQuery,
  };
}
