import { useCallback } from "react";
import { useMutation } from "urql";
import {
  CreateGroupDocument,
  GetGroupsByTripDocument,
} from "@mirai-app/graphql-client";
import { useClient } from "urql";

export function useCreateGroup(tripId?: string | null) {
  const client = useClient();
  const [, createGroupMutation] = useMutation(CreateGroupDocument);

  const createGroup = async (args: { name: string; image?: string }) => {
    const { name, image } = args;
    const result = await createGroupMutation({
      input: {
        tripId: tripId ?? "",
        name,
        image: image ?? null,
      },
    });

    if (result.error) {
      throw result.error;
    }

    // Invalidate groups query
    client.invalidate(GetGroupsByTripDocument, {
      tripId: tripId ?? "",
      limit: 30,
      offset: 0,
    });

    return result.data;
  };

  return {
    createGroup,
    isCreating: false, // urql doesn't have isPending, use fetching from mutation result if needed
  } as const;
}
