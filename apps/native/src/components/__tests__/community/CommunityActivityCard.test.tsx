import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { createMockActivity } from "../../../test-utils/activityMocks";
import {
  CommunityActivityCard,
  type CommunityFeedActivity,
} from "../../community/CommunityActivityCard";

describe("CommunityActivityCard", () => {
  const baseActivity: CommunityFeedActivity = createMockActivity({
    id: "1",
    tripId: "trip-1",
    activityType: "custom",
    title: "Test Activity",
    description: "Test description",
    createdAt: new Date(),
    reactionsSummary: {
      total: 5,
      counts: { heart: 3, fire: 1, clap: 1, star: 0 },
      myReactions: [],
    },
    admin: {
      id: "admin-1",
      firstName: "John",
      lastName: "Doe",
    },
  });

  it("renders with basic activity data", () => {
    render(<CommunityActivityCard activity={baseActivity} />);

    expect(screen.getByText("Test Activity")).toBeOnTheScreen();
    expect(screen.getByText("John Doe")).toBeOnTheScreen();
    expect(screen.getByText("Official post")).toBeOnTheScreen();
  });

  it("renders with user post activity type", () => {
    const userPostActivity = createMockActivity({
      id: "2",
      tripId: "trip-1",
      activityType: "user_post",
      title: "User Post Title",
      userPost: {
        authorId: "",
        additionalImages: [],
        author: {
          id: "",
          userId: "",
          tripId: "",
          groupId: null,
          user: {
            id: "user-1",
            firstName: "Jane",
            lastName: "Smith",
            hasAvatar: false,
          },
          group: {
            id: "",
            name: "Team Alpha",
            image: "",
          },
        },
      },
    });

    render(<CommunityActivityCard activity={userPostActivity} />);

    expect(screen.getByText("User Post Title")).toBeOnTheScreen();
    expect(screen.getByText("Jane Smith")).toBeOnTheScreen();
    expect(screen.getByText("Team Alpha")).toBeOnTheScreen();
  });

  it("renders with submission activity type", () => {
    const submissionActivity = createMockActivity({
      id: "3",
      tripId: "trip-1",
      activityType: "submission",
      title: "Submission Title",
      submissionActivity: {
        submissionId: "",
        challengeId: "",
        groupId: "group-1",
        hasVideo: false,
        isWinner: false,
        ranking: 3,
        pointsAwarded: 100,
        currentGroupRank: 3,
        challenge: {
          id: "",
          name: "Photo Challenge",
          status: "",
          submissionType: "",
          endTime: null,
        },
        group: {
          id: "group-1",
          name: "Team Beta",
          image: "",
          coins: 0,
        },
        submission: null,
      },
    });

    render(<CommunityActivityCard activity={submissionActivity} />);

    expect(screen.getByText("Submission Title")).toBeOnTheScreen();
    expect(screen.getByText("Team Beta")).toBeOnTheScreen();
    expect(screen.getByText("Miejsce w rankingu: #3")).toBeOnTheScreen();
  });

  it("renders with rank change activity type", () => {
    const rankChangeActivity = createMockActivity({
      id: "4",
      tripId: "trip-1",
      activityType: "rank_change",
      title: "Rank Change",
      description: "⬆ Ranked Team: #2 -> #1",
      rankChangeActivity: {
        groupId: "",
        newRank: 1,
        coinsGained: 50,
        totalCoins: 150,
        group: {
          id: "",
          name: "Ranked Team",
          image: "",
          coins: 0,
        },
      },
    });

    render(<CommunityActivityCard activity={rankChangeActivity} />);

    expect(screen.getByText("Rank Change")).toBeOnTheScreen();
    // Team name appears in both owner section and rank change message
    const teamElements = screen.getAllByText("Ranked Team");
    expect(teamElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Now #1")).toBeOnTheScreen();
  });

  it("renders with challenge event activity type", () => {
    const challengeEventActivity = createMockActivity({
      id: "5",
      tripId: "trip-1",
      activityType: "challenge_event",
      title: "Challenge Event",
      challengeActivity: {
        challengeId: "challenge-1",
        eventType: "challenge_started",
        endTime: null,
        submissionType: "",
        basePoints: 0,
        submissionCount: 0,
        challenge: {
          id: "",
          name: "New Challenge",
          description: "Challenge description",
          image: "",
          status: "",
          startTime: null,
          endTime: null,
          votingStartTime: null,
          votingEndTime: null,
        },
      },
    });

    render(<CommunityActivityCard activity={challengeEventActivity} />);

    expect(screen.getByText("Challenge Event")).toBeOnTheScreen();
    expect(screen.getByText("Challenge started")).toBeOnTheScreen();
  });

  it("renders with image when imageUrl is provided", () => {
    const activityWithImage = createMockActivity({
      ...baseActivity,
      imageUrl: "https://example.com/image.jpg",
    });

    render(<CommunityActivityCard activity={activityWithImage} />);

    expect(screen.getByText("Test Activity")).toBeOnTheScreen();
  });

  it("renders without description when description is null", () => {
    const activityWithoutDescription = createMockActivity({
      ...baseActivity,
      description: "",
    });

    render(<CommunityActivityCard activity={activityWithoutDescription} />);

    expect(screen.getByText("Test Activity")).toBeOnTheScreen();
  });

  it("displays correct activity type label", () => {
    render(<CommunityActivityCard activity={baseActivity} />);

    expect(screen.getByText("news")).toBeOnTheScreen();
  });

  it("displays reaction count", () => {
    render(<CommunityActivityCard activity={baseActivity} />);

    expect(screen.getByText("5")).toBeOnTheScreen();
  });

  it("calls onPress when card is pressed", () => {
    const onPress = jest.fn();
    render(<CommunityActivityCard activity={baseActivity} onPress={onPress} />);

    const card = screen.getByText("Test Activity").parent?.parent;
    if (card) {
      fireEvent.press(card);
    }

    expect(onPress).toHaveBeenCalled();
  });

  it("calls onPressOwner when owner row is pressed", () => {
    const onPressOwner = jest.fn();
    render(<CommunityActivityCard activity={baseActivity} onPressOwner={onPressOwner} />);

    const ownerName = screen.getByText("John Doe");
    fireEvent.press(ownerName);

    expect(onPressOwner).toHaveBeenCalled();
  });

  it("renders with heart reaction active", () => {
    const activityWithHeartReaction = createMockActivity({
      ...baseActivity,
      reactionsSummary: {
        total: 5,
        counts: { heart: 3, fire: 1, clap: 1, star: 0 },
        myReactions: ["heart"],
      },
    });

    render(<CommunityActivityCard activity={activityWithHeartReaction} />);

    expect(screen.getByText("5")).toBeOnTheScreen();
  });

  it("renders with focused state styling", () => {
    render(<CommunityActivityCard activity={baseActivity} isFocused={true} />);

    expect(screen.getByText("Test Activity")).toBeOnTheScreen();
  });

  it("renders with unknown admin when admin is null", () => {
    const activityWithoutAdmin = createMockActivity({
      ...baseActivity,
      admin: null,
    });

    render(<CommunityActivityCard activity={activityWithoutAdmin} />);

    expect(screen.getByText("MIRAI Admin")).toBeOnTheScreen();
  });

  it("renders with avatarUri when provided", () => {
    render(
      <CommunityActivityCard activity={baseActivity} avatarUri="https://example.com/avatar.jpg" />,
    );

    expect(screen.getByText("Test Activity")).toBeOnTheScreen();
  });

  it("renders with empty title and description", () => {
    const emptyActivity = createMockActivity({
      ...baseActivity,
      title: "",
      description: "",
    });

    render(<CommunityActivityCard activity={emptyActivity} />);
    expect(screen.getByText("Official post")).toBeOnTheScreen();
  });

  it("renders with missing firstName and lastName", () => {
    const activityNoName = createMockActivity({
      ...baseActivity,
      admin: {
        id: "admin-1",
        firstName: "",
        lastName: "",
      },
    });

    render(<CommunityActivityCard activity={activityNoName} />);
    expect(screen.getByText("Unknown")).toBeOnTheScreen();
  });

  it("renders with only firstName", () => {
    const activityFirstNameOnly = createMockActivity({
      ...baseActivity,
      admin: {
        id: "admin-1",
        firstName: "John",
        lastName: "",
      },
    });

    render(<CommunityActivityCard activity={activityFirstNameOnly} />);
    expect(screen.getByText("John")).toBeOnTheScreen();
  });

  it("renders rank change with down direction", () => {
    const rankDownActivity = createMockActivity({
      id: "4",
      tripId: "trip-1",
      activityType: "rank_change",
      title: "Rank Change",
      description: "⬇ Team A: #2 -> #3",
      rankChangeActivity: {
        groupId: "",
        newRank: 3,
        coinsGained: 0,
        totalCoins: 100,
        group: {
          id: "",
          name: "Team A",
          image: "",
          coins: 0,
        },
      },
    });

    render(<CommunityActivityCard activity={rankDownActivity} />);
    expect(screen.getByText("Rank Change")).toBeOnTheScreen();
  });

  it("renders with null admin and no userPost", () => {
    const activityNoOwner = createMockActivity({
      ...baseActivity,
      activityType: "custom",
      admin: null,
      userPost: null,
    } as any);

    render(<CommunityActivityCard activity={activityNoOwner} />);
    expect(screen.getByText("MIRAI Admin")).toBeOnTheScreen();
  });

  it("renders with rank change and no rankChangeActivity", () => {
    const rankChangeNoDetails = createMockActivity({
      ...baseActivity,
      activityType: "rank_change",
      rankChangeActivity: null,
    } as any);

    render(<CommunityActivityCard activity={rankChangeNoDetails} />);
    expect(screen.getByText("ranking")).toBeOnTheScreen();
  });

  it("renders with submission and no group", () => {
    const submissionNoGroup = createMockActivity({
      ...baseActivity,
      activityType: "submission",
      submissionActivity: {
        submissionId: "",
        challengeId: "",
        groupId: "",
        hasVideo: false,
        isWinner: false,
        ranking: null,
        pointsAwarded: 0,
        currentGroupRank: null,
        challenge: {
          id: "",
          name: "",
          status: "",
          submissionType: "",
          endTime: null,
        },
        group: null,
        submission: null,
      },
    } as any);

    render(<CommunityActivityCard activity={submissionNoGroup} />);
    expect(screen.getByText("submission")).toBeOnTheScreen();
  });

  it("renders with leaderboard data", () => {
    const rankChangeActivity = createMockActivity({
      id: "4",
      tripId: "trip-1",
      activityType: "rank_change",
      title: "Rank Change",
      description: "Rank changed",
      rankChangeActivity: {
        groupId: "",
        newRank: 1,
        coinsGained: 50,
        totalCoins: 150,
        group: {
          id: "",
          name: "Ranked Team",
          image: "",
          coins: 0,
        },
      },
    });

    const rankingData = [
      {
        id: "1",
        name: "Team 1",
        image: "",
        coins: 100,
        memberCount: 5,
        rank: 1,
        isCurrentUserGroup: false,
      },
      {
        id: "2",
        name: "Team 2",
        image: "",
        coins: 80,
        memberCount: 5,
        rank: 2,
        isCurrentUserGroup: false,
      },
      {
        id: "3",
        name: "Team 3",
        image: "",
        coins: 60,
        memberCount: 5,
        rank: 3,
        isCurrentUserGroup: false,
      },
    ];

    render(<CommunityActivityCard activity={rankChangeActivity} rankingData={rankingData} />);
    expect(screen.getByText("Rank Change")).toBeOnTheScreen();
  });

  it("renders with challenge event and no challengeActivity", () => {
    const challengeEventNoDetails = createMockActivity({
      ...baseActivity,
      activityType: "challenge_event",
      challengeActivity: null,
    } as any);

    render(<CommunityActivityCard activity={challengeEventNoDetails} />);
    expect(screen.getByText("challenge")).toBeOnTheScreen();
  });

  it("renders with user post and no userPost", () => {
    const userPostNoDetails = createMockActivity({
      ...baseActivity,
      activityType: "user_post",
      userPost: null,
    } as any);

    render(<CommunityActivityCard activity={userPostNoDetails} />);
    expect(screen.getByText("post")).toBeOnTheScreen();
  });
});
