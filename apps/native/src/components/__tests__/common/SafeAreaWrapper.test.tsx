import React from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { SafeAreaTop } from "../../SafeAreaWrapper";

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: "SafeAreaProvider",
  SafeAreaView: "SafeAreaView",
  useSafeAreaInsets: jest.fn(),
  useSafeAreaFrame: jest.fn(() => ({
    x: 0,
    y: 0,
    width: 375,
    height: 812,
  })),
  initialWindowMetrics: {
    frame: { x: 0, y: 0, width: 375, height: 812 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  },
}));

describe("SafeAreaTop", () => {
  beforeEach(() => {
    (useSafeAreaInsets as jest.Mock).mockReturnValue({
      top: 44,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });

  it("should render children", () => {
    const { getByText } = renderWithProviders(
      <SafeAreaTop>
        <Text>Content</Text>
      </SafeAreaTop>
    );

    expect(getByText("Content")).toBeTruthy();
  });

  it("should apply safe area top padding", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <SafeAreaTop>
        <Text>Content</Text>
      </SafeAreaTop>
    );

    const view = UNSAFE_getByType(View);
    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingTop: 44 }),
      ])
    );
  });

  it("should combine with existing paddingTop", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <SafeAreaTop style={{ paddingTop: 10 }}>
        <Text>Content</Text>
      </SafeAreaTop>
    );

    const view = UNSAFE_getByType(View);
    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingTop: 54 }),
      ])
    );
  });

  it("should handle zero top inset", () => {
    (useSafeAreaInsets as jest.Mock).mockReturnValue({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });

    const { UNSAFE_getByType } = renderWithProviders(
      <SafeAreaTop>
        <Text>Content</Text>
      </SafeAreaTop>
    );

    const view = UNSAFE_getByType(View);
    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingTop: 0 }),
      ])
    );
  });

  it("should handle large top inset (notch devices)", () => {
    (useSafeAreaInsets as jest.Mock).mockReturnValue({
      top: 59,
      right: 0,
      bottom: 34,
      left: 0,
    });

    const { UNSAFE_getByType } = renderWithProviders(
      <SafeAreaTop>
        <Text>Content</Text>
      </SafeAreaTop>
    );

    const view = UNSAFE_getByType(View);
    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingTop: 59 }),
      ])
    );
  });

  it("should apply additional custom styles", () => {
    const customStyle = { backgroundColor: "red", marginBottom: 10 };
    const { UNSAFE_getByType } = renderWithProviders(
      <SafeAreaTop style={customStyle}>
        <Text>Content</Text>
      </SafeAreaTop>
    );

    const view = UNSAFE_getByType(View);
    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "red" }),
        expect.objectContaining({ marginBottom: 10 }),
      ])
    );
  });

  it("should handle array style prop", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <SafeAreaTop style={[{ backgroundColor: "blue" }, { marginTop: 5 }]}>
        <Text>Content</Text>
      </SafeAreaTop>
    );

    const view = UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });

  it("should render complex children", () => {
    const { getByText } = renderWithProviders(
      <SafeAreaTop>
        <View>
          <Text>Header</Text>
          <Text>Subheader</Text>
        </View>
      </SafeAreaTop>
    );

    expect(getByText("Header")).toBeTruthy();
    expect(getByText("Subheader")).toBeTruthy();
  });

  it("should preserve other style properties", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <SafeAreaTop style={{ backgroundColor: "blue", paddingHorizontal: 20 }}>
        <Text>Content</Text>
      </SafeAreaTop>
    );

    const view = UNSAFE_getByType(View);
    const styles = view.props.style;
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "blue" }),
        expect.objectContaining({ paddingHorizontal: 20 }),
      ])
    );
  });
});
