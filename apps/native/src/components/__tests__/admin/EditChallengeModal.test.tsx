import type React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import EditChallengeModal from "../../admin/challenges/EditChallengeModal";

const mockUpdateChallenge = jest.fn();

jest.mock("~/hooks/trips", () => ({
  useTrips: () => ({ trips: [{ id: "trip-1", name: "Trip One" }, { id: "trip-2", name: "Trip Two" }], hasNextPage: false, isFetchingNextPage: false, fetchNextPage: jest.fn() }),
}));

jest.mock("~/hooks/admin", () => ({
  useAdminChallenges: () => ({ updateChallenge: mockUpdateChallenge }),
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
  keyboardType?: string;
  multiline?: boolean;
}

jest.mock("~/components/common/ui", () => {
  const { View, Text, TouchableOpacity, TextInput } = jest.requireActual("react-native");
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
    FormField: ({ children, label, required }: FormFieldProps) => (<View><Text>{label}{required ? "*" : ""}</Text>{children}</View>),
    ThemedTextInput: ({ value, onChangeText, placeholder, keyboardType, multiline }: ThemedTextInputProps) => (<TextInput value={value} placeholder={placeholder} keyboardType={keyboardType as "default" | "numeric" | "email-address" | "phone-pad"} multiline={multiline} onChangeText={onChangeText} />),
  };
});

describe("EditChallengeModal", () => {
  const mockChallenge = {
    id: "challenge-1",
    tripId: "trip-1",
    title: "Test Challenge",
    description: "Test description",
    points: 100,
    icon: "star",
    category: "standard" as const,
    status: "draft" as const,
    submissionType: "IMAGE" as const,
    scoringCategory: "JUDGED_STAFF" as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  beforeEach(() => { jest.clearAllMocks(); });

  it("renders the edit challenge form", () => {
    const { getByPlaceholderText, getByDisplayValue } = renderWithProviders(
      <EditChallengeModal visible={true} challenge={mockChallenge} onClose={jest.fn()} />
    );

    expect(getByDisplayValue("Test Challenge")).toBeTruthy();
    expect(getByDisplayValue("Test description")).toBeTruthy();
    expect(getByPlaceholderText("Trip ID or search")).toBeTruthy();
  });

  it("calls onClose from the footer", () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(<EditChallengeModal visible={true} challenge={mockChallenge} onClose={onClose} />);
    fireEvent.press(getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("updates challenge title through the input", () => {
    const { getByDisplayValue } = renderWithProviders(<EditChallengeModal visible={true} challenge={mockChallenge} onClose={jest.fn()} />);
    const titleInput = getByDisplayValue("Test Challenge");
    fireEvent.changeText(titleInput, "Updated Challenge");
    expect(titleInput.props.value).toBe("Updated Challenge");
  });
});
