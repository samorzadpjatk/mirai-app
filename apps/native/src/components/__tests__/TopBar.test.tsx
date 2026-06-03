import { fireEvent, render, screen } from "@testing-library/react-native";
import TopBar from "../TopBar";

describe("TopBar", () => {
  const mockOnHomePress = jest.fn();
  const mockOnSignPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with unauthenticated state", () => {
    render(
      <TopBar
        isAuthenticated={false}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    expect(screen.getByText("Sign In")).toBeTruthy();
  });

  it("renders with authenticated state", () => {
    render(
      <TopBar
        user={{ name: "John Doe", image: null }}
        isAuthenticated={true}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByText("Sign Out")).toBeTruthy();
  });

  it("renders user initials when no image", () => {
    render(
      <TopBar
        user={{ name: "Jane Smith", image: null }}
        isAuthenticated={true}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    expect(screen.getByText("Jane Smith")).toBeTruthy();
    expect(screen.getByText("JS")).toBeTruthy();
  });

  it("renders user name and image when provided", () => {
    render(
      <TopBar
        user={{ name: "John Doe", image: "https://example.com/avatar.jpg" }}
        isAuthenticated={true}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByLabelText("User avatar")).toBeTruthy();
  });

  it("renders sign in button when not authenticated", () => {
    render(
      <TopBar
        isAuthenticated={false}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    expect(screen.getByText("Sign In")).toBeTruthy();
  });

  it("calls onSignPress when sign button is pressed", () => {
    render(
      <TopBar
        isAuthenticated={false}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    const signButton = screen.getByText("Sign In");
    fireEvent.press(signButton);

    expect(mockOnSignPress).toHaveBeenCalled();
  });

  it("calls onSignPress when sign out button is pressed", () => {
    render(
      <TopBar
        user={{ name: "John Doe", image: null }}
        isAuthenticated={true}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    const signOutButton = screen.getByText("Sign Out");
    fireEvent.press(signOutButton);

    expect(mockOnSignPress).toHaveBeenCalled();
  });

  it("renders with single name initial", () => {
    render(
      <TopBar
        user={{ name: "Madonna", image: null }}
        isAuthenticated={true}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    expect(screen.getByText("Madonna")).toBeTruthy();
    expect(screen.getByText("M")).toBeTruthy();
  });

  it("renders sign out button when authenticated with null user name", () => {
    render(
      <TopBar
        user={{ name: null, image: null }}
        isAuthenticated={true}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    expect(screen.getByText("Sign Out")).toBeTruthy();
  });

  it("renders sign out button when authenticated with empty user object", () => {
    render(
      <TopBar
        user={{}}
        isAuthenticated={true}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    expect(screen.getByText("Sign Out")).toBeTruthy();
  });

  it("does not render user section when not authenticated", () => {
    const { queryByText } = render(
      <TopBar
        isAuthenticated={false}
        onHomePress={mockOnHomePress}
        onSignPress={mockOnSignPress}
      />,
    );

    expect(queryByText("John Doe")).toBeNull();
  });
});
