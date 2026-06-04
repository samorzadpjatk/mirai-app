import { fireEvent } from "@testing-library/react-native";
import React from "react";
import { Pressable, Text, type TextInput, View } from "react-native";
import type { NotificationSchedule } from "~/hooks/admin/useAdminSchedules";
import {
  CreateScheduleModal,
  DeleteScheduleModal,
  EditScheduleModal,
} from "../../admin/schedules/ScheduleModals";
import { renderWithProviders } from "../helpers/renderWithProviders";

interface AdminModalProps {
  children: React.ReactNode;
  visible: boolean;
  title: string;
  onClose: () => void;
  actions?: React.ReactNode;
}

interface AdminModalButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const createSchedule = (overrides: Partial<NotificationSchedule> = {}): NotificationSchedule => ({
  id: "schedule-1",
  name: "Old name",
  message: "Old message",
  triggerTime: "08:00",
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  startDate: "2024-01-01T00:00:00.000Z",
  endDate: "2024-01-02T00:00:00.000Z",
  executionCount: 0,
  isRecurring: false,
  hour: 8,
  minute: 0,
  notificationType: "custom",
  ...overrides,
});

describe("Schedule modals", () => {
  it("creates a schedule", () => {
    const onCreateSchedule = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <CreateScheduleModal
        visible={true}
        onClose={jest.fn()}
        onCreateSchedule={onCreateSchedule}
        isCreating={false}
      />,
    );
    fireEvent.changeText(getByPlaceholderText("Enter schedule name..."), "Morning push");
    fireEvent.changeText(getByPlaceholderText("Enter notification message..."), "Hello");
    fireEvent.changeText(getByPlaceholderText("e.g., 09:00, 14:30"), "09:00");
    fireEvent.press(getByText("Create"));
    expect(onCreateSchedule).toHaveBeenCalledWith("Morning push", "Hello", "09:00");
  });

  it("updates a schedule", () => {
    const onUpdateSchedule = jest.fn();
    const schedule = createSchedule();
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <EditScheduleModal
        visible={true}
        onClose={jest.fn()}
        schedule={schedule}
        onUpdateSchedule={onUpdateSchedule}
        isUpdating={false}
      />,
    );
    fireEvent.changeText(getByPlaceholderText("Enter schedule name..."), "Updated name");
    fireEvent.changeText(getByPlaceholderText("Enter notification message..."), "Updated message");
    fireEvent.changeText(getByPlaceholderText("e.g., 09:00, 14:30"), "10:30");
    fireEvent.press(getByText("Update"));
    expect(onUpdateSchedule).toHaveBeenCalledWith(
      "schedule-1",
      "Updated name",
      "Updated message",
      "10:30",
    );
  });

  it("deletes a schedule", () => {
    const onDeleteSchedule = jest.fn();
    const schedule = createSchedule({ name: "Schedule to Delete" });
    const { getByText } = renderWithProviders(
      <DeleteScheduleModal
        visible={true}
        onClose={jest.fn()}
        schedule={schedule}
        onDeleteSchedule={onDeleteSchedule}
        isDeleting={false}
      />,
    );
    fireEvent.press(getByText("Delete"));
    expect(onDeleteSchedule).toHaveBeenCalledWith("schedule-1");
  });
});
