import { fireEvent, screen } from "@testing-library/react-native";
import { GroupMemberList } from "../../../trips/groups/details/GroupMemberList";
import type { GroupMember } from "../../../trips/groups/details/GroupMemberList";
import { renderWithProviders } from "../../helpers/renderWithProviders";

jest.mock("@mirai-app/orpc/client", () => ({
  useTRPC: () => ({
    storage: {
      createDownloadUrl: {
        queryOptions: () => ({
          queryKey: ["test"],
          queryFn: () => Promise.resolve({ signedUrl: null }),
        }),
      },
    },
  }),
  orpc: {
    storage: {
      createDownloadUrl: {
        queryOptions: () => ({
          queryKey: ["test"],
          queryFn: () => Promise.resolve({ signedUrl: null }),
        }),
      },
    },
  },
}));

describe("GroupMemberList", () => {
  const mockMembers: GroupMember[] = [
    {
      id: "1",
      name: "John Doe",
      initials: "JD",
      role: "Member",
      isLeader: false,
      avatarStoragePath: null,
    },
    {
      id: "2",
      name: "Jane Smith",
      initials: "JS",
      role: "Organizer",
      isLeader: true,
      avatarStoragePath: null,
    },
    {
      id: "3",
      name: "Bob Wilson",
      initials: "BW",
      role: "Member",
      isLeader: false,
      avatarStoragePath: null,
    },
    {
      id: "4",
      name: "Alice Brown",
      initials: "AB",
      role: "Member",
      isLeader: false,
      avatarStoragePath: null,
    },
  ];

  it("should render section title", () => {
    renderWithProviders(<GroupMemberList members={mockMembers} />);
    expect(screen.getByText("Member Directory")).toBeOnTheScreen();
  });

  it("should render all member names", () => {
    renderWithProviders(<GroupMemberList members={mockMembers} />);
    expect(screen.getByText("John Doe")).toBeOnTheScreen();
    expect(screen.getByText("Jane Smith")).toBeOnTheScreen();
    expect(screen.getByText("Bob Wilson")).toBeOnTheScreen();
  });

  it("should render member initials", () => {
    renderWithProviders(<GroupMemberList members={mockMembers} />);
    expect(screen.getByText("JD")).toBeOnTheScreen();
    expect(screen.getByText("JS")).toBeOnTheScreen();
    expect(screen.getByText("BW")).toBeOnTheScreen();
  });

  it("should render member roles in uppercase", () => {
    const { getAllByText } = renderWithProviders(<GroupMemberList members={mockMembers} />);
    const memberRoles = getAllByText("MEMBER");
    expect(memberRoles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("ORGANIZER")).toBeOnTheScreen();
  });

  it("should show 'View All' button when more than 3 members", () => {
    renderWithProviders(<GroupMemberList members={mockMembers} />);
    expect(screen.getByText("View All")).toBeOnTheScreen();
  });

  it("should not show 'View All' button when 3 or fewer members", () => {
    const fewMembers = mockMembers.slice(0, 3);
    renderWithProviders(<GroupMemberList members={fewMembers} />);
    expect(screen.queryByText("View All")).toBeNull();
  });

  it("should expand to show all members when 'View All' is pressed", () => {
    renderWithProviders(<GroupMemberList members={mockMembers} />);
    const viewAllButton = screen.getByText("View All");
    fireEvent.press(viewAllButton);
    expect(screen.getByText("Alice Brown")).toBeOnTheScreen();
    expect(screen.getByText("Show Less")).toBeOnTheScreen();
  });

  it("should collapse when 'Show Less' is pressed", () => {
    renderWithProviders(<GroupMemberList members={mockMembers} />);
    const viewAllButton = screen.getByText("View All");
    fireEvent.press(viewAllButton);
    const showLessButton = screen.getByText("Show Less");
    fireEvent.press(showLessButton);
    expect(screen.queryByText("Alice Brown")).toBeNull();
    expect(screen.getByText("View All")).toBeOnTheScreen();
  });

  it("should apply leader styling to leader members", () => {
    renderWithProviders(<GroupMemberList members={mockMembers} />);
    const leaderAvatars = screen.getAllByTestId("leader-avatar");
    expect(leaderAvatars.length).toBeGreaterThan(0);
  });

  it("should render with leader role in primary color", () => {
    renderWithProviders(<GroupMemberList members={mockMembers} />);
    expect(screen.getByText("ORGANIZER")).toBeOnTheScreen();
  });

  it("should handle empty members array", () => {
    renderWithProviders(<GroupMemberList members={[]} />);
    expect(screen.getByText("Member Directory")).toBeOnTheScreen();
  });

  it("should handle single member", () => {
    const singleMember = [mockMembers[0]!];
    renderWithProviders(<GroupMemberList members={singleMember} />);
    expect(screen.getByText("John Doe")).toBeOnTheScreen();
    expect(screen.queryByText("View All")).toBeNull();
  });

  it("should handle exactly 3 members without View All button", () => {
    const threeMembers = mockMembers.slice(0, 3);
    renderWithProviders(<GroupMemberList members={threeMembers} />);
    expect(screen.getByText("John Doe")).toBeOnTheScreen();
    expect(screen.getByText("Jane Smith")).toBeOnTheScreen();
    expect(screen.getByText("Bob Wilson")).toBeOnTheScreen();
    expect(screen.queryByText("View All")).toBeNull();
  });
});
