import React, { type ReactNode } from "react";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CreateUserModal } from "../../admin/users/CreateUserModal";

jest.mock("~/components/common/ui", () => {
  const { Text, TouchableOpacity, View, TextInput } = require("react-native");

  return {
    AppModalShell: ({
      children,
      visible,
      title,
      onClose,
    }: {
      children: ReactNode;
      visible: boolean;
      title: string;
      onClose: () => void;
    }) => {
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
    FormField: ({
      children,
      label,
      required,
    }: {
      children: ReactNode;
      label: string;
      required?: boolean;
    }) => {
      return (
        <View>
          <Text>{required ? `${label}*` : label}</Text>
          {children}
        </View>
      );
    },
    ThemedTextInput: ({
      value,
      onChangeText,
      placeholder,
    }: {
      value: string;
      onChangeText: (text: string) => void;
      placeholder?: string;
    }) => {
      return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} />;
    },
  };
});

describe("CreateUserModal", () => {
  const onClose = jest.fn();
  const onCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a user with trimmed values", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateUserModal visible onClose={onClose} onCreate={onCreate} isCreating={false} />,
    );

    await user.type(screen.getByPlaceholderText("Enter first name..."), "  Jane  ");
    await user.type(screen.getByPlaceholderText("Enter last name..."), "  Smith  ");
    await user.type(screen.getByPlaceholderText("Enter email..."), "  jane@example.com  ");
    await user.press(screen.getByText("Create"));

    expect(onCreate).toHaveBeenCalledWith({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
    });
  });

  it("resets fields when cancelled", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <CreateUserModal visible onClose={onClose} onCreate={onCreate} isCreating={false} />,
    );

    await user.type(screen.getByPlaceholderText("Enter first name..."), "Jane");
    await user.press(screen.getByText("Cancel"));

    rerender(<CreateUserModal visible onClose={onClose} onCreate={onCreate} isCreating={false} />);

    expect(screen.getByPlaceholderText("Enter first name...").props.value).toBe("");
  });

  it("does not create when fields are empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateUserModal visible onClose={onClose} onCreate={onCreate} isCreating={false} />,
    );

    await user.press(screen.getByText("Create"));
    expect(onCreate).not.toHaveBeenCalled();
  });
});
