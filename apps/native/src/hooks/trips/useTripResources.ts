import { orpc } from "@mirai-app/orpc/client";
import { TRIP_RESOURCE_TYPES } from "@mirai-app/shared/tripInfo";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

export function useTripResources(tripId?: string | null) {
  const resourcesQuery = useQuery(
    orpc.trip.getResources.queryOptions({
      input: { tripId: tripId ?? "" },
      enabled: !!tripId,
    }),
  );

  const { data: resourcesData, isLoading, isError, error, refetch } = resourcesQuery;

  // Helper function to get a resource by type
  const getResource = useCallback(
    (type: keyof typeof TRIP_RESOURCE_TYPES) => {
      if (!resourcesData?.resources) return null;
      return (
        resourcesData.resources.find((resource) => resource.type === TRIP_RESOURCE_TYPES[type]) ??
        null
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
