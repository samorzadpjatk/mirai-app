import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { Pressable, Text, TextInput, View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CreateScheduleModal, EditScheduleModal, DeleteScheduleModal } from "../../admin/schedules/ScheduleModals";
import type { NotificationSchedule } from "~/hooks/admin/useAdminSchedules";

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

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}

type ThemedTextInputProps = React.ComponentProps<typeof TextInput>;

jest.mock("~/components/admin/AdminModal", () => {
  const { View, Text, Pressable } = require("react-native");
  return {
    AdminModal: ({ children, visible, title, onClose, actions }: AdminModalProps) =>
      !visible ? null : (
        <View>
          <Text>{title}</Text>
          <Pressable onPress={onClose}>
            <Text>Close</Text>
          </Pressable>
          {children}
          {actions}
        </View>
      ),
    AdminModalButton: ({ title, onPress, disabled, loading }: AdminModalButtonProps) => (
      <Pressable onPress={onPress} disabled={(disabled ?? false) || (loading ?? false)}>
        <Text>{loading ? "Loading..." : title}</Text>
      </Pressable>
    ),
  };
});

jest.mock("~/components/common/ui", () => {
  const { View, Text, TextInput } = require("react-native");
  return {
    FormField: ({ children, label, required }: FormFieldProps) => (
      <View>
        <Text>{`${label}${required ? "*" : ""}`}</Text>
        {children}
      </View>
    ),
    ThemedTextInput: ({ value, onChangeText, placeholder, ...props }: ThemedTextInputProps) => (
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} {...props} />
    ),
  };
});

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
    const { getByPlaceholderText, getByText } = renderWithProviders(<CreateScheduleModal visible={true} onClose={jest.fn()} onCreateSchedule={onCreateSchedule} isCreating={false} />);
    fireEvent.changeText(getByPlaceholderText("Enter schedule name..."), "Morning push");
    fireEvent.changeText(getByPlaceholderText("Enter notification message..."), "Hello");
    fireEvent.changeText(getByPlaceholderText("e.g., 09:00, 14:30"), "09:00");
    fireEvent.press(getByText("Create"));
    expect(onCreateSchedule).toHaveBeenCalledWith("Morning push", "Hello", "09:00");
  });

  it("updates a schedule", () => {
    const onUpdateSchedule = jest.fn();
    const schedule = createSchedule();
    const { getByPlaceholderText, getByText } = renderWithProviders(<EditScheduleModal visible={true} onClose={jest.fn()} schedule={schedule} onUpdateSchedule={onUpdateSchedule} isUpdating={false} />);
    fireEvent.changeText(getByPlaceholderText("Enter schedule name..."), "Updated name");
    fireEvent.changeText(getByPlaceholderText("Enter notification message..."), "Updated message");
    fireEvent.changeText(getByPlaceholderText("e.g., 09:00, 14:30"), "10:30");
    fireEvent.press(getByText("Update"));
    expect(onUpdateSchedule).toHaveBeenCalledWith("schedule-1", "Updated name", "Updated message", "10:30");
  });

  it("deletes a schedule", () => {
    const onDeleteSchedule = jest.fn();
    const schedule = createSchedule({ name: "Schedule to Delete" });
    const { getByText } = renderWithProviders(<DeleteScheduleModal visible={true} onClose={jest.fn()} schedule={schedule} onDeleteSchedule={onDeleteSchedule} isDeleting={false} />);
    fireEvent.press(getByText("Delete"));
    expect(onDeleteSchedule).toHaveBeenCalledWith("schedule-1");
  });
});
