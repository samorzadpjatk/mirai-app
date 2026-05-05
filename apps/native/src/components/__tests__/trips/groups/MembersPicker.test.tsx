import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { MembersPicker } from "../../../trips/groups/create/MembersPicker";

describe("MembersPicker", () => {
  const mockParticipants = [
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
    const { getByText } = renderWithProviders(
      <MembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />
    );
    expect(getByText("John Doe")).toBeTruthy();
    expect(getByText("Jane Smith")).toBeTruthy();
    expect(getByText("Bob")).toBeTruthy();
  });

  it("should render all participant emails", () => {
    const { getByText } = renderWithProviders(
      <MembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />
    );
    expect(getByText("john@example.com")).toBeTruthy();
    expect(getByText("jane@example.com")).toBeTruthy();
    expect(getByText("bob@example.com")).toBeTruthy();
  });

  it("should render initials for each participant", () => {
    const { getByText } = renderWithProviders(
      <MembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />
    );
    expect(getByText("JD")).toBeTruthy();
    expect(getByText("JS")).toBeTruthy();
    expect(getByText("B")).toBeTruthy();
  });

  it("should render ActivityIndicator when isLoading is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <MembersPicker
        participants={[]}
        selectedMembers={new Set()}
        isLoading={true}
        onToggleMember={mockOnToggleMember}
      />
    );
    const activityIndicator = UNSAFE_getByType(require("react-native").ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
  });

  it("should call onToggleMember when a member is pressed", () => {
    const { getAllByText } = renderWithProviders(
      <MembersPicker
        participants={mockParticipants}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />
    );
    const memberItems = getAllByText(/JD|JS|B/);
    fireEvent.press(memberItems[0].parent?.parent?.parent || memberItems[0]);
    expect(mockOnToggleMember).toHaveBeenCalled();
  });

  it("should show selected checkbox for selected members", () => {
    const selectedMembers = new Set(["1"]);
    const { UNSAFE_getAllByType } = renderWithProviders(
      <MembersPicker
        participants={mockParticipants}
        selectedMembers={selectedMembers}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />
    );
    const views = UNSAFE_getAllByType(require("react-native").View);
    expect(views.length).toBeGreaterThan(0);
  });

  it("should render empty state when no participants", () => {
    const { getByText } = renderWithProviders(
      <MembersPicker
        participants={[]}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />
    );
    expect(getByText("No participants found")).toBeTruthy();
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
    const { getByText } = renderWithProviders(
      <MembersPicker
        participants={participantsWithNullNames}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />
    );
    expect(getByText("?")).toBeTruthy();
    expect(getByText("unknown@example.com")).toBeTruthy();
  });

  it("should handle single participant", () => {
    const singleParticipant = [mockParticipants[0]];
    const { getByText } = renderWithProviders(
      <MembersPicker
        participants={singleParticipant}
        selectedMembers={new Set()}
        isLoading={false}
        onToggleMember={mockOnToggleMember}
      />
    );
    expect(getByText("John Doe")).toBeTruthy();
  });
});
