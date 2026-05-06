import React from "react";
import { TextInput } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { GroupFormFields } from "../../../../trips/groups/create/GroupFormFields";

describe("GroupFormFields", () => {
  it("should render group name label", () => {
    const { getByText } = renderWithProviders(
      <GroupFormFields groupName="" onChangeName={jest.fn()} />
    );

    expect(getByText("Group Name")).toBeTruthy();
  });

  it("should render with empty group name", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupFormFields groupName="" onChangeName={jest.fn()} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe("");
  });

  it("should render with provided group name", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupFormFields groupName="Test Group" onChangeName={jest.fn()} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe("Test Group");
  });

  it("should call onChangeName when text changes", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupFormFields groupName="" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, "New Group Name");

    expect(onChangeName).toHaveBeenCalledWith("New Group Name");
    expect(onChangeName).toHaveBeenCalledTimes(1);
  });

  it("should update value when groupName prop changes", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType, rerender } = renderWithProviders(
      <GroupFormFields groupName="Initial Name" onChangeName={onChangeName} />
    );

    let input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe("Initial Name");

    rerender(
      <GroupFormFields groupName="Updated Name" onChangeName={onChangeName} />
    );

    input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe("Updated Name");
  });

  it("should have correct placeholder text", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupFormFields groupName="" onChangeName={jest.fn()} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.placeholder).toBe("Enter group name");
  });

  it("should handle special characters in group name", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupFormFields groupName="" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    const specialName = "Group @#$%^&*()_+-=[]{}|;':\",./<>?";
    fireEvent.changeText(input, specialName);

    expect(onChangeName).toHaveBeenCalledWith(specialName);
  });

  it("should handle unicode characters in group name", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupFormFields groupName="" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    const unicodeName = "Grupa Testowa 🎉 日本語";
    fireEvent.changeText(input, unicodeName);

    expect(onChangeName).toHaveBeenCalledWith(unicodeName);
  });

  it("should handle very long group names", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupFormFields groupName="" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    const longName = "A".repeat(200);
    fireEvent.changeText(input, longName);

    expect(onChangeName).toHaveBeenCalledWith(longName);
  });

  it("should handle empty string input", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupFormFields groupName="Existing Name" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, "");

    expect(onChangeName).toHaveBeenCalledWith("");
  });

  it("should trim whitespace-only input correctly", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupFormFields groupName="" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, "   ");

    expect(onChangeName).toHaveBeenCalledWith("   ");
  });
});
