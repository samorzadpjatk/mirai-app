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
  Spinner,
  Separator,
} from "@radix-ui/themes";
import {
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { api } from "~/trpc/react";
import { format } from "~/utils/format";

type NotificationStatus = "pending" | "sent" | "failed" | "all";
type TargetType = "group" | "all_users" | "all";

export default function NotificationsPage() {
  // State for filtering and pagination
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NotificationStatus>("all");
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Only show sent notifications for regular users
  const { data: notifications, isLoading } = api.webPushNotification.getAll.useQuery({
    page,
    pageSize: 20,
    status: "sent", // Only show successfully sent notifications
    targetType: targetType === "all" ? undefined : targetType,
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

  // Filter notifications based on search term
  const filteredNotifications = notifications?.notifications.filter(notification =>
    searchTerm === "" ||
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.body.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <Flex align="center" justify="center" p="9">
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex direction="column" align="center" justify="center" gap="3">
          <Heading size="6">📨 Notifications</Heading>
          <Text size="2" align="center" color="gray">
            All notifications that have been sent in the application
          </Text>
        </Flex>

        <Separator size="4" />

        {/* Search and Filters */}
        <Flex gap="3">
          <TextField.Root
            style={{width: '100%'}}
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>
          </TextField.Root>

          <Select.Root value={targetType} onValueChange={(value) => setTargetType(value as TargetType)}>
            <Select.Trigger placeholder="Filter by target..." />
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
                <Table.ColumnHeaderCell>Notification</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Target</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Sent at</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Sent by</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredNotifications.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>
                    <Text color="gray">
                      {searchTerm ? "Nie znaleziono powiadomień pasujących do wyszukiwania" : "Brak powiadomień do wyświetlenia"}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredNotifications.map((notification) => (
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
                      <Text size="2">
                        {notification.sentAt ? format.formatDateTime(notification.sentAt) : "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">{notification.admin.name}</Text>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>

          {/* Pagination */}
          {notifications && notifications.pagination.totalPages > 1 && (
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
      </Flex>
    </Card>
  );
}
