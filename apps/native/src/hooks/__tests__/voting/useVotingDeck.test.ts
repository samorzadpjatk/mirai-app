import { describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import {
  type VotingDeckSource,
  type VotingSubmission,
  buildVotingDeck,
  useVotingDeck,
} from "../../voting/useVotingDeck";

const makeSource = (overrides: Partial<VotingDeckSource> = {}): VotingDeckSource => ({
  id: "sub-1",
  groupId: "group-1",
  status: "APPROVED",
  imageIds: ["images/1.jpg"],
  videoId: null,
  textContent: null,
  createdAt: "2024-01-01T10:00:00Z",
  group: { name: "Team Alpha" },
  ...overrides,
});

const makeDeckEntry = (overrides: Partial<VotingSubmission> = {}): VotingSubmission => ({
  id: "sub-1",
  groupId: "group-1",
  groupName: "Team Alpha",
  imagePath: "images/1.jpg",
  videoPath: null,
  createdAt: "2024-01-01T10:00:00Z",
  ...overrides,
});

describe("buildVotingDeck", () => {
  it("keeps video submissions in the deck", () => {
    const deck = buildVotingDeck([
      makeSource({ id: "image-sub" }),
      makeSource({
        id: "video-sub",
        groupId: "group-2",
        imageIds: [],
        videoId: "videos/1.mp4",
      }),
    ]);

    expect(deck.map((entry) => entry.id)).toEqual(["image-sub", "video-sub"]);
    expect(deck[1]?.videoPath).toBe("videos/1.mp4");
    expect(deck[1]?.imagePath).toBeNull();
  });

  it("keeps text submissions when media is not required", () => {
    const deck = buildVotingDeck([
      makeSource({ id: "text-sub", imageIds: [], videoId: null, textContent: "42" }),
    ]);

    expect(deck).toHaveLength(1);
    expect(deck[0]?.textContent).toBe("42");
  });

  it("drops submissions without media when media is required", () => {
    const deck = buildVotingDeck(
      [
        makeSource({ id: "text-sub", imageIds: [], videoId: null, textContent: "42" }),
        makeSource({ id: "video-sub", groupId: "group-2", imageIds: [], videoId: "videos/1.mp4" }),
      ],
      { requireMedia: true },
    );

    expect(deck.map((entry) => entry.id)).toEqual(["video-sub"]);
  });

  it("drops rejected submissions", () => {
    const deck = buildVotingDeck([
      makeSource({ id: "ok-sub" }),
      makeSource({ id: "rejected-sub", groupId: "group-2", status: "REJECTED" }),
    ]);

    expect(deck.map((entry) => entry.id)).toEqual(["ok-sub"]);
  });

  it("drops the voter's own group", () => {
    const deck = buildVotingDeck(
      [makeSource({ id: "mine" }), makeSource({ id: "theirs", groupId: "group-2" })],
      { excludeGroupId: "group-1" },
    );

    expect(deck.map((entry) => entry.id)).toEqual(["theirs"]);
  });

  it("returns an empty deck for missing data", () => {
    expect(buildVotingDeck(undefined)).toEqual([]);
  });
});

describe("useVotingDeck", () => {
  const twoSubmissions: VotingSubmission[] = [
    makeDeckEntry({ id: "sub-1", groupId: "group-1" }),
    makeDeckEntry({ id: "sub-2", groupId: "group-2", imagePath: "images/2.jpg" }),
  ];

  it("blocks instead of leaving the deck empty when there is nothing to compare", () => {
    const onPhaseChange = jest.fn();
    const { result } = renderHook(() =>
      useVotingDeck({ votingSubmissions: [], onPhaseChange: onPhaseChange as never }),
    );

    act(() => {
      result.current.startComparing();
    });

    expect(result.current.phase).toBe("blocked");
    expect(result.current.bootstrapped).toBe(true);
    expect(result.current.currentPair).toBeNull();
  });

  it("marks the deck as bootstrapped once comparing starts", () => {
    const { result } = renderHook(() => useVotingDeck({ votingSubmissions: twoSubmissions }));

    act(() => {
      result.current.startComparing();
    });

    expect(result.current.phase).toBe("comparing");
    expect(result.current.bootstrapped).toBe(true);
    expect(result.current.currentPair).not.toBeNull();
  });

  it("reaches the confirming phase and exposes a podium", () => {
    const { result } = renderHook(() => useVotingDeck({ votingSubmissions: twoSubmissions }));

    act(() => {
      result.current.startComparing();
    });

    for (let i = 0; i < 5; i += 1) {
      const pair = result.current.currentPair;
      if (!pair) break;
      act(() => {
        result.current.handlePickWinner(pair[0]);
      });
    }

    expect(result.current.phase).toBe("confirming");
    expect(result.current.finalTopThree).toHaveLength(2);
  });

  it("moves to the done phase when voting is completed", () => {
    const { result } = renderHook(() => useVotingDeck({ votingSubmissions: twoSubmissions }));

    act(() => {
      result.current.completeVoting();
    });

    expect(result.current.phase).toBe("done");
    expect(result.current.bootstrapped).toBe(true);
    expect(result.current.currentPair).toBeNull();
  });

  it("records the blocked reason", () => {
    const { result } = renderHook(() => useVotingDeck({ votingSubmissions: twoSubmissions }));

    act(() => {
      result.current.blockVoting("Nope");
    });

    expect(result.current.phase).toBe("blocked");
    expect(result.current.blockedReason).toBe("Nope");
  });
});
