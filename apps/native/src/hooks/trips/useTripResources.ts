import { useCallback } from "react";
import { useQuery } from "urql";
import { GetTripResourcesDocument } from "@mirai-app/graphql-client";
import { TRIP_RESOURCE_TYPES } from "../../types/trip";

export function useTripResources(tripId?: string | null) {
  const [{ data, fetching, error }] = useQuery({
    query: GetTripResourcesDocument,
    variables: { tripId: tripId ?? "" },
    pause: !tripId,
  });

  const resourcesData = data?.tripResources;

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
    isLoading: fetching,
    isError: !!error,
    error,
    refetch: () => {}, // urql handles this via re-execute
  };
}
