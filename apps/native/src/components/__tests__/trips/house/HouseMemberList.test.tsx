import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../../test-utils/msw/server";
import { renderWithMSW } from "../../../../test-utils/msw/test-wrapper";
import {
  HouseMemberList,
  buildExpandButtonText,
  calculateHasMoreThanPreview,
  calculateVisibleMembers,
} from "../../../trips/house/HouseMemberList";

describe("HouseMemberList", () => {
  const mockMembers = [
    {
      id: "1",
      name: "John Doe",
      initials: "JD",
      isCurrentUser: false,
      avatarStoragePath: null,
      wristNumber: "123",
    },
    {
      id: "2",
      name: "Jane Smith",
      initials: "JS",
      isCurrentUser: true,
      avatarStoragePath: null,
      wristNumber: "456",
    },
    {
      id: "3",
      name: "Bob Wilson",
      initials: "BW",
      isCurrentUser: false,
      avatarStoragePath: null,
      wristNumber: null,
    },
  ];

  beforeEach(() => {
    server.use(
      createORPCHandler(["storage", "createDownloadUrl"], () => ({
        signedUrl: null,
      })),
    );
  });

  it("should render house number", () => {
    renderWithMSW(<HouseMemberList members={mockMembers} houseNumber="12" />);
    expect(screen.getByText("House 12")).toBeOnTheScreen();
  });

  it("should render member count", () => {
    renderWithMSW(<HouseMemberList members={mockMembers} houseNumber="12" />);
    expect(screen.getByText("3 occupants")).toBeOnTheScreen();
  });

  it("should render member names", async () => {
    renderWithMSW(<HouseMemberList members={mockMembers} houseNumber="12" />);
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeOnTheScreen();
    });
    expect(screen.getByText(/Jane Smith/)).toBeOnTheScreen();
    expect(screen.getByText("Bob Wilson")).toBeOnTheScreen();
  });

  it("should highlight current user", async () => {
    renderWithMSW(<HouseMemberList members={mockMembers} houseNumber="12" />);
    await waitFor(() => {
      expect(screen.getByText(/Jane Smith/)).toBeOnTheScreen();
    });
    expect(screen.getByText(/\(You\)/)).toBeOnTheScreen();
  });

  it("should render wrist numbers", async () => {
    renderWithMSW(<HouseMemberList members={mockMembers} houseNumber="12" />);
    await waitFor(() => {
      expect(screen.getByText("Wrist #123")).toBeOnTheScreen();
    });
    expect(screen.getByText("Wrist #456")).toBeOnTheScreen();
  });

  it("should not show View All button when 3 or fewer members", () => {
    renderWithMSW(<HouseMemberList members={mockMembers} houseNumber="12" />);
    expect(screen.queryByText("View All")).toBeNull();
  });

  it("should show View All button when more than 3 members", () => {
    const manyMembers = [
      ...mockMembers,
      {
        id: "4",
        name: "Alice Brown",
        initials: "AB",
        isCurrentUser: false,
        avatarStoragePath: null,
        wristNumber: "789",
      },
    ];
    renderWithMSW(<HouseMemberList members={manyMembers} houseNumber="12" />);
    expect(screen.getByText("View All")).toBeOnTheScreen();
  });

  it("should expand to show all members when View All is pressed", () => {
    const manyMembers = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      name: `User ${i + 1}`,
      initials: `U${i + 1}`,
      isCurrentUser: false,
      avatarStoragePath: null,
      wristNumber: null,
    }));
    renderWithMSW(<HouseMemberList members={manyMembers} houseNumber="12" />);
    fireEvent.press(screen.getByText("View All"));
    expect(screen.getByText("Show Less")).toBeOnTheScreen();
  });

  it("should collapse when Show Less is pressed", () => {
    const manyMembers = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      name: `User ${i + 1}`,
      initials: `U${i + 1}`,
      isCurrentUser: false,
      avatarStoragePath: null,
      wristNumber: null,
    }));
    renderWithMSW(<HouseMemberList members={manyMembers} houseNumber="12" />);
    fireEvent.press(screen.getByText("View All"));
    fireEvent.press(screen.getByText("Show Less"));
    expect(screen.getByText("View All")).toBeOnTheScreen();
  });

  it("should render member initials", async () => {
    renderWithMSW(<HouseMemberList members={mockMembers} houseNumber="12" />);
    await waitFor(() => {
      expect(screen.getByText("JD")).toBeOnTheScreen();
    });
    expect(screen.getByText("JS")).toBeOnTheScreen();
    expect(screen.getByText("BW")).toBeOnTheScreen();
  });

  it("should handle empty members list", () => {
    renderWithMSW(<HouseMemberList members={[]} houseNumber="12" />);
    expect(screen.getByText("House 12")).toBeOnTheScreen();
    expect(screen.getByText("0 occupants")).toBeOnTheScreen();
  });

  it("should not show wrist number when null", async () => {
    renderWithMSW(<HouseMemberList members={mockMembers} houseNumber="12" />);
    await waitFor(() => {
      expect(screen.getByText("Bob Wilson")).toBeOnTheScreen();
    });
    expect(screen.queryByText("Wrist #null")).toBeNull();
  });

  it("should render avatar image when available", async () => {
    server.use(
      createORPCHandler(["storage", "createDownloadUrl"], () => ({
        signedUrl: "https://example.com/avatar.jpg",
      })),
    );

    const membersWithAvatar = [
      {
        ...mockMembers[0],
        avatarStoragePath: "avatar/1.jpg",
      },
    ];

    renderWithMSW(<HouseMemberList members={membersWithAvatar} houseNumber="12" />);
    await waitFor(() => {
      expect(screen.getByTestId("member-avatar")).toBeOnTheScreen();
    });
  });

  it("should apply current user avatar styling", async () => {
    renderWithMSW(<HouseMemberList members={mockMembers} houseNumber="12" />);
    await waitFor(() => {
      expect(screen.getByTestId("current-user-avatar")).toBeOnTheScreen();
    });
  });
});

describe("calculateHasMoreThanPreview", () => {
  it("should return false for 3 or fewer members", () => {
    const members = Array.from({ length: 3 }, (_, i) => ({
      id: String(i),
      name: `User ${i}`,
      initials: `U${i}`,
      isCurrentUser: false,
    }));
    expect(calculateHasMoreThanPreview(members)).toBe(false);
  });

  it("should return true for more than 3 members", () => {
    const members = Array.from({ length: 4 }, (_, i) => ({
      id: String(i),
      name: `User ${i}`,
      initials: `U${i}`,
      isCurrentUser: false,
    }));
    expect(calculateHasMoreThanPreview(members)).toBe(true);
  });
});

describe("calculateVisibleMembers", () => {
  const members = Array.from({ length: 5 }, (_, i) => ({
    id: String(i),
    name: `User ${i}`,
    initials: `U${i}`,
    isCurrentUser: false,
  }));

  it("should return all members when expanded", () => {
    expect(calculateVisibleMembers(members, true)).toHaveLength(5);
  });

  it("should return first 3 members when not expanded", () => {
    expect(calculateVisibleMembers(members, false)).toHaveLength(3);
  });
});

describe("buildExpandButtonText", () => {
  it("should return Show Less when expanded", () => {
    expect(buildExpandButtonText(true)).toBe("Show Less");
  });

  it("should return View All when not expanded", () => {
    expect(buildExpandButtonText(false)).toBe("View All");
  });
});
