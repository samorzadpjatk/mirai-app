import React from "react";
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

jest.mock("~/components/common/ui", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity, TextInput } = require("react-native");
  return {
    AppModalShell: ({ children, visible, title, onClose }: { children: React.ReactNode; visible: boolean; title: string; onClose: () => void; }) => visible ? (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
        {children}
      </View>
    ) : null,
    AppModalFooter: ({ primaryLabel, onPrimary, secondaryLabel, onSecondary, isPrimaryLoading }: { primaryLabel: string; onPrimary: () => void; secondaryLabel: string; onSecondary: () => void; isPrimaryLoading?: boolean; }) => (
      <View>
        <TouchableOpacity onPress={onPrimary} disabled={isPrimaryLoading}><Text>{primaryLabel}</Text></TouchableOpacity>
        <TouchableOpacity onPress={onSecondary}><Text>{secondaryLabel}</Text></TouchableOpacity>
      </View>
    ),
    FormField: ({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean; }) => (<View><Text>{label}{required ? "*" : ""}</Text>{children}</View>),
    ThemedTextInput: ({ value, onChangeText, placeholder, keyboardType, multiline }: { value: string; onChangeText: (text: string) => void; placeholder?: string; keyboardType?: string; multiline?: boolean; }) => (<TextInput value={value} placeholder={placeholder} keyboardType={keyboardType as any} multiline={multiline} onChangeText={onChangeText} />),
  };
});

describe("EditChallengeModal", () => {
  const mockChallenge = { id: "challenge-1", tripId: "trip-1", title: "Test Challenge", description: "Test description", points: 100, icon: "star", category: "standard" as const, status: "draft" as const, createdAt: new Date(), updatedAt: new Date() };
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
