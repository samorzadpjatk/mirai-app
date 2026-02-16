import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  code: string;
  coins: number;
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count: { participants: number };
}

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
  wristNumber: string | null;
  houseNumber: string | null;
  group: { name: string; id: string } | null;
  tripId: string;
}

export function useAdminGroups(tripId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery(
    trpc.group.getGroupList.queryOptions({ tripId })
  );

  const usersQuery = useQuery(
    trpc.user.getAll.queryOptions({ tripId })
  );

  const createGroupMutation = useMutation(
    trpc.group.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [['group', 'getGroupList']] });
      },
      onError: (error) => {
        console.error('Failed to create group:', error);
      },
    })
  );

  const updateGroupMutation = useMutation(
    trpc.group.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [['group', 'getGroupList']] });
      },
      onError: (error) => {
        console.error('Failed to update group:', error);
      },
    })
  );

  const deleteGroupMutation = useMutation(
    trpc.group.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [['group', 'getGroupList']] });
      },
      onError: (error) => {
        console.error('Failed to delete group:', error);
      },
    })
  );

  const createGroup = (name: string, code: string) => {
    return createGroupMutation.mutateAsync({
      name,
      code,
      tripId,
    });
  };

  const updateGroup = (id: string, name: string, organizerId?: string) => {
    return updateGroupMutation.mutateAsync({
      id,
      tripId,
      name,
      organizerId,
    });
  };

  const deleteGroup = (id: string) => {
    return deleteGroupMutation.mutateAsync({
      id,
    });
  };

  return {
    groups: groupsQuery.data ?? [],
    groupsLoading: groupsQuery.isLoading,
    users: usersQuery.data ?? [],
    usersLoading: usersQuery.isLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    isCreatingGroup: createGroupMutation.isPending,
    isUpdatingGroup: updateGroupMutation.isPending,
    isDeletingGroup: deleteGroupMutation.isPending,
  };
}
