"use client";

import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import type { GetNotificationSchedulesQuery } from "@mirai-app/frameworks";

type NotificationSchedule =
  GetNotificationSchedulesQuery["notificationSchedules"]["schedules"][number];

interface ScheduleCardProps {
  schedule: NotificationSchedule;
  onEdit: (schedule: NotificationSchedule) => void;
  onDelete: (scheduleId: string) => void;
  onToggle: (scheduleId: string) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
  onToggle,
  isDeleting = false,
  isToggling = false,
}: ScheduleCardProps) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            {schedule.name}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {schedule.notificationBody || "No message"}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            schedule.isActive
              ? "bg-emerald-900/30 text-emerald-400"
              : "bg-surface text-text-secondary"
          }`}
        >
          {schedule.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
        <p>
          <span className="font-medium text-text-primary">Trip:</span>{" "}
          {schedule.tripId ?? "Global"}
        </p>
        <p>
          <span className="font-medium text-text-primary">Trigger:</span>{" "}
          {schedule.hour.toString().padStart(2, "0")}:
          {schedule.minute.toString().padStart(2, "0")}
        </p>
        <p>
          <span className="font-medium text-text-primary">Start:</span>{" "}
          {formatDateTime(schedule.startDate)}
        </p>
        <p>
          <span className="font-medium text-text-primary">End:</span>{" "}
          {formatDateTime(schedule.endDate)}
        </p>
      </div>

      <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => onEdit(schedule)}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          disabled={isToggling}
          onClick={() => onToggle(schedule.id)}
        >
          {isToggling
            ? "Updating..."
            : schedule.isActive
              ? "Pause"
              : "Activate"}
        </Button>
        <Button
          variant="danger"
          className="w-full"
          disabled={isDeleting}
          onClick={() => onDelete(schedule.id)}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </Card>
  );
}
