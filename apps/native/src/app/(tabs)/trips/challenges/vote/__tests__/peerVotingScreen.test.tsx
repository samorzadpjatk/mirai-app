import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { createORPCHandler, server } from "~/test-utils/msw/server";
import { renderWithMSW } from "~/test-utils/msw/test-wrapper";
import ChallengePeerVotingScreen from "../[id]";

const mockReact = React;
const mockText = Text;

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "challenge-1", tripId: "trip-1" }),
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: mockReplace,
    setParams: jest.fn(),
  }),
}));

jest.mock("~/components/common/SubmissionVideoPlayer", () => ({
  __esModule: true,
  SubmissionVideoPlayer: ({ storagePath }: { storagePath?: string | null }) =>
    mockReact.createElement(mockText, { testID: "submission-video-player" }, storagePath ?? ""),
}));

const FUTURE_ISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const makeSubmission = (index: number, overrides: Record<string, unknown> = {}) => ({
  id: `sub-${index}`,
  challengeId: "challenge-1",
  groupId: `group-${index}`,
  imageIds: [`images/${index}.jpg`],
  videoId: null,
  textContent: null,
  latitude: null,
  longitude: null,
  status: "APPROVED",
  reviewedById: null,
  reviewedAt: null,
  rejectionReason: null,
  awardedPoints: 0,
  bonusPoints: 0,
  ranking: null,
  voteCount: 0,
  voteScore: 0,
  createdAt: `2025-01-0${index}T10:00:00.000Z`,
  updatedAt: `2025-01-0${index}T10:00:00.000Z`,
  group: { id: `group-${index}`, name: `Team ${index}`, description: null, image: null },
  reviewedBy: null,
  ...overrides,
});

interface SubmitVotesInput {
  tripId: string;
  challengeId: string;
  votes: { submissionId: string; votePosition: number; votePoints: number }[];
}

function registerHandlers(options: {
  submissions: ReturnType<typeof makeSubmission>[];
  myVotes?: unknown[];
  onSubmitVotes: (input: SubmitVotesInput) => void;
}) {
  server.use(
    createORPCHandler(["trip", "getByIdFull"], () => ({
      trip: {
        id: "trip-1",
        name: "Test Trip",
        description: "",
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: FUTURE_ISO,
        backgroundImagePath: null,
        groups: [],
        participants: [],
        tripSponsors: [],
      },
      groups: [],
      challenges: [],
      sponsors: [],
      latestNews: [],
    })),
    createORPCHandler(["challenge", "getById"], () => ({
      id: "challenge-1",
      tripId: "trip-1",
      name: "Best Photo",
      description: "",
      image: null,
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      status: "VOTING_PHASE",
      startTime: null,
      endTime: null,
      votingStartTime: null,
      votingEndTime: null,
      basePoints: 0,
      firstPlacePoints: 0,
      secondPlacePoints: 0,
      thirdPlacePoints: 0,
      autoApprove: false,
    })),
    createORPCHandler(["challengeSubmission", "getByChallenge"], () => options.submissions),
    createORPCHandler(["challengeVote", "getMyByChallenge"], () => options.myVotes ?? []),
    createORPCHandler(["user", "getMyWithGroup"], () => ({
      id: "user-1",
      trips: [{ id: "trip-1", group: { id: "group-99", name: "Mine" } }],
    })),
    createORPCHandler(["challengeVote", "submitVotes"], (input) => {
      options.onSubmitVotes(input as unknown as SubmitVotesInput);
      return [];
    }),
    createORPCHandler(["storage", "createDownloadUrl"], () => ({
      signedUrl: "https://example.com/image.jpg",
      expiresAt: FUTURE_ISO,
    })),
  );
}

describe("ChallengePeerVotingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  it("submits the whole podium in a single mutation and confirms the vote", async () => {
    const submitCalls: SubmitVotesInput[] = [];
    registerHandlers({
      submissions: [makeSubmission(1), makeSubmission(2), makeSubmission(3)],
      onSubmitVotes: (input) => submitCalls.push(input),
    });

    const { getAllByText, getByTestId, queryByTestId } = renderWithMSW(
      <ChallengePeerVotingScreen />,
    );

    await waitFor(() => expect(getAllByText("Pick this").length).toBe(2), { timeout: 8000 });

    // Every pair gets compared, then the deck moves on to the confirmation step.
    for (let i = 0; i < 6 && !queryByTestId("confirm-podium-button"); i += 1) {
      fireEvent.press(getAllByText("Pick this")[0] as never);
    }

    await waitFor(() => expect(getByTestId("confirm-podium-button")).toBeTruthy());

    fireEvent.press(getByTestId("confirm-podium-button"));

    await waitFor(() => expect(submitCalls).toHaveLength(1));

    expect(submitCalls[0]?.votes).toHaveLength(3);
    expect(submitCalls[0]?.votes.map((vote) => vote.votePosition)).toEqual([1, 2, 3]);
    expect(submitCalls[0]?.votes.map((vote) => vote.votePoints)).toEqual([3, 2, 1]);
    expect(new Set(submitCalls[0]?.votes.map((vote) => vote.submissionId)).size).toBe(3);

    // The user stays on the screen and sees a confirmation instead of being bounced.
    await waitFor(() => expect(getByTestId("vote-submitted-card")).toBeTruthy());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("keeps video submissions in the deck", async () => {
    registerHandlers({
      submissions: [
        makeSubmission(1, { imageIds: [], videoId: "videos/1.mp4" }),
        makeSubmission(2, { imageIds: [], videoId: "videos/2.mp4" }),
      ],
      onSubmitVotes: () => undefined,
    });

    const { getAllByTestId } = renderWithMSW(<ChallengePeerVotingScreen />);

    await waitFor(() => expect(getAllByTestId("submission-video-player").length).toBe(2));
  });

  it("shows the confirmation when the user has already voted", async () => {
    registerHandlers({
      submissions: [makeSubmission(1), makeSubmission(2)],
      myVotes: [{ id: "vote-1", submissionId: "sub-1", votePosition: 1, votePoints: 3 }],
      onSubmitVotes: () => undefined,
    });

    const { getByTestId } = renderWithMSW(<ChallengePeerVotingScreen />);

    await waitFor(() => expect(getByTestId("vote-submitted-card")).toBeTruthy());
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
