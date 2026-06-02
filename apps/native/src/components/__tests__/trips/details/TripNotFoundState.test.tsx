import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TripNotFoundState } from "../../../trips/details/TripNotFoundState";

describe("TripNotFoundState", () => {
  it("should render error message", () => {
    renderWithProviders(<TripNotFoundState onGoBack={jest.fn()} />);

    expect(screen.getByText("Trip not found")).toBeOnTheScreen();
  });

  it("should render go back link", () => {
    renderWithProviders(<TripNotFoundState onGoBack={jest.fn()} />);

    expect(screen.getByText("Go back")).toBeOnTheScreen();
  });

  it("should call onGoBack when go back link is pressed", () => {
    const onGoBack = jest.fn();
    renderWithProviders(<TripNotFoundState onGoBack={onGoBack} />);

    fireEvent.press(screen.getByText("Go back"));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it("should render in centered container", () => {
    renderWithProviders(<TripNotFoundState onGoBack={jest.fn()} />);

    expect(screen.getByText("Trip not found")).toBeOnTheScreen();
    expect(screen.getByText("Go back")).toBeOnTheScreen();
  });
});
