import React, { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  YStack,
  XStack,
  Card,
  Text,
  Button,
  Spinner,
  Input,
  H2,
  H4,
  Separator,
} from "tamagui";
import { User, Search, ChevronLeft, ChevronRight } from "@tamagui/lucide-icons";
import { useTRPC } from "@integral-2025-app/trpc/client";

type UserListItem = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  houseNumber: string | null;
  wristNumber: string | null;
  group: { id: string; name: string } | null;
};

type UserSearchData = {
  users: UserListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
};

/**
 * UserListView Component
 * 
 * This component demonstrates how to utilize tRPC with Tanstack React Query
 * in an Expo React Native application.
 */
export function UserListView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchField] = useState<"name" | "email" | "wristNumber" | "houseNumber" | "groupName">("name");
  // Use tRPC client; cast to avoid overly strict union types in hooks typing
  const trpcRoot = useTRPC() as unknown;
  // Type assertion needed due to complex union types in tRPC hooks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const userTrpc = (trpcRoot as { user: any }).user;
  // tRPC Query - Fetching Data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<UserSearchData>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    userTrpc.searchWithPagination.queryOptions({
      field: searchField,
      searchTerm: searchTerm || undefined,
      page: currentPage,
      limit: 10,
    }),
  );

  const updateAdminStatus = useMutation<
    unknown,
    Error,
    { userId: string; isAdmin: boolean }
  >(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    userTrpc.updateUserAdminStatus.mutationOptions({
      onSuccess: () => {
        void refetch();
      },
      onError: (err: unknown) => {
        console.error("Error updating admin status:", err);
      },
    }),
  );

  const handleSearch = () => {
    setCurrentPage(1);
    void refetch();
  };

  const handleNextPage = () => {
    if (data?.pagination.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (data?.pagination.hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleToggleAdmin = (userId: string, currentStatus: boolean) => {
    updateAdminStatus.mutate({
      userId,
      isAdmin: !currentStatus,
    });
  };

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4" color="$gray11">
          Loading users...
        </Text>
      </YStack>
    );
  }

  if (isError) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text color="$red10" fontSize="$6" fontWeight="bold">
          Error loading users
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

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <YStack flex={1} backgroundColor="$background" padding="$4">
      <XStack alignItems="center" marginBottom="$4">
        <User size={24} color="$gray12" />
        <H2 marginLeft="$2" color="$gray12">
          Users
        </H2>
      </XStack>

      <XStack marginBottom="$4" gap="$2">
        <Input
          flex={1}
          placeholder="Search by name..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
        />
        <Button
          icon={Search}
          onPress={handleSearch}
          disabled={isFetching}
        />
      </XStack>

      {pagination && (
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
          <Text fontSize="$3" color="$gray11">
            Page {pagination.currentPage} of {pagination.totalPages}
          </Text>
          <Text fontSize="$3" color="$gray11">
            {pagination.totalCount} total users
          </Text>
        </XStack>
      )}

      <FlatList<UserListItem>
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            elevate
            bordered
            marginBottom="$3"
            padding="$3"
            backgroundColor="$background"
          >
            <YStack gap="$2">
              <H4 color="$gray12">{item.name}</H4>

              <Text fontSize="$3" color="$gray11">
                {item.email}
              </Text>

              <Separator marginVertical="$2" />

              <XStack justifyContent="space-between" flexWrap="wrap" gap="$2">
                {item.wristNumber && (
                  <Text fontSize="$2" color="$gray10">
                    Wrist: {item.wristNumber}
                  </Text>
                )}
                {item.houseNumber && (
                  <Text fontSize="$2" color="$gray10">
                    House: {item.houseNumber}
                  </Text>
                )}
                {item.group && (
                  <Text fontSize="$2" color="$blue10">
                    Group: {item.group.name}
                  </Text>
                )}
              </XStack>

              <XStack justifyContent="space-between" alignItems="center" marginTop="$2">
                <Text
                  fontSize="$2"
                  color={item.isAdmin ? "$green10" : "$gray10"}
                  fontWeight="bold"
                >
                  {item.isAdmin ? "ADMIN" : "USER"}
                </Text>

                <Button
                  size="$2"
                  onPress={() => handleToggleAdmin(item.id, item.isAdmin)}
                  disabled={updateAdminStatus.isPending}
                  theme={item.isAdmin ? "red" : "green"}
                >
                  {updateAdminStatus.isPending
                    ? "Updating..."
                    : item.isAdmin
                      ? "Remove Admin"
                      : "Make Admin"}
                </Button>
              </XStack>
            </YStack>
          </Card>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => void refetch()}
          />
        }
        ListEmptyComponent={
          <YStack alignItems="center" marginTop="$8">
            <Text color="$gray11">No users found</Text>
          </YStack>
        }
      />

      {pagination && pagination.totalPages > 1 && (
        <XStack justifyContent="space-between" marginTop="$4">
          <Button
            icon={ChevronLeft}
            onPress={handlePreviousPage}
            disabled={!pagination.hasPreviousPage || isFetching}
            opacity={pagination.hasPreviousPage ? 1 : 0.5}
          >
            Previous
          </Button>
          <Button
            iconAfter={ChevronRight}
            onPress={handleNextPage}
            disabled={!pagination.hasNextPage || isFetching}
            opacity={pagination.hasNextPage ? 1 : 0.5}
          >
            Next
          </Button>
        </XStack>
      )}
    </YStack>
  );
}
