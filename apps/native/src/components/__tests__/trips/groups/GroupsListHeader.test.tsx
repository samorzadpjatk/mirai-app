import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupsListHeader } from "../../../trips/groups/GroupsListHeader";

describe("GroupsListHeader", () => {
  it("should render title", () => {
    renderWithProviders(<GroupsListHeader title="All Groups" count={10} />);
    expect(screen.getByText("All Groups")).toBeOnTheScreen();
  });

  it("should render count with 'Results' suffix", () => {
    renderWithProviders(<GroupsListHeader title="All Groups" count={10} />);
    expect(screen.getByText("10 Results")).toBeOnTheScreen();
  });

  it("should handle zero count", () => {
    renderWithProviders(<GroupsListHeader title="All Groups" count={0} />);
    expect(screen.getByText("0 Results")).toBeOnTheScreen();
  });

  it("should handle single result", () => {
    renderWithProviders(<GroupsListHeader title="All Groups" count={1} />);
    expect(screen.getByText("1 Results")).toBeOnTheScreen();
  });

  it("should handle large count", () => {
    renderWithProviders(<GroupsListHeader title="All Groups" count={999} />);
    expect(screen.getByText("999 Results")).toBeOnTheScreen();
  });

  it("should render with different titles", () => {
    const titles = ["My Group", "Available Groups", "Search Results"];
    titles.forEach((title) => {
      const { unmount } = renderWithProviders(<GroupsListHeader title={title} count={5} />);
      expect(screen.getByText(title)).toBeOnTheScreen();
      unmount();
    });
  });

  it("should render with row layout", () => {
    renderWithProviders(<GroupsListHeader title="All Groups" count={10} />);
    expect(screen.getByTestId("groups-list-header")).toBeOnTheScreen();
  });
});
