import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "~/lib/graphql-client";
import { TRIP_RESOURCE_TYPES } from "../../types/trip";

// GraphQL document for trip resources (not yet in generated hooks)
const GetTripResourcesDocument = `
  query GetTripResources($tripId: ID!) {
    tripResources(tripId: $tripId) {
      resources {
        id
        type
        title
        description
        url
        fileUrl
        order
      }
      insurance {
        id
        provider
        policyNumber
        coverage
        emergencyContact
      }
    }
  }
`;

export function useTripResources(tripId?: string | null) {
  const resourcesQuery = useQuery({
    queryKey: ["GetTripResources", tripId ?? ""],
    queryFn: async () => {
      if (!tripId) return null;
      const result = await graphqlClient.request<{
        tripResources: {
          resources: Array<{
            id: string;
            type: string;
            title: string;
            description: string | null;
            url: string | null;
            fileUrl: string | null;
            order: number;
          }>;
          insurance: {
            id: string;
            provider: string;
            policyNumber: string;
            coverage: string;
            emergencyContact: string;
          } | null;
        };
      }>(GetTripResourcesDocument, { tripId });
      return result.tripResources;
    },
    enabled: !!tripId,
  });

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
