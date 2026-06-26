import { fireEvent } from "@testing-library/react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { EditUserModal } from "../../../admin/users/EditUserModal";
import { renderWithProviders } from "../../helpers/renderWithProviders";

jest.mock("~/components/common/ui/DateTimePickerModal", () => {
  const { Pressable, Text } = require("react-native");
  return {
    DateTimePickerModal: ({
      onConfirm,
      visible,
    }: {
      onConfirm?: (date: Date) => void;
      visible?: boolean;
    }) =>
      visible ? (
        <Pressable testID="date-picker-confirm" onPress={() => onConfirm?.(new Date("2099-01-01"))}>
          <Text>Confirm Date</Text>
        </Pressable>
      ) : null,
  };
});

jest.mock("~/components/admin/AdminModal", () => {
  const { View, TouchableOpacity, Text } = require("react-native");
  return {
    AdminModal: ({
      children,
      actions,
      visible,
    }: {
      children?: React.ReactNode;
      actions?: React.ReactNode;
      visible?: boolean;
    }) =>
      visible ? (
        <View testID="admin-modal">
          {children}
          <View testID="modal-actions">{actions}</View>
        </View>
      ) : null,
    AdminModalButton: ({
      title,
      onPress,
      disabled,
    }: {
      title?: string;
      onPress?: () => void;
      disabled?: boolean;
    }) => (
      <TouchableOpacity testID={`modal-button-${title}`} onPress={onPress} disabled={disabled}>
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
  };
});

describe("EditUserModal", () => {
  const mockUser = {
    id: "user-1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "USER" as const,
    wristNumber: "123",
    houseNumber: "456",
    tripId: "trip-1",
  };

  it("should render with user data", () => {
    const { getByText, getByTestId } = renderWithProviders(
      <EditUserModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSave={jest.fn()}
        onDelete={jest.fn()}
        onBan={jest.fn()}
        isSaving={false}
        isDeleting={false}
        isBanning={false}
      />,
    );

    expect(getByTestId("admin-modal")).toBeTruthy();
    expect(getByText("John Doe")).toBeTruthy();
    expect(getByText("john@example.com")).toBeTruthy();
  });

  it("should not render when not visible", () => {
    const { queryByTestId } = renderWithProviders(
      <EditUserModal
        visible={false}
        user={mockUser}
        onClose={jest.fn()}
        onSave={jest.fn()}
        onDelete={jest.fn()}
        onBan={jest.fn()}
        isSaving={false}
        isDeleting={false}
        isBanning={false}
      />,
    );

    expect(queryByTestId("admin-modal")).toBeNull();
  });

  it("should call onSave when save button pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = renderWithProviders(
      <EditUserModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSave={onSave}
        onDelete={jest.fn()}
        onBan={jest.fn()}
        isSaving={false}
        isDeleting={false}
        isBanning={false}
      />,
    );

    fireEvent.press(getByTestId("modal-button-Save"));
    expect(onSave).toHaveBeenCalledWith("user-1", "John", "Doe", "123", "456");
  });

  it("should not call onSave when no user", () => {
    const onSave = jest.fn();
    const { getByTestId } = renderWithProviders(
      <EditUserModal
        visible={true}
        user={null}
        onClose={jest.fn()}
        onSave={onSave}
        onDelete={jest.fn()}
        onBan={jest.fn()}
        isSaving={false}
        isDeleting={false}
        isBanning={false}
      />,
    );

    fireEvent.press(getByTestId("modal-button-Save"));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("should call onDelete when delete button pressed", () => {
    const onDelete = jest.fn();
    const { getByText } = renderWithProviders(
      <EditUserModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSave={jest.fn()}
        onDelete={onDelete}
        onBan={jest.fn()}
        isSaving={false}
        isDeleting={false}
        isBanning={false}
      />,
    );

    fireEvent.press(getByText("Delete user"));
    expect(onDelete).toHaveBeenCalledWith("user-1");
  });

  it("should call onBan when ban button pressed with date", () => {
    const onBan = jest.fn();
    const { getByText, getByPlaceholderText, getByTestId } = renderWithProviders(
      <EditUserModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSave={jest.fn()}
        onDelete={jest.fn()}
        onBan={onBan}
        isSaving={false}
        isDeleting={false}
        isBanning={false}
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Optional reason for the ban"), "Spam");
    fireEvent.press(getByText("Select date & time"));
    fireEvent.press(getByTestId("date-picker-confirm"));
    fireEvent.press(getByText("Ban user"));
    expect(onBan).toHaveBeenCalled();
  });

  it("should not call onBan when no ban date", () => {
    const onBan = jest.fn();
    const { getByText } = renderWithProviders(
      <EditUserModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSave={jest.fn()}
        onDelete={jest.fn()}
        onBan={onBan}
        isSaving={false}
        isDeleting={false}
        isBanning={false}
      />,
    );

    fireEvent.press(getByText("Ban user"));
    expect(onBan).not.toHaveBeenCalled();
  });

  it("should call onClose when cancel button pressed", () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithProviders(
      <EditUserModal
        visible={true}
        user={mockUser}
        onClose={onClose}
        onSave={jest.fn()}
        onDelete={jest.fn()}
        onBan={jest.fn()}
        isSaving={false}
        isDeleting={false}
        isBanning={false}
      />,
    );

    fireEvent.press(getByTestId("modal-button-Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
