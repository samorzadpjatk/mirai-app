import { useCallback } from "react";
import { useQuery, useMutation } from "urql";
import {
  GetGroupDocument,
  UpdateGroupDocument,
  GetGroupsByTripDocument,
  AssignUserToGroupDocument,
  RemoveUserFromGroupDocument,
} from "@mirai-app/frameworks";

export function useGroupEditor(groupId?: string | null) {
  const [, reexecuteGroupQuery] = useQuery({
    query: GetGroupDocument,
    variables: { id: groupId ?? "" },
    pause: true, // Never execute automatically - only for reexecution
  });

  const [{ data: groupData, fetching: isLoading }] = useQuery({
    query: GetGroupDocument,
    variables: { id: groupId ?? "" },
    pause: !groupId,
  });

  const [, updateMutation] = useMutation(UpdateGroupDocument);
  const [{ fetching: isAssigning }, assignUserMutation] = useMutation(
    AssignUserToGroupDocument,
  );
  const [{ fetching: isRemoving }, removeUserMutation] = useMutation(
    RemoveUserFromGroupDocument,
  );

  const assignUser = useCallback(
    async (userId: string, tripId: string) => {
      if (!groupId) {
        throw new Error("Cannot assign user: groupId is required");
      }

      const result = await assignUserMutation({
        input: {
          groupId,
          userId,
        },
      });

      if (result.error) {
        throw result.error;
      }

      // Reexecute queries to refresh group data
      void reexecuteGroupQuery({ requestPolicy: "network-only" });

      return result.data;
    },
    [groupId, assignUserMutation, reexecuteGroupQuery],
  );

  const removeUser = useCallback(
    async (userId: string) => {
      if (!groupId) {
        throw new Error("Cannot remove user: groupId is required");
      }

      const tripId = groupData?.group?.trip?.id;
      if (!tripId) {
        throw new Error("Cannot remove user: tripId not available");
      }

      const result = await removeUserMutation({
        input: {
          groupId,
          userId,
        },
      });

      if (result.error) {
        throw result.error;
      }

      // Reexecute query to refresh group data
      void reexecuteGroupQuery({ requestPolicy: "network-only" });

      return result.data;
    },
    [
      groupId,
      groupData?.group?.trip?.id,
      removeUserMutation,
      reexecuteGroupQuery,
    ],
  );

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

    // Reexecute query to refresh data
    void reexecuteGroupQuery({ requestPolicy: "network-only" });

    return result.data;
  };

  return {
    group: groupData?.group,
    isLoading,
    isUpdating: false, // Can track from mutation result if needed
    isAssigning,
    isRemoving,
    updateGroup,
    handleSave: updateGroup, // Alias for compatibility
    assignUser,
    removeUser,
  } as const;
}
