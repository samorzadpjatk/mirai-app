import React from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CoinOperationScreen } from "../../admin/coins/CoinOperationScreen";

const mockAlert = jest.spyOn(Alert, "alert");
const mockBack = jest.fn();
const mockAddCoins = jest.fn();
const mockRemoveCoins = jest.fn();

interface MockSearchParams {
  tripId: string;
  groupId: string;
  groupName: string;
  groupCoins: string;
}

let mockParams: MockSearchParams = {
  tripId: "trip-1",
  groupId: "group-1",
  groupName: "Test Group",
  groupCoins: "100",
};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("~/hooks/admin/useAdminCoins", () => ({
  useAdminCoins: () => ({
    addCoins: mockAddCoins,
    removeCoins: mockRemoveCoins,
    isAddingCoins: false,
    isRemovingCoins: false,
  }),
}));

jest.mock("expo-status-bar", () => ({
  __esModule: true,
  StatusBar: () => null,
}));

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

jest.mock("~/components/admin/AdminHeader", () => ({
  __esModule: true,
  AdminHeader: ({ title, subtitle }: AdminHeaderProps) => (
    <View>
      <Text testID="screen-title">{title}</Text>
      {subtitle ? <Text>{subtitle}</Text> : null}
    </View>
  ),
}));

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}

interface ThemedTextInputProps extends React.ComponentProps<typeof TextInput> {
  value?: string;
  onChangeText?: (text: string) => void;
}

jest.mock("~/components/common/ui", () => ({
  FormField: ({ children, label, required }: FormFieldProps) => (
    <View>
      <Text>{`${label}${required ? "*" : ""}`}</Text>
      {children}
    </View>
  ),
  ThemedTextInput: ({ value, onChangeText, placeholder, editable, ...props }: ThemedTextInputProps) => (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      editable={editable}
      {...props}
    />
  ),
}));

interface PrimaryLoadingButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

jest.mock("~/components/common/buttons/PrimaryLoadingButton", () => ({
  __esModule: true,
  PrimaryLoadingButton: ({ label, onPress, isLoading, disabled }: PrimaryLoadingButtonProps) => (
    <Pressable onPress={onPress} disabled={disabled ?? isLoading}>
      <Text>{isLoading ? "Loading..." : label}</Text>
    </Pressable>
  ),
}));

describe("CoinOperationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    mockParams = {
      tripId: "trip-1",
      groupId: "group-1",
      groupName: "Test Group",
      groupCoins: "100",
    };
  });

  it("renders group summary", () => {
    const { getByTestId, getByDisplayValue } = renderWithProviders(<CoinOperationScreen operation="add" />);
    expect(getByTestId("screen-title").props.children).toBe("Add Coins");
    expect(getByDisplayValue("Test Group")).toBeTruthy();
    expect(getByDisplayValue("100 coins")).toBeTruthy();
  });

  it("adds coins", async () => {
    mockAddCoins.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<CoinOperationScreen operation="add" />);
    fireEvent.changeText(getByPlaceholderText("Enter amount"), "50");
    fireEvent.changeText(getByPlaceholderText("Describe why you are adding coins"), "Bonus");
    fireEvent.press(getAllByText("Add Coins")[1]);
    await waitFor(() => expect(mockAddCoins).toHaveBeenCalledWith("group-1", 50, "Bonus"));
  });

  it("removes coins", async () => {
    mockRemoveCoins.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<CoinOperationScreen operation="remove" />);
    fireEvent.changeText(getByPlaceholderText("Enter amount"), "25");
    fireEvent.changeText(getByPlaceholderText("Describe why you are removing coins"), "Penalty");
    fireEvent.press(getAllByText("Remove Coins")[1]);
    await waitFor(() => expect(mockRemoveCoins).toHaveBeenCalledWith("group-1", 25, "Penalty"));
  });

  it("shows missing params error", () => {
    mockParams = { tripId: "", groupId: "", groupName: "", groupCoins: "0" };
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<CoinOperationScreen operation="add" />);
    fireEvent.changeText(getByPlaceholderText("Enter amount"), "10");
    fireEvent.changeText(getByPlaceholderText("Describe why you are adding coins"), "Reason");
    fireEvent.press(getAllByText("Add Coins")[1]);
    expect(mockAlert).toHaveBeenCalledWith("Error", "Trip and group are required.");
  });
});
