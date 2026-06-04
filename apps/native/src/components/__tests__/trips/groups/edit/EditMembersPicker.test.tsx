import { fireEvent, screen } from "@testing-library/react-native";
import { ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { EditMembersPicker } from "../../../../trips/groups/edit/EditMembersPicker";
import { renderWithProviders } from "../../../helpers/renderWithProviders";

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
    renderWithProviders(
      <EditMembersPicker
        participants={[]}
        selectedMembers={new Set()}
        isLoading={true}
        onToggleMember={jest.fn()}
      />,
    );

    expect(screen.getByTestId("edit-members-picker-indicator")).toBeTruthy();
  });

  it("should render participants list when not loading", () => {
    renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />,
    );

    expect(screen.getByText("John Doe")).toBeOnTheScreen();
    expect(screen.getByText("Jane Smith")).toBeOnTheScreen();
    expect(screen.getByText("Bob Johnson")).toBeOnTheScreen();
  });

  it("should render participant emails", () => {
    renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />,
    );

    expect(screen.getByText("john@example.com")).toBeOnTheScreen();
    expect(screen.getByText("jane@example.com")).toBeOnTheScreen();
    expect(screen.getByText("bob@example.com")).toBeOnTheScreen();
  });

  it("should show empty state when no participants", () => {
    renderWithProviders(
      <EditMembersPicker
        participants={[]}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />,
    );

    expect(screen.getByText("No participants found")).toBeOnTheScreen();
  });

  it("should call onToggleMember when a participant is pressed", () => {
    const onToggleMember = jest.fn();
    renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={onToggleMember}
      />,
    );

    fireEvent.press(screen.getByText("John Doe"));
    expect(onToggleMember).toHaveBeenCalledWith("user-1");
    expect(onToggleMember).toHaveBeenCalledTimes(1);
  });

  it("should show selected state for selected members", () => {
    const selectedMembers = new Set(["user-1", "user-3"]);
    renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={selectedMembers}
        isLoading={false}
        onToggleMember={jest.fn()}
      />,
    );

    expect(screen.getByTestId("member-item-user-1")).toBeTruthy();
    expect(screen.getByTestId("member-item-user-2")).toBeTruthy();
    expect(screen.getByTestId("member-item-user-3")).toBeTruthy();
  });

  it("should disable organizer from being toggled", () => {
    const onToggleMember = jest.fn();
    renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        organizerId="user-1"
        onToggleMember={onToggleMember}
      />,
    );

    expect(screen.getByText("john@example.com (Organizer)")).toBeOnTheScreen();
  });

  it("should not call onToggleMember when organizer is pressed", () => {
    const onToggleMember = jest.fn();
    renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        organizerId="user-1"
        onToggleMember={onToggleMember}
      />,
    );

    const organizerTouchable = screen.getByTestId("member-item-user-1");
    expect(organizerTouchable).toBeDisabled();
  });

  it("should display initials for participants", () => {
    renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />,
    );

    expect(screen.getByText("JD")).toBeOnTheScreen();
    expect(screen.getByText("JS")).toBeOnTheScreen();
    expect(screen.getByText("BJ")).toBeOnTheScreen();
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

    renderWithProviders(
      <EditMembersPicker
        participants={participantsWithNoNames}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />,
    );

    expect(screen.getByText("?")).toBeOnTheScreen();
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

    renderWithProviders(
      <EditMembersPicker
        participants={participantsWithSingleName}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />,
    );

    expect(screen.getByText("A")).toBeOnTheScreen();
  });

  it("should allow toggling multiple members", () => {
    const onToggleMember = jest.fn();
    renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={onToggleMember}
      />,
    );

    fireEvent.press(screen.getByText("John Doe"));
    fireEvent.press(screen.getByText("Jane Smith"));
    fireEvent.press(screen.getByText("Bob Johnson"));

    expect(onToggleMember).toHaveBeenCalledTimes(3);
    expect(onToggleMember).toHaveBeenNthCalledWith(1, "user-1");
    expect(onToggleMember).toHaveBeenNthCalledWith(2, "user-2");
    expect(onToggleMember).toHaveBeenNthCalledWith(3, "user-3");
  });

  it("should handle rapid toggling of same member", () => {
    const onToggleMember = jest.fn();
    renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={onToggleMember}
      />,
    );

    fireEvent.press(screen.getByText("John Doe"));
    fireEvent.press(screen.getByText("John Doe"));
    fireEvent.press(screen.getByText("John Doe"));

    expect(onToggleMember).toHaveBeenCalledTimes(3);
    expect(onToggleMember).toHaveBeenNthCalledWith(1, "user-1");
    expect(onToggleMember).toHaveBeenNthCalledWith(2, "user-1");
    expect(onToggleMember).toHaveBeenNthCalledWith(3, "user-1");
  });

  it("should render ScrollView for participant list", () => {
    renderWithProviders(
      <EditMembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />,
    );

    expect(screen.getByTestId("edit-members-picker-scroll")).toBeTruthy();
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

    renderWithProviders(
      <EditMembersPicker
        participants={participantsWithUndefined}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={jest.fn()}
      />,
    );

    expect(screen.getByText("?")).toBeOnTheScreen();
    expect(screen.getByText("undefined@example.com")).toBeOnTheScreen();
  });
});
