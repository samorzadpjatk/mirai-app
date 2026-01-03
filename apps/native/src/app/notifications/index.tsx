import React, { useEffect, useState } from "react";
import { YStack, H2, Spinner, Text, ScrollView, Button, XStack, Card, Dialog, Input, Label, Adapt, Sheet, AlertDialog, Select } from "tamagui";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Trash2, Bell, BellOff } from "@tamagui/lucide-icons";
import { formatRelativeTime, formatDate } from "~/utils/format";

export default function NotificationsScreen() {
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
  
  const { data: schedules, isLoading, isError, error, refetch, isFetching } = useQuery(
    trpc.notificationSchedule.getAll.queryOptions()
  );

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"custom" | "ranking">("custom");
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [createUrl, setCreateUrl] = useState("");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createHour, setCreateHour] = useState("9");
  const [createMinute, setCreateMinute] = useState("0");

  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);

  const createScheduleMutation = useMutation(
    trpc.notificationSchedule.create.mutationOptions({
      onSuccess: () => {
        void refetch();
        setIsCreateDialogOpen(false);
        // Reset form
        setCreateName("");
        setCreateType("custom");
        setCreateTitle("");
        setCreateBody("");
        setCreateUrl("");
        setCreateStartDate("");
        setCreateEndDate("");
        setCreateHour("9");
        setCreateMinute("0");
      },
      onError: (err) => {
        console.error("Error creating schedule:", err);
      },
    })
  );

  const deleteScheduleMutation = useMutation(
    trpc.notificationSchedule.delete.mutationOptions({
      onSuccess: () => {
        void refetch();
        setDeletingScheduleId(null);
      },
      onError: (err) => {
        console.error("Error deleting schedule:", err);
      },
    })
  );

  const toggleActiveMutation = useMutation(
    trpc.notificationSchedule.toggleActive.mutationOptions({
      onSuccess: () => {
        void refetch();
      },
      onError: (err) => {
        console.error("Error toggling schedule:", err);
      },
    })
  );

  const handleCreate = () => {
    if (createName.trim() && createStartDate && createEndDate) {
      createScheduleMutation.mutate({
        name: createName.trim(),
        notificationType: createType,
        notificationTitle: createType === "custom" ? createTitle : undefined,
        notificationBody: createType === "custom" ? createBody : undefined,
        notificationUrl: createType === "custom" ? createUrl : undefined,
        startDate: new Date(createStartDate),
        endDate: new Date(createEndDate),
        hour: parseInt(createHour),
        minute: parseInt(createMinute),
        isActive: true,
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteScheduleMutation.mutate({ id });
  };

  const handleToggleActive = (id: string) => {
    toggleActiveMutation.mutate({ id });
  };

  if (isLoading || isLoadingUser) {
    return (
      <YStack flex={1} justify="center" items="center" p="$4">
        <Spinner size="large" />
        <Text mt="$4" color="$gray11">
          Loading notifications...
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
      <YStack flex={1} justify="center" items="center" p="$4">
        <Text color="$red10" fontSize="$6" fontWeight="bold">
          Error loading notifications
        </Text>
        <Text color="$gray11" mt="$2" text="center">
          {error?.message || "Something went wrong"}
        </Text>
        <Button mt="$4" onPress={() => void refetch()}>
          Try Again
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => void refetch()}
          />
        }
      >
        <YStack p="$4" gap="$4">
          <XStack justify="space-between" items="center">
            <H2 color="$gray12">Notification Schedules</H2>
            
            {/* Create Schedule Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <Dialog.Trigger asChild>
                <Button size="$3" icon={<Plus size={16} />} >
                  Create Schedule
                </Button>
              </Dialog.Trigger>

              <Adapt when={true} platform="touch">
                <Sheet animation="medium" zIndex={200000} modal dismissOnSnapToBottom>
                  <Sheet.Frame p="$4" gap="$4">
                    <Adapt.Contents />
                  </Sheet.Frame>
                  <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                </Sheet>
              </Adapt>

              <Dialog.Portal>
                <Dialog.Overlay key="overlay" animation="quick" opacity={0.5} />
                <Dialog.Content bordered elevate key="content" gap="$4" animation="quick" maxH="80%">
                  <ScrollView>
                    <YStack gap="$4" p="$1">
                      <Dialog.Title>Create Notification Schedule</Dialog.Title>
                      <Dialog.Description>
                        Schedule a notification to be sent at specific times
                      </Dialog.Description>
                      
                      <YStack gap="$3">
                        <YStack gap="$2">
                          <Label>Schedule Name</Label>
                          <Input
                            placeholder="E.g., Daily Ranking Update"
                            value={createName}
                            onChangeText={setCreateName}
                          />
                        </YStack>
                        
                        <YStack gap="$2">
                          <Label>Notification Type</Label>
                          <Select value={createType} onValueChange={(val) => setCreateType(val)}>
                            <Select.Trigger>
                              <Select.Value />
                            </Select.Trigger>
                            <Select.Content zIndex={200000}>
                              <Select.ScrollUpButton />
                              <Select.Viewport>
                                <Select.Item value="custom" index={0}>
                                  <Select.ItemText>Custom Message</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="ranking" index={1}>
                                  <Select.ItemText>Ranking Update</Select.ItemText>
                                </Select.Item>
                              </Select.Viewport>
                              <Select.ScrollDownButton />
                            </Select.Content>
                          </Select>
                        </YStack>
                        
                        {createType === "custom" && (
                          <>
                            <YStack gap="$2">
                              <Label>Notification Title</Label>
                              <Input
                                placeholder="Title"
                                value={createTitle}
                                onChangeText={setCreateTitle}
                              />
                            </YStack>
                            
                            <YStack gap="$2">
                              <Label>Notification Body</Label>
                              <Input
                                placeholder="Message content"
                                value={createBody}
                                onChangeText={setCreateBody}
                              />
                            </YStack>
                            
                            <YStack gap="$2">
                              <Label>URL (optional)</Label>
                              <Input
                                placeholder="https://..."
                                value={createUrl}
                                onChangeText={setCreateUrl}
                              />
                            </YStack>
                          </>
                        )}
                        
                        <XStack gap="$2">
                          <YStack flex={1} gap="$2">
                            <Label>Start Date</Label>
                            <Input
                              placeholder="YYYY-MM-DD"
                              value={createStartDate}
                              onChangeText={setCreateStartDate}
                            />
                          </YStack>
                          
                          <YStack flex={1} gap="$2">
                            <Label>End Date</Label>
                            <Input
                              placeholder="YYYY-MM-DD"
                              value={createEndDate}
                              onChangeText={setCreateEndDate}
                            />
                          </YStack>
                        </XStack>
                        
                        <XStack gap="$2">
                          <YStack flex={1} gap="$2">
                            <Label>Hour (0-23)</Label>
                            <Input
                              keyboardType="numeric"
                              placeholder="9"
                              value={createHour}
                              onChangeText={setCreateHour}
                            />
                          </YStack>
                          
                          <YStack flex={1} gap="$2">
                            <Label>Minute (0-59)</Label>
                            <Input
                              keyboardType="numeric"
                              placeholder="0"
                              value={createMinute}
                              onChangeText={setCreateMinute}
                            />
                          </YStack>
                        </XStack>
                      </YStack>
                    </YStack>
                  </ScrollView>
                  
                  <XStack gap="$3" justify="flex-end">
                    <Dialog.Close asChild>
                      <Button>Cancel</Button>
                    </Dialog.Close>
                    <Button 
                       
                      onPress={handleCreate}
                      disabled={!createName.trim() || !createStartDate || !createEndDate || createScheduleMutation.isPending}
                    >
                      {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                    </Button>
                  </XStack>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          </XStack>
          
          {schedules?.length === 0 && (
            <Card p="$4" bordered>
              <Text color="$gray11" text="center">
                No notification schedules found. Create your first schedule!
              </Text>
            </Card>
          )}
          
          {schedules?.map((schedule) => (
            <Card key={schedule.id} bordered p="$4">
              <YStack gap="$3">
                <XStack justify="space-between" items="center">
                  <YStack flex={1}>
                    <Text fontSize="$6" fontWeight="bold" color="$color">
                      {schedule.name}
                    </Text>
                    <Text fontSize="$2" color="$gray10" mt="$1">
                      Created by {schedule.createdBy.name ?? schedule.createdBy.email} • {formatRelativeTime(schedule.createdAt)}
                    </Text>
                  </YStack>
                  <XStack gap="$2">
                    <Button
                      size="$3"
                      icon={schedule.isActive ? <Bell size={16} /> : <BellOff size={16} />}
                      
                      onPress={() => handleToggleActive(schedule.id)}
                    />
                    <Button
                      size="$3"
                      
                      icon={<Trash2 size={16} />}
                      onPress={() => setDeletingScheduleId(schedule.id)}
                    />
                  </XStack>
                </XStack>
                
                <XStack gap="$2" flexWrap="wrap">
                  <Text px="$2" py="$1" rounded="$2" fontSize="$2">
                    {schedule.isActive ? "Active" : "Inactive"}
                  </Text>
                  <Text px="$2" py="$1" rounded="$2" fontSize="$2">
                    {schedule.notificationType}
                  </Text>
                  <Text px="$2" py="$1" rounded="$2" fontSize="$2">
                    {String(schedule.hour).padStart(2, '0')}:{String(schedule.minute).padStart(2, '0')}
                  </Text>
                </XStack>
                
                <YStack gap="$2">
                  <Text fontSize="$3" color="$gray11">
                    Period: {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                  </Text>
                  
                  {schedule.notification && (
                    <YStack gap="$1" p="$2" bg="$background" rounded="$2">
                      <Text fontSize="$3" fontWeight="bold">
                        {schedule.notification.title}
                      </Text>
                      <Text fontSize="$2" color="$gray11">
                        {schedule.notification.body}
                      </Text>
                      {schedule.notification.url && (
                        <Text fontSize="$2" color="#3b82f6">
                          {schedule.notification.url}
                        </Text>
                      )}
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingScheduleId} onOpenChange={(open) => !open && setDeletingScheduleId(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay key="overlay" animation="quick" opacity={0.5} />
          <AlertDialog.Content bordered elevate key="content" animation="quick">
            <AlertDialog.Title>Delete Schedule?</AlertDialog.Title>
            <AlertDialog.Description>
              Are you sure you want to delete this notification schedule? This action cannot be undone.
            </AlertDialog.Description>
            
            <XStack gap="$3" justify="flex-end" mt="$4">
              <AlertDialog.Cancel asChild>
                <Button>Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button 
                   
                  onPress={() => deletingScheduleId && handleDelete(deletingScheduleId)}
                  disabled={deleteScheduleMutation.isPending}
                >
                  {deleteScheduleMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialog.Action>
            </XStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </YStack>
  );
}
