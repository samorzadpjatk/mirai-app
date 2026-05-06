import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AdminActivityCard } from "../../admin/activity/AdminActivityCard";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

describe("AdminActivityCard", () => {
  const now = new Date("2026-01-01T12:00:00.000Z").getTime();
  const spy = jest.spyOn(Date, "now").mockReturnValue(now);

  interface SubmissionActivity {
    group: { name: string };
  }

  interface Activity {
    id: string;
    tripId: string;
    activityType: "submission";
    title: string;
    description: string;
    imageUrl: string;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: Date;
    submissionActivity: SubmissionActivity;
  }

  const baseActivity: Activity = {
    id: "activity-1",
    tripId: "trip-1",
    activityType: "submission",
    title: "Test Activity",
    description: "This is a test description",
    imageUrl: "https://example.com/image.jpg",
    isPinned: false,
    isHidden: false,
    createdAt: new Date(now - 5 * 60000),
    submissionActivity: {
      group: { name: "Test Group" },
    },
  };

  const callbacks = {
    onEdit: jest.fn(),
    onPin: jest.fn(),
    onHide: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    spy.mockRestore();
  });

  it("renders activity content and group name", () => {
    const { getByText } = renderWithProviders(
      <AdminActivityCard item={baseActivity} canDelete isBusy={false} {...callbacks} />
    );

    expect(getByText("Test Activity")).toBeTruthy();
    expect(getByText("submission")).toBeTruthy();
    expect(getByText("Group: Test Group")).toBeTruthy();
    expect(getByText("This is a test description")).toBeTruthy();
    expect(getByText("5m ago")).toBeTruthy();
  });

  it("invokes callbacks from action buttons", () => {
    const { getByText } = renderWithProviders(
      <AdminActivityCard item={baseActivity} canDelete isBusy={false} {...callbacks} />
    );

    fireEvent.press(getByText("Edit"));
    fireEvent.press(getByText("Pin"));
    fireEvent.press(getByText("Hide"));
    fireEvent.press(getByText("Delete"));

    expect(callbacks.onEdit).toHaveBeenCalledWith(baseActivity);
    expect(callbacks.onPin).toHaveBeenCalledWith(baseActivity);
    expect(callbacks.onHide).toHaveBeenCalledWith(baseActivity);
    expect(callbacks.onDelete).toHaveBeenCalledWith(baseActivity);
  });

  it("shows pinned and hidden labels when needed", () => {
    const { getByText } = renderWithProviders(
      <AdminActivityCard
        item={{ ...baseActivity, isPinned: true, isHidden: true, createdAt: new Date(now) }}
        canDelete={false}
        isBusy={false}
        {...callbacks}
      />
    );

    expect(getByText("Pinned")).toBeTruthy();
    expect(getByText("Hidden")).toBeTruthy();
    expect(getByText("Unpin")).toBeTruthy();
    expect(getByText("Unhide")).toBeTruthy();
  });
});
