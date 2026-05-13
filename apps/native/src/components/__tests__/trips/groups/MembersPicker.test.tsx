import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { MembersPicker } from "../../../trips/groups/create/MembersPicker";

interface ParticipantUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

interface Participant {
  user: ParticipantUser;
}

describe("MembersPicker", () => {
  const mockParticipants: Participant[] = [
    {
      user: {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      },
    },
    {
      user: {
        id: "2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
      },
    },
    {
      user: {
        id: "3",
        firstName: "Bob",
        lastName: null,
        email: "bob@example.com",
      },
    },
  ];

  const mockOnToggleMember = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all participant names", () => {
    renderWithProviders(
      <MembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />,
    );
    expect(screen.getByText("John Doe")).toBeOnTheScreen();
    expect(screen.getByText("Jane Smith")).toBeOnTheScreen();
    expect(screen.getByText("Bob")).toBeOnTheScreen();
  });

  it("should render all participant emails", () => {
    renderWithProviders(
      <MembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />,
    );
    expect(screen.getByText("john@example.com")).toBeOnTheScreen();
    expect(screen.getByText("jane@example.com")).toBeOnTheScreen();
    expect(screen.getByText("bob@example.com")).toBeOnTheScreen();
  });

  it("should render initials for each participant", () => {
    renderWithProviders(
      <MembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />,
    );
    expect(screen.getByText("JD")).toBeOnTheScreen();
    expect(screen.getByText("JS")).toBeOnTheScreen();
    expect(screen.getByText("B")).toBeOnTheScreen();
  });

  it("should render ActivityIndicator when isLoading is true", () => {
    renderWithProviders(
      <MembersPicker
        participants={[]}
        selectedMembers={new Set()}
        isLoading={true}
        onToggleMember={mockOnToggleMember}
      />,
    );
    const activityIndicator = screen.getByTestId("activity-indicator");
    expect(activityIndicator).toBeOnTheScreen();
  });

  it("should call onToggleMember when a member is pressed", () => {
    renderWithProviders(
      <MembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />,
    );
    const pressableElements = screen.getAllByTestId(/checkbox-/);
    const firstPressableElement = pressableElements[0];
    expect(firstPressableElement).toBeDefined();
    fireEvent.press(firstPressableElement!);
    expect(mockOnToggleMember).toHaveBeenCalled();
  });

  it("should show selected checkbox for selected members", () => {
    const selectedMembers = new Set(["1"]);
    renderWithProviders(
      <MembersPicker
        participants={mockParticipants}
        selectedMembers={selectedMembers}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />,
    );
    const checkboxes = screen.getAllByTestId(/checkbox-/);
    expect(checkboxes.length).toBeGreaterThan(0);
    const selectedCheckbox = screen.getByTestId("checkbox-inner-1");
    expect(selectedCheckbox).toBeOnTheScreen();
  });

  it("should render empty state when no participants", () => {
    renderWithProviders(
      <MembersPicker
        participants={[]}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />,
    );
    expect(screen.getByText("No participants found")).toBeOnTheScreen();
  });

  it("should handle participant with null first and last name", () => {
    const participantsWithNullNames = [
      {
        user: {
          id: "4",
          firstName: null,
          lastName: null,
          email: "unknown@example.com",
        },
      },
    ];
    renderWithProviders(
      <MembersPicker
        participants={participantsWithNullNames}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />,
    );
    expect(screen.getByText("?")).toBeOnTheScreen();
    expect(screen.getByText("unknown@example.com")).toBeOnTheScreen();
  });

  it("should handle single participant", () => {
    const singleParticipant = [mockParticipants[0]!];
    renderWithProviders(
      <MembersPicker
        participants={singleParticipant}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />,
    );
    expect(screen.getByText("John Doe")).toBeOnTheScreen();
  });
});
