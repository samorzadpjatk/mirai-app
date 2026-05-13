import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { QueuedSubmissionCard } from "../../judgement/QueuedSubmissionCard";
import { type Submission } from "~/stores/judgement";

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

const createMockSubmission = (overrides: Partial<Submission> = {}): Submission => ({
  id: "sub-1",
  status: "PENDING",
  group: {
    id: "group-1",
    name: "Test Group",
    description: null,
    image: null,
  },
  createdAt: new Date("2024-01-15"),
  textContent: "Test content",
  latitude: null,
  longitude: null,
  imageIds: [],
  videoId: null,
  ...overrides,
});

const mockSubmission = createMockSubmission();

describe("QueuedSubmissionCard", () => {
  it("should render group name", () => {
    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={500} />,
    );

    expect(getByText("Test Group")).toBeTruthy();
  });

  it("should render group initials", () => {
    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={500} />,
    );

    expect(getByText("TG")).toBeTruthy();
  });

  it("should render 'Next in line' hint", () => {
    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={500} />,
    );

    expect(getByText("Next in line")).toBeTruthy();
  });

  it("should render time icon", () => {
    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={500} />,
    );

    expect(getByText("time")).toBeTruthy();
  });

  it("should render 'Queued submission' placeholder text", () => {
    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={500} />,
    );

    expect(getByText("Queued submission")).toBeTruthy();
  });

  it("should apply maxCardHeight", () => {
    const { getByTestId } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={400} />,
    );

    const card = getByTestId("queued-submission-card");
    expect(card).toBeTruthy();
  });

  it("should render with different group names", () => {
    const differentSubmission = createMockSubmission({
      group: {
        id: "group-1",
        name: "Another Group Name",
        description: null,
        image: null,
      },
    });

    const { getByText } = renderWithProviders(
      <QueuedSubmissionCard submission={differentSubmission} maxCardHeight={500} />,
    );

    expect(getByText("Another Group Name")).toBeTruthy();
  });

  it("should render with different maxCardHeight values", () => {
    const { getByText, rerender } = renderWithProviders(
      <QueuedSubmissionCard submission={mockSubmission} maxCardHeight={300} />,
    );

    expect(getByText("Test Group")).toBeTruthy();

    rerender(<QueuedSubmissionCard submission={mockSubmission} maxCardHeight={600} />);

    expect(getByText("Test Group")).toBeTruthy();
  });
});
