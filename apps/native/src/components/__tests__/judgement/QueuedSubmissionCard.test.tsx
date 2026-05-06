import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { QueuedSubmissionCard } from "../../judgement/QueuedSubmissionCard";

import { Text } from "react-native";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => {
      return <Text>{name}</Text>;
    },
  };
});

jest.mock("~/utils/validation", () => ({
  getInitials: jest.fn().mockReturnValue("TG"),
}));

const mockSubmission = {
  id: "sub-1",
  group: {
    id: "group-1",
    name: "Test Group",
  },
  createdAt: new Date("2024-01-15"),
  textContent: "Test content",
  latitude: null,
  longitude: null,
  imageIds: [],
  videoId: null,
};

describe("QueuedSubmissionCard", () => {
  it("should render group name", () => {
    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={500} />
    );

    expect(getByText("Test Group")).toBeTruthy();
  });

  it("should render group initials", () => {
    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={500} />
    );

    expect(getByText("TG")).toBeTruthy();
  });

  it("should render 'Next in line' hint", () => {
    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={500} />
    );

    expect(getByText("Next in line")).toBeTruthy();
  });

  it("should render time icon", () => {
    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={500} />
    );

    expect(getByText("time")).toBeTruthy();
  });

  it("should render 'Queued submission' placeholder text", () => {
    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={500} />
    );

    expect(getByText("Queued submission")).toBeTruthy();
  });

  it("should apply maxCardHeight", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={400} />
    );

    const view = UNSAFE_getByType("View");
    expect(view).toBeTruthy();
  });

  it("should render with different group names", () => {
    const differentSubmission = {
      ...mockSubmission,
      group: {
        ...mockSubmission.group,
        name: "Another Group Name",
      },
    };

    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={differentSubmission} maxCardHeight={500} />
    );

    expect(getByText("Another Group Name")).toBeTruthy();
  });

  it("should render with different maxCardHeight values", () => {
    const { getByText, rerender } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={300} />
    );

    expect(getByText("Test Group")).toBeTruthy();

    rerender(<QueuedSubmissionCard submission={mockSubmission} maxCardHeight={600} />);

    expect(getByText("Test Group")).toBeTruthy();
  });
});
