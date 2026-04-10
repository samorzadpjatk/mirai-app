import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/frameworks/graphql";

export function useMapActions() {
  const trpc = useTRPC();
  const updateLocationMutation = useMutation({
    mutationFn: async (input: {
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      altitude?: number | null;
      altitudeAccuracy?: number | null;
      heading?: number | null;
      speed?: number | null;
    }) => {
      return trpc.location.update.mutate({
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy ?? undefined,
      });
    },
  });

  const sendLocation = async (input: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  }) => {
    return updateLocationMutation.mutateAsync({
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
    });
  };

  return {
    sendLocation,
    isSendingLocation: updateLocationMutation.isPending,
  };
}
