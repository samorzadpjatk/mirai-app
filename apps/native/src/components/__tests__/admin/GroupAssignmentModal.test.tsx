import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { GroupAssignmentModal } from "../../admin/groups/GroupAssignmentModal";

jest.mock("~/components/common/ui", () => ({
  AppModalShell: ({ children, visible, title, onClose }: any) => {
    const { Text, TouchableOpacity, View } = require("react-native");
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
}));

describe("GroupAssignmentModal", () => {
  const groups = [
    { id: "group-1", name: "Group One" },
    { id: "group-2", name: "Group Two" },
  ] as any;

  const user = {
    id: "user-1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    group: { name: "Current Group" },
  } as any;

  const onClose = jest.fn();
  const onAssign = jest.fn().mockResolvedValue({ id: "assignment-1" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders modal content", () => {
    const { getByText } = renderWithProviders(
      <GroupAssignmentModal visible onClose={onClose} user={user} groups={groups} onAssign={onAssign} />
    );

    expect(getByText("Assign to Group")).toBeTruthy();
    expect(getByText("John Doe")).toBeTruthy();
    expect(getByText("Current: Current Group")).toBeTruthy();
  });

  it("assigns selected group", async () => {
    const { getByText } = renderWithProviders(
      <GroupAssignmentModal visible onClose={onClose} user={user} groups={groups} onAssign={onAssign} />
    );

    fireEvent.press(getByText("Group Two"));
    fireEvent.press(getByText("Assign"));

    await waitFor(() => expect(onAssign).toHaveBeenCalledWith("user-1", "group-2"));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when cancel is pressed", () => {
    const { getByText } = renderWithProviders(
      <GroupAssignmentModal visible onClose={onClose} user={user} groups={groups} onAssign={onAssign} />
    );

    fireEvent.press(getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
