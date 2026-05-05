import React from "react";
import { Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CoinOperationScreen } from "../../admin/coins/CoinOperationScreen";

const mockAlert = jest.spyOn(Alert, "alert");
const mockBack = jest.fn();
const mockAddCoins = jest.fn();
const mockRemoveCoins = jest.fn();
let mockParams: Record<string, string> = { tripId: "trip-1", groupId: "group-1", groupName: "Test Group", groupCoins: "100" };

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("~/hooks/admin/useAdminCoins", () => ({
  useAdminCoins: () => ({ addCoins: mockAddCoins, removeCoins: mockRemoveCoins, isAddingCoins: false, isRemovingCoins: false }),
}));

jest.mock("expo-status-bar", () => {
  return { __esModule: true, StatusBar: () => null };
});

jest.mock("~/components/admin/AdminHeader", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return { __esModule: true, AdminHeader: ({ title, subtitle }: any) => React.createElement(View, null, React.createElement(Text, { testID: "screen-title" }, title), React.createElement(Text, null, subtitle)) };
});

jest.mock("~/components/common/ui", () => {
  const React = require("react");
  const { Text, TextInput, View } = require("react-native");
  return {
    FormField: ({ children, label, required }: any) => React.createElement(View, null, React.createElement(Text, null, `${label}${required ? "*" : ""}`), children),
    ThemedTextInput: ({ value, onChangeText, placeholder, editable, ...props }: any) => React.createElement(TextInput, { value, onChangeText, placeholder, editable, ...props }),
  };
});

jest.mock("~/components/common/buttons/PrimaryLoadingButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return { __esModule: true, PrimaryLoadingButton: ({ label, onPress, isLoading, disabled }: any) => React.createElement(Pressable, { onPress, disabled: disabled || isLoading }, React.createElement(Text, null, isLoading ? "Loading..." : label)) };
});

describe("CoinOperationScreen", () => {
  beforeEach(() => { jest.clearAllMocks(); mockAlert.mockClear(); mockParams = { tripId: "trip-1", groupId: "group-1", groupName: "Test Group", groupCoins: "100" }; });

  it("renders group summary", () => {
    const { getByTestId, getByDisplayValue } = renderWithProviders(<CoinOperationScreen operation="add" />);
    expect(getByTestId("screen-title").props.children).toBe("Add Coins");
    expect(getByDisplayValue("Test Group")).toBeTruthy();
    expect(getByDisplayValue("100 coins")).toBeTruthy();
  });

  it("adds coins", async () => {
    mockAddCoins.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText, getAllByText } = renderWithProviders(<CoinOperationScreen operation="add" />);
    fireEvent.changeText(getByPlaceholderText("Enter amount"), "50");
    fireEvent.changeText(getByPlaceholderText("Describe why you are adding coins"), "Bonus");
    fireEvent.press(getAllByText("Add Coins")[1]);
    await waitFor(() => expect(mockAddCoins).toHaveBeenCalledWith("group-1", 50, "Bonus"));
  });

  it("removes coins", async () => {
    mockRemoveCoins.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText, getAllByText } = renderWithProviders(<CoinOperationScreen operation="remove" />);
    fireEvent.changeText(getByPlaceholderText("Enter amount"), "25");
    fireEvent.changeText(getByPlaceholderText("Describe why you are removing coins"), "Penalty");
    fireEvent.press(getAllByText("Remove Coins")[1]);
    await waitFor(() => expect(mockRemoveCoins).toHaveBeenCalledWith("group-1", 25, "Penalty"));
  });

  it("shows missing params error", () => {
    mockParams = { tripId: "", groupId: "", groupName: "", groupCoins: "0" };
    const { getByPlaceholderText, getByText, getAllByText } = renderWithProviders(<CoinOperationScreen operation="add" />);
    fireEvent.changeText(getByPlaceholderText("Enter amount"), "10");
    fireEvent.changeText(getByPlaceholderText("Describe why you are adding coins"), "Reason");
    fireEvent.press(getAllByText("Add Coins")[1]);
    expect(mockAlert).toHaveBeenCalledWith("Error", "Trip and group are required.");
  });
});
