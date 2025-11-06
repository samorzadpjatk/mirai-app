"use client";

import { useState } from "react";

import {
  Button,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  Table,
  Spinner,
  Separator,
  Box,
  Avatar,
} from "@radix-ui/themes";

import {
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { api } from "~/trpc/react";
import { format } from "~/utils/format";

export default function NotificationsPage() {
  // State for filtering and pagination
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: result, isLoading } = api.notifications.getAllMy.useQuery({
    page,
    pageSize: 20,
  });
  const notifications = result?.notifications;
  const pagination = result?.pagination;

  // Filter notifications based on search term
  const filteredNotifications = notifications?.filter(notification =>
    searchTerm === "" ||
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.body.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

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
        </Flex>

        <Separator size="4" />

        {/* Search and Filters */}
        <Flex gap="3">
          <TextField.Root
            style={{ width: '100%' }}
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>
          </TextField.Root>
        </Flex>

        {/* Notifications Table */}
        {filteredNotifications.length === 0 ? (
          <Text color="gray">
            {searchTerm ? "Nie znaleziono powiadomień pasujących do wyszukiwania" : "Brak powiadomień do wyświetlenia"}
          </Text>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification.id}>
              <Flex direction="column" gap="4">
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

            </Card>
          )))}

        {/* Pagination */}
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
      </Flex>
    </Card>
  );
}
