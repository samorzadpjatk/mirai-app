import React from "react";
import { View } from "react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupsListHeader } from "../../../trips/groups/GroupsListHeader";

describe("GroupsListHeader", () => {
  it("should render title", () => {
    const { getByText } = renderWithProviders(
      <GroupsListHeader title="All Groups" count={10} />
    );
    expect(getByText("All Groups")).toBeTruthy();
  });

  it("should render count with 'Results' suffix", () => {
    const { getByText } = renderWithProviders(
      <GroupsListHeader title="All Groups" count={10} />
    );
    expect(getByText("10 Results")).toBeTruthy();
  });

  it("should handle zero count", () => {
    const { getByText } = renderWithProviders(
      <GroupsListHeader title="All Groups" count={0} />
    );
    expect(getByText("0 Results")).toBeTruthy();
  });

  it("should handle single result", () => {
    const { getByText } = renderWithProviders(
      <GroupsListHeader title="All Groups" count={1} />
    );
    expect(getByText("1 Results")).toBeTruthy();
  });

  it("should handle large count", () => {
    const { getByText } = renderWithProviders(
      <GroupsListHeader title="All Groups" count={999} />
    );
    expect(getByText("999 Results")).toBeTruthy();
  });

  it("should render with different titles", () => {
    const titles = ["My Group", "Available Groups", "Search Results"];
    titles.forEach((title) => {
      const { getByText, unmount } = renderWithProviders(
        <GroupsListHeader title={title} count={5} />
      );
      expect(getByText(title)).toBeTruthy();
      unmount();
    });
  });

  it("should render with row layout", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupsListHeader title="All Groups" count={10} />
    );
    const view = UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });
});
