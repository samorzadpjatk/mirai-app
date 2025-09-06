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
  Grid,
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
type TargetType = "user" | "group" | "all_users" | "all";

export default function NotificationsAdminPage() {
  // State for filtering and pagination
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NotificationStatus>("all");
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // State for modals
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  
  // State for sending notifications
  const [sendForm, setSendForm] = useState({
    title: "",
    body: "",
    targetType: "all_users" as const,
    userId: "",
    icon: "",
    badge: "",
    tag: "",
    requireInteraction: false,
    silent: false,
  });

  // Queries
  const { data: notifications, refetch: refetchNotifications, isLoading } = api.webPushNotification.getAll.useQuery({
    page,
    pageSize: 20,
    status: status === "all" ? undefined : status,
    targetType: targetType === "all" ? undefined : targetType,
  });

  const { data: stats, refetch: refetchStats } = api.webPushNotification.getStats.useQuery();

  // Mutations
  const sendToAllMutation = api.webPushNotification.sendToAll.useMutation({
    onSuccess: () => {
      setShowSendDialog(false);
      setSendForm({
        title: "",
        body: "",
        targetType: "all_users",
        userId: "",
        icon: "",
        badge: "",
        tag: "",
        requireInteraction: false,
        silent: false,
      });
      refetchNotifications();
      refetchStats();
    },
  });

  const sendToUserMutation = api.webPushNotification.sendToUser.useMutation({
    onSuccess: () => {
      setShowSendDialog(false);
      setSendForm({
        title: "",
        body: "",
        targetType: "all_users",
        userId: "",
        icon: "",
        badge: "",
        tag: "",
        requireInteraction: false,
        silent: false,
      });
      refetchNotifications();
      refetchStats();
    },
  });

  const retryMutation = api.webPushNotification.retryNotification.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchStats();
    },
  });

  const deleteMutation = api.webPushNotification.delete.useMutation({
    onSuccess: () => {
      setShowDeleteDialog(null);
      refetchNotifications();
      refetchStats();
    },
  });

  const handleSendNotification = () => {
    if (sendForm.targetType === "all_users") {
      sendToAllMutation.mutate({
        title: sendForm.title,
        body: sendForm.body,
        icon: sendForm.icon || undefined,
        badge: sendForm.badge || undefined,
        tag: sendForm.tag || undefined,
        requireInteraction: sendForm.requireInteraction,
        silent: sendForm.silent,
      });
    } else if (sendForm.targetType === "user" && sendForm.userId) {
      sendToUserMutation.mutate({
        userId: sendForm.userId,
        title: sendForm.title,
        body: sendForm.body,
        icon: sendForm.icon || undefined,
        badge: sendForm.badge || undefined,
        tag: sendForm.tag || undefined,
        requireInteraction: sendForm.requireInteraction,
        silent: sendForm.silent,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge color="green">Wysłane</Badge>;
      case "failed":
        return <Badge color="red">Niepowodzenie</Badge>;
      case "pending":
        return <Badge color="yellow">Oczekuje</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  const getTargetDescription = (notification: any) => {
    if (notification.sentToAll) return "Wszyscy użytkownicy";
    if (notification.targetUser) return `Użytkownik: ${notification.targetUser.name}`;
    if (notification.targetGroup) return `Gildia: ${notification.targetGroup.name}`;
    return "Nieznane";
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
      {/* Header with Stats */}
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between">
          <Heading size="6">Historia Powiadomień</Heading>
          <Button onClick={() => setShowSendDialog(true)}>
            <PlusIcon width="16" height="16" />
            Wyślij Powiadomienie
          </Button>
        </Flex>

        {stats && (
          <Grid columns="5" gap="3">
            <Card>
              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">Łącznie</Text>
                <Text size="6" weight="bold">{stats.total}</Text>
              </Flex>
            </Card>
            <Card>
              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">Wysłane</Text>
                <Text size="6" weight="bold" color="green">{stats.sent}</Text>
              </Flex>
            </Card>
            <Card>
              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">Nieudane</Text>
                <Text size="6" weight="bold" color="red">{stats.failed}</Text>
              </Flex>
            </Card>
            <Card>
              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">Dzisiaj</Text>
                <Text size="6" weight="bold" color="blue">{stats.today}</Text>
              </Flex>
            </Card>
            <Card>
              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">Skuteczność</Text>
                <Text size="6" weight="bold">{stats.successRate}%</Text>
              </Flex>
            </Card>
          </Grid>
        )}
      </Flex>

      <Separator size="4" />

      {/* Filters */}
      <Flex gap="3" wrap="wrap">
        <TextField.Root 
          placeholder="Szukaj..." 
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
            <Select.Item value="all">Wszystkie</Select.Item>
            <Select.Item value="sent">Wysłane</Select.Item>
            <Select.Item value="failed">Niepowodzenie</Select.Item>
            <Select.Item value="pending">Oczekujące</Select.Item>
          </Select.Content>
        </Select.Root>

        <Select.Root value={targetType} onValueChange={(value) => setTargetType(value as TargetType)}>
          <Select.Trigger placeholder="Cel..." />
          <Select.Content>
            <Select.Item value="all">Wszystkie</Select.Item>
            <Select.Item value="all_users">Wszyscy użytkownicy</Select.Item>
            <Select.Item value="user">Konkretny użytkownik</Select.Item>
            <Select.Item value="group">Gildia</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {/* Notifications Table */}
      <Card>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Tytuł</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Cel</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Data utworzenia</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Data wysłania</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Admin</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Akcje</Table.ColumnHeaderCell>
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
                        disabled={retryMutation.isLoading}
                      >
                        <ReloadIcon width="14" height="14" />
                        Ponów
                      </Button>
                    )}
                    <Button 
                      size="1" 
                      variant="soft" 
                      color="red"
                      onClick={() => setShowDeleteDialog(notification.id)}
                    >
                      <TrashIcon width="14" height="14" />
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
              Strona {notifications.pagination.page} z {notifications.pagination.totalPages}
              {" "}({notifications.pagination.total} łącznie)
            </Text>
            <Flex gap="2">
              <Button 
                variant="soft" 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Poprzednia
              </Button>
              <Button 
                variant="soft"
                disabled={page === notifications.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Następna
              </Button>
            </Flex>
          </Flex>
        )}
      </Card>

      {/* Send Notification Dialog */}
      <Dialog.Root open={showSendDialog} onOpenChange={setShowSendDialog}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Wyślij Nowe Powiadomienie</Dialog.Title>
          <Dialog.Description>
            Utwórz i wyślij powiadomienie push do użytkowników.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <TextField.Root 
              placeholder="Tytuł powiadomienia"
              value={sendForm.title}
              onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
            />
            
            <TextArea 
              placeholder="Treść powiadomienia"
              value={sendForm.body}
              onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
              rows={3}
            />

            <Select.Root 
              value={sendForm.targetType} 
              onValueChange={(value) => setSendForm({ ...sendForm, targetType: value as any })}
            >
              <Select.Trigger placeholder="Wybierz cel..." />
              <Select.Content>
                <Select.Item value="all_users">Wszyscy użytkownicy</Select.Item>
                <Select.Item value="user">Konkretny użytkownik</Select.Item>
              </Select.Content>
            </Select.Root>

            {sendForm.targetType === "user" && (
              <TextField.Root 
                placeholder="ID użytkownika"
                value={sendForm.userId}
                onChange={(e) => setSendForm({ ...sendForm, userId: e.target.value })}
              />
            )}

            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">Opcje zaawansowane</Text>
              
              <TextField.Root 
                placeholder="URL ikony (opcjonalne)"
                value={sendForm.icon}
                onChange={(e) => setSendForm({ ...sendForm, icon: e.target.value })}
              />
              
              <TextField.Root 
                placeholder="Tag (opcjonalne)"
                value={sendForm.tag}
                onChange={(e) => setSendForm({ ...sendForm, tag: e.target.value })}
              />

              <Flex align="center" gap="2">
                <Switch 
                  checked={sendForm.requireInteraction}
                  onCheckedChange={(checked) => setSendForm({ ...sendForm, requireInteraction: checked })}
                />
                <Text size="2">Wymagaj interakcji</Text>
              </Flex>

              <Flex align="center" gap="2">
                <Switch 
                  checked={sendForm.silent}
                  onCheckedChange={(checked) => setSendForm({ ...sendForm, silent: checked })}
                />
                <Text size="2">Ciche powiadomienie</Text>
              </Flex>
            </Flex>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">Anuluj</Button>
            </Dialog.Close>
            <Button 
              onClick={handleSendNotification}
              disabled={!sendForm.title || !sendForm.body || sendToAllMutation.isLoading || sendToUserMutation.isLoading}
            >
              <PaperPlaneIcon width="16" height="16" />
              Wyślij
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Usuń Powiadomienie</AlertDialog.Title>
          <AlertDialog.Description>
            Czy na pewno chcesz usunąć to powiadomienie z historii? Tej operacji nie można cofnąć.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Anuluj</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button 
                variant="solid" 
                color="red"
                onClick={() => showDeleteDialog && deleteMutation.mutate({ notificationId: showDeleteDialog })}
              >
                Usuń
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Flex>
  );
}
