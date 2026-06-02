import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { EmptyState } from "../../common/ui/EmptyState";

describe("EmptyState", () => {
  it("should render with title", () => {
    renderWithProviders(<EmptyState title="No Data" />);

    expect(screen.getByText("No Data")).toBeOnTheScreen();
  });

  it("should render with subtitle when provided", () => {
    renderWithProviders(<EmptyState title="No Data" subtitle="Try refreshing the page" />);

    expect(screen.getByText("No Data")).toBeOnTheScreen();
    expect(screen.getByText("Try refreshing the page")).toBeOnTheScreen();
  });

  it("should not render subtitle when not provided", () => {
    renderWithProviders(<EmptyState title="No Data" />);

    expect(screen.queryByText("Some subtitle")).toBeNull();
  });

  it("should render icon when provided", () => {
    renderWithProviders(<EmptyState title="No Data" icon="search" />);

    expect(screen.getByText("search")).toBeOnTheScreen();
  });

  it("should not render icon when not provided", () => {
    renderWithProviders(<EmptyState title="No Data" />);

    expect(screen.queryByText("search")).toBeNull();
  });

  it("should apply custom icon size", () => {
    renderWithProviders(<EmptyState title="No Data" icon="search" iconSize={64} />);

    const icon = screen.getByText("search");
    expect(icon).toBeOnTheScreen();
  });

  it("should apply custom icon color", () => {
    renderWithProviders(<EmptyState title="No Data" icon="search" iconColor="#FF0000" />);

    const icon = screen.getByText("search");
    expect(icon).toBeOnTheScreen();
  });

  it("should apply custom icon opacity", () => {
    renderWithProviders(<EmptyState title="No Data" icon="search" iconOpacity={0.8} />);

    const iconWrapper = screen.getByTestId("empty-state-icon-wrapper");
    expect(iconWrapper).toBeOnTheScreen();
  });

  it("should apply default icon opacity when not specified", () => {
    renderWithProviders(<EmptyState title="No Data" icon="search" />);

    const iconWrapper = screen.getByTestId("empty-state-icon-wrapper");
    expect(iconWrapper).toBeOnTheScreen();
  });

  it("should apply custom container style", () => {
    renderWithProviders(<EmptyState title="No Data" />);

    const container = screen.getByTestId("empty-state-container");
    expect(container).toBeOnTheScreen();
  });

  it("should render with different icon names", () => {
    const { rerender } = renderWithProviders(<EmptyState title="No Data" icon="home" />);

    expect(screen.getByText("home")).toBeOnTheScreen();

    rerender(<EmptyState title="No Data" icon="person" />);
    expect(screen.getByText("person")).toBeOnTheScreen();
  });
});
