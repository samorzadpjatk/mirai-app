import { jest } from "@jest/globals";
import type { GroupListItem } from "~/components/trips/groups/types";

// Types for group data
export interface GroupParticipant {
  id: string;
  name?: string;
  avatar?: string | null;
}

export interface GroupTrip {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  image: string | null;
  participants: GroupParticipant[];
  trip: GroupTrip | null;
}

export interface GroupPage {
  groups: Group[];
  pagination: {
    hasMore: boolean;
    offset: number;
    limit: number;
  };
}

// Mock useGroups hook
export const mockUseGroups = jest.fn((_tripId?: string | null) => ({
  groups: [] as Group[],
  filteredGroups: [] as GroupListItem[],
  isLoading: false,
  isRefetching: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(() => Promise.resolve()),
  refetch: jest.fn(() => Promise.resolve()),
  searchQuery: "",
  setSearchQuery: jest.fn(),
}));

// Mock useGroupDetails hook
export const mockUseGroupDetails = jest.fn((_groupId?: string | null) => ({
  currentUser: null as { id: string; name?: string; email?: string } | null,
  isLoadingUser: false,
  group: undefined as Group | undefined,
  isLoadingGroup: false,
}));

// Mock useGroupEditor hook
export const mockUseGroupEditor = jest.fn((_groupId?: string | null) => ({
  group: undefined as Group | undefined,
  isLoading: false,
  isUpdating: false,
  updateGroup: jest.fn(() => Promise.resolve({ id: "group-123" })),
  assignUser: jest.fn(() => Promise.resolve({ success: true })),
  removeUser: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock useCreateGroup hook
export const mockUseCreateGroup = jest.fn((_tripId?: string | null) => ({
  createGroup: jest.fn(() => Promise.resolve({ id: "new-group", name: "", code: "" })),
  isCreating: false,
}));

// Mock useMyGroup hook
export const mockUseMyGroup = jest.fn((_tripId?: string | null) => ({
  group: null as Group | null,
  isLoading: false,
  error: null as Error | null,
}));

// Export hook names for jest.mock
export const useGroups = mockUseGroups;
export const useGroupDetails = mockUseGroupDetails;
export const useGroupEditor = mockUseGroupEditor;
export const useCreateGroup = mockUseCreateGroup;
export const useMyGroup = mockUseMyGroup;

// Helper to create mock group data
export function createMockGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: "group-123",
    name: "Test Group",
    code: "TG001",
    image: null,
    participants: [],
    trip: null,
    ...overrides,
  };
}

// Helper to create mock group page for infinite query
export function createMockGroupPage(overrides: Partial<GroupPage> = {}): GroupPage {
  return {
    groups: [],
    pagination: {
      hasMore: false,
      offset: 0,
      limit: 30,
    },
    ...overrides,
  };
}

// Helper to create mock group list item
export function createMockGroupListItem(overrides: Partial<GroupListItem> = {}): GroupListItem {
  return {
    id: "group-123",
    name: "Test Group",
    code: "TG001",
    image: null,
    participantCount: 0,
    ...overrides,
  };
}
