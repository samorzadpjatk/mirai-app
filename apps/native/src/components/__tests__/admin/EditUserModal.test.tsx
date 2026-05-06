import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { EditUserModal } from "../../admin/users/EditUserModal";

const mockOnSave = jest.fn();
const mockOnDelete = jest.fn();
const mockOnBan = jest.fn();

jest.mock("../../admin/AdminModal", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    AdminModal: ({ children, visible, title, onClose, actions }: {
      children: React.ReactNode;
      visible: boolean;
      title: string;
      onClose: () => void;
      actions?: React.ReactNode;
    }) => visible ? (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
        {children}
        {actions}
      </View>
    ) : null,
    AdminModalButton: ({ title, onPress, disabled, loading }: {
      title: string;
      onPress: () => void;
      disabled?: boolean;
      loading?: boolean;
    }) => (
      <TouchableOpacity onPress={onPress} disabled={(disabled ?? false) || (loading ?? false)}><Text>{loading ? "Loading..." : title}</Text></TouchableOpacity>
    ),
  };
});

jest.mock("~/components/common/ui", () => {
  const { View, Text, TextInput } = require("react-native");
  return {
    FormField: ({ children, label, required }: {
      children: React.ReactNode;
      label: string;
      required?: boolean;
    }) => (<View><Text>{label}{required ? "*" : ""}</Text>{children}</View>),
    ThemedTextInput: ({ value, onChangeText, placeholder, keyboardType, multiline }: {
      value: string;
      onChangeText: (text: string) => void;
      placeholder?: string;
      keyboardType?: string;
      multiline?: boolean;
    }) => (<TextInput value={value} placeholder={placeholder} keyboardType={keyboardType} multiline={multiline} onChangeText={onChangeText} />),
    DateTimePickerModal: () => null,
  };
});

describe("EditUserModal", () => {
  const mockUser = { id: "user-1", firstName: "John", lastName: "Doe", email: "john@example.com", role: "USER" as const, wristNumber: 123, houseNumber: 456, isBanned: false, bannedUntil: null, groupId: "group-1" };
  beforeEach(() => { jest.clearAllMocks(); });

  it("renders the edit user modal", () => {
    const { getByDisplayValue } = renderWithProviders(
      <EditUserModal visible={true} user={mockUser} onClose={jest.fn()} onSave={mockOnSave} onDelete={mockOnDelete} onBan={mockOnBan} isSaving={false} isDeleting={false} isBanning={false} />
    );

    expect(getByDisplayValue("John")).toBeTruthy();
    expect(getByDisplayValue("Doe")).toBeTruthy();
  });

  it("calls onClose from the footer", () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(
      <EditUserModal visible={true} user={mockUser} onClose={onClose} onSave={mockOnSave} onDelete={mockOnDelete} onBan={mockOnBan} isSaving={false} isDeleting={false} isBanning={false} />
    );

    fireEvent.press(getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onSave with edited values", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <EditUserModal visible={true} user={mockUser} onClose={jest.fn()} onSave={mockOnSave} onDelete={mockOnDelete} onBan={mockOnBan} isSaving={false} isDeleting={false} isBanning={false} />
    );

    fireEvent.changeText(getByPlaceholderText("Enter first name..."), "Jane");
    fireEvent.press(getByText("Save"));

    expect(mockOnSave).toHaveBeenCalledWith("user-1", "Jane", "Doe", "123", "456");
  });
});
