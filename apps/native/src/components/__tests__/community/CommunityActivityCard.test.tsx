import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import {
  CommunityActivityCard,
  type CommunityFeedActivity,
} from "../../community/CommunityActivityCard";

describe("CommunityActivityCard", () => {
  const baseActivity: CommunityFeedActivity = {
    id: "1",
    tripId: "trip-1",
    activityType: "custom",
    title: "Test Activity",
    description: "Test description",
    imageUrl: null,
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
  };

  it("renders with basic activity data", () => {
    render(<CommunityActivityCard activity={baseActivity} />);

    expect(screen.getByText("Test Activity")).toBeOnTheScreen();
    expect(screen.getByText("John Doe")).toBeOnTheScreen();
    expect(screen.getByText("Official post")).toBeOnTheScreen();
  });

  it("renders with user post activity type", () => {
    const userPostActivity: CommunityFeedActivity = {
      ...baseActivity,
      activityType: "user_post",
      title: "User Post Title",
      userPost: {
        additionalImages: [],
        author: {
          user: {
            id: "user-1",
            firstName: "Jane",
            lastName: "Smith",
          },
          group: {
            name: "Team Alpha",
          },
        },
      },
    };

    render(<CommunityActivityCard activity={userPostActivity} />);

    expect(screen.getByText("User Post Title")).toBeOnTheScreen();
    expect(screen.getByText("Jane Smith")).toBeOnTheScreen();
    expect(screen.getByText("Team Alpha")).toBeOnTheScreen();
  });

  it("renders with submission activity type", () => {
    const submissionActivity: CommunityFeedActivity = {
      ...baseActivity,
      activityType: "submission",
      title: "Submission Title",
      submissionActivity: {
        groupId: "group-1",
        isWinner: false,
        currentGroupRank: 3,
        ranking: 3,
        pointsAwarded: 100,
        challenge: {
          name: "Photo Challenge",
        },
        group: {
          id: "group-1",
          name: "Team Beta",
          image: null,
        },
      },
    };

    render(<CommunityActivityCard activity={submissionActivity} />);

    expect(screen.getByText("Submission Title")).toBeOnTheScreen();
    expect(screen.getByText("Team Beta")).toBeOnTheScreen();
    expect(screen.getByText("Miejsce w rankingu: #3")).toBeOnTheScreen();
  });

  it("renders with rank change activity type", () => {
    const rankChangeActivity: CommunityFeedActivity = {
      ...baseActivity,
      activityType: "rank_change",
      title: "Rank Change",
      description: "⬆ Ranked Team: #2 -> #1",
      rankChangeActivity: {
        newRank: 1,
        coinsGained: 50,
        totalCoins: 150,
        group: {
          name: "Ranked Team",
          image: null,
        },
      },
    };

    render(<CommunityActivityCard activity={rankChangeActivity} />);

    expect(screen.getByText("Rank Change")).toBeOnTheScreen();
    // Team name appears in both owner section and rank change message
    const teamElements = screen.getAllByText("Ranked Team");
    expect(teamElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Now #1")).toBeOnTheScreen();
  });

  it("renders with challenge event activity type", () => {
    const challengeEventActivity: CommunityFeedActivity = {
      ...baseActivity,
      activityType: "challenge_event",
      title: "Challenge Event",
      challengeActivity: {
        challengeId: "challenge-1",
        eventType: "challenge_started",
        challenge: {
          name: "New Challenge",
          description: "Challenge description",
        },
      },
    };

    render(<CommunityActivityCard activity={challengeEventActivity} />);

    expect(screen.getByText("Challenge Event")).toBeOnTheScreen();
    expect(screen.getByText("Challenge started")).toBeOnTheScreen();
  });

  it("renders with image when imageUrl is provided", () => {
    const activityWithImage: CommunityFeedActivity = {
      ...baseActivity,
      imageUrl: "https://example.com/image.jpg",
    };

    render(<CommunityActivityCard activity={activityWithImage} />);

    expect(screen.getByText("Test Activity")).toBeOnTheScreen();
  });

  it("renders without description when description is null", () => {
    const activityWithoutDescription: CommunityFeedActivity = {
      ...baseActivity,
      description: null,
    };

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
    const activityWithHeartReaction: CommunityFeedActivity = {
      ...baseActivity,
      reactionsSummary: {
        total: 5,
        counts: { heart: 3, fire: 1, clap: 1, star: 0 },
        myReactions: ["heart"],
      },
    };

    render(<CommunityActivityCard activity={activityWithHeartReaction} />);

    expect(screen.getByText("5")).toBeOnTheScreen();
  });

  it("renders with focused state styling", () => {
    render(<CommunityActivityCard activity={baseActivity} isFocused={true} />);

    expect(screen.getByText("Test Activity")).toBeOnTheScreen();
  });

  it("renders with unknown admin when admin is null", () => {
    const activityWithoutAdmin: CommunityFeedActivity = {
      ...baseActivity,
      admin: null,
    };

    render(<CommunityActivityCard activity={activityWithoutAdmin} />);

    expect(screen.getByText("MIRAI Admin")).toBeOnTheScreen();
  });

  it("renders with avatarUri when provided", () => {
    render(
      <CommunityActivityCard activity={baseActivity} avatarUri="https://example.com/avatar.jpg" />,
    );

    expect(screen.getByText("Test Activity")).toBeOnTheScreen();
  });
});
