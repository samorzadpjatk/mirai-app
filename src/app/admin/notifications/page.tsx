"use client";

import { useState } from "react";
import { 
  Badge, 
  Button, 
  Card, 
  Flex, 
  Heading, 
  Text, 
  TextField,
  Select,
  Table,
  Dialog,
  TextArea,
  Switch,
  AlertDialog,
  Spinner,
  Separator,
} from "@radix-ui/themes";
import { 
  PaperPlaneIcon, 
  TrashIcon, 
  ReloadIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { api } from "~/trpc/react";
import { format } from "~/utils/format";

type NotificationStatus = "pending" | "sent" | "failed" | "all";
type TargetType = "group" | "all_users" | "all";

export default function NotificationsAdminPage() {
  // State for filtering and pagination
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NotificationStatus>("all");
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // State for modals  
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);

  // Queries
  const { data: notifications, refetch: refetchNotifications, isLoading } = api.webPushNotification.getAllForAdmin.useQuery({
    page,
    pageSize: 20,
    status: status === "all" ? undefined : status,
    targetType: targetType === "all" ? undefined : targetType,
  });


  // Mutations

  const retryMutation = api.webPushNotification.retryNotification.useMutation({
    onSuccess: () => {
      refetchNotifications();
    },
  });

  const deleteMutation = api.webPushNotification.delete.useMutation({
    onSuccess: () => {
      setShowDeleteDialog(null);
      refetchNotifications();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge color="green">Sent</Badge>;
      case "failed":
        return <Badge color="red">Failed</Badge>;
      case "pending":
        return <Badge color="yellow">Pending</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  const getTargetDescription = (notification: any) => {
    if (notification.sentToAll) return "All users";
    if (notification.targetUser) return `User: ${notification.targetUser.name}`;
    if (notification.targetGroup) return `Guild: ${notification.targetGroup.name}`;
    return "Unknown";
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" p="9">
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="4">
      {/* Filters */}
      <Flex gap="3" wrap="wrap">
        <TextField.Root 
          placeholder="Search..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        >
          <TextField.Slot>
            <MagnifyingGlassIcon height="16" width="16" />
          </TextField.Slot>
        </TextField.Root>
        
        <Select.Root value={status} onValueChange={(value) => setStatus(value as NotificationStatus)}>
          <Select.Trigger placeholder="Status..." />
          <Select.Content>
            <Select.Item value="all">All</Select.Item>
            <Select.Item value="sent">Sent</Select.Item>
            <Select.Item value="failed">Failed</Select.Item>
            <Select.Item value="pending">Pending</Select.Item>
          </Select.Content>
        </Select.Root>

        <Select.Root value={targetType} onValueChange={(value) => setTargetType(value as TargetType)}>
          <Select.Trigger placeholder="Target..." />
          <Select.Content>
            <Select.Item value="all">All</Select.Item>
            <Select.Item value="all_users">All users</Select.Item>
            <Select.Item value="group">Guild</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {/* Notifications Table */}
      <Card>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Target</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Sent at</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Admin</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {notifications?.notifications.map((notification) => (
              <Table.Row key={notification.id}>
                <Table.Cell>
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="bold">{notification.title}</Text>
                    <Text size="1" color="gray">{notification.body}</Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2">{getTargetDescription(notification)}</Text>
                </Table.Cell>
                <Table.Cell>
                  {getStatusBadge(notification.status)}
                </Table.Cell>
                <Table.Cell>
                  <Text size="2">{format.formatDateTime(notification.createdAt)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2">
                    {notification.sentAt ? format.formatDateTime(notification.sentAt) : "-"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2">{notification.admin.name}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Flex gap="2">
                    {notification.status === "failed" && (
                      <Button 
                        size="1" 
                        variant="soft"
                        color="blue"
                        onClick={() => retryMutation.mutate({ notificationId: notification.id })}
                        disabled={retryMutation.isPending}
                      >
                        <ReloadIcon width="14" height="14" />
                        Retry
                      </Button>
                    )}
                    <Button 
                      size="1" 
                      variant="soft" 
                      color="red"
                      onClick={() => setShowDeleteDialog(notification.id)}
                    >
                      <TrashIcon width="14" height="14" />
                      Delete
                    </Button>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        {/* Pagination */}
        {notifications && (
          <Flex justify="between" align="center" mt="4">
            <Text size="2" color="gray">
              Page {notifications.pagination.page} of {notifications.pagination.totalPages}
              {" "}({notifications.pagination.total} total)
            </Text>
            <Flex gap="2">
              <Button 
                variant="soft" 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="soft"
                disabled={page === notifications.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </Flex>
          </Flex>
        )}
      </Card>

{/* Send Notification Dialog removed - notifications are sent only through schedules */}

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Delete Notification</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this notification from history? This operation cannot be undone.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button 
                variant="solid" 
                color="red"
                onClick={() => showDeleteDialog && deleteMutation.mutate({ notificationId: showDeleteDialog })}
              >
                Delete
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Flex>
  );
}
