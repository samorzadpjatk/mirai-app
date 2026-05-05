import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupDetailsHero } from "../../../trips/groups/details/GroupDetailsHero";

describe("GroupDetailsHero", () => {
  it("should render group name", () => {
    const { getByText } = renderWithProviders(
      <GroupDetailsHero name="Test Group" />
    );
    expect(getByText("Test Group")).toBeTruthy();
  });

  it("should render image when imageUrl is provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupDetailsHero
        name="Test Group"
        imageUrl="https://example.com/group-image.jpg"
      />
    );
    const image = UNSAFE_getByType(require("react-native").Image);
    expect(image).toBeTruthy();
    expect(image.props.source.uri).toBe("https://example.com/group-image.jpg");
  });

  it("should render placeholder when no imageUrl", () => {
    const { getByText } = renderWithProviders(
      <GroupDetailsHero name="Test Group" />
    );
    expect(getByText("No group image")).toBeTruthy();
  });

  it("should render placeholder icon", () => {
    const { getByText } = renderWithProviders(
      <GroupDetailsHero name="Test Group" />
    );
    expect(getByText("images-outline")).toBeTruthy();
  });

  it("should handle long group names", () => {
    const longName = "This is a very long group name that might wrap";
    const { getByText } = renderWithProviders(
      <GroupDetailsHero name={longName} />
    );
    expect(getByText(longName)).toBeTruthy();
  });

  it("should render with hero card styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupDetailsHero name="Test Group" />
    );
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view).toBeTruthy();
  });

  it("should handle null imageUrl", () => {
    const { getByText } = renderWithProviders(
      <GroupDetailsHero name="Test Group" imageUrl={null} />
    );
    expect(getByText("No group image")).toBeTruthy();
  });
});
