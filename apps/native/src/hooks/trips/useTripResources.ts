import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/frameworks/trpc/client";
import { TRIP_RESOURCE_TYPES } from "../../types/trip";

export function useTripResources(tripId?: string | null) {
  const trpc = useTRPC();

  const resourcesQuery = useQuery(
    trpc.trip.getResources.queryOptions(
      { tripId: tripId ?? "" },
      { enabled: !!tripId },
    ),
  );

  const {
    data: resourcesData,
    isLoading,
    isError,
    error,
    refetch,
  } = resourcesQuery;

  // Helper function to get a resource by type
  const getResource = useCallback(
    (type: keyof typeof TRIP_RESOURCE_TYPES) => {
      if (!resourcesData?.resources) return null;
      return (
        resourcesData.resources.find(
          (resource) => resource.type === TRIP_RESOURCE_TYPES[type],
        ) ?? null
      );
    },
    [resourcesData],
  );

  return {
    resources: resourcesData?.resources ?? [],
    insurance: resourcesData?.insurance ?? null,
    getResource,
    isLoading,
    isError,
    error,
    refetch,
  };
}
