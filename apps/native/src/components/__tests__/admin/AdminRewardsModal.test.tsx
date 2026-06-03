import { fireEvent } from "@testing-library/react-native";
import type React from "react";
import type { Text, TextInput, TouchableOpacity, View } from "react-native";
import AdminRewardsModal from "../../admin/rewards/AdminRewardsModal";
import { renderWithProviders } from "../helpers/renderWithProviders";

const mockCreateReward = jest.fn();
const mockUpload = jest.fn();

jest.mock("~/hooks/rewards", () => ({
  useCreateReward: () => ({ mutateAsync: mockCreateReward, isPending: false }),
}));

jest.mock("~/hooks/files", () => ({
  useFileUpload: () => ({ upload: mockUpload, status: "idle", progress: { percent: null } }),
}));

describe("AdminRewardsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the new reward form", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <AdminRewardsModal visible={true} onClose={jest.fn()} tripId="trip-1" />,
    );

    expect(getByText("New Reward")).toBeTruthy();
    expect(getByPlaceholderText("e.g. Branded T-shirt")).toBeTruthy();
    expect(getByPlaceholderText("0")).toBeTruthy();
    expect(getByPlaceholderText("5")).toBeTruthy();
  });

  it("does not render when hidden", () => {
    const { queryByText } = renderWithProviders(
      <AdminRewardsModal visible={false} onClose={jest.fn()} tripId="trip-1" />,
    );
    expect(queryByText("New Reward")).toBeNull();
  });

  it("calls onClose from the footer", () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(
      <AdminRewardsModal visible={true} onClose={onClose} tripId="trip-1" />,
    );
    fireEvent.press(getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("allows editing reward fields", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <AdminRewardsModal visible={true} onClose={jest.fn()} tripId="trip-1" />,
    );
    const nameInput = getByPlaceholderText("e.g. Branded T-shirt");
    fireEvent.changeText(nameInput, "Hoodie");
    expect(nameInput.props.value).toBe("Hoodie");
  });
});
