import { View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { UserMap } from "../../map/UserMap";

jest.mock("~/stores/location", () => ({
  useLocationContext: jest.fn().mockReturnValue({
    canShareOwnLocation: true,
    canViewOthersLocations: true,
  }),
}));

describe("UserMap", () => {
  const defaultProps = {
    users: [],
  };

  it("should render with empty users", () => {
    const { getByTestId } = renderWithProviders(<UserMap {...defaultProps} />);
    expect(getByTestId("map-view")).toBeTruthy();
  });

  it("should render with users", () => {
    const props = {
      users: [
        {
          id: "user1",
          name: "Alice",
          coordinate: [21, 52] as [number, number],
          lastActiveAt: Date.now(),
        },
      ],
    };
    const { getByTestId } = renderWithProviders(<UserMap {...props} />);
    expect(getByTestId("map-view")).toBeTruthy();
  });

  it("should render with overlay", () => {
    const props = {
      users: [],
      overlay: <View testID="test-overlay" />,
    };
    const { getByTestId } = renderWithProviders(<UserMap {...props} />);
    expect(getByTestId("test-overlay")).toBeTruthy();
  });

  it("should render with map theme", () => {
    const props = {
      users: [],
      mapTheme: "light" as const,
    };
    const { getByTestId } = renderWithProviders(<UserMap {...props} />);
    expect(getByTestId("map-view")).toBeTruthy();
  });

  it("should render with custom map style URL", () => {
    const props = {
      users: [],
      mapStyleURL: "https://example.com/style.json",
    };
    const { getByTestId } = renderWithProviders(<UserMap {...props} />);
    expect(getByTestId("map-view")).toBeTruthy();
  });

  it("should render with vector source URL", () => {
    const props = {
      users: [],
      vectorSourceUrl: "https://example.com/vector",
    };
    const { getByTestId } = renderWithProviders(<UserMap {...props} />);
    expect(getByTestId("map-view")).toBeTruthy();
  });
});
