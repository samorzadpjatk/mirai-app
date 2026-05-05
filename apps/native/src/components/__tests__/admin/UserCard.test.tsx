import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { UserCard } from "../../admin/users/UserCard";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => name,
}));

describe("UserCard", () => {
  const mockUser = {
    id: "user-1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "USER" as const,
    wristNumber: 123,
    houseNumber: 456,
    isBanned: false,
    bannedUntil: null,
    group: {
      id: "group-1",
      name: "Test Group",
    },
  };

  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders user full name", () => {
    const { getByText } = renderWithProviders(
      <UserCard user={mockUser} onEdit={mockOnEdit} />
    );

    expect(getByText("John Doe")).toBeTruthy();
  });

  it("renders user email", () => {
    const { getByText } = renderWithProviders(
      <UserCard user={mockUser} onEdit={mockOnEdit} />
    );

    expect(getByText("john@example.com")).toBeTruthy();
  });

  it("renders group name", () => {
    const { getByText } = renderWithProviders(
      <UserCard user={mockUser} onEdit={mockOnEdit} />
    );

    expect(getByText("Group: Test Group")).toBeTruthy();
  });

  it("renders wrist number", () => {
    const { getByText } = renderWithProviders(
      <UserCard user={mockUser} onEdit={mockOnEdit} />
    );

    expect(getByText("123")).toBeTruthy();
  });

  it("renders house number", () => {
    const { getByText } = renderWithProviders(
      <UserCard user={mockUser} onEdit={mockOnEdit} />
    );

    expect(getByText("456")).toBeTruthy();
  });

  it("calls onEdit when edit button is pressed", () => {
    const { getByText } = renderWithProviders(
      <UserCard user={mockUser} onEdit={mockOnEdit} />
    );

    fireEvent.press(getByText("Edit"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });

  it("renders admin badge when user is admin", () => {
    const adminUser = { ...mockUser, role: "ADMIN" as const };
    const { getByText } = renderWithProviders(
      <UserCard user={adminUser} onEdit={mockOnEdit} />
    );

    expect(getByText("Admin")).toBeTruthy();
  });

  it("does not render admin badge when user is not admin", () => {
    const { queryByText } = renderWithProviders(
      <UserCard user={mockUser} onEdit={mockOnEdit} />
    );

    expect(queryByText("Admin")).toBeNull();
  });

  it("renders banned status when user is banned", () => {
    const bannedUser = {
      ...mockUser,
      isBanned: true,
      bannedUntil: new Date(Date.now() + 86400000).toISOString(),
    };
    const { getByText } = renderWithProviders(
      <UserCard user={bannedUser} onEdit={mockOnEdit} />
    );

    expect(getByText(/Banned until/)).toBeTruthy();
  });

  it("does not render banned status when user is not banned", () => {
    const { queryByText } = renderWithProviders(
      <UserCard user={mockUser} onEdit={mockOnEdit} />
    );

    expect(queryByText(/Banned until/)).toBeNull();
  });

  it("renders user with only first name", () => {
    const userWithOnlyFirstName = { ...mockUser, lastName: null };
    const { getByText } = renderWithProviders(
      <UserCard user={userWithOnlyFirstName} onEdit={mockOnEdit} />
    );

    expect(getByText("John")).toBeTruthy();
  });

  it("renders user with only last name", () => {
    const userWithOnlyLastName = { ...mockUser, firstName: null };
    const { getByText } = renderWithProviders(
      <UserCard user={userWithOnlyLastName} onEdit={mockOnEdit} />
    );

    expect(getByText("Doe")).toBeTruthy();
  });

  it("renders user with no name using email", () => {
    const userWithNoName = { ...mockUser, firstName: null, lastName: null };
    const { getByText } = renderWithProviders(
      <UserCard user={userWithNoName} onEdit={mockOnEdit} />
    );

    expect(getByText("john@example.com")).toBeTruthy();
  });

  it("renders 'Not selected' when user has no group", () => {
    const userWithoutGroup = { ...mockUser, group: null };
    const { getByText } = renderWithProviders(
      <UserCard user={userWithoutGroup} onEdit={mockOnEdit} />
    );

    expect(getByText("Group: Not selected")).toBeTruthy();
  });

  it("renders em dash for missing wrist number", () => {
    const userWithoutWristNumber = { ...mockUser, wristNumber: null };
    const { getByText } = renderWithProviders(
      <UserCard user={userWithoutWristNumber} onEdit={mockOnEdit} />
    );

    expect(getByText("—")).toBeTruthy();
  });

  it("renders em dash for missing house number", () => {
    const userWithoutHouseNumber = { ...mockUser, houseNumber: null };
    const { getByText } = renderWithProviders(
      <UserCard user={userWithoutHouseNumber} onEdit={mockOnEdit} />
    );

    expect(getByText("—")).toBeTruthy();
  });

  it("renders with different wrist and house numbers", () => {
    const userWithDifferentNumbers = { ...mockUser, wristNumber: 999, houseNumber: 888 };
    const { getByText } = renderWithProviders(
      <UserCard user={userWithDifferentNumbers} onEdit={mockOnEdit} />
    );

    expect(getByText("999")).toBeTruthy();
    expect(getByText("888")).toBeTruthy();
  });
});
