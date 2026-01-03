import React, { useEffect, useState } from "react";
import { YStack, H2, Spinner, Text, ScrollView, Button, XStack, Card, Dialog, Input, Select, Label, Adapt, Sheet, AlertDialog } from "tamagui";
import { Badge } from "../../components/Badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Pencil, Trash2 } from "@tamagui/lucide-icons";

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
  members: {
    id: string;
    name: string | null;
    email: string | null;
  }[];
  coinTransactions: {
    id: string;
    amount: number;
    admin: {
      id: string;
      name: string | null;
    };
  }[];
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
  
  const { data: groups, isLoading, isError, error, refetch, isFetching } = useQuery(
    trpc.group.getAll.queryOptions()
  );

  const { data: adminUsers } = useQuery(
    trpc.user.getAllAdminsNames.queryOptions()
  );

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createOrganizerId, setCreateOrganizerId] = useState("");

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrganizerId, setEditOrganizerId] = useState("");

  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const createGroupMutation = useMutation(
    trpc.group.create.mutationOptions({
      onSuccess: () => {
        void refetch();
        setIsCreateDialogOpen(false);
        setCreateName("");
        setCreateCode("");
        setCreateOrganizerId("");
      },
      onError: (err) => {
        console.error("Error creating group:", err);
      },
    })
  );

  const deleteGroupMutation = useMutation(
    trpc.group.delete.mutationOptions({
      onSuccess: () => {
        void refetch();
        setDeletingGroupId(null);
      },
      onError: (err) => {
        console.error("Error deleting group:", err);
      },
    })
  );

  const updateGroupMutation = useMutation(
    trpc.group.update.mutationOptions({
      onSuccess: () => {
        void refetch();
        setEditingGroup(null);
      },
      onError: (err) => {
        console.error("Error updating group:", err);
      },
    })
  );

  const handleCreate = () => {
    if (createName.trim() && createCode.trim()) {
      createGroupMutation.mutate({
        name: createName.trim(),
        code: createCode.trim(),
        organizerId: createOrganizerId || undefined,
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteGroupMutation.mutate({ id });
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditOrganizerId(group.organizer.id);
  };

  const handleUpdate = () => {
    if (editingGroup && editName.trim()) {
      updateGroupMutation.mutate({
        id: editingGroup.id,
        name: editName.trim(),
        organizerId: editOrganizerId || undefined,
      });
    }
  };

  if (isLoading || isLoadingUser) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Spinner size="large" />
        <Text marginTop="$4">
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
        <YStack padding="$4" gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <H2 color="$gray12">Guilds</H2>
            
            {/* Create Guild Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <Dialog.Trigger asChild>
                <Button size="$3" icon={<Plus size={16} />} theme="green">
                  Create Guild
                </Button>
              </Dialog.Trigger>

              <Adapt when="sm" platform="touch">
                <Sheet animation="medium" zIndex={200000} modal dismissOnSnapToBottom>
                  <Sheet.Frame padding="$4" gap="$4">
                    <Adapt.Contents />
                  </Sheet.Frame>
                  <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                </Sheet>
              </Adapt>

              <Dialog.Portal>
                <Dialog.Overlay key="overlay" animation="quick" opacity={0.5} />
                <Dialog.Content bordered elevate key="content" gap="$4" animation="quick">
                  <Dialog.Title>Create New Guild</Dialog.Title>
                  <Dialog.Description>
                    Forge a new guild to unite companions
                  </Dialog.Description>
                  
                  <YStack gap="$3">
                    <YStack gap="$2">
                      <Label>Guild Name</Label>
                      <Input
                        placeholder="Enter guild name"
                        value={createName}
                        onChangeText={setCreateName}
                      />
                    </YStack>
                    
                    <YStack gap="$2">
                      <Label>Guild Code</Label>
                      <Input
                        placeholder="Enter unique code"
                        value={createCode}
                        onChangeText={setCreateCode}
                      />
                    </YStack>
                    
                    <YStack gap="$2">
                      <Label>Organizer (optional)</Label>
                      <Select value={createOrganizerId} onValueChange={setCreateOrganizerId}>
                        <Select.Trigger>
                          <Select.Value placeholder="Select organizer..." />
                        </Select.Trigger>
                        <Select.Content zIndex={200000}>
                          <Select.ScrollUpButton />
                          <Select.Viewport>
                            <Select.Item value="" index={0}>
                              <Select.ItemText>Default (Current User)</Select.ItemText>
                            </Select.Item>
                            {adminUsers?.map((admin, idx) => (
                              <Select.Item key={admin.id} value={admin.id} index={idx + 1}>
                                <Select.ItemText>{admin.name ?? "Unknown"}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                          <Select.ScrollDownButton />
                        </Select.Content>
                      </Select>
                    </YStack>
                  </YStack>
                  
                  <XStack gap="$3" justifyContent="flex-end">
                    <Dialog.Close asChild>
                      <Button>Cancel</Button>
                    </Dialog.Close>
                    <Button 
                      theme="green" 
                      onPress={handleCreate}
                      disabled={!createName.trim() || !createCode.trim() || createGroupMutation.isPending}
                    >
                      {createGroupMutation.isPending ? "Creating..." : "Create Guild"}
                    </Button>
                  </XStack>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          </XStack>
          
          {groups?.length === 0 && (
            <Card padding="$4" bordered>
              <Text color="$gray11" textAlign="center">
                No guilds found. Create your first guild!
              </Text>
            </Card>
          )}
          
          {groups?.map((group) => (
            <Card key={group.id} bordered padding="$4">
              <YStack gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$6" fontWeight="bold" color="$color">
                    {group.name}
                  </Text>
                  <XStack gap="$2">
                    <Button
                      size="$3"
                      icon={<Pencil size={16} />}
                      onPress={() => handleEdit(group)}
                    />
                    <Button
                      size="$3"
                      theme="red"
                      icon={<Trash2 size={16} />}
                      onPress={() => setDeletingGroupId(group.id)}
                    />
                  </XStack>
                </XStack>
                
                <Text fontSize="$3" color="$gray11">
                  Organizer: {group.organizer.name ?? group.organizer.email ?? "Unknown"}
                </Text>
                
                <XStack gap="$2" flexWrap="wrap">
                  <Badge>
                    {group.members.length} members
                  </Badge>
                  <Badge>
                    💰 {group.coins} coins
                  </Badge>
                  <Badge>
                    Code: {group.code}
                  </Badge>
                </XStack>
              </YStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>

      {/* Edit Guild Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <Dialog.Portal>
          <Dialog.Overlay key="overlay" animation="quick" opacity={0.5} />
          <Dialog.Content bordered elevate key="content" gap="$4" animation="quick">
            <Dialog.Title>Edit Guild</Dialog.Title>
            <Dialog.Description>
              Update guild information
            </Dialog.Description>
            
            <YStack gap="$3">
              <YStack gap="$2">
                <Label>Guild Name</Label>
                <Input
                  placeholder="Enter guild name"
                  value={editName}
                  onChangeText={setEditName}
                />
              </YStack>
              
              <YStack gap="$2">
                <Label>Organizer</Label>
                <Select value={editOrganizerId} onValueChange={setEditOrganizerId}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select organizer..." />
                  </Select.Trigger>
                  <Select.Content zIndex={200000}>
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      {adminUsers?.map((admin, idx) => (
                        <Select.Item key={admin.id} value={admin.id} index={idx}>
                          <Select.ItemText>{admin.name ?? "Unknown"}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>
              </YStack>
            </YStack>
            
            <XStack gap="$3" justifyContent="flex-end">
              <Button onPress={() => setEditingGroup(null)}>Cancel</Button>
              <Button 
                theme="blue" 
                onPress={handleUpdate}
                disabled={!editName.trim() || updateGroupMutation.isPending}
              >
                {updateGroupMutation.isPending ? "Updating..." : "Update Guild"}
              </Button>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingGroupId} onOpenChange={(open) => !open && setDeletingGroupId(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay key="overlay" animation="quick" opacity={0.5} />
          <AlertDialog.Content bordered elevate key="content" animation="quick">
            <AlertDialog.Title>Delete Guild?</AlertDialog.Title>
            <AlertDialog.Description>
              Are you sure you want to delete this guild? This action cannot be undone.
              All members will be removed from the guild.
            </AlertDialog.Description>
            
            <XStack gap="$3" justifyContent="flex-end" marginTop="$4">
              <AlertDialog.Cancel asChild>
                <Button>Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button 
                  theme="red" 
                  onPress={() => deletingGroupId && handleDelete(deletingGroupId)}
                  disabled={deleteGroupMutation.isPending}
                >
                  {deleteGroupMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialog.Action>
            </XStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </YStack>
  );
}

