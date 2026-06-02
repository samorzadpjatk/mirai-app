import { Text } from "react-native";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { SegmentedOption } from "../../common/ui/SegmentedOption";

const noop = (): void => {
  // Intentionally empty for test mocks
};

describe("SegmentedOption", () => {
  it("should render with label", () => {
    renderWithProviders(<SegmentedOption label="Option 1" selected={false} onPress={noop} />);

    expect(screen.getByText("Option 1")).toBeOnTheScreen();
  });

  it("should call onPress when pressed", async () => {
    const onPress = jest.fn();
    renderWithProviders(<SegmentedOption label="Option 1" selected={false} onPress={onPress} />);

    const user = userEvent.setup();
    await user.press(screen.getByText("Option 1"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should render selected and custom-styled options", () => {
    renderWithProviders(
      <>
        <SegmentedOption label="Selected" selected onPress={noop} />
        <SegmentedOption
          label="With Custom Content"
          selected={false}
          onPress={noop}
          style={{ marginHorizontal: 10 }}
        />
        <Text>Extra</Text>
      </>,
    );

    expect(screen.getByText("Selected")).toBeOnTheScreen();
    expect(screen.getByText("With Custom Content")).toBeOnTheScreen();
    expect(screen.getByText("Extra")).toBeOnTheScreen();
  });
});
