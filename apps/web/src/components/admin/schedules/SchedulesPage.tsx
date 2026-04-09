"use client";

import { useMemo, useState } from "react";
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
  useAdminSchedules,
  type NotificationSchedule,
} from "@mirai-app/frameworks/trpc/hooks";
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

  const {
    schedules,
    isLoading,
    refetch,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling,
  } = useAdminSchedules(selectedTripId || undefined);

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
        schedule.message.toLowerCase().includes(normalized) ||
        (schedule.tripName ?? "").toLowerCase().includes(normalized)
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
      message: schedule.notificationBody ?? schedule.message,
      date,
      time,
    });
  };

  const handleCreate = async () => {
    if (!selectedTripId) {
      appToast.error("Select a trip before creating schedules.");
      return;
    }

    if (!formState.name.trim() || !formState.message.trim()) {
      appToast.error("Name and message are required.");
      return;
    }

    try {
      const window = buildScheduleWindow(formState.date, formState.time);
      const toastId = appToast.loading("Creating schedule...");

      await createSchedule({
        name: formState.name.trim(),
        tripId: selectedTripId,
        notificationType: "custom",
        notificationTitle: formState.name.trim(),
        notificationBody: formState.message.trim(),
        notificationUrl: "/ranking",
        startDate: window.startDate,
        endDate: window.endDate,
        hour: window.hour,
        minute: window.minute,
        isActive: true,
      });

      appToast.dismiss(toastId);
      appToast.success("Schedule created.");
      closeCreateModal();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Create failed.");
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

    try {
      const window = buildScheduleWindow(formState.date, formState.time);
      const toastId = appToast.loading("Updating schedule...");

      await updateSchedule({
        id: editingSchedule.id,
        name: formState.name.trim(),
        notificationTitle: formState.name.trim(),
        notificationBody: formState.message.trim(),
        notificationUrl: "/ranking",
        startDate: window.startDate,
        endDate: window.endDate,
        hour: window.hour,
        minute: window.minute,
      });

      appToast.dismiss(toastId);
      appToast.success("Schedule updated.");
      closeEditModal();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Update failed.");
    }
  };

  const handleDelete = async (scheduleId: string) => {
    const confirmed = window.confirm("Delete this schedule?");
    if (!confirmed) {
      return;
    }

    const toastId = appToast.loading("Deleting schedule...");
    try {
      await deleteSchedule(scheduleId);
      appToast.dismiss(toastId);
      appToast.success("Schedule deleted.");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  const handleToggle = async (scheduleId: string) => {
    try {
      await toggleSchedule(scheduleId);
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Toggle failed.");
    }
  };

  if (isLoading || tripsLoading) {
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
          <Button variant="secondary" onClick={() => void refetch()}>
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
              isDeleting={isDeleting}
              isToggling={isToggling}
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
            <Button disabled={isCreating} onClick={() => void handleCreate()}>
              {isCreating ? "Creating..." : "Create"}
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
            <Button disabled={isUpdating} onClick={() => void handleUpdate()}>
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
