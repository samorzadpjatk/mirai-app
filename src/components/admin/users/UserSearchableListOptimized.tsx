"use client";

import { useState, useCallback } from "react";
import { StarIcon, PersonIcon } from "@radix-ui/react-icons";
import { Flex, Card, DataList, Strong, Badge, Text } from "@radix-ui/themes";
import AssignUserToGroupFormDialog from "./dialog/AssignUserToGroupFormDialog";
import RemoveUserFromGroupFormDialog from "./dialog/RemoveUserFromGroupFormDialog";
import ChangeUserAdminButton from "./ChangeUserAdminButton";
import WristNumberManager from "./WristNumberManager";
import UserSearchBar from "./UserSearchBar";
import UserPagination from "./UserPagination";
import { api } from "~/trpc/react";

// Types for user data from searchWithPagination
interface UserGroup {
  group: {
    id: string;
    name: string;
  };
}

interface OrganizerGroup {
  id: string;
  name: string;
}

interface SearchUser {
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  wristNumber: string | null;
  groups: UserGroup[];
  organizerGroups: OrganizerGroup[];
}

export default function UserSearchableListOptimized() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const {
    data: searchResult,
    isLoading,
  } = api.user.searchWithPagination.useQuery({
    searchTerm: searchTerm || undefined,
    page: currentPage,
    limit,
  });

  const handleSearch = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  }, []);

  const users = (searchResult?.users ?? []) as SearchUser[];
  const pagination = searchResult?.pagination;

  return (
    <Flex direction="column" gap="4">
      <UserSearchBar 
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
                  Nie znaleziono użytkowników pasujących do frazy: &quot;{searchTerm}&quot;
                </Text>
              </Card>
            )}
            
            {users.length === 0 && !searchTerm && !isLoading && (
              <Card style={{ padding: "1rem" }}>
                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                  Brak użytkowników do wyświetlenia
                </Text>
              </Card>
            )}
            
            {users.map((user) => (
              <Card size={{ "initial": "1", "xs": "2", "sm": "3" }} key={user.id}>
                <DataList.Root>
                  <DataList.Item>
                    <DataList.Label>Użytkownik</DataList.Label>
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
                          Użytkownik
                        </Badge>
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>Numer opaski</DataList.Label>
                    <DataList.Value>
                      {user.wristNumber ? (
                        <Badge variant="soft" color="green">
                          {user.wristNumber}
                        </Badge>
                      ) : (
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                          Nie przypisano
                        </Text>
                      )}
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>Gildie</DataList.Label>
                    <DataList.Value>
                      <Flex gap="2" wrap="wrap">
                        {user.groups?.map((userGroup: UserGroup) => (
                          <Badge key={userGroup.group.id} variant="soft" color="purple">
                            {userGroup.group.name}
                          </Badge>
                        ))}
                        {user.organizerGroups?.map((organizerGroup: OrganizerGroup) => (
                          <Badge key={organizerGroup.id} variant="solid" color="purple">
                            {organizerGroup.name}
                          </Badge>
                        ))}
                        {(!user.groups || user.groups.length === 0) && (!user.organizerGroups || user.organizerGroups.length === 0) && (
                          <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                            Brak gildii
                          </Text>
                        )}
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>Akcje</DataList.Label>
                    <DataList.Value>
                      <Flex direction={"column"} gap="2">
                        {(!user.groups || user.groups.length === 0) && (!user.organizerGroups || user.organizerGroups.length === 0) && (
                          <AssignUserToGroupFormDialog
                            selectedUserId={user.id}
                          />
                        )}
                        {user.groups && user.groups.length > 0 && (
                          <RemoveUserFromGroupFormDialog
                            selectedUserId={user.id}
                          />
                        )}
                        <WristNumberManager 
                          userId={user.id}
                          userName={user.name ?? "Nieznany użytkownik"}
                          currentWristNumber={user.wristNumber}
                        />
                        <ChangeUserAdminButton selectedUserId={user.id} />
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
