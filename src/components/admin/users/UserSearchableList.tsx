"use client";

import { useState, useMemo } from "react";
import { StarIcon, PersonIcon } from "@radix-ui/react-icons";
import { Flex, Card, DataList, Strong, Badge, Text } from "@radix-ui/themes";
import AssignUserToGroupFormDialog from "./dialog/AssignUserToGroupFormDialog";
import RemoveUserFromGroupFormDialog from "./dialog/RemoveUserFromGroupFormDialog";
import ChangeUserAdminButton from "./ChangeUserAdminButton";
import WristNumberManager from "./WristNumberManager";
import UserSearchBar from "./UserSearchBar";

interface UserSearchableListProps {
  users: any[];
}

export default function UserSearchableList({ users }: UserSearchableListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const searchLower = searchTerm.toLowerCase().trim();

    return users.filter((user) => {
      // Search by name
      const nameMatch = user.name?.toLowerCase().includes(searchLower);
      
      // Search by email
      const emailMatch = user.email?.toLowerCase().includes(searchLower);
      
      // Search by wrist number
      const wristNumberMatch = user.wristNumber?.toLowerCase().includes(searchLower);
      
      // Search by group names (both member and organizer)
      const memberGroupMatch = user.groups?.some((userGroup: any) =>
        userGroup.group.name.toLowerCase().includes(searchLower)
      );
      
      const organizerGroupMatch = user.organizerGroups?.some((organizerGroup: any) =>
        organizerGroup.name.toLowerCase().includes(searchLower)
      );

      return nameMatch || emailMatch || wristNumberMatch || memberGroupMatch || organizerGroupMatch;
    });
  }, [users, searchTerm]);

  return (
    <Flex direction="column" gap="4">
      <UserSearchBar 
        onSearch={setSearchTerm}
        resultCount={filteredUsers.length}
      />
      
      <Flex direction="column" justify="center">
        {filteredUsers.length === 0 && searchTerm && (
          <Card style={{ padding: "1rem" }}>
            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
              Nie znaleziono użytkowników pasujących do frazy: "{searchTerm}"
            </Text>
          </Card>
        )}
        
        {filteredUsers.length === 0 && !searchTerm && (
          <Card style={{ padding: "1rem" }}>
            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
              Brak użytkowników do wyświetlenia
            </Text>
          </Card>
        )}
        
        {filteredUsers.map((user) => (
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
                    {user.groups?.map((userGroup: any) => (
                      <Badge key={userGroup.group.id} variant="soft" color="purple">
                        {userGroup.group.name}
                      </Badge>
                    ))}
                    {user.organizerGroups?.map((organizerGroup: any) => (
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
                      userName={user.name || "Nieznany użytkownik"}
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
    </Flex>
  );
}
