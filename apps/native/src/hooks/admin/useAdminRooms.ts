import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "./useAdminGroups";

/** Invalidate every `room.*` query (getAll + getById) after a mutation. */
function useInvalidateRooms() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      predicate: (query) => {
        const first = query.queryKey?.[0];
        return Array.isArray(first) && first[0] === "room";
      },
    });
}

export function useAdminRooms(tripId: string) {
  const invalidateRooms = useInvalidateRooms();

  const {
    data: roomsData,
    isLoading: roomsLoading,
    isRefetching: roomsRefetching,
    refetch: refetchRooms,
  } = useQuery(
    orpc.room.getAll.queryOptions({
      input: { tripId },
      enabled: Boolean(tripId),
    }),
  );

  const { data: usersData, isLoading: usersLoading } = useQuery(
    orpc.user.getAll.queryOptions({ input: { tripId }, enabled: Boolean(tripId) }),
  );

  const createMutation = useMutation(
    orpc.room.create.mutationOptions({ onSuccess: invalidateRooms }),
  );
  const updateMutation = useMutation(
    orpc.room.update.mutationOptions({ onSuccess: invalidateRooms }),
  );
  const deleteMutation = useMutation(
    orpc.room.delete.mutationOptions({ onSuccess: invalidateRooms }),
  );
  const assignMutation = useMutation(
    orpc.room.assignUserToRoom.mutationOptions({ onSuccess: invalidateRooms }),
  );
  const removeMutation = useMutation(
    orpc.room.removeUserFromRoom.mutationOptions({ onSuccess: invalidateRooms }),
  );

  return {
    rooms: roomsData?.rooms ?? [],
    users: (usersData ?? []) as User[],
    isLoading: roomsLoading || usersLoading,
    isRefetching: roomsRefetching,
    refetchRooms,
    createRoom: (name: string, capacity: number) =>
      createMutation.mutateAsync({ tripId, name, capacity }),
    updateRoom: (id: string, name: string, capacity: number) =>
      updateMutation.mutateAsync({ id, name, capacity }),
    deleteRoom: (id: string) => deleteMutation.mutateAsync({ id }),
    assignUser: (userId: string, roomId: string) =>
      assignMutation.mutateAsync({ userId, tripId, roomId }),
    removeUser: (userId: string) => removeMutation.mutateAsync({ userId, tripId }),
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      assignMutation.isPending ||
      removeMutation.isPending,
  };
}
