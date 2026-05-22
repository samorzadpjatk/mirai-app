import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CreateUserModal } from "../../admin/users/CreateUserModal";

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
