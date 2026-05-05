import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CreateGroupModal, EditGroupModal, DeleteGroupModal, AssignOrganizerModal } from "../../admin/groups/GroupModals";

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
    ThemedTextInput: ({ value, onChangeText, placeholder }: any) => React.createElement(TextInput, { value, onChangeText, placeholder }),
  };
});

const group = { id: "group-1", name: "Existing Group", _count: { participants: 2 }, organizer: { firstName: "Old", lastName: "Organizer" } };
const users = [
  { id: "user-1", firstName: "Jane", lastName: "Doe", email: "jane@example.com" },
  { id: "user-2", firstName: "John", lastName: "Smith", email: "john@example.com" },
];

describe("Group modals", () => {
  it("creates a group", () => {
    const onCreateGroup = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithProviders(<CreateGroupModal visible={true} onClose={jest.fn()} onCreateGroup={onCreateGroup} isCreating={false} />);
    fireEvent.changeText(getByPlaceholderText("Enter group name..."), "New Group");
    fireEvent.press(getByText("Create"));
    expect(onCreateGroup).toHaveBeenCalledWith("New Group");
  });

  it("updates a group", () => {
    const onUpdateGroup = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithProviders(<EditGroupModal visible={true} onClose={jest.fn()} group={group as any} onUpdateGroup={onUpdateGroup} isUpdating={false} />);
    fireEvent.changeText(getByPlaceholderText("Enter group name..."), "Updated Group");
    fireEvent.press(getByText("Update"));
    expect(onUpdateGroup).toHaveBeenCalledWith("group-1", "Updated Group");
  });

  it("deletes a group", () => {
    const onDeleteGroup = jest.fn();
    const { getByText } = renderWithProviders(<DeleteGroupModal visible={true} onClose={jest.fn()} group={group as any} onDeleteGroup={onDeleteGroup} isDeleting={false} />);
    fireEvent.press(getByText("Delete"));
    expect(onDeleteGroup).toHaveBeenCalledWith("group-1");
  });

  it("assigns an organizer", () => {
    const onAssignOrganizer = jest.fn();
    const { getByText } = renderWithProviders(<AssignOrganizerModal visible={true} onClose={jest.fn()} group={group as any} users={users as any} onAssignOrganizer={onAssignOrganizer} isAssigning={false} />);
    fireEvent.press(getByText("Jane Doe"));
    fireEvent.press(getByText("Assign"));
    expect(onAssignOrganizer).toHaveBeenCalledWith("group-1", "user-1");
  });
});
