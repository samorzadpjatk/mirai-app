import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

export function useMapActions() {
  const trpc = useTRPC();
  const updateLocationMutation = useMutation(trpc.location.updateLocation.mutationOptions());

  const sendLocation = async (input: {
    latitude: number;
    longitude: number;
  }) => {
    return updateLocationMutation.mutateAsync({
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  };

  return {
    sendLocation,
    isSendingLocation: updateLocationMutation.isPending,
  };
}
