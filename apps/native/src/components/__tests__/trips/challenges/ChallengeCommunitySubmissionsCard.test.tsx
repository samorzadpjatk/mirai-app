import React from "react";
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
    const { getAllByText } = renderWithProviders(
      <ChallengeCommunitySubmissionsCard submissions={[]} showPodium={false} />
    );

    expect(getAllByText("Groups submissions").length).toBeGreaterThan(0);
    expect(getAllByText("No photos yet. Submit first and set the pace.").length).toBeGreaterThan(0);
  });

  it("renders podium and gallery sections when enabled", () => {
    const { getByText } = renderWithProviders(
      <ChallengeCommunitySubmissionsCard submissions={mockSubmissions} showPodium={true} />
    );

    expect(getByText("4 photos uploaded")).toBeTruthy();
    expect(getByText("Top 3")).toBeTruthy();
    expect(getByText("More photos")).toBeTruthy();
    expect(getByText("View all (4)")).toBeTruthy();
    expect(getByText("2nd Place")).toBeTruthy();
    expect(getByText("3rd Place")).toBeTruthy();
  });

  it("renders a gallery section when podium is disabled", () => {
    const { getByText, queryByText } = renderWithProviders(
      <ChallengeCommunitySubmissionsCard submissions={mockSubmissions} showPodium={false} />
    );

    expect(getByText("Gallery")).toBeTruthy();
    expect(queryByText("Top 3")).toBeNull();
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

    const { getByText } = renderWithProviders(
      <ChallengeCommunitySubmissionsCard submissions={mixedSubmissions} showPodium={false} />
    );

    expect(getByText("4 photos uploaded")).toBeTruthy();
  });
});
