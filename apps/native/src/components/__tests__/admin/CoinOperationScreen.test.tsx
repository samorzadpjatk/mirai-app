import { fireEvent, waitFor } from "@testing-library/react-native";
import { Alert, Pressable, Text, type TextInput, View } from "react-native";
import { CoinOperationScreen } from "../../admin/coins/CoinOperationScreen";
import { renderWithProviders } from "../helpers/renderWithProviders";

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

const mockParamsWrapper = {
  current: {
    tripId: "trip-1",
    groupId: "group-1",
    groupName: "Test Group",
    groupCoins: "100",
  },
};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParamsWrapper.current,
  useRouter: () => ({ back: mockBack }),
}));

const mockGroupsWrapper = {
  current: [{ id: "group-1", name: "Test Group", coins: 100 }] as Array<{
    id: string;
    name: string;
    coins: number;
  }>,
};

jest.mock("~/hooks/admin/useAdminCoins", () => ({
  useAdminCoins: () => ({
    groups: mockGroupsWrapper.current,
    groupsLoading: false,
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

jest.mock("~/components/admin/AdminHeader", () => {
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    AdminHeader: ({ title, subtitle }: AdminHeaderProps) => (
      <View>
        <Text testID="screen-title">{title}</Text>
        {subtitle ? <Text>{subtitle}</Text> : null}
      </View>
    ),
  };
});

interface PrimaryLoadingButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

jest.mock("~/components/common/buttons/PrimaryLoadingButton", () => {
  const { Pressable, Text } = require("react-native");
  return {
    __esModule: true,
    PrimaryLoadingButton: ({ label, onPress, isLoading, disabled }: PrimaryLoadingButtonProps) => (
      <Pressable onPress={onPress} disabled={disabled ?? isLoading}>
        <Text>{isLoading ? "Loading..." : label}</Text>
      </Pressable>
    ),
  };
});

describe("CoinOperationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    mockParamsWrapper.current = {
      tripId: "trip-1",
      groupId: "group-1",
      groupName: "Test Group",
      groupCoins: "100",
    };
    mockGroupsWrapper.current = [{ id: "group-1", name: "Test Group", coins: 100 }];
  });

  it("renders group summary", () => {
    const { getByTestId, getByDisplayValue } = renderWithProviders(
      <CoinOperationScreen operation="add" />,
    );
    expect(getByTestId("screen-title").props.children).toBe("Add Coins");
    expect(getByDisplayValue("Test Group")).toBeTruthy();
    expect(getByDisplayValue("100 coins")).toBeTruthy();
  });

  it("adds coins", async () => {
    mockAddCoins.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getAllByText } = renderWithProviders(
      <CoinOperationScreen operation="add" />,
    );
    fireEvent.changeText(getByPlaceholderText("Enter amount"), "50");
    fireEvent.changeText(getByPlaceholderText("Describe why you are adding coins"), "Bonus");
    fireEvent.press(getAllByText("Add Coins")[1]!);
    await waitFor(() => expect(mockAddCoins).toHaveBeenCalledWith("group-1", 50, "Bonus"));
  });

  it("removes coins", async () => {
    mockRemoveCoins.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getAllByText } = renderWithProviders(
      <CoinOperationScreen operation="remove" />,
    );
    fireEvent.changeText(getByPlaceholderText("Enter amount"), "25");
    fireEvent.changeText(getByPlaceholderText("Describe why you are removing coins"), "Penalty");
    fireEvent.press(getAllByText("Remove Coins")[1]!);
    await waitFor(() => expect(mockRemoveCoins).toHaveBeenCalledWith("group-1", 25, "Penalty"));
  });

  // The balance used to be read from the navigation params, so it froze at
  // whatever the list happened to show when the row was tapped -- the screen
  // could tell a moderator a group had 100 coins right after they awarded it
  // another 150.
  it("shows the balance the server reports, not the one it was navigated with", () => {
    mockGroupsWrapper.current = [{ id: "group-1", name: "Test Group", coins: 250 }];
    const { getByDisplayValue } = renderWithProviders(<CoinOperationScreen operation="add" />);

    expect(getByDisplayValue("250 coins")).toBeTruthy();
  });

  it("falls back to the navigated balance until the group list arrives", () => {
    mockGroupsWrapper.current = [];
    const { getByDisplayValue } = renderWithProviders(<CoinOperationScreen operation="add" />);

    expect(getByDisplayValue("100 coins")).toBeTruthy();
  });

  it("shows missing params error", () => {
    mockParamsWrapper.current = { tripId: "", groupId: "", groupName: "", groupCoins: "0" };
    const { getByPlaceholderText, getAllByText } = renderWithProviders(
      <CoinOperationScreen operation="add" />,
    );
    fireEvent.changeText(getByPlaceholderText("Enter amount"), "10");
    fireEvent.changeText(getByPlaceholderText("Describe why you are adding coins"), "Reason");
    fireEvent.press(getAllByText("Add Coins")[1]!);
    expect(mockAlert).toHaveBeenCalledWith("Error", "Trip and group are required.");
  });
});
