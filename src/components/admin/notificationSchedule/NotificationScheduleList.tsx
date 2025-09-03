"use client";

import { useEffect, useState } from "react";
import { Button, Card, Flex, Text, Badge, Dialog, Box, Heading, Table } from "@radix-ui/themes";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useOfflineNotificationScheduleMutation } from "~/hooks/useUniversalOfflineMutation";

export default function NotificationScheduleList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {
    data: schedules,
    isLoading,
    refetch,
  } = api.notificationSchedule.getAll.useQuery();

  // Enhanced mutations with offline handling
  const offlineToggleActive = useOfflineNotificationScheduleMutation('toggleActive');
  const offlineDelete = useOfflineNotificationScheduleMutation('delete');
  
  const { mutation: toggleActiveMutation, offlineStatus: toggleOfflineStatus } = offlineToggleActive(() => 
    api.notificationSchedule.toggleActive.useMutation({
      onSuccess: () => {
        refetch();
      }
    })
  );

  const { mutation: deleteMutation, offlineStatus: deleteOfflineStatus } = offlineDelete(() => 
    api.notificationSchedule.delete.useMutation({
      onSuccess: () => {
        refetch();
      }
    })
  );

  // Combined offline status
  const offlineStatus = toggleOfflineStatus || deleteOfflineStatus;

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActiveMutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error toggling schedule:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten harmonogram?")) {
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

  const getStatusBadge = (schedule: any) => {
    const now = new Date();
    const isActive = schedule.isActive;
    const isInDateRange = now >= new Date(schedule.startDate) && now <= new Date(schedule.endDate);

    if (!isActive) {
      return <Badge color="gray">Nieaktywny</Badge>;
    }
    
    if (!isInDateRange) {
      return <Badge color="orange">Poza zakresem dat</Badge>;
    }
    
    return <Badge color="green">Aktywny</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <Flex direction="column" gap="3">
          <Heading size="4">Harmonogramy powiadomień</Heading>
          <Text>Ładowanie...</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Heading size="4">Harmonogramy powiadomień</Heading>
            <Button onClick={() => setCreateDialogOpen(true)}>
              Dodaj nowy harmonogram
            </Button>
          </Flex>

          {schedules && schedules.length > 0 ? (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Nazwa</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Opis</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Godzina</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Okres</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Ostatnie uruchomienie</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Akcje</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {schedules.map((schedule) => (
                  <Table.Row key={schedule.id}>
                    <Table.Cell>
                      <Text weight="bold">{schedule.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {schedule.description || "Brak opisu"}
                      </Text>
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
                          : "Nigdy"}
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
                          {schedule.isActive ? "Dezaktywuj" : "Aktywuj"}
                        </Button>
                        <Button
                          size="1"
                          variant="outline"
                          color="red"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          Usuń
                        </Button>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <Text color="gray">Brak harmonogramów powiadomień.</Text>
          )}

          {/* Offline Status Indicator */}
          {offlineStatus && (
            <Card 
              variant="surface" 
              style={{ 
                backgroundColor: offlineStatus.includes('saved for later') ? 'var(--orange-2)' : 'var(--red-2)',
                border: offlineStatus.includes('saved for later') ? '1px solid var(--orange-6)' : '1px solid var(--red-6)'
              }}
            >
              <Text 
                size="2" 
                color={offlineStatus.includes('saved for later') ? 'orange' : 'red'}
              >
                {offlineStatus}
              </Text>
              {offlineStatus.includes('saved for later') && (
                <Text size="1" color="gray" style={{ display: 'block', marginTop: '0.5rem' }}>
                  Operation will be completed when connection is restored.
                </Text>
              )}
            </Card>
          )}
        </Flex>
      </Card>

      <CreateNotificationScheduleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          refetch();
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
    description: "",
    startDate: "",
    endDate: "",
    hour: 9,
    minute: 0,
    isActive: true,
  });

  // Enhanced create mutation with offline handling
  const offlineCreate = useOfflineNotificationScheduleMutation('create');
  const { mutation: createMutation, offlineStatus: createOfflineStatus } = offlineCreate(() => 
    api.notificationSchedule.create.useMutation({
      onSuccess: () => {
        onSuccess();
        setFormData({
          name: "",
          description: "",
          startDate: "",
          endDate: "",
          hour: 9,
          minute: 0,
          isActive: true,
        });
      }
    })
  );

  // Auto-close dialog when saved for offline retry
  useEffect(() => {
    if (createOfflineStatus && createOfflineStatus.includes('saved for later')) {
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        hour: 9,
        minute: 0,
        isActive: true,
      });
    }
  }, [createOfflineStatus, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
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
        <Dialog.Title>Dodaj nowy harmonogram powiadomień</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Utwórz harmonogram automatycznych powiadomień o rankingu gildii.
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Nazwa
              </Text>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Codzienny ranking"
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid var(--gray-7)",
                  borderRadius: "4px",
                }}
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Opis (opcjonalny)
              </Text>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Opis harmonogramu..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid var(--gray-7)",
                  borderRadius: "4px",
                  resize: "vertical",
                }}
              />
            </label>

            <Flex gap="3">
              <label style={{ flex: 1 }}>
                <Text as="div" size="2" mb="1" weight="bold">
                  Data rozpoczęcia
                </Text>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid var(--gray-7)",
                    borderRadius: "4px",
                  }}
                />
              </label>

              <label style={{ flex: 1 }}>
                <Text as="div" size="2" mb="1" weight="bold">
                  Data zakończenia
                </Text>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid var(--gray-7)",
                    borderRadius: "4px",
                  }}
                />
              </label>
            </Flex>

            <Flex gap="3">
              <label style={{ flex: 1 }}>
                <Text as="div" size="2" mb="1" weight="bold">
                  Godzina (0-23)
                </Text>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.hour}
                  onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid var(--gray-7)",
                    borderRadius: "4px",
                  }}
                />
              </label>

              <label style={{ flex: 1 }}>
                <Text as="div" size="2" mb="1" weight="bold">
                  Minuta (0-59)
                </Text>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.minute}
                  onChange={(e) => setFormData({ ...formData, minute: parseInt(e.target.value) })}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid var(--gray-7)",
                    borderRadius: "4px",
                  }}
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
                <Text size="2">Aktywny od razu</Text>
              </Flex>
            </label>
          </Flex>

          {/* Offline Status Indicator */}
          {createOfflineStatus && (
            <div style={{ 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              backgroundColor: createOfflineStatus.includes('saved for later') ? 'var(--orange-2)' : 'var(--red-2)',
              border: createOfflineStatus.includes('saved for later') ? '1px solid var(--orange-6)' : '1px solid var(--red-6)'
            }}>
              <Text 
                size="2" 
                color={createOfflineStatus.includes('saved for later') ? 'orange' : 'red'}
              >
                {createOfflineStatus}
              </Text>
              {createOfflineStatus.includes('saved for later') && (
                <Text size="1" color="gray" style={{ display: 'block', marginTop: '0.5rem' }}>
                  Schedule will be created when connection is restored.
                </Text>
              )}
            </div>
          )}

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">
                Anuluj
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Tworzenie..." : "Utwórz"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
