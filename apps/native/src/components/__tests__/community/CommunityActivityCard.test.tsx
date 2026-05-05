import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { CommunityActivityCard, CommunityFeedActivity } from "../../community/CommunityActivityCard";

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

    expect(screen.getByText("Test Activity")).toBeTruthy();
    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByText("Official post")).toBeTruthy();
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

    expect(screen.getByText("User Post Title")).toBeTruthy();
    expect(screen.getByText("Jane Smith")).toBeTruthy();
    expect(screen.getByText("Team Alpha")).toBeTruthy();
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

    expect(screen.getByText("Submission Title")).toBeTruthy();
    expect(screen.getByText("Team Beta")).toBeTruthy();
    expect(screen.getByText("Miejsce w rankingu: #3")).toBeTruthy();
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

    expect(screen.getByText("Rank Change")).toBeTruthy();
    // Team name appears in both owner section and rank change message
    const teamElements = screen.getAllByText("Ranked Team");
    expect(teamElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Now #1")).toBeTruthy();
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

    expect(screen.getByText("Challenge Event")).toBeTruthy();
    expect(screen.getByText("Challenge started")).toBeTruthy();
  });

  it("renders with image when imageUrl is provided", () => {
    const activityWithImage: CommunityFeedActivity = {
      ...baseActivity,
      imageUrl: "https://example.com/image.jpg",
    };

    const { UNSAFE_getAllByType } = render(<CommunityActivityCard activity={activityWithImage} />);
    
    expect(screen.getByText("Test Activity")).toBeTruthy();
  });

  it("renders without description when description is null", () => {
    const activityWithoutDescription: CommunityFeedActivity = {
      ...baseActivity,
      description: null,
    };

    render(<CommunityActivityCard activity={activityWithoutDescription} />);

    expect(screen.getByText("Test Activity")).toBeTruthy();
  });

  it("displays correct activity type label", () => {
    render(<CommunityActivityCard activity={baseActivity} />);

    expect(screen.getByText("news")).toBeTruthy();
  });

  it("displays reaction count", () => {
    render(<CommunityActivityCard activity={baseActivity} />);

    expect(screen.getByText("5")).toBeTruthy();
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

    expect(screen.getByText("5")).toBeTruthy();
  });

  it("renders with focused state styling", () => {
    render(<CommunityActivityCard activity={baseActivity} isFocused={true} />);

    expect(screen.getByText("Test Activity")).toBeTruthy();
  });

  it("renders with unknown admin when admin is null", () => {
    const activityWithoutAdmin: CommunityFeedActivity = {
      ...baseActivity,
      admin: null,
    };

    render(<CommunityActivityCard activity={activityWithoutAdmin} />);

    expect(screen.getByText("MIRAI Admin")).toBeTruthy();
  });

  it("renders with avatarUri when provided", () => {
    const { UNSAFE_getAllByType } = render(
      <CommunityActivityCard activity={baseActivity} avatarUri="https://example.com/avatar.jpg" />
    );

    expect(screen.getByText("Test Activity")).toBeTruthy();
  });
});
