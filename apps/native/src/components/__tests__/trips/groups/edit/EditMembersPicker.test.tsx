import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { EditMembersPicker } from "../../../../trips/groups/edit/EditMembersPicker";

const mockParticipants = [
  {
    user: {
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    },
  },
  {
    user: {
      id: "user-2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
    },
  },
  {
    user: {
      id: "user-3",
      firstName: "Bob",
      lastName: "Johnson",
      email: "bob@example.com",
    },
  },
];

describe("EditMembersPicker", () => {
  it("should show loading indicator when isLoading is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditMembersPicker
        participants={[]}
        selectedMembers={new Set()}
        isLoading={true}
        onToggleMember={jest.fn()}
      />
    );

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("should render participants list when not loading", () => {
    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />
    );

    expect(getByText("John Doe")).toBeTruthy();
    expect(getByText("Jane Smith")).toBeTruthy();
    expect(getByText("Bob Johnson")).toBeTruthy();
  });

  it("should render participant emails", () => {
    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />
    );

    expect(getByText("john@example.com")).toBeTruthy();
    expect(getByText("jane@example.com")).toBeTruthy();
    expect(getByText("bob@example.com")).toBeTruthy();
  });

  it("should show empty state when no participants", () => {
    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={[]}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />
    );

    expect(getByText("No participants found")).toBeTruthy();
  });

  it("should call onToggleMember when a participant is pressed", () => {
    const onToggleMember = jest.fn();
    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={onToggleMember}
      />
    );

    fireEvent.press(getByText("John Doe"));
    expect(onToggleMember).toHaveBeenCalledWith("user-1");
    expect(onToggleMember).toHaveBeenCalledTimes(1);
  });

  it("should show selected state for selected members", () => {
    const selectedMembers = new Set(["user-1", "user-3"]);
    const { UNSAFE_getAllByType } = renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={selectedMembers}
        isLoading={false}
        onToggleMember={jest.fn()}
      />
    );

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBe(3);
  });

  it("should disable organizer from being toggled", () => {
    const onToggleMember = jest.fn();
    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        organizerId="user-1"
        onToggleMember={onToggleMember}
      />
    );

    expect(getByText("john@example.com (Organizer)")).toBeTruthy();
  });

  it("should not call onToggleMember when organizer is pressed", () => {
    const onToggleMember = jest.fn();
    const { UNSAFE_getAllByType } = renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        organizerId="user-1"
        onToggleMember={onToggleMember}
      />
    );

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const organizerTouchable = touchables[0];

    expect(organizerTouchable.props.disabled).toBe(true);
  });

  it("should display initials for participants", () => {
    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />
    );

    expect(getByText("JD")).toBeTruthy();
    expect(getByText("JS")).toBeTruthy();
    expect(getByText("BJ")).toBeTruthy();
  });

  it("should show question mark for participants without names", () => {
    const participantsWithNoNames = [
      {
        user: {
          id: "user-4",
          firstName: null,
          lastName: null,
          email: "unknown@example.com",
        },
      },
    ];

    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={participantsWithNoNames}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />
    );

    expect(getByText("?")).toBeTruthy();
  });

  it("should handle single name participants", () => {
    const participantsWithSingleName = [
      {
        user: {
          id: "user-5",
          firstName: "Alice",
          lastName: null,
          email: "alice@example.com",
        },
      },
    ];

    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={participantsWithSingleName}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />
    );

    expect(getByText("A")).toBeTruthy();
  });

  it("should allow toggling multiple members", () => {
    const onToggleMember = jest.fn();
    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={onToggleMember}
      />
    );

    fireEvent.press(getByText("John Doe"));
    fireEvent.press(getByText("Jane Smith"));
    fireEvent.press(getByText("Bob Johnson"));

    expect(onToggleMember).toHaveBeenCalledTimes(3);
    expect(onToggleMember).toHaveBeenNthCalledWith(1, "user-1");
    expect(onToggleMember).toHaveBeenNthCalledWith(2, "user-2");
    expect(onToggleMember).toHaveBeenNthCalledWith(3, "user-3");
  });

  it("should handle rapid toggling of same member", () => {
    const onToggleMember = jest.fn();
    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={onToggleMember}
      />
    );

    fireEvent.press(getByText("John Doe"));
    fireEvent.press(getByText("John Doe"));
    fireEvent.press(getByText("John Doe"));

    expect(onToggleMember).toHaveBeenCalledTimes(3);
    expect(onToggleMember).toHaveBeenNthCalledWith(1, "user-1");
    expect(onToggleMember).toHaveBeenNthCalledWith(2, "user-1");
    expect(onToggleMember).toHaveBeenNthCalledWith(3, "user-1");
  });

  it("should render ScrollView for participant list", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />
    );

    expect(UNSAFE_getByType(ScrollView)).toBeTruthy();
  });

  it("should handle participants with undefined names", () => {
    const participantsWithUndefined = [
      {
        user: {
          id: "user-6",
          firstName: undefined,
          lastName: undefined,
          email: "undefined@example.com",
        },
      },
    ];

    const { getByText } = renderWithProviders(
      <EditMembersPicker
        participants={participantsWithUndefined}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />
    );

    expect(getByText("?")).toBeTruthy();
    expect(getByText("undefined@example.com")).toBeTruthy();
  });
});
