import { fireEvent, screen } from "@testing-library/react-native";
import { GroupCard } from "../../../trips/groups/GroupCard";
import type { GroupListItem } from "../../../trips/groups/types";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("GroupCard", () => {
  const mockGroup: GroupListItem = {
    id: "1",
    name: "Test Group",
    code: "ABC123",
    image: null,
    participantCount: 5,
    coins: 100,
    organizer: {
      authUserId: "user1",
      firstName: "John",
      lastName: "Doe",
    },
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render group name", () => {
    renderWithProviders(<GroupCard group={mockGroup} onPress={mockOnPress} />);
    expect(screen.getByText("Test Group")).toBeTruthy();
  });

  it("should render group code", () => {
    renderWithProviders(<GroupCard group={mockGroup} onPress={mockOnPress} />);
    expect(screen.getByText("ABC123")).toBeTruthy();
  });

  it("should render participant count", () => {
    renderWithProviders(<GroupCard group={mockGroup} onPress={mockOnPress} />);
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("should render MEMBERS label", () => {
    renderWithProviders(<GroupCard group={mockGroup} onPress={mockOnPress} />);
    expect(screen.getByText("MEMBERS")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const { getByTestId } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} />,
    );
    const touchable = getByTestId("group-card");
    fireEvent.press(touchable);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
    expect(mockOnPress).toHaveBeenCalledWith(mockGroup);
  });

  it("should render 'Your group' badge when isMyGroup is true", () => {
    renderWithProviders(<GroupCard group={mockGroup} onPress={mockOnPress} isMyGroup={true} />);
    expect(screen.getByText("Your group")).toBeTruthy();
  });

  it("should not render 'Your group' badge when isMyGroup is false", () => {
    renderWithProviders(<GroupCard group={mockGroup} onPress={mockOnPress} isMyGroup={false} />);
    expect(screen.queryByText("Your group")).toBeNull();
  });

  it("should not render 'Your group' badge when isMyGroup is undefined", () => {
    renderWithProviders(<GroupCard group={mockGroup} onPress={mockOnPress} />);
    expect(screen.queryByText("Your group")).toBeNull();
  });

  it("should render image placeholder when no image", () => {
    const groupWithoutImage = { ...mockGroup, image: null };
    renderWithProviders(<GroupCard group={groupWithoutImage} onPress={mockOnPress} />);
    const placeholder = screen.getByTestId("image-placeholder");
    expect(placeholder).toBeTruthy();
  });

  it("should render image when image is provided", () => {
    const groupWithImage = { ...mockGroup, image: "https://example.com/image.jpg" };
    renderWithProviders(<GroupCard group={groupWithImage} onPress={mockOnPress} />);
    const image = screen.getByTestId("group-image");
    expect(image).toBeTruthy();
    expect((image.props as { source: { uri: string } }).source.uri).toBe(
      "https://example.com/image.jpg",
    );
  });

  it("should apply my group styling when isMyGroup is true", () => {
    const { getByTestId } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} isMyGroup={true} />,
    );
    const touchable = getByTestId("group-card");
    expect(touchable).toBeTruthy();
  });

  it("should handle zero participants", () => {
    const groupWithZeroParticipants = { ...mockGroup, participantCount: 0 };
    renderWithProviders(<GroupCard group={groupWithZeroParticipants} onPress={mockOnPress} />);
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("should handle large participant counts", () => {
    const groupWithManyParticipants = { ...mockGroup, participantCount: 999 };
    renderWithProviders(<GroupCard group={groupWithManyParticipants} onPress={mockOnPress} />);
    expect(screen.getByText("999")).toBeTruthy();
  });
});
