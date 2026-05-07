import React from "react";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupDetailsHero } from "../../../trips/groups/details/GroupDetailsHero";

describe("GroupDetailsHero", () => {
  it("should render group name", () => {
    renderWithProviders(<GroupDetailsHero name="Test Group" />);
    expect(screen.getByText("Test Group")).toBeOnTheScreen();
  });

  it("should render image when imageUrl is provided", () => {
    renderWithProviders(
      <GroupDetailsHero
        name="Test Group"
        imageUrl="https://example.com/group-image.jpg"
      />
    );
    const image = screen.getByTestId("group-hero-image");
    expect(image).toBeOnTheScreen();
    expect(image.props.source.uri).toBe("https://example.com/group-image.jpg");
  });

  it("should render placeholder when no imageUrl", () => {
    renderWithProviders(<GroupDetailsHero name="Test Group" />);
    expect(screen.getByText("No group image")).toBeOnTheScreen();
  });

  it("should render placeholder icon", () => {
    renderWithProviders(<GroupDetailsHero name="Test Group" />);
    expect(screen.getByText("images-outline")).toBeOnTheScreen();
  });

  it("should handle long group names", () => {
    const longName = "This is a very long group name that might wrap";
    renderWithProviders(<GroupDetailsHero name={longName} />);
    expect(screen.getByText(longName)).toBeOnTheScreen();
  });

  it("should render with hero card styling", () => {
    renderWithProviders(<GroupDetailsHero name="Test Group" />);
    expect(screen.getByTestId("group-details-hero")).toBeOnTheScreen();
  });

  it("should handle null imageUrl", () => {
    renderWithProviders(<GroupDetailsHero name="Test Group" imageUrl={null} />);
    expect(screen.getByText("No group image")).toBeOnTheScreen();
  });
});
