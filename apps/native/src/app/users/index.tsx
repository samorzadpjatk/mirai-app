import React, { useEffect } from "react";
import { UserListView } from "~/components/UserListView";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useRouter } from "expo-router";
import { YStack, Spinner, Text } from "tamagui";

/**
 * Users Screen
 * 
 * Example screen showing how to use the UserListView component
 * with tRPC and Tanstack React Query in Expo Router.
 * Only accessible to Admin, Moderator, or Service Account users.
 */
export default function UsersScreen() {
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

  if (isLoadingUser) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Spinner size="large" />
        <Text marginTop="$4">
          Loading...
        </Text>
      </YStack>
    );
  }

  // Don't render if user doesn't have access
  if (!currentUser?.isAdmin && !currentUser?.isModerator && !currentUser?.isServiceAccount) {
    return null;
  }

  return <UserListView />;
}
