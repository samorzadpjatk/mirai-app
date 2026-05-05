import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TripNotFoundState } from "../../../trips/details/TripNotFoundState";

describe("TripNotFoundState", () => {
  it("should render error message", () => {
    const { getByText } = renderWithProviders(
      <TripNotFoundState onGoBack={() => {}} />
    );

    expect(getByText("Trip not found")).toBeTruthy();
  });

  it("should render go back link", () => {
    const { getByText } = renderWithProviders(
      <TripNotFoundState onGoBack={() => {}} />
    );

    expect(getByText("Go back")).toBeTruthy();
  });

  it("should call onGoBack when go back link is pressed", () => {
    const onGoBack = jest.fn();
    const { getByText } = renderWithProviders(
      <TripNotFoundState onGoBack={onGoBack} />
    );

    fireEvent.press(getByText("Go back"));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it("should render in centered container", () => {
    const { getByText } = renderWithProviders(
      <TripNotFoundState onGoBack={() => {}} />
    );

    expect(getByText("Trip not found")).toBeTruthy();
    expect(getByText("Go back")).toBeTruthy();
  });
});
