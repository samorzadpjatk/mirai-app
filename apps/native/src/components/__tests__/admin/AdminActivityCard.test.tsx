import { fireEvent, screen } from "@testing-library/react-native";
import { createMockActivity } from "../../../test-utils/activityMocks";
import { AdminActivityCard } from "../../admin/activity/AdminActivityCard";
import { renderWithProviders } from "../helpers/renderWithProviders";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

describe("AdminActivityCard", () => {
  const now = new Date("2026-01-01T12:00:00.000Z").getTime();
  const spy = jest.spyOn(Date, "now").mockReturnValue(now);

  const baseActivity = createMockActivity({
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
      submissionId: "",
      challengeId: "",
      groupId: "",
      hasVideo: false,
      isWinner: false,
      ranking: 0,
      pointsAwarded: 0,
      currentGroupRank: null,
      group: {
        id: "",
        name: "Test Group",
        image: "",
        coins: 0,
      },
      challenge: null,
      submission: null,
    },
  });

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
    renderWithProviders(
      <AdminActivityCard item={baseActivity} canDelete isBusy={false} {...callbacks} />,
    );

    expect(screen.getByText("Test Activity")).toBeTruthy();
    expect(screen.getByText("submission")).toBeTruthy();
    expect(screen.getByText("Group: Test Group")).toBeTruthy();
    expect(screen.getByText("This is a test description")).toBeTruthy();
    expect(screen.getByText("5m ago")).toBeTruthy();
  });

  it("invokes callbacks from action buttons", () => {
    renderWithProviders(
      <AdminActivityCard item={baseActivity} canDelete isBusy={false} {...callbacks} />,
    );

    fireEvent.press(screen.getByText("Edit"));
    fireEvent.press(screen.getByText("Pin"));
    fireEvent.press(screen.getByText("Hide"));
    fireEvent.press(screen.getByText("Delete"));

    expect(callbacks.onEdit).toHaveBeenCalledWith(baseActivity);
    expect(callbacks.onPin).toHaveBeenCalledWith(baseActivity);
    expect(callbacks.onHide).toHaveBeenCalledWith(baseActivity);
    expect(callbacks.onDelete).toHaveBeenCalledWith(baseActivity);
  });

  it("shows pinned and hidden labels when needed", () => {
    renderWithProviders(
      <AdminActivityCard
        item={createMockActivity({
          ...baseActivity,
          isPinned: true,
          isHidden: true,
          createdAt: new Date(now),
        })}
        canDelete={false}
        isBusy={false}
        {...callbacks}
      />,
    );

    expect(screen.getByText("Pinned")).toBeTruthy();
    expect(screen.getByText("Hidden")).toBeTruthy();
    expect(screen.getByText("Unpin")).toBeTruthy();
    expect(screen.getByText("Unhide")).toBeTruthy();
  });
});
