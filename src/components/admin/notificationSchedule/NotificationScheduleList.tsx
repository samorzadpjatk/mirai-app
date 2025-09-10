"use client";

import { useState } from "react";
import { Button, Card, Flex, Text, Badge, Dialog, Heading, Table, TextArea } from "@radix-ui/themes";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { NotificationSchedule } from "@prisma/client";

export default function NotificationScheduleList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {
    data: schedules,
    isLoading,
    refetch,
  } = api.notificationSchedule.getAll.useQuery();

  const toggleActiveMutation = api.notificationSchedule.toggleActive.useMutation({
    onSuccess: async () => {
      await refetch();
    },
  });

  const deleteMutation = api.notificationSchedule.delete.useMutation({
    onSuccess: async () => {
      await refetch();
    },
  });

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActiveMutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error toggling schedule:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Do you truly intend to strike this schedule from existence?")) {
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (error) {
        console.error("Error deleting schedule:", error);
      }
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = (schedule: NotificationSchedule) => {
    const now = new Date();
    const isActive = schedule.isActive;
    const isInDateRange = now >= new Date(schedule.startDate) && now <= new Date(schedule.endDate);

    if (!isActive) {
      return <Badge color="gray">Inactive</Badge>;
    }

    if (!isInDateRange) {
      return <Badge color="orange">Beyond the Bounds of Time</Badge>;
    }

    return <Badge color="green">Active</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <Flex direction="column" gap="3">
          <Heading size="4">Chronicles of Notifications</Heading>
          <Text>Fetching data...</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Heading size="4">Chronicles of Notifications</Heading>
            <Button onClick={() => setCreateDialogOpen(true)}>
              Create a New Chronicle
            </Button>
          </Flex>

          {schedules && schedules.length > 0 ? (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Period</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Last Execution</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {schedules.map((schedule) => (
                  <Table.Row key={schedule.id}>
                    <Table.Cell>
                      <Text weight="bold">{schedule.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{formatTime(schedule.hour, schedule.minute)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">
                        {format(new Date(schedule.startDate), "dd MMM yyyy", { locale: pl })}
                        {" - "}
                        {format(new Date(schedule.endDate), "dd MMM yyyy", { locale: pl })}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      {getStatusBadge(schedule)}
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {schedule.lastRun
                          ? format(new Date(schedule.lastRun), "dd MMM yyyy HH:mm", { locale: pl })
                          : "Never"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2">
                        <Button
                          size="1"
                          variant="outline"
                          color={schedule.isActive ? "orange" : "green"}
                          onClick={() => handleToggleActive(schedule.id)}
                        >
                          {schedule.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="1"
                          variant="outline"
                          color="red"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          Erase
                        </Button>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <Text color="gray">No chronicles of notifications exist.</Text>
          )}
        </Flex>
      </Card>

      <CreateNotificationScheduleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={async () => {
          await refetch();
          setCreateDialogOpen(false);
        }}
      />
    </>
  );
}

interface CreateNotificationScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateNotificationScheduleDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateNotificationScheduleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    notificationType: "custom" as "custom" | "ranking",
    notificationTitle: "",
    notificationBody: "",
    notificationUrl: "/",
    description: "",
    startDate: "",
    endDate: "",
    hour: 9,
    minute: 0,
    isActive: true,
  });

  const createMutation = api.notificationSchedule.create.useMutation({
    onSuccess: () => {
      onSuccess();
      setFormData({
        name: "",
        notificationType: "custom",
        notificationTitle: "",
        notificationBody: "",
        notificationUrl: "/",
        description: "",
        startDate: "",
        endDate: "",
        hour: 9,
        minute: 0,
        isActive: true,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        name: formData.name,
        notificationType: formData.notificationType,
        notificationTitle: formData.notificationTitle,
        notificationBody: formData.notificationBody,
        notificationUrl: formData.notificationUrl,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        hour: formData.hour,
        minute: formData.minute,
        isActive: formData.isActive,
      });
    } catch (error) {
      console.error("Error creating schedule:", error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Forge a New Notification Chronicle</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Set up automatic notifications for the guild ranking.
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Name
              </Text>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Daily ranking"
                required
              />
            </label>
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Notification Type
              </Text>
              <select
                value={formData.notificationType}
                onChange={(e) => setFormData({ ...formData, notificationType: e.target.value as "custom" | "ranking" })}
                required
              >
                <option value="custom">Custom Notification</option>
                <option value="ranking">Guild Ranking Notification</option>
              </select>
            </label>
            {formData.notificationType === "custom" && <>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Notification title
                </Text>
                <input
                  type="text"
                  value={formData.notificationTitle}
                  onChange={(e) => setFormData({ ...formData, notificationTitle: e.target.value })}
                  placeholder="np. Time for lunch!"
                  required
                />
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Notification body
                </Text>
                <input
                  type="text"
                  value={formData.notificationBody}
                  onChange={(e) => setFormData({ ...formData, notificationBody: e.target.value })}
                  placeholder="np. Lucky you, it's lunch time!"
                  required
                />
              </label>
            </>}


            <Flex gap="3">
              <label style={{ flex: 1 }}>
                <Text as="div" size="2" mb="1" weight="bold">
                  Start Date
                </Text>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </label>

              <label style={{ flex: 1 }}>
                <Text as="div" size="2" mb="1" weight="bold">
                  End Date
                </Text>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </label>
            </Flex>

            <Flex gap="3">
              <label style={{ flex: 1 }}>
                <Text as="div" size="2" mb="1" weight="bold">
                  Hour (0-23)
                </Text>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.hour}
                  onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                  required
                />
              </label>

              <label style={{ flex: 1 }}>
                <Text as="div" size="2" mb="1" weight="bold">
                  Minute (0-59)
                </Text>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.minute}
                  onChange={(e) => setFormData({ ...formData, minute: parseInt(e.target.value) })}
                  required
                />
              </label>
            </Flex>

            <label>
              <Flex align="center" gap="2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <Text size="2">Active Immediately</Text>
              </Flex>
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Forging..." : "Forge"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
