import type React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import AdminRewardsModal from "../../admin/rewards/AdminRewardsModal";

const mockCreateReward = jest.fn();
const mockUpload = jest.fn();

jest.mock("~/hooks/rewards", () => ({
  useCreateReward: () => ({ mutateAsync: mockCreateReward, isPending: false }),
}));

jest.mock("~/hooks/files", () => ({
  useFileUpload: () => ({ upload: mockUpload, status: "idle", progress: { percent: null } }),
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
  required?: boolean;
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
    FormField: ({ children, label, required }: FormFieldProps) => (
      <View>
        <Text>{label}{required ? "*" : ""}</Text>
        {children}
      </View>
    ),
    ThemedTextInput: ({ value, onChangeText, placeholder, keyboardType, multiline }: ThemedTextInputProps) => (
      <TextInput value={value} placeholder={placeholder} keyboardType={keyboardType} multiline={multiline} onChangeText={onChangeText} />
    ),
  };
});

describe("AdminRewardsModal", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("renders the new reward form", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <AdminRewardsModal visible={true} onClose={jest.fn()} tripId="trip-1" />
    );

    expect(getByText("New Reward")).toBeTruthy();
    expect(getByPlaceholderText("e.g. Branded T-shirt")).toBeTruthy();
    expect(getByPlaceholderText("0")).toBeTruthy();
    expect(getByPlaceholderText("5")).toBeTruthy();
  });

  it("does not render when hidden", () => {
    const { queryByText } = renderWithProviders(<AdminRewardsModal visible={false} onClose={jest.fn()} tripId="trip-1" />);
    expect(queryByText("New Reward")).toBeNull();
  });

  it("calls onClose from the footer", () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(<AdminRewardsModal visible={true} onClose={onClose} tripId="trip-1" />);
    fireEvent.press(getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("allows editing reward fields", () => {
    const { getByPlaceholderText } = renderWithProviders(<AdminRewardsModal visible={true} onClose={jest.fn()} tripId="trip-1" />);
    const nameInput = getByPlaceholderText("e.g. Branded T-shirt");
    fireEvent.changeText(nameInput, "Hoodie");
    expect(nameInput.props.value).toBe("Hoodie");
  });
});
