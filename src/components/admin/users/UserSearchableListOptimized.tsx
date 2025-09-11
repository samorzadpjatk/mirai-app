"use client";

import { useState, useCallback } from "react";
import { StarIcon, PersonIcon } from "@radix-ui/react-icons";
import { Flex, Card, DataList, Strong, Badge, Text } from "@radix-ui/themes";
import AssignUserToGroupFormDialog from "./dialog/AssignUserToGroupFormDialog";
import RemoveUserFromGroupFormDialog from "./dialog/RemoveUserFromGroupFormDialog";
import WristNumberManager from "./WristNumberManager";
import UserSearchBar from "./UserSearchBar";
import UserPagination from "./UserPagination";
import { api } from "~/trpc/react";
import HouseNumberManager from "./HouseNumberManager";
import UserSearchFieldDropdownMenu from "./UserSearchFieldDropdownMenu";

export default function UserSearchableListOptimized() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [field, setField] = useState<"name" | "email" | "wristNumber" | "houseNumber" | "groupName">("name");
  const searchBarPlaceholderMap: Record<typeof field, string> = {
    name: "Search users by name...",
    email: "Search users by email...",
    wristNumber: "Search users by wrist number...",
    houseNumber: "Search users by house number...",
    groupName: "Search users by group name...",
  };

  const {
    data: searchResult,
    isLoading,
    refetch
  } = api.user.searchWithPagination.useQuery({
    searchTerm: searchTerm || undefined,
    page: currentPage,
    limit,
    field,
  });

  const handleSearch = useCallback(async (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page when searching
    await refetch();
  }, [refetch]);

  const handlePageChange = useCallback(async (page: number) => {
    setCurrentPage(page);
  }, []);

  const handleLimitChange = useCallback(async (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
    await refetch();
  }, [refetch]);

  const handleValueChange = useCallback(async (newField: typeof field) => {
    setField(newField);
    setCurrentPage(1); // Reset to first page when changing search field
    await refetch();
  }, [refetch]);

  const users = searchResult?.users ?? [];
  const pagination = searchResult?.pagination;

  return (
    <Flex direction="column" gap="4">
      <UserSearchFieldDropdownMenu onValueChange={handleValueChange} />
      <UserSearchBar
        placeholder={searchBarPlaceholderMap[field]}
        onSearch={handleSearch}
        resultCount={pagination?.totalCount}
      />

      {isLoading ? (
        <Card style={{ padding: "2rem", textAlign: "center" }}>
          <Text size="3">Ładowanie użytkowników...</Text>
        </Card>
      ) : (
        <>
          <Flex direction="column" justify="center" gap="3">
            {users.length === 0 && searchTerm && (
              <Card style={{ padding: "1rem" }}>
                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                  The realm holds no users matching the phrase: &quot;{searchTerm}&quot;
                </Text>
              </Card>
            )}

            {users.length === 0 && !searchTerm && !isLoading && (
              <Card style={{ padding: "1rem" }}>
                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                  The realm holds no users to show
                </Text>
              </Card>
            )}
            {users.map((user) => (
              <Card size={{ "initial": "1", "xs": "2", "sm": "3" }} key={user.id}>
                <DataList.Root>
                  <DataList.Item>
                    <DataList.Label>Companions</DataList.Label>
                    <DataList.Value>
                      <Strong>{user.name}</Strong>
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>Email</DataList.Label>
                    <DataList.Value>
                      <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                        {user.email}
                      </Text>
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>Status</DataList.Label>
                    <DataList.Value>
                      <Flex direction={"column"} gap="2">
                        {user.isAdmin && (
                          <Badge variant="solid" color="gold">
                            <StarIcon />
                            Admin
                          </Badge>
                        )}
                        <Badge variant="soft" color="blue">
                          <PersonIcon />
                          Companions
                        </Badge>
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>Wrist number</DataList.Label>
                    <DataList.Value>
                      {user.wristNumber ? (
                        <Badge variant="soft" color="green">
                          {user.wristNumber}
                        </Badge>
                      ) : (
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                          Not assigned
                        </Text>
                      )}
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>House number</DataList.Label>
                    <DataList.Value>
                      {user.houseNumber ? (
                        <Badge variant="soft" color="green">
                          {user.houseNumber}
                        </Badge>
                      ) : (
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                          Not assigned
                        </Text>
                      )}
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>Guilds</DataList.Label>
                    <DataList.Value>
                      <Flex gap="2" wrap="wrap">
                        {user.group && (
                          <Badge key={user.group.id} variant="soft" color="purple">
                            {user.group.name}
                          </Badge>
                        )}
                        {user.organizerGroup.map(group => (
                          <Badge key={group.id} variant="solid" color="purple">
                            {group.name}
                          </Badge>
                        ))}
                        {(!user.group) && (user.organizerGroup.length === 0) && (
                          <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                            No groups assigned
                          </Text>
                        )}
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>Actions</DataList.Label>
                    <DataList.Value>
                      <Flex direction={"column"} gap="2">
                        {(user.group === null) && (
                          <AssignUserToGroupFormDialog
                            selectedUserId={user.id}
                          />
                        )}
                        {user.group && (
                          <RemoveUserFromGroupFormDialog
                            selectedUserId={user.id}
                          />
                        )}
                        <WristNumberManager
                          userId={user.id}
                          userName={user.name ?? "Nieznany użytkownik"}
                          currentWristNumber={user.wristNumber}
                        />
                        <HouseNumberManager
                          userId={user.id}
                          userName={user.name ?? "Nieznany użytkownik"}
                          currentHouseNumber={user.houseNumber}
                        />
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                </DataList.Root>
              </Card>
            ))}
          </Flex>

          {pagination && (
            <UserPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </Flex>
  );
}
