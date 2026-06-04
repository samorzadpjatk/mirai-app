import { orpc } from "@mirai-app/orpc/client";
import { useMutation } from "@tanstack/react-query";

export function useMapActions() {
  const updateLocationMutation = useMutation(orpc.location.updateLocation.mutationOptions());

  const sendLocation = async (input: { latitude: number; longitude: number }) => {
    return updateLocationMutation.mutateAsync({
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: undefined,
      altitude: undefined,
      altitudeAccuracy: undefined,
      heading: undefined,
      speed: undefined,
    });
  };

  return {
    sendLocation,
    isSendingLocation: updateLocationMutation.isPending,
  };
}
