import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { GroupAssignmentModal } from "../../admin/groups/GroupAssignmentModal";
import type { Group, User } from "~/hooks/admin/useAdminUsers";

interface GroupAssignmentResult {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tripId: string;
  groupId: string | null;
  userId: string;
  wristNumber: string | null;
  houseNumber: string | null;
}

jest.mock("~/components/common/ui", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    AppModalShell: (props: { children: React.ReactNode; visible: boolean; title: string; onClose: () => void }) =>
      !props.visible ? null : (
        <View>
          <Text>{props.title}</Text>
          <TouchableOpacity onPress={props.onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
          {props.children}
        </View>
      ),
  };
});

describe("GroupAssignmentModal", () => {
  const groups: Group[] = [
    { id: "group-1", name: "Group One" },
    { id: "group-2", name: "Group Two" },
  ];

  const user: User = {
    id: "user-1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "ADMIN",
    tripId: "trip-1",
    group: { id: "group-current", name: "Current Group" },
  };

  const onClose = jest.fn();
  const onAssign = jest.fn((userId: string, groupId: string) =>
    Promise.resolve({
      id: "assignment-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      tripId: "trip-1",
      groupId,
      userId,
      wristNumber: null,
      houseNumber: null,
    } satisfies GroupAssignmentResult),
  );

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
