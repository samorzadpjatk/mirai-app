"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Flex,
  Text,
  TextField,
  Select,
  AlertDialog,
  Spinner,
  DataList,
  Avatar,
} from "@radix-ui/themes";
import {
  TrashIcon,
  ReloadIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { api } from "~/trpc/react";
import { format } from "~/utils/format";

type NotificationStatus = "pending" | "sent" | "failed" | "all";

export default function NotificationsAdminPage() {
  // State for filtering and pagination
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NotificationStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // State for modals  
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);

  // Queries
  const { data: result, refetch: refetchNotifications, isLoading } = api.notifications.getAll.useQuery({
    page,
    pageSize: 20,
  });

  const notifications = result?.notifications;
  const pagination = result?.pagination;

  // Mutations
  const retryMutation = api.notifications.retryNotification.useMutation({
    onSuccess: () => {
      void refetchNotifications();
    },
  });

  const deleteMutation = api.notifications.delete.useMutation({
    onSuccess: () => {
      setShowDeleteDialog(null);
      void refetchNotifications();
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
      <Flex gap="3">
        <TextField.Root
          style={{ width: "100%" }}
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
      </Flex>
      {notifications?.length === 0 ? (
        <Text color="gray">
          {searchTerm ? "Nie znaleziono powiadomień pasujących do wyszukiwania" : "Brak powiadomień do wyświetlenia"}
        </Text>
      ) : (
        notifications?.map((notification) => {
          const statusGroups = {
            sent: notification.pushes.filter((p) => p.status === "sent"),
            failed: notification.pushes.filter((p) => p.status === "failed"),
          }

          return (<Card key={notification.id}>
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="4">
                <Flex direction={"row"} align={"end"} gap="2">
                  {statusGroups.failed.length > 0 && (
                    <Button
                      size="1"
                      variant="soft"
                      color="blue"
                      onClick={() => retryMutation.mutate({ notificationId: notification.id })}
                      disabled={retryMutation.isPending}
                    >
                      <ReloadIcon />
                      Retry
                    </Button>
                  )}
                  <Button
                    size="1"
                    variant="soft"
                    color="red"
                    onClick={() => setShowDeleteDialog(notification.id)}
                  >
                    <TrashIcon />
                    Delete
                  </Button>
                </Flex>
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2"><Avatar
                    variant={"solid"}
                    size={{ "initial": "1", "xs": "2", "sm": "3" }}
                    fallback={notification.createdBy.name?.split(" ").map((name) => name[0]).join("") ?? ""}
                    src={undefined}
                  />
                    <Text size="2"> {notification.createdBy.name}</Text></Flex>
                  <Text size="2" color="gray">{format.formatDateTime(notification.createdAt)}</Text>
                </Flex>

                <Text size="2" weight="bold">{notification.title}</Text>
                <Text size="1" color="gray">{notification.body.split("\n").map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < notification.body.split("\n").length - 1 && <br />}
                  </span>
                ))}</Text>
              </Flex>
              {notification.pushes.length > 0 && (
                <Flex direction="column" gap="4">
                  <Text size="2" weight="bold">Recipients:</Text>
                  <DataList.Root>
                    {statusGroups.failed.length > 0 && (
                      <DataList.Item>
                        <DataList.Label>{getStatusBadge("failed")}</DataList.Label>
                        {statusGroups.failed.map((push) => (<DataList.Value key={push.targetUser.id}><Text size="2">{push.targetUser.name}</Text></DataList.Value>))}
                      </DataList.Item>
                    )}
                    {statusGroups.sent.length > 0 && (
                      <DataList.Item>
                        <DataList.Label>{getStatusBadge("sent")}</DataList.Label>
                        {statusGroups.sent.map((push) => (<DataList.Value key={push.targetUser.id}><Text size="2">{push.targetUser.name}</Text></DataList.Value>))}
                      </DataList.Item>
                    )}
                  </DataList.Root>
                </Flex>
              )}
            </Flex>
          </Card>
          )
        })



      )}

      {pagination && pagination.totalPages > 1 && (
        <Flex justify="between" align="center" mt="4">
          <Text size="2" color="gray">
            Page {pagination.page} of {pagination.totalPages}
            {" "}({pagination.total} total)
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
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </Flex>
        </Flex>
      )}


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
    </Flex >
  );
}
