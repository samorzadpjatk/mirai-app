import { fireEvent, screen } from "@testing-library/react-native";
import { UserCard } from "../../admin/users/UserCard";
import { renderWithProviders } from "../helpers/renderWithProviders";

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
    wristNumber: "123",
    houseNumber: "456",
    isBanned: false,
    bannedUntil: undefined,
    tripId: "trip-1",
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
    renderWithProviders(<UserCard user={mockUser} onEdit={mockOnEdit} />);

    expect(screen.getByText("John Doe")).toBeTruthy();
  });

  it("renders user email", () => {
    renderWithProviders(<UserCard user={mockUser} onEdit={mockOnEdit} />);

    expect(screen.getByText("john@example.com")).toBeTruthy();
  });

  it("renders group name", () => {
    renderWithProviders(<UserCard user={mockUser} onEdit={mockOnEdit} />);

    expect(screen.getByText("Group: Test Group")).toBeTruthy();
  });

  it("renders wrist number", () => {
    renderWithProviders(<UserCard user={mockUser} onEdit={mockOnEdit} />);

    expect(screen.getByText("123")).toBeTruthy();
  });

  it("renders house number", () => {
    renderWithProviders(<UserCard user={mockUser} onEdit={mockOnEdit} />);

    expect(screen.getByText("456")).toBeTruthy();
  });

  it("calls onEdit when edit button is pressed", () => {
    renderWithProviders(<UserCard user={mockUser} onEdit={mockOnEdit} />);

    fireEvent.press(screen.getByText("Edit"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });

  it("renders admin badge when user is admin", () => {
    const adminUser = { ...mockUser, role: "ADMIN" as const };
    renderWithProviders(<UserCard user={adminUser} onEdit={mockOnEdit} />);

    expect(screen.getByText("Admin")).toBeTruthy();
  });

  it("does not render admin badge when user is not admin", () => {
    renderWithProviders(<UserCard user={mockUser} onEdit={mockOnEdit} />);

    expect(screen.queryByText("Admin")).toBeNull();
  });

  it("renders banned status when user is banned", () => {
    const bannedUser = {
      ...mockUser,
      isBanned: true,
      bannedUntil: new Date(Date.now() + 86400000).toISOString(),
    };
    renderWithProviders(<UserCard user={bannedUser} onEdit={mockOnEdit} />);

    expect(screen.getByText(/Banned until/)).toBeTruthy();
  });

  it("does not render banned status when user is not banned", () => {
    renderWithProviders(<UserCard user={mockUser} onEdit={mockOnEdit} />);

    expect(screen.queryByText(/Banned until/)).toBeNull();
  });

  it("renders user with only first name", () => {
    const userWithOnlyFirstName = { ...mockUser, lastName: "" };
    renderWithProviders(<UserCard user={userWithOnlyFirstName} onEdit={mockOnEdit} />);

    expect(screen.getByText("John")).toBeTruthy();
  });

  it("renders user with only last name", () => {
    const userWithOnlyLastName = { ...mockUser, firstName: "" };
    renderWithProviders(<UserCard user={userWithOnlyLastName} onEdit={mockOnEdit} />);

    expect(screen.getByText("Doe")).toBeTruthy();
  });

  it("renders user with no name using email", () => {
    const userWithNoName = { ...mockUser, firstName: "", lastName: "" };
    renderWithProviders(<UserCard user={userWithNoName} onEdit={mockOnEdit} />);

    expect(screen.getAllByText("john@example.com").length).toBeGreaterThanOrEqual(1);
  });

  it("renders 'Not selected' when user has no group", () => {
    const userWithoutGroup = { ...mockUser, group: undefined };
    renderWithProviders(<UserCard user={userWithoutGroup} onEdit={mockOnEdit} />);

    expect(screen.getByText("Group: Not selected")).toBeTruthy();
  });

  it("renders em dash for missing wrist number", () => {
    const userWithoutWristNumber = { ...mockUser, wristNumber: "" };
    renderWithProviders(<UserCard user={userWithoutWristNumber} onEdit={mockOnEdit} />);

    expect(screen.getByText("—")).toBeTruthy();
  });

  it("renders em dash for missing house number", () => {
    const userWithoutHouseNumber = { ...mockUser, houseNumber: "" };
    renderWithProviders(<UserCard user={userWithoutHouseNumber} onEdit={mockOnEdit} />);

    expect(screen.getByText("—")).toBeTruthy();
  });

  it("renders with different wrist and house numbers", () => {
    const userWithDifferentNumbers = { ...mockUser, wristNumber: "999", houseNumber: "888" };
    renderWithProviders(<UserCard user={userWithDifferentNumbers} onEdit={mockOnEdit} />);

    expect(screen.getByText("999")).toBeTruthy();
    expect(screen.getByText("888")).toBeTruthy();
  });
});
