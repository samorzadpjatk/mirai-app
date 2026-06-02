import { Text } from "react-native";
import { fireEvent, screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AppModalFooter } from "../../common/ui/AppModalFooter";

const noop = (): void => undefined;

describe("AppModalFooter", () => {
  it("should render primary button with label", () => {
    renderWithProviders(<AppModalFooter primaryLabel="Save" onPrimary={noop} />);

    expect(screen.getByText("Save")).toBeOnTheScreen();
  });

  it("should call onPrimary when primary button is pressed", async () => {
    const onPrimary = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<AppModalFooter primaryLabel="Save" onPrimary={onPrimary} />);

    await user.press(screen.getByText("Save"));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it("should render secondary button when provided", () => {
    renderWithProviders(
      <AppModalFooter
        primaryLabel="Save"
        onPrimary={noop}
        secondaryLabel="Cancel"
        onSecondary={noop}
      />,
    );

    expect(screen.getByText("Save")).toBeOnTheScreen();
    expect(screen.getByText("Cancel")).toBeOnTheScreen();
  });

  it("should call onSecondary when secondary button is pressed", async () => {
    const onSecondary = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <AppModalFooter
        primaryLabel="Save"
        onPrimary={noop}
        secondaryLabel="Cancel"
        onSecondary={onSecondary}
      />,
    );

    await user.press(screen.getByText("Cancel"));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it("should not render secondary button when secondary props are incomplete", () => {
    renderWithProviders(<AppModalFooter primaryLabel="Save" onPrimary={noop} onSecondary={noop} />);

    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("should hide the primary label while loading", () => {
    renderWithProviders(<AppModalFooter primaryLabel="Save" onPrimary={noop} isPrimaryLoading />);

    expect(screen.queryByText("Save")).toBeNull();
  });

  it("should render children content", () => {
    renderWithProviders(
      <AppModalFooter primaryLabel="Save" onPrimary={noop}>
        <Text>Additional Info</Text>
      </AppModalFooter>,
    );

    expect(screen.getByText("Additional Info")).toBeOnTheScreen();
    expect(screen.getByText("Save")).toBeOnTheScreen();
  });
});
