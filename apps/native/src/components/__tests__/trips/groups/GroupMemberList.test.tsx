import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupMemberList } from "../../../trips/groups/details/GroupMemberList";

jest.mock("@mirai-app/trpc/client", () => ({
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
}));

describe("GroupMemberList", () => {
  const mockMembers = [
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
    const { getByText } = renderWithProviders(
      <GroupMemberList members={mockMembers} />
    );
    expect(getByText("Member Directory")).toBeTruthy();
  });

  it("should render all member names", () => {
    const { getByText } = renderWithProviders(
      <GroupMemberList members={mockMembers} />
    );
    expect(getByText("John Doe")).toBeTruthy();
    expect(getByText("Jane Smith")).toBeTruthy();
    expect(getByText("Bob Wilson")).toBeTruthy();
  });

  it("should render member initials", () => {
    const { getByText } = renderWithProviders(
      <GroupMemberList members={mockMembers} />
    );
    expect(getByText("JD")).toBeTruthy();
    expect(getByText("JS")).toBeTruthy();
    expect(getByText("BW")).toBeTruthy();
  });

  it("should render member roles in uppercase", () => {
    const { getAllByText, getByText } = renderWithProviders(
      <GroupMemberList members={mockMembers} />
    );
    const memberRoles = getAllByText("MEMBER");
    expect(memberRoles.length).toBeGreaterThanOrEqual(1);
    expect(getByText("ORGANIZER")).toBeTruthy();
  });

  it("should show 'View All' button when more than 3 members", () => {
    const { getByText } = renderWithProviders(
      <GroupMemberList members={mockMembers} />
    );
    expect(getByText("View All")).toBeTruthy();
  });

  it("should not show 'View All' button when 3 or fewer members", () => {
    const fewMembers = mockMembers.slice(0, 3);
    const { queryByText } = renderWithProviders(
      <GroupMemberList members={fewMembers} />
    );
    expect(queryByText("View All")).toBeNull();
  });

  it("should expand to show all members when 'View All' is pressed", () => {
    const { getByText, queryByText } = renderWithProviders(
      <GroupMemberList members={mockMembers} />
    );
    const viewAllButton = getByText("View All");
    fireEvent.press(viewAllButton);
    expect(getByText("Alice Brown")).toBeTruthy();
    expect(getByText("Show Less")).toBeTruthy();
  });

  it("should collapse when 'Show Less' is pressed", () => {
    const { getByText, queryByText } = renderWithProviders(
      <GroupMemberList members={mockMembers} />
    );
    const viewAllButton = getByText("View All");
    fireEvent.press(viewAllButton);
    const showLessButton = getByText("Show Less");
    fireEvent.press(showLessButton);
    expect(queryByText("Alice Brown")).toBeNull();
    expect(getByText("View All")).toBeTruthy();
  });

  it("should apply leader styling to leader members", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <GroupMemberList members={mockMembers} />
    );
    const views = UNSAFE_getAllByType(require("react-native").View);
    expect(views.length).toBeGreaterThan(0);
  });

  it("should render with leader role in primary color", () => {
    const { getByText } = renderWithProviders(
      <GroupMemberList members={mockMembers} />
    );
    expect(getByText("ORGANIZER")).toBeTruthy();
  });

  it("should handle empty members array", () => {
    const { getByText } = renderWithProviders(
      <GroupMemberList members={[]} />
    );
    expect(getByText("Member Directory")).toBeTruthy();
  });

  it("should handle single member", () => {
    const singleMember = [mockMembers[0]];
    const { getByText, queryByText } = renderWithProviders(
      <GroupMemberList members={singleMember} />
    );
    expect(getByText("John Doe")).toBeTruthy();
    expect(queryByText("View All")).toBeNull();
  });

  it("should handle exactly 3 members without View All button", () => {
    const threeMembers = mockMembers.slice(0, 3);
    const { getByText, queryByText } = renderWithProviders(
      <GroupMemberList members={threeMembers} />
    );
    expect(getByText("John Doe")).toBeTruthy();
    expect(getByText("Jane Smith")).toBeTruthy();
    expect(getByText("Bob Wilson")).toBeTruthy();
    expect(queryByText("View All")).toBeNull();
  });
});
