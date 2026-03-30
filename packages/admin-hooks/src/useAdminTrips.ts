"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/trpc/client";

export interface AdminTrip {
  id: string;
  name: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function useAdminTrips() {
  const trpc = useTRPCClient();

  const query = useQuery({
    queryKey: ["admin-trips"],
    queryFn: () =>
      trpc.trip.getAll.query({
        pagination: {
          limit: 100,
          offset: 0,
        },
      }),
  });

  const trips = useMemo(() => {
    const data = query.data;
    if (!isObject(data) || !Array.isArray(data.trips)) {
      return [] as AdminTrip[];
    }

    return data.trips
      .map((trip) => {
        if (
          !isObject(trip) ||
          typeof trip.id !== "string" ||
          typeof trip.name !== "string"
        ) {
          return null;
        }
        return {
          id: trip.id,
          name: trip.name,
        };
      })
      .filter((trip): trip is AdminTrip => trip !== null);
  }, [query.data]);

  return {
    trips,
    isLoading: query.isLoading,
  };
}
