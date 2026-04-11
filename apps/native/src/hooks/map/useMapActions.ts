import { useMutation } from "urql";
import { UpdateLocationDocument } from "@mirai-app/graphql-client";

export function useMapActions() {
  const [, updateLocation] = useMutation(UpdateLocationDocument);

  const sendLocation = async (input: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  }) => {
    const result = await updateLocation({
      input: {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy ?? undefined,
      },
    });

    if (result.error) {
      throw result.error;
    }

    return result.data?.updateLocation;
  };

  return {
    sendLocation,
    isSendingLocation: false, // Can track from mutation state if needed
  };
}
