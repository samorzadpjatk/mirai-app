import { useCallback } from "react";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetGroupDocument,
  UpdateGroupDocument,
  GetGroupsByTripDocument,
} from "@mirai-app/graphql-types";

export function useGroupEditor(groupId?: string | null) {
  const client = useClient();

  const [{ data: groupData, fetching: isLoading }] = useQuery({
    query: GetGroupDocument,
    variables: { id: groupId ?? "" },
    pause: !groupId,
  });

  const [, updateMutation] = useMutation(UpdateGroupDocument);

  // TODO: assignMutation and removeMutation need custom GraphQL mutations
  // These are not yet available in the generated hooks
  const assignUser = async (_userId: string, _tripId: string) => {
    throw new Error("assignUser not yet implemented with GraphQL");
  };

  const removeUser = async (_userId: string) => {
    throw new Error("removeUser not yet implemented with GraphQL");
  };

  const updateGroup = async (data: {
    id: string;
    name?: string;
    image?: string;
    tripId?: string;
  }) => {
    const tripId = data.tripId ?? groupData?.group?.trip?.id;
    if (!tripId) throw new Error("Missing tripId for updateGroup");

    const result = await updateMutation({
      input: {
        id: data.id,
        tripId,
        name: data.name,
        image: data.image ?? null,
      },
    });

    if (result.error) {
      throw result.error;
    }

    // Invalidate queries
    client.invalidate(GetGroupDocument, { id: data.id });
    client.invalidate(GetGroupsByTripDocument, {
      tripId,
      limit: 30,
      offset: 0,
    });

    return result.data;
  };

  return {
    group: groupData?.group,
    isLoading,
    isUpdating: false, // Can track from mutation result if needed
    updateGroup,
    assignUser,
    removeUser,
  } as const;
}
