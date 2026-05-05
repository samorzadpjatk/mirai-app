import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CreateScheduleModal, EditScheduleModal, DeleteScheduleModal } from "../../admin/schedules/ScheduleModals";

jest.mock("~/components/admin/AdminModal", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");
  return {
    AdminModal: ({ children, visible, title, onClose, actions }: any) => (!visible ? null : React.createElement(View, null, React.createElement(Text, null, title), React.createElement(Pressable, { onPress: onClose }, React.createElement(Text, null, "Close")), children, actions)),
    AdminModalButton: ({ title, onPress, disabled, loading }: any) => React.createElement(Pressable, { onPress, disabled: disabled || loading }, React.createElement(Text, null, loading ? "Loading..." : title)),
  };
});

jest.mock("~/components/common/ui", () => {
  const React = require("react");
  const { Text, TextInput, View } = require("react-native");
  return {
    FormField: ({ children, label, required }: any) => React.createElement(View, null, React.createElement(Text, null, `${label}${required ? "*" : ""}`), children),
    ThemedTextInput: ({ value, onChangeText, placeholder, ...props }: any) => React.createElement(TextInput, { value, onChangeText, placeholder, ...props }),
  };
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
    const schedule = { id: "schedule-1", name: "Old name", message: "Old message", triggerTime: "08:00" };
    const { getByPlaceholderText, getByText } = renderWithProviders(<EditScheduleModal visible={true} onClose={jest.fn()} schedule={schedule as any} onUpdateSchedule={onUpdateSchedule} isUpdating={false} />);
    fireEvent.changeText(getByPlaceholderText("Enter schedule name..."), "Updated name");
    fireEvent.changeText(getByPlaceholderText("Enter notification message..."), "Updated message");
    fireEvent.changeText(getByPlaceholderText("e.g., 09:00, 14:30"), "10:30");
    fireEvent.press(getByText("Update"));
    expect(onUpdateSchedule).toHaveBeenCalledWith("schedule-1", "Updated name", "Updated message", "10:30");
  });

  it("deletes a schedule", () => {
    const onDeleteSchedule = jest.fn();
    const schedule = { id: "schedule-1", name: "Schedule to Delete" };
    const { getByText } = renderWithProviders(<DeleteScheduleModal visible={true} onClose={jest.fn()} schedule={schedule as any} onDeleteSchedule={onDeleteSchedule} isDeleting={false} />);
    fireEvent.press(getByText("Delete"));
    expect(onDeleteSchedule).toHaveBeenCalledWith("schedule-1");
  });
});
