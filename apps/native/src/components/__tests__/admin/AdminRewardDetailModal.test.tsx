import type React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import AdminRewardDetailModal from "../../admin/rewards/AdminRewardDetailModal";

const mockUpdateReward = jest.fn();
const mockDeleteReward = jest.fn();
const mockSetRewardHidden = jest.fn();
const mockUpdatePurchaseStatus = jest.fn();
const mockUpload = jest.fn();

const mockReward = {
  id: "reward-1",
  name: "Test Reward",
  description: "Test description",
  availableQuantity: 10,
  coinCost: 25,
  originalCoinCost: 25,
  images: ["reward-image.jpg"],
  image: "reward-image.jpg",
  signedImageUrls: [],
  signedImageUrl: null,
  isHidden: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  createdBy: { firstName: "Ada", lastName: "Lovelace" },
  purchases: [
    {
      id: "purchase-1",
      quantity: 1,
      totalCost: 25,
      status: "BOUGHT",
      collectionMethod: "",
      purchasedBy: { firstName: "John", lastName: "Smith" },
    },
  ],
};

jest.mock("~/hooks/rewards", () => ({
  useReward: () => ({ data: mockReward, isLoading: false }),
  useUpdateReward: () => ({ mutateAsync: mockUpdateReward, isPending: false }),
  useDeleteReward: () => ({ mutateAsync: mockDeleteReward, isPending: false }),
  useSetRewardHidden: () => ({ mutateAsync: mockSetRewardHidden, isPending: false }),
  useUpdateRewardPurchaseStatus: () => ({ mutateAsync: mockUpdatePurchaseStatus, isPending: false }),
}));

jest.mock("~/hooks/files", () => ({
  useFileUpload: () => ({ upload: mockUpload, status: "idle" }),
}));

interface AppModalShellProps {
  children: React.ReactNode;
  visible: boolean;
  title: string;
  onClose: () => void;
}

interface AppModalFooterProps {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  isPrimaryLoading?: boolean;
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
}

interface ThemedTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
}

jest.mock("~/components/common/ui", () => {
   
  const React = jest.requireActual<typeof import("react")>("react");
   
  const { View, Text, TouchableOpacity, TextInput } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    AppModalShell: ({ children, visible, title, onClose }: AppModalShellProps) => visible ? (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
        {children}
      </View>
    ) : null,
    AppModalFooter: ({ primaryLabel, onPrimary, secondaryLabel, onSecondary, isPrimaryLoading }: AppModalFooterProps) => (
      <View>
        <TouchableOpacity onPress={onPrimary} disabled={isPrimaryLoading}><Text>{primaryLabel}</Text></TouchableOpacity>
        <TouchableOpacity onPress={onSecondary}><Text>{secondaryLabel}</Text></TouchableOpacity>
      </View>
    ),
    FormField: ({ children, label }: FormFieldProps) => (
      <View><Text>{label}</Text>{children}</View>
    ),
    ThemedTextInput: ({ value, onChangeText, placeholder, keyboardType, multiline }: ThemedTextInputProps) => (
      <TextInput value={value} placeholder={placeholder} keyboardType={keyboardType} multiline={multiline} onChangeText={onChangeText} />
    ),
  };
});

describe("AdminRewardDetailModal", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("renders the reward details view", () => {
    const { getByDisplayValue } = renderWithProviders(<AdminRewardDetailModal rewardId="reward-1" onClose={jest.fn()} />);
    expect(getByDisplayValue("Test Reward")).toBeTruthy();
    expect(getByDisplayValue("Test description")).toBeTruthy();
    expect(getByDisplayValue("10")).toBeTruthy();
  });

  it("calls onClose from the modal shell", () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(<AdminRewardDetailModal rewardId="reward-1" onClose={onClose} />);
    fireEvent.press(getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("allows editing the reward name", () => {
    const { getByPlaceholderText } = renderWithProviders(<AdminRewardDetailModal rewardId="reward-1" onClose={jest.fn()} />);
    const nameInput = getByPlaceholderText("Reward name");
    fireEvent.changeText(nameInput, "Updated Reward");
    expect(nameInput.props.value).toBe("Updated Reward");
  });
});
