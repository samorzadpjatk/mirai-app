import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CreateUserModal } from "../../admin/users/CreateUserModal";
import { Text, TouchableOpacity, View, TextInput } from "react-native";

interface AppModalShellProps {
  children: React.ReactNode;
  visible: boolean;
  title: string;
  onClose: () => void;
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}

interface ThemedTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

jest.mock("~/components/common/ui", () => ({
  AppModalShell: ({ children, visible, title, onClose }: AppModalShellProps) => {
    if (!visible) return null;
    return (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
        {children}
      </View>
    );
  },
  FormField: ({ children, label, required }: FormFieldProps) => {
    return (
      <View>
        <Text>{required ? `${label}*` : label}</Text>
        {children}
      </View>
    );
  },
  ThemedTextInput: ({ value, onChangeText, placeholder }: ThemedTextInputProps) => {
    return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} />;
  },
}));

describe("CreateUserModal", () => {
  const onClose = jest.fn();
  const onCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a user with trimmed values", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <CreateUserModal visible onClose={onClose} onCreate={onCreate} isCreating={false} />
    );

    fireEvent.changeText(getByPlaceholderText("Enter first name..."), "  Jane  ");
    fireEvent.changeText(getByPlaceholderText("Enter last name..."), "  Smith  ");
    fireEvent.changeText(getByPlaceholderText("Enter email..."), "  jane@example.com  ");
    fireEvent.press(getByText("Create"));

    expect(onCreate).toHaveBeenCalledWith({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
    });
  });

  it("resets fields when cancelled", () => {
    const { getByPlaceholderText, getByText, rerender } = renderWithProviders(
      <CreateUserModal visible onClose={onClose} onCreate={onCreate} isCreating={false} />
    );

    fireEvent.changeText(getByPlaceholderText("Enter first name..."), "Jane");
    fireEvent.press(getByText("Cancel"));

    rerender(<CreateUserModal visible onClose={onClose} onCreate={onCreate} isCreating={false} />);

    expect(getByPlaceholderText("Enter first name...").props.value).toBe("");
  });

  it("does not create when fields are empty", () => {
    const { getByText } = renderWithProviders(
      <CreateUserModal visible onClose={onClose} onCreate={onCreate} isCreating={false} />
    );

    fireEvent.press(getByText("Create"));
    expect(onCreate).not.toHaveBeenCalled();
  });
});
