import { fireEvent, screen } from "@testing-library/react-native";
import { InteractiveMapTile } from "../../tripInfo/InteractiveMapTile";
import { renderWithProviders } from "../helpers/renderWithProviders";

const noop = () => undefined;

describe("InteractiveMapTile", () => {
  it("should render the seeded label", () => {
    renderWithProviders(
      <InteractiveMapTile label="Mapa ośrodka" iconName="compass" onPress={noop} />,
    );

    expect(screen.getByText("Mapa ośrodka")).toBeOnTheScreen();
  });

  it("should render the seeded description as the subtitle", () => {
    renderWithProviders(
      <InteractiveMapTile
        label="Mapa ośrodka"
        subtitle="Plan ośrodka Kacze Stawy i okolic Łeby."
        iconName="compass"
        onPress={noop}
      />,
    );

    expect(screen.getByTestId("trip-info-map-tile-subtitle")).toHaveTextContent(
      "Plan ośrodka Kacze Stawy i okolic Łeby.",
    );
  });

  it("should not render template ski copy when the resource has no description", () => {
    renderWithProviders(
      <InteractiveMapTile label="Mapa ośrodka" iconName="compass" onPress={noop} />,
    );

    expect(screen.queryByTestId("trip-info-map-tile-subtitle")).toBeNull();
    expect(screen.queryByText("Navigate trails & lifts")).toBeNull();
  });

  it("should render the seeded background image when one is downloaded", () => {
    renderWithProviders(
      <InteractiveMapTile
        label="Mapa ośrodka"
        iconName="compass"
        backgroundUri="file:///kacze-stawy.png"
        onPress={noop}
      />,
    );

    expect(screen.getByTestId("trip-info-map-tile-image")).toBeOnTheScreen();
  });

  it("should fall back to a plain card instead of a remote stock photo", () => {
    renderWithProviders(
      <InteractiveMapTile label="Mapa ośrodka" iconName="compass" onPress={noop} />,
    );

    expect(screen.getByTestId("trip-info-map-tile")).toBeOnTheScreen();
    expect(screen.queryByTestId("trip-info-map-tile-image")).toBeNull();
  });

  it("should call onPress when tapped", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <InteractiveMapTile label="Mapa ośrodka" iconName="compass" onPress={onPress} />,
    );

    fireEvent.press(screen.getByTestId("trip-info-map-tile"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
