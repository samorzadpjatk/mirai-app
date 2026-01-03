import React, { useEffect } from "react";
import { YStack, H2, Spinner, Text, ScrollView, Button } from "tamagui";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { RefreshControl } from "react-native";
import { useRouter } from "expo-router";

interface Group {
  id: string;
  name: string;
  code: string;
  coins: number;
  organizer: {
    id: string;
    name: string | null;
    email: string | null;
  };
  members: Array<{
    id: string;
    name: string | null;
    email: string | null;
  }>;
  coinTransactions: Array<{
    id: string;
    amount: number;
    admin: {
      id: string;
      name: string | null;
    };
  }>;
}

export default function GroupsScreen() {
  const trpc = useTRPC();
  const router = useRouter();
  
  // Check user permissions
  const { data: currentUser, isLoading: isLoadingUser } = useQuery(
    trpc.user.getMy.queryOptions()
  );

  // Redirect if user doesn't have access
  useEffect(() => {
    if (!isLoadingUser && currentUser) {
      const hasAccess = currentUser.isAdmin || currentUser.isModerator || currentUser.isServiceAccount;
      if (!hasAccess) {
        router.replace("/");
      }
    }
  }, [currentUser, isLoadingUser, router]);
  
  const { data: groups, isLoading, isError, error, refetch, isFetching } = useQuery<Group[]>(
    trpc.group.getAll.queryOptions()
  );

  const deleteGroupMutation = useMutation(
    trpc.group.delete.mutationOptions({
      onSuccess: () => {
        void refetch();
      },
      onError: (err: Error) => {
        console.error("Error deleting group:", err);
      },
    })
  );

  const updateGroupMutation = useMutation(
    trpc.group.update.mutationOptions({
      onSuccess: () => {
        void refetch();
      },
      onError: (err: Error) => {
        console.error("Error updating group:", err);
      },
    })
  );

  const handleDelete = (id: string) => {
    deleteGroupMutation.mutate({ id });
  };

  const handleUpdate = (id: string, name: string, organizerId: string) => {
    updateGroupMutation.mutate({ id, name, organizerId });
  };

  if (isLoading || isLoadingUser) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4" color="$gray11">
          Loading groups...
        </Text>
      </YStack>
    );
  }

  // Don't render if user doesn't have access
  if (!currentUser?.isAdmin && !currentUser?.isModerator && !currentUser?.isServiceAccount) {
    return null;
  }

  if (isError) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text color="$red10" fontSize="$6" fontWeight="bold">
          Error loading groups
        </Text>
        <Text color="$gray11" marginTop="$2" textAlign="center">
          {error?.message || "Something went wrong"}
        </Text>
        <Button marginTop="$4" onPress={() => void refetch()}>
          Try Again
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => void refetch()}
          />
        }
      >
        <YStack padding="$4">
          <H2 marginBottom="$4" color="$gray12">
            Guilds
          </H2>
          
          {groups?.length === 0 && (
            <YStack padding="$4" alignItems="center">
              <Text color="$gray11" textAlign="center">
                No guilds found. Create your first guild!
              </Text>
            </YStack>
          )}
          
          {groups?.map((group) => (
            <YStack
              key={group.id}
              backgroundColor="$backgroundHover"
              borderRadius="$4"
              padding="$4"
              marginBottom="$3"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <YStack gap="$2">
                <Text fontSize="$6" fontWeight="bold" color="$color">
                  {group.name}
                </Text>
                <Text fontSize="$3" color="$gray11">
                  Organizer: {group.organizer.name ?? group.organizer.email ?? "Unknown"}
                </Text>
                <YStack gap="$2">
                  <Text fontSize="$3" color="$gray11">
                    Members: {group.members.length}
                  </Text>
                  <Text fontSize="$3" color="$gray11">
                    💰 Coins: {group.coins}
                  </Text>
                  <Text fontSize="$3" color="$gray11">
                    Code: {group.code}
                  </Text>
                </YStack>
              </YStack>
            </YStack>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}

