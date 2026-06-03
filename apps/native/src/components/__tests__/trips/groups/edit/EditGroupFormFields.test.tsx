import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { EditGroupFormFields } from "../../../../trips/groups/edit/EditGroupFormFields";

describe("EditGroupFormFields", () => {
  it("should render group name label", () => {
    renderWithProviders(<EditGroupFormFields groupName="" onChangeName={jest.fn()} />);

    expect(screen.getByText("Group Name")).toBeOnTheScreen();
  });

  it("should render with empty group name", () => {
    renderWithProviders(<EditGroupFormFields groupName="" onChangeName={jest.fn()} />);

    const input = screen.getByPlaceholderText("Enter group name");
    expect((input.props as { value: string }).value).toBe("");
  });

  it("should render with provided group name", () => {
    renderWithProviders(
      <EditGroupFormFields groupName="Existing Group" onChangeName={jest.fn()} />,
    );

    const input = screen.getByPlaceholderText("Enter group name");
    expect((input.props as { value: string }).value).toBe("Existing Group");
  });

  it("should call onChangeName when text changes", () => {
    const onChangeName = jest.fn();
    renderWithProviders(<EditGroupFormFields groupName="" onChangeName={onChangeName} />);

    const input = screen.getByPlaceholderText("Enter group name");
    fireEvent.changeText(input, "Updated Group Name");

    expect(onChangeName).toHaveBeenCalledWith("Updated Group Name");
    expect(onChangeName).toHaveBeenCalledTimes(1);
  });

  it("should update value when groupName prop changes", () => {
    const onChangeName = jest.fn();
    const view = renderWithProviders(
      <EditGroupFormFields groupName="Old Name" onChangeName={onChangeName} />,
    );

    let input = screen.getByPlaceholderText("Enter group name");
    expect((input.props as { value: string }).value).toBe("Old Name");

    view.rerender(<EditGroupFormFields groupName="New Name" onChangeName={onChangeName} />);

    input = screen.getByPlaceholderText("Enter group name");
    expect((input.props as { value: string }).value).toBe("New Name");
  });

  it("should have correct placeholder text", () => {
    renderWithProviders(<EditGroupFormFields groupName="" onChangeName={jest.fn()} />);

    const input = screen.getByPlaceholderText("Enter group name");
    expect(input).toBeTruthy();
  });

  it("should handle special characters in group name", () => {
    const onChangeName = jest.fn();
    renderWithProviders(<EditGroupFormFields groupName="" onChangeName={onChangeName} />);

    const input = screen.getByPlaceholderText("Enter group name");
    const specialName = "Group @#$%^&*()_+-=[]{}|;':\",./<>?";
    fireEvent.changeText(input, specialName);

    expect(onChangeName).toHaveBeenCalledWith(specialName);
  });

  it("should handle unicode characters in group name", () => {
    const onChangeName = jest.fn();
    renderWithProviders(<EditGroupFormFields groupName="" onChangeName={onChangeName} />);

    const input = screen.getByPlaceholderText("Enter group name");
    const unicodeName = "Grupa Testowa 🎉 日本語";
    fireEvent.changeText(input, unicodeName);

    expect(onChangeName).toHaveBeenCalledWith(unicodeName);
  });

  it("should handle very long group names", () => {
    const onChangeName = jest.fn();
    renderWithProviders(<EditGroupFormFields groupName="" onChangeName={onChangeName} />);

    const input = screen.getByPlaceholderText("Enter group name");
    const longName = "A".repeat(200);
    fireEvent.changeText(input, longName);

    expect(onChangeName).toHaveBeenCalledWith(longName);
  });

  it("should handle empty string input", () => {
    const onChangeName = jest.fn();
    renderWithProviders(
      <EditGroupFormFields groupName="Existing Name" onChangeName={onChangeName} />,
    );

    const input = screen.getByPlaceholderText("Enter group name");
    fireEvent.changeText(input, "");

    expect(onChangeName).toHaveBeenCalledWith("");
  });

  it("should handle whitespace-only input correctly", () => {
    const onChangeName = jest.fn();
    renderWithProviders(<EditGroupFormFields groupName="" onChangeName={onChangeName} />);

    const input = screen.getByPlaceholderText("Enter group name");
    fireEvent.changeText(input, "   ");

    expect(onChangeName).toHaveBeenCalledWith("   ");
  });

  it("should maintain focus state during editing", () => {
    const onChangeName = jest.fn();
    renderWithProviders(<EditGroupFormFields groupName="Initial" onChangeName={onChangeName} />);

    const input = screen.getByPlaceholderText("Enter group name");
    fireEvent.changeText(input, "A");
    fireEvent.changeText(input, "AB");
    fireEvent.changeText(input, "ABC");

    expect(onChangeName).toHaveBeenCalledTimes(3);
    expect(onChangeName).toHaveBeenLastCalledWith("ABC");
  });
});
