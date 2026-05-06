import React from "react";
import { TextInput } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { EditGroupFormFields } from "../../../../trips/groups/edit/EditGroupFormFields";

describe("EditGroupFormFields", () => {
  it("should render group name label", () => {
    const { getByText } = renderWithProviders(
      <EditGroupFormFields groupName="" onChangeName={jest.fn()} />
    );

    expect(getByText("Group Name")).toBeTruthy();
  });

  it("should render with empty group name", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupFormFields groupName="" onChangeName={jest.fn()} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe("");
  });

  it("should render with provided group name", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupFormFields groupName="Existing Group" onChangeName={jest.fn()} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe("Existing Group");
  });

  it("should call onChangeName when text changes", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupFormFields groupName="" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, "Updated Group Name");

    expect(onChangeName).toHaveBeenCalledWith("Updated Group Name");
    expect(onChangeName).toHaveBeenCalledTimes(1);
  });

  it("should update value when groupName prop changes", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType, rerender } = renderWithProviders(
      <EditGroupFormFields groupName="Old Name" onChangeName={onChangeName} />
    );

    let input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe("Old Name");

    rerender(
      <EditGroupFormFields groupName="New Name" onChangeName={onChangeName} />
    );

    input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe("New Name");
  });

  it("should have correct placeholder text", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupFormFields groupName="" onChangeName={jest.fn()} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.placeholder).toBe("Enter group name");
  });

  it("should handle special characters in group name", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupFormFields groupName="" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    const specialName = "Group @#$%^&*()_+-=[]{}|;':\",./<>?";
    fireEvent.changeText(input, specialName);

    expect(onChangeName).toHaveBeenCalledWith(specialName);
  });

  it("should handle unicode characters in group name", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupFormFields groupName="" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    const unicodeName = "Grupa Testowa 🎉 日本語";
    fireEvent.changeText(input, unicodeName);

    expect(onChangeName).toHaveBeenCalledWith(unicodeName);
  });

  it("should handle very long group names", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupFormFields groupName="" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    const longName = "A".repeat(200);
    fireEvent.changeText(input, longName);

    expect(onChangeName).toHaveBeenCalledWith(longName);
  });

  it("should handle empty string input", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupFormFields groupName="Existing Name" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, "");

    expect(onChangeName).toHaveBeenCalledWith("");
  });

  it("should handle whitespace-only input correctly", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupFormFields groupName="" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, "   ");

    expect(onChangeName).toHaveBeenCalledWith("   ");
  });

  it("should maintain focus state during editing", () => {
    const onChangeName = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupFormFields groupName="Initial" onChangeName={onChangeName} />
    );

    const input = UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, "A");
    fireEvent.changeText(input, "AB");
    fireEvent.changeText(input, "ABC");

    expect(onChangeName).toHaveBeenCalledTimes(3);
    expect(onChangeName).toHaveBeenLastCalledWith("ABC");
  });
});
