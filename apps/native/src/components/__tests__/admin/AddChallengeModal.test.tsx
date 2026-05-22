import React from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import AddChallengeModal from "../../admin/challenges/AddChallengeModal";

const mockAlert = jest.spyOn(Alert, "alert");

jest.mock("~/hooks/trips", () => {
  const mockTrips = [
    { id: "trip-1", name: "Trip One" },
    { id: "trip-2", name: "Trip Two" },
  ];
  return {
    useTrips: () => ({
      trips: mockTrips,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    }),
  };
});

jest.mock("~/hooks/admin", () => {
  const mockCreateChallenge = jest.fn();
  return {
    useAdminChallenges: () => ({ createChallenge: mockCreateChallenge }),
  };
});

interface IoniconsProps {
  name: string;
}

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: IoniconsProps) => React.createElement(Text, null, name),
  };
});

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: { latitude: number; longitude: number }) => void;
}

jest.mock("../../map/LocationPicker", () => {
  const React = require("react");
  const { View, Pressable, Text } = require("react-native");
  return {
    LocationPicker: ({ visible, onClose, onLocationSelected }: LocationPickerProps) =>
      !visible
        ? null
        : React.createElement(
            View,
            null,
            React.createElement(
              Pressable,
              { onPress: () => onLocationSelected({ latitude: 52.2297, longitude: 21.0122 }) },
              React.createElement(Text, null, "Select Location"),
            ),
            React.createElement(
              Pressable,
              { onPress: onClose },
              React.createElement(Text, null, "Close Location Picker"),
            ),
          ),
  };
});

describe("AddChallengeModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
  });

  it("renders and closes", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithProviders(<AddChallengeModal visible={true} onClose={onClose} />);
    await user.press(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("validates required fields on save", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddChallengeModal visible={true} onClose={jest.fn()} />);
    await user.press(screen.getByText("Save Challenge"));
    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "Please fill in required fields (including Trip)",
    );
  });

  it("lets the user pick and clear a location", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddChallengeModal visible={true} onClose={jest.fn()} />);
    await user.press(screen.getByText("Tap to select location"));
    await user.press(screen.getByText("Select Location"));
    expect(screen.getByText("52.2297, 21.0122")).toBeOnTheScreen();
    expect(screen.getByText("Clear location")).toBeOnTheScreen();
    await user.press(screen.getByText("Clear location"));
    expect(screen.queryByText("52.2297, 21.0122")).toBeNull();
  });

  it("filters trips and selects a trip id", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddChallengeModal visible={true} onClose={jest.fn()} />);
    await user.type(screen.getByPlaceholderText("Trip ID or search"), "Trip One");
    await user.press(screen.getByText("Trip One (trip-1)"));
    expect(screen.getByPlaceholderText("Trip ID or search").props.value).toBe("trip-1");
  });
});
