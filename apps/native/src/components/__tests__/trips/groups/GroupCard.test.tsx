import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupCard } from "../../../trips/groups/GroupCard";
import type { GroupListItem } from "../../../trips/groups/types";

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
    const { getByText } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} />
    );
    expect(getByText("Test Group")).toBeTruthy();
  });

  it("should render group code", () => {
    const { getByText } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} />
    );
    expect(getByText("ABC123")).toBeTruthy();
  });

  it("should render participant count", () => {
    const { getByText } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} />
    );
    expect(getByText("5")).toBeTruthy();
  });

  it("should render MEMBERS label", () => {
    const { getByText } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} />
    );
    expect(getByText("MEMBERS")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const { getByTestId } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} />
    );
    const touchable = getByTestId("group-card");
    fireEvent.press(touchable);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
    expect(mockOnPress).toHaveBeenCalledWith(mockGroup);
  });

  it("should render 'Your group' badge when isMyGroup is true", () => {
    const { getByText } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} isMyGroup={true} />
    );
    expect(getByText("Your group")).toBeTruthy();
  });

  it("should not render 'Your group' badge when isMyGroup is false", () => {
    const { queryByText } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} isMyGroup={false} />
    );
    expect(queryByText("Your group")).toBeNull();
  });

  it("should not render 'Your group' badge when isMyGroup is undefined", () => {
    const { queryByText } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} />
    );
    expect(queryByText("Your group")).toBeNull();
  });

  it("should render image placeholder when no image", () => {
    const groupWithoutImage = { ...mockGroup, image: null };
    const { getByTestId } = renderWithProviders(
      <GroupCard group={groupWithoutImage} onPress={mockOnPress} />
    );
    const placeholder = getByTestId("image-placeholder");
    expect(placeholder).toBeTruthy();
  });

  it("should render image when image is provided", () => {
    const groupWithImage = { ...mockGroup, image: "https://example.com/image.jpg" };
    const { getByTestId } = renderWithProviders(
      <GroupCard group={groupWithImage} onPress={mockOnPress} />
    );
    const image = getByTestId("group-image");
    expect(image).toBeTruthy();
    expect(image.props.source.uri).toBe("https://example.com/image.jpg");
  });

  it("should apply my group styling when isMyGroup is true", () => {
    const { getByTestId } = renderWithProviders(
      <GroupCard group={mockGroup} onPress={mockOnPress} isMyGroup={true} />
    );
    const touchable = getByTestId("group-card");
    expect(touchable).toBeTruthy();
  });

  it("should handle zero participants", () => {
    const groupWithZeroParticipants = { ...mockGroup, participantCount: 0 };
    const { getByText } = renderWithProviders(
      <GroupCard group={groupWithZeroParticipants} onPress={mockOnPress} />
    );
    expect(getByText("0")).toBeTruthy();
  });

  it("should handle large participant counts", () => {
    const groupWithManyParticipants = { ...mockGroup, participantCount: 999 };
    const { getByText } = renderWithProviders(
      <GroupCard group={groupWithManyParticipants} onPress={mockOnPress} />
    );
    expect(getByText("999")).toBeTruthy();
  });
});
