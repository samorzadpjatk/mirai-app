import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ScheduleCard } from "../../admin/schedules/ScheduleCard";
import type { NotificationSchedule } from "../../../hooks/admin/useAdminSchedules";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const baseSchedule: NotificationSchedule = {
  id: "schedule-1",
  name: "Morning Update",
  message: "Send a morning update",
  triggerTime: "08:00",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  executionCount: 0,
  isRecurring: true,
  hour: 8,
  minute: 0,
  notificationType: "morning_update",
};

describe("ScheduleCard", () => {

  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onToggle = jest.fn();
  const onTrigger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders schedule details", () => {
    const { getByText } = renderWithProviders(
      <ScheduleCard
        schedule={baseSchedule}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onTrigger={onTrigger}
      />
    );

    expect(getByText("Morning Update")).toBeTruthy();
    expect(getByText(/08:00/)).toBeTruthy();
    expect(getByText("Send a morning update")).toBeTruthy();
    expect(getByText("Active")).toBeTruthy();
  });

  it("calls the action handlers", () => {
    const { getByText } = renderWithProviders(
      <ScheduleCard
        schedule={baseSchedule}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onTrigger={onTrigger}
      />
    );

    fireEvent.press(getByText("Edit"));
    fireEvent.press(getByText("Trigger"));
    fireEvent.press(getByText("Pause"));
    fireEvent.press(getByText("Delete"));

    expect(onEdit).toHaveBeenCalledWith(baseSchedule);
    expect(onTrigger).toHaveBeenCalledWith(baseSchedule);
    expect(onToggle).toHaveBeenCalledWith(baseSchedule);
    expect(onDelete).toHaveBeenCalledWith(baseSchedule);
  });

  it("shows start and inactive when schedule is disabled", () => {
    const inactiveSchedule: NotificationSchedule = { ...baseSchedule, isActive: false };
    const { getByText } = renderWithProviders(
      <ScheduleCard
        schedule={inactiveSchedule}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onTrigger={onTrigger}
      />
    );

    expect(getByText("Inactive")).toBeTruthy();
    expect(getByText("Start")).toBeTruthy();
  });
});
