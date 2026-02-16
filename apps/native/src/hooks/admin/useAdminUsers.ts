import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR' | 'SERVICE';
  wristNumber?: string | null;
  houseNumber?: string | null;
  group?: { id: string; name: string } | null;
  tripId: string;
}

export interface Group {
  id: string;
  name: string;
}

export const USERS_PER_PAGE = 20;

export function useAdminUsers(tripId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const usersQuery = useQuery(
    trpc.user.searchWithPagination.queryOptions({
      searchTerm: undefined,
      page: 1,
      limit: USERS_PER_PAGE,
      field: 'firstName',
      tripId,
    })
  );

  const groupsQuery = useQuery(
    trpc.group.getAllNames.queryOptions({ tripId })
  );

  const assignToGroupMutation = useMutation(trpc.group.assignUserToGroup.mutationOptions({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'searchWithPagination'] });
    },
  }));

  const removeFromGroupMutation = useMutation(trpc.group.removeUserFromGroup.mutationOptions({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'searchWithPagination'] });
    },
  }));

  const toggleAdminMutation = useMutation(trpc.user.updateUserAdminStatus.mutationOptions({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'searchWithPagination'] });
    },
  }));

  const updateWristNumberMutation = useMutation(trpc.user.updateWristNumber.mutationOptions({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'searchWithPagination'] });
    },
  }));

  const removeWristNumberMutation = useMutation(trpc.user.removeWristNumber.mutationOptions({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'searchWithPagination'] });
    },
  }));

  const updateHouseNumberMutation = useMutation(trpc.user.updateHouseNumber.mutationOptions({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'searchWithPagination'] });
    },
  }));

  const removeHouseNumberMutation = useMutation(trpc.user.removeHouseNumber.mutationOptions({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'searchWithPagination'] });
    },
  }));

  const useSearchUsers = (searchTerm: string, page: number, field: 'firstName' | 'lastName' | 'email' | 'wristNumber' | 'houseNumber' | 'groupName') => {
    return useQuery(
      trpc.user.searchWithPagination.queryOptions({
        searchTerm: searchTerm ?? undefined,
        page,
        limit: USERS_PER_PAGE,
        field,
        tripId,
      })
    );
  };

  const assignToGroup = (userId: string, groupId: string) => {
    return assignToGroupMutation.mutateAsync({
      userId,
      tripId,
      groupId,
    });
  };

  const removeFromGroup = (userId: string) => {
    return removeFromGroupMutation.mutateAsync({
      userId,
      tripId,
    });
  };

  const toggleAdmin = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN' as const;
    return toggleAdminMutation.mutateAsync({ 
      userId, 
      role: newRole 
    });
  };

  const updateWristNumber = (userId: string, wristNumber: string) => {
    if (wristNumber.trim()) {
      return updateWristNumberMutation.mutateAsync({ 
        userId, 
        tripId,
        wristNumber: wristNumber.trim() 
      });
    } else {
      return removeWristNumberMutation.mutateAsync({ userId, tripId });
    }
  };

  const updateHouseNumber = (userId: string, houseNumber: string) => {
    if (houseNumber.trim()) {
      return updateHouseNumberMutation.mutateAsync({ 
        userId, 
        tripId,
        houseNumber: houseNumber.trim() 
      });
    } else {
      return removeHouseNumberMutation.mutateAsync({ userId, tripId });
    }
  };

  return {
    users: usersQuery.data?.users ?? [],
    usersLoading: usersQuery.isLoading,
    usersPagination: usersQuery.data?.pagination,
    groups: groupsQuery.data ?? [],
    groupsLoading: groupsQuery.isLoading,
    useSearchUsers,
    assignToGroup,
    removeFromGroup,
    toggleAdmin,
    updateWristNumber,
    updateHouseNumber,
    isAssigningToGroup: assignToGroupMutation.isPending,
    isRemovingFromGroup: removeFromGroupMutation.isPending,
    isTogglingAdmin: toggleAdminMutation.isPending,
    isUpdatingWristNumber: updateWristNumberMutation.isPending,
    isRemovingWristNumber: removeWristNumberMutation.isPending,
    isUpdatingHouseNumber: updateHouseNumberMutation.isPending,
    isRemovingHouseNumber: removeHouseNumberMutation.isPending,
  };
}
