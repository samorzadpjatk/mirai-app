import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CreateGroupModal, EditGroupModal, DeleteGroupModal, AssignOrganizerModal } from "../../admin/groups/GroupModals";
import type { Group, User } from "~/hooks/admin/useAdminGroups";

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

jest.mock("~/components/admin/AdminModal", () => {
  const { View, Text, Pressable } = jest.requireActual("react-native");
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

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}

interface ThemedTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

jest.mock("~/components/common/ui", () => {
  const { View, Text, TextInput } = jest.requireActual("react-native");
  return {
    FormField: ({ children, label, required }: FormFieldProps) => (
      <View>
        <Text>{`${label}${required ? "*" : ""}`}</Text>
        {children}
      </View>
    ),
    ThemedTextInput: ({ value, onChangeText, placeholder }: ThemedTextInputProps) => (
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} />
    ),
  };
});

const group: Group = {
  id: "group-1",
  name: "Existing Group",
  description: null,
  image: null,
  code: "GROUP-1",
  coins: 0,
  organizer: { id: "user-3", firstName: "Old", lastName: "Organizer" },
  _count: { participants: 2 },
};

const users: User[] = [
  {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    role: "USER",
    wristNumber: null,
    houseNumber: null,
    group: null,
    tripId: "trip-1",
  },
  {
    id: "user-2",
    firstName: "John",
    lastName: "Smith",
    email: "john@example.com",
    role: "USER",
    wristNumber: null,
    houseNumber: null,
    group: null,
    tripId: "trip-1",
  },
];

describe("Group modals", () => {
  it("creates a group", () => {
    const onCreateGroup = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <CreateGroupModal visible={true} onClose={jest.fn()} onCreateGroup={onCreateGroup} isCreating={false} />,
    );

    fireEvent.changeText(getByPlaceholderText("Enter group name..."), "New Group");
    fireEvent.press(getByText("Create"));

    expect(onCreateGroup).toHaveBeenCalledWith("New Group");
  });

  it("updates a group", () => {
    const onUpdateGroup = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <EditGroupModal visible={true} onClose={jest.fn()} group={group} onUpdateGroup={onUpdateGroup} isUpdating={false} />,
    );

    fireEvent.changeText(getByPlaceholderText("Enter group name..."), "Updated Group");
    fireEvent.press(getByText("Update"));

    expect(onUpdateGroup).toHaveBeenCalledWith("group-1", "Updated Group");
  });

  it("deletes a group", () => {
    const onDeleteGroup = jest.fn();
    const { getByText } = renderWithProviders(
      <DeleteGroupModal visible={true} onClose={jest.fn()} group={group} onDeleteGroup={onDeleteGroup} isDeleting={false} />,
    );

    fireEvent.press(getByText("Delete"));

    expect(onDeleteGroup).toHaveBeenCalledWith("group-1");
  });

  it("assigns an organizer", () => {
    const onAssignOrganizer = jest.fn();
    const { getByText } = renderWithProviders(
      <AssignOrganizerModal visible={true} onClose={jest.fn()} group={group} users={users} onAssignOrganizer={onAssignOrganizer} isAssigning={false} />,
    );

    fireEvent.press(getByText("Jane Doe"));
    fireEvent.press(getByText("Assign"));

    expect(onAssignOrganizer).toHaveBeenCalledWith("group-1", "user-1");
  });
});
