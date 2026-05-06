import React from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import AddChallengeModal from "../../admin/challenges/AddChallengeModal";

const mockAlert = jest.spyOn(Alert, "alert");

jest.mock("~/hooks/trips", () => {
  const mockTrips = [
    { id: "trip-1", name: "Trip One" },
    { id: "trip-2", name: "Trip Two" },
  ];
  return {
    useTrips: () => ({ trips: mockTrips, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: jest.fn() }),
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

interface AppModalShellProps {
  children: React.ReactNode;
  visible: boolean;
  title: string;
  onClose: () => void;
}

interface AppModalFooterProps {
  primaryLabel: string;
  onPrimary: () => void;
  isPrimaryLoading: boolean;
  secondaryLabel: string;
  onSecondary: () => void;
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}

interface ThemedTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

jest.mock("~/components/common/ui", () => {
  const React = require("react");
  const { View, Text, Pressable, TextInput } = require("react-native");
  return {
    AppModalShell: ({ children, visible, title, onClose }: AppModalShellProps) =>
      !visible ? null : React.createElement(View, null,
        React.createElement(Text, null, title),
        React.createElement(Pressable, { onPress: onClose }, React.createElement(Text, null, "Close")),
        children
      ),
    AppModalFooter: ({ primaryLabel, onPrimary, isPrimaryLoading, secondaryLabel, onSecondary }: AppModalFooterProps) =>
      React.createElement(View, null,
        React.createElement(Pressable, { onPress: onPrimary, disabled: isPrimaryLoading }, React.createElement(Text, null, primaryLabel)),
        React.createElement(Pressable, { onPress: onSecondary }, React.createElement(Text, null, secondaryLabel))
      ),
    FormField: ({ children, label, required }: FormFieldProps) =>
      React.createElement(View, null,
        React.createElement(Text, null, `${label}${required ? "*" : ""}`),
        children
      ),
    ThemedTextInput: ({ value, onChangeText, placeholder }: ThemedTextInputProps) =>
      React.createElement(TextInput, { value, onChangeText, placeholder }),
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
      !visible ? null : React.createElement(View, null,
        React.createElement(Pressable, { onPress: () => onLocationSelected({ latitude: 52.2297, longitude: 21.0122 }) },
          React.createElement(Text, null, "Select Location")
        ),
        React.createElement(Pressable, { onPress: onClose },
          React.createElement(Text, null, "Close Location Picker")
        )
      ),
  };
});

describe("AddChallengeModal", () => {
  beforeEach(() => { jest.clearAllMocks(); mockAlert.mockClear(); });

  it("renders and closes", () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(<AddChallengeModal visible={true} onClose={onClose} />);
    fireEvent.press(getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("validates required fields on save", () => {
    const { getByText } = renderWithProviders(<AddChallengeModal visible={true} onClose={jest.fn()} />);
    fireEvent.press(getByText("Save Challenge"));
    expect(mockAlert).toHaveBeenCalledWith("Error", "Please fill in required fields (including Trip)");
  });

  it("lets the user pick and clear a location", () => {
    const { getByText, queryByText } = renderWithProviders(<AddChallengeModal visible={true} onClose={jest.fn()} />);
    fireEvent.press(getByText("Tap to select location"));
    fireEvent.press(getByText("Select Location"));
    expect(getByText("52.2297, 21.0122")).toBeTruthy();
    expect(getByText("Clear location")).toBeTruthy();
    fireEvent.press(getByText("Clear location"));
    expect(queryByText("52.2297, 21.0122")).toBeNull();
  });

  it("filters trips and selects a trip id", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(<AddChallengeModal visible={true} onClose={jest.fn()} />);
    fireEvent.changeText(getByPlaceholderText("Trip ID or search"), "Trip One");
    fireEvent.press(getByText("Trip One (trip-1)"));
    expect(getByPlaceholderText("Trip ID or search").props.value).toBe("trip-1");
  });
});
