import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeCommunitySubmissionsCard } from "../../../trips/challenges/ChallengeCommunitySubmissionsCard";

jest.mock("~/hooks/files", () => ({
  useFileDownload: () => ({
    download: jest.fn().mockResolvedValue(undefined),
    status: "success",
    file: null,
    reset: jest.fn(),
    abort: jest.fn(),
  }),
}));

describe("ChallengeCommunitySubmissionsCard", () => {
  const mockSubmissions = [
    {
      id: "1",
      status: "APPROVED" as const,
      ranking: 1,
      createdAt: "2024-01-01T10:00:00Z",
      imageIds: ["image1"],
      group: { id: "g1", name: "Group 1" },
    },
    {
      id: "2",
      status: "APPROVED" as const,
      ranking: 2,
      createdAt: "2024-01-01T11:00:00Z",
      imageIds: ["image2"],
      group: { id: "g2", name: "Group 2" },
    },
    {
      id: "3",
      status: "APPROVED" as const,
      ranking: 3,
      createdAt: "2024-01-01T12:00:00Z",
      imageIds: ["image3"],
      group: { id: "g3", name: "Group 3" },
    },
    {
      id: "4",
      status: "APPROVED" as const,
      ranking: null,
      createdAt: "2024-01-01T13:00:00Z",
      imageIds: ["image4"],
      group: { id: "g4", name: "Group 4" },
    },
  ];

  it("renders the empty state when there are no submissions", () => {
    renderWithProviders(<ChallengeCommunitySubmissionsCard submissions={[]} showPodium={false} />);

    expect(screen.getAllByText("Groups submissions").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("No photos yet. Submit first and set the pace.").length,
    ).toBeGreaterThan(0);
  });

  it("renders podium and gallery sections when enabled", () => {
    renderWithProviders(
      <ChallengeCommunitySubmissionsCard submissions={mockSubmissions} showPodium={true} />,
    );

    expect(screen.getByText("4 photos uploaded")).toBeOnTheScreen();
    expect(screen.getByText("Top 3")).toBeOnTheScreen();
    expect(screen.getByText("More photos")).toBeOnTheScreen();
    expect(screen.getByText("View all (4)")).toBeOnTheScreen();
    expect(screen.getByText("2nd Place")).toBeOnTheScreen();
    expect(screen.getByText("3rd Place")).toBeOnTheScreen();
  });

  it("renders a gallery section when podium is disabled", () => {
    renderWithProviders(
      <ChallengeCommunitySubmissionsCard submissions={mockSubmissions} showPodium={false} />,
    );

    expect(screen.getByText("Gallery")).toBeOnTheScreen();
    expect(screen.queryByText("Top 3")).toBeNull();
  });

  it("filters out non-approved submissions and submissions without images", () => {
    const mixedSubmissions = [
      ...mockSubmissions,
      {
        id: "5",
        status: "PENDING" as const,
        ranking: null,
        createdAt: "2024-01-01T14:00:00Z",
        imageIds: ["image5"],
        group: { id: "g5", name: "Group 5" },
      },
      {
        id: "6",
        status: "APPROVED" as const,
        ranking: null,
        createdAt: "2024-01-01T15:00:00Z",
        imageIds: [],
        group: { id: "g6", name: "Group 6" },
      },
    ];

    renderWithProviders(
      <ChallengeCommunitySubmissionsCard submissions={mixedSubmissions} showPodium={false} />,
    );

    expect(screen.getByText("4 photos uploaded")).toBeOnTheScreen();
  });
});
