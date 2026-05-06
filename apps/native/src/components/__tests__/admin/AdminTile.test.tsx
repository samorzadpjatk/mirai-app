import React from "react";
import { Text } from "react-native";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AdminTile } from "../../admin/AdminTile";

jest.mock("expo-router", () => {
  const mockPush = jest.fn();
  return {
    useRouter: jest.fn(() => ({
      push: mockPush,
    })),
  };
});

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

const useMockPush = () => {
  const { useRouter } = jest.requireMock("expo-router");
  return useRouter().push;
};

describe("AdminTile", () => {
  beforeEach(() => {
    useMockPush().mockClear();
  });

  it("renders with title and subtitle", () => {
    renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
      />
    );

    expect(screen.getByText("Users")).toBeOnTheScreen();
    expect(screen.getByText("Manage users")).toBeOnTheScreen();
  });

  it("renders icon", () => {
    renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
      />
    );

    expect(screen.getByText("people")).toBeOnTheScreen();
  });

  it("calls onPress when provided instead of navigation", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
        onPress={onPress}
      />
    );

    await user.press(screen.getByTestId("admin-tile"));
    expect(onPress).toHaveBeenCalled();
    expect(useMockPush()).not.toHaveBeenCalled();
  });

  it("navigates to route when pressed with route and tripId", async () => {
    const user = userEvent.setup();

    renderWithProviders(
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

    await user.press(screen.getByTestId("admin-tile"));
    expect(useMockPush()).toHaveBeenCalledWith({
      pathname: "/users",
      params: { tripId: "trip-123" },
    });
  });

  it("does not navigate when route is not provided", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
      />
    );

    await user.press(screen.getByTestId("admin-tile"));
    expect(useMockPush()).not.toHaveBeenCalled();
  });

  it("does not navigate when tripId is not provided", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AdminTile
        title="Users"
        subtitle="Manage users"
        icon="people"
        accent="#00ced1"
        accentBg="rgba(0, 206, 209, 0.1)"
        route="/users"
      />
    );

    await user.press(screen.getByTestId("admin-tile"));
    expect(useMockPush()).not.toHaveBeenCalled();
  });

  it("applies custom accent colors", () => {
    renderWithProviders(
      <AdminTile
        title="Challenges"
        subtitle="Manage challenges"
        icon="trophy"
        accent="#ff6b6b"
        accentBg="rgba(255, 107, 107, 0.1)"
      />
    );

    expect(screen.getByText("Challenges")).toBeOnTheScreen();
    expect(screen.getByText("trophy")).toBeOnTheScreen();
  });

  it("handles different icon names", () => {
    renderWithProviders(
      <AdminTile
        title="Settings"
        subtitle="App settings"
        icon="settings"
        accent="#9b59b6"
        accentBg="rgba(155, 89, 182, 0.1)"
      />
    );

    expect(screen.getByText("settings")).toBeOnTheScreen();
  });
});
