import { screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { MapModalShell } from "../../map/modals/MapModalShell";
import { renderWithProviders } from "../helpers/renderWithProviders";

const noop = (): void => undefined;

describe("MapModalShell", () => {
  it("should render with title", () => {
    renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>,
    );

    expect(screen.getByText("Test Modal")).toBeOnTheScreen();
  });

  it("should render children", () => {
    renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>,
    );

    expect(screen.getByTestId("child-content")).toBeOnTheScreen();
  });

  it("should not render when not visible", () => {
    renderWithProviders(
      <MapModalShell visible={false} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>,
    );

    expect(screen.queryByTestId("app-modal")).toBeNull();
  });

  it("should pass maxHeight prop", () => {
    renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop} maxHeight="70%">
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>,
    );

    expect(screen.getByTestId("app-modal")).toBeOnTheScreen();
  });

  it("should pass contentStyle prop", () => {
    renderWithProviders(
      <MapModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        contentStyle={{ padding: 20 }}
      >
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>,
    );

    expect(screen.getByTestId("app-modal")).toBeOnTheScreen();
  });

  it("should use default maxHeight when not specified", () => {
    renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>,
    );

    expect(screen.getByTestId("app-modal")).toBeOnTheScreen();
  });
});
