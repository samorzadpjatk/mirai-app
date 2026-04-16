"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useClient } from "urql";
import { Select } from "../../ui/Select";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { DateInput } from "../../ui/DateInput";
import { TimeInput } from "../../ui/TimeInput";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import {
  GetNotificationSchedulesDocument,
  CreateNotificationScheduleDocument,
  UpdateNotificationScheduleDocument,
  DeleteNotificationScheduleDocument,
  ToggleNotificationScheduleActiveDocument,
  type GetNotificationSchedulesQuery,
} from "@mirai-app/frameworks/graphql/urql";
import { useTrip } from "../../../contexts/TripContext";
import { ScheduleCard } from "./ScheduleCard";

interface ScheduleFormState {
  name: string;
  message: string;
  date: string;
  time: string;
}

const emptyFormState: ScheduleFormState = {
  name: "",
  message: "",
  date: "",
  time: "",
};

function getTomorrowDateString() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getDefaultTimeString() {
  return "09:00";
}

function buildScheduleWindow(dateValue: string, timeValue: string) {
  const [yearRaw, monthRaw, dayRaw] = dateValue.split("-");
  const [hourRaw, minuteRaw] = timeValue.split(":");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const month = Number.parseInt(monthRaw ?? "", 10);
  const day = Number.parseInt(dayRaw ?? "", 10);
  const hour = Number.parseInt(hourRaw ?? "", 10);
  const minute = Number.parseInt(minuteRaw ?? "", 10);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error("Provide a valid date and time.");
  }

  const startDate = new Date(
    Date.UTC(year, month - 1, day, hour, minute, 0, 0),
  );
  const now = new Date();
  const minimum = new Date(now.getTime() + 5 * 60 * 1000);
  if (startDate < minimum) {
    throw new Error("Schedule must be at least 5 minutes in the future.");
  }

  const endDate = new Date(startDate);
  endDate.setUTCFullYear(endDate.getUTCFullYear() + 1);

  return {
    startDate,
    endDate,
    hour,
    minute,
  };
}

type NotificationSchedule =
  GetNotificationSchedulesQuery["notificationSchedules"]["schedules"][number];

export function SchedulesPage() {
  const { selectedTrip, isLoading: tripsLoading } = useTrip();
  const selectedTripId = selectedTrip?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<NotificationSchedule | null>(null);
  const [formState, setFormState] = useState<ScheduleFormState>(() => ({
    ...emptyFormState,
    date: getTomorrowDateString(),
    time: getDefaultTimeString(),
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const client = useClient();

  // Fetch schedules using urql
  const [schedulesResult, reexecuteSchedules] = useQuery({
    query: GetNotificationSchedulesDocument,
    variables: {
      tripId: selectedTripId || undefined,
      limit: 100,
      offset: 0,
    },
    pause: !selectedTripId,
  });

  const schedules = useMemo(
    () => schedulesResult.data?.notificationSchedules?.schedules ?? [],
    [schedulesResult.data],
  );

  // Mutations using urql
  const [, createSchedule] = useMutation(CreateNotificationScheduleDocument);
  const [, updateSchedule] = useMutation(UpdateNotificationScheduleDocument);
  const [, deleteSchedule] = useMutation(DeleteNotificationScheduleDocument);
  const [, toggleSchedule] = useMutation(
    ToggleNotificationScheduleActiveDocument,
  );

  const filteredSchedules = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return schedules.filter((schedule) => {
      if (statusFilter === "active" && !schedule.isActive) {
        return false;
      }
      if (statusFilter === "inactive" && schedule.isActive) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        schedule.name.toLowerCase().includes(normalized) ||
        schedule.notificationType.toLowerCase().includes(normalized)
      );
    });
  }, [schedules, searchTerm, statusFilter]);

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setFormState({
      ...emptyFormState,
      date: getTomorrowDateString(),
      time: getDefaultTimeString(),
    });
  };

  const closeEditModal = () => {
    setEditingSchedule(null);
    setFormState({
      ...emptyFormState,
      date: getTomorrowDateString(),
      time: getDefaultTimeString(),
    });
  };

  const openEditModal = (schedule: NotificationSchedule) => {
    setEditingSchedule(schedule);

    const start = new Date(schedule.startDate);
    const date = start.toISOString().slice(0, 10);
    const time = `${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")}`;

    setFormState({
      name: schedule.name,
      message: schedule.notificationBody ?? "",
      date,
      time,
    });
  };

  const invalidateSchedules = useCallback(() => {
    client.invalidate(GetNotificationSchedulesDocument, {
      tripId: selectedTripId || undefined,
      limit: 100,
      offset: 0,
    });
  }, [client, selectedTripId]);

  const handleCreate = async () => {
    if (!selectedTripId) {
      appToast.error("Select a trip before creating schedules.");
      return;
    }

    if (!formState.name.trim() || !formState.message.trim()) {
      appToast.error("Name and message are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const window = buildScheduleWindow(formState.date, formState.time);

      const result = await createSchedule({
        input: {
          name: formState.name.trim(),
          tripId: selectedTripId,
          notificationType: "custom",
          notificationTitle: formState.name.trim(),
          notificationBody: formState.message.trim(),
          notificationUrl: "/ranking",
          startDate: window.startDate.toISOString(),
          endDate: window.endDate.toISOString(),
          hour: window.hour,
          minute: window.minute,
          isActive: true,
        },
      });

      if (result.error) {
        throw result.error;
      }

      appToast.success("Schedule created.");
      invalidateSchedules();
      closeCreateModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Create failed.";
      appToast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSchedule) {
      return;
    }

    if (!formState.name.trim() || !formState.message.trim()) {
      appToast.error("Name and message are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const window = buildScheduleWindow(formState.date, formState.time);

      const result = await updateSchedule({
        input: {
          id: editingSchedule.id,
          name: formState.name.trim(),
          notificationTitle: formState.name.trim(),
          notificationBody: formState.message.trim(),
          notificationUrl: "/ranking",
          startDate: window.startDate.toISOString(),
          endDate: window.endDate.toISOString(),
          hour: window.hour,
          minute: window.minute,
        },
      });

      if (result.error) {
        throw result.error;
      }

      appToast.success("Schedule updated.");
      invalidateSchedules();
      closeEditModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed.";
      appToast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    const confirmed = window.confirm("Delete this schedule?");
    if (!confirmed) {
      return;
    }

    try {
      const result = await deleteSchedule({ id: scheduleId });

      if (result.error) {
        throw result.error;
      }

      appToast.success("Schedule deleted.");
      invalidateSchedules();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed.";
      appToast.error(message);
    }
  };

  const handleToggle = async (scheduleId: string) => {
    try {
      const result = await toggleSchedule({ id: scheduleId });

      if (result.error) {
        throw result.error;
      }

      invalidateSchedules();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Toggle failed.";
      appToast.error(message);
    }
  };

  if (schedulesResult.fetching || tripsLoading) {
    return <LoadingSpinner label="Loading schedules..." />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-text-primary">Schedules</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage automated notifications by trip.
        </p>
      </header>

      <div className="grid gap-3 rounded-xl border border-border-subtle bg-card p-4 md:grid-cols-4">
        <Input
          label="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Name, message, trip"
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | "active" | "inactive")
          }
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        <div className="flex items-end gap-2 md:col-span-2">
          <Button
            variant="secondary"
            onClick={() =>
              void reexecuteSchedules({ requestPolicy: "network-only" })
            }
          >
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>Create schedule</Button>
        </div>
      </div>

      {!selectedTripId ? (
        <ErrorMessage message="Select a trip from the navbar to create or edit schedules." />
      ) : null}

      {filteredSchedules.length === 0 ? (
        <ErrorMessage message="No schedules found for selected filters." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onToggle={handleToggle}
              isDeleting={isSubmitting}
              isToggling={isSubmitting}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        title="Create schedule"
      >
        <div className="space-y-3">
          <Input
            label="Name"
            value={formState.name}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Morning reminder"
          />
          <Input
            label="Message"
            value={formState.message}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, message: event.target.value }))
            }
            placeholder="Start your challenge submissions"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <DateInput
              label="Date"
              value={formState.date}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, date: event.target.value }))
              }
            />
            <TimeInput
              label="Time"
              value={formState.time}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, time: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleCreate()}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(editingSchedule)}
        onClose={closeEditModal}
        title="Edit schedule"
      >
        <div className="space-y-3">
          <Input
            label="Name"
            value={formState.name}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Morning reminder"
          />
          <Input
            label="Message"
            value={formState.message}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, message: event.target.value }))
            }
            placeholder="Start your challenge submissions"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <DateInput
              label="Date"
              value={formState.date}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, date: event.target.value }))
              }
            />
            <TimeInput
              label="Time"
              value={formState.time}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, time: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleUpdate()}>
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
