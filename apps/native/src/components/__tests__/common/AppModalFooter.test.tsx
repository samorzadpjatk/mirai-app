import React from "react";
import { Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AppModalFooter } from "../../common/ui/AppModalFooter";

describe("AppModalFooter", () => {
  it("should render primary button with label", () => {
    const { getByText } = renderWithProviders(
      <AppModalFooter primaryLabel="Save" onPrimary={() => {}} />
    );

    expect(getByText("Save")).toBeTruthy();
  });

  it("should call onPrimary when primary button is pressed", () => {
    const onPrimary = jest.fn();
    const { getByText } = renderWithProviders(
      <AppModalFooter primaryLabel="Save" onPrimary={onPrimary} />
    );

    fireEvent.press(getByText("Save"));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it("should render secondary button when provided", () => {
    const { getByText } = renderWithProviders(
      <AppModalFooter
        primaryLabel="Save"
        onPrimary={() => {}}
        secondaryLabel="Cancel"
        onSecondary={() => {}}
      />
    );

    expect(getByText("Save")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("should call onSecondary when secondary button is pressed", () => {
    const onSecondary = jest.fn();
    const { getByText } = renderWithProviders(
      <AppModalFooter
        primaryLabel="Save"
        onPrimary={() => {}}
        secondaryLabel="Cancel"
        onSecondary={onSecondary}
      />
    );

    fireEvent.press(getByText("Cancel"));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it("should not render secondary button when secondary props are incomplete", () => {
    const { queryByText } = renderWithProviders(
      <AppModalFooter primaryLabel="Save" onPrimary={() => {}} onSecondary={() => {}} />
    );

    expect(queryByText("Cancel")).toBeNull();
  });

  it("should hide the primary label while loading", () => {
    const { queryByText } = renderWithProviders(
      <AppModalFooter primaryLabel="Save" onPrimary={() => {}} isPrimaryLoading />
    );

    expect(queryByText("Save")).toBeNull();
  });

  it("should render children content", () => {
    const { getByText } = renderWithProviders(
      <AppModalFooter primaryLabel="Save" onPrimary={() => {}}>
        <Text>Additional Info</Text>
      </AppModalFooter>
    );

    expect(getByText("Additional Info")).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
  });
});
