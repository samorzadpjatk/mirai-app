import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AdminTile } from "../../admin/AdminTile";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement("Text", null, name),
  };
});

describe("AdminTile", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders with title and subtitle", () => {
    const { getByText } = renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
      />
    );

    expect(getByText("Users")).toBeTruthy();
    expect(getByText("Manage users")).toBeTruthy();
  });

  it("renders icon", () => {
    const { getByText } = renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
      />
    );

    expect(getByText("people")).toBeTruthy();
  });

  it("calls onPress when provided instead of navigation", () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
        onPress={onPress}
      />
    );

    fireEvent.press(getByTestId("admin-tile"));
    expect(onPress).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to route when pressed with route and tripId", () => {
    const { getByTestId } = renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
        route="/users"
        tripId="trip-123"
      />
    );

    fireEvent.press(getByTestId("admin-tile"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/users",
      params: { tripId: "trip-123" },
    });
  });

  it("does not navigate when route is not provided", () => {
    const { getByTestId } = renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
      />
    );

    fireEvent.press(getByTestId("admin-tile"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not navigate when tripId is not provided", () => {
    const { getByTestId } = renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
        route="/users"
      />
    );

    fireEvent.press(getByTestId("admin-tile"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("applies custom accent colors", () => {
    const { getByText } = renderWithProviders(
      <AdminTile
        title="Challenges"
        subtitle="Manage challenges"
        icon="trophy"
        accent="#ff6b6b"
        accentBg="rgba(255, 107, 107, 0.1)"
      />
    );

    expect(getByText("Challenges")).toBeTruthy();
    expect(getByText("trophy")).toBeTruthy();
  });

  it("handles different icon names", () => {
    const { getByText } = renderWithProviders(
      <AdminTile
        title="Settings"
        subtitle="App settings"
        icon="settings"
        accent="#9b59b6"
        accentBg="rgba(155, 89, 182, 0.1)"
      />
    );

    expect(getByText("settings")).toBeTruthy();
  });
});
