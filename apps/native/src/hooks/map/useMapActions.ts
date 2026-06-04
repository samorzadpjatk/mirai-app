import { orpc } from "@mirai-app/orpc/client";
import { useMutation } from "@tanstack/react-query";

export function useMapActions() {
  const updateLocationMutation = useMutation(orpc.location.updateLocation.mutationOptions());

  const sendLocation = async (input: { latitude: number; longitude: number }) => {
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
