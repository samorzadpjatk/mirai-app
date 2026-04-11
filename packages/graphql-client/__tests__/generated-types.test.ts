import { describe, it, expect } from "bun:test";
import {
  GetUserQuery,
  GetUserQueryVariables,
  GetCurrentUserQuery,
  GetTripQuery,
  GetTripQueryVariables,
  GetTripsQuery,
  GetTripsQueryVariables,
  CreateTripMutation,
  CreateTripMutationVariables,
  UpdateTripMutation,
  UpdateTripMutationVariables,
  DeleteTripMutation,
  DeleteTripMutationVariables,
  UserFieldsFragment,
  TripFieldsFragment,
  UserRole,
  TripStatus,
} from "../src/generated/graphql";

describe("[UNIT] GraphQL Generated Types", () => {
  describe("User Query Types", () => {
    it("compiles GetUser query type correctly", () => {
      const mockData: GetUserQuery = {
        user: {
          id: "1",
          firstName: "John",
          lastName: "Doe",
          fullName: "John Doe",
          hasAvatar: true,
          role: UserRole.Admin,
          createdAt: "2024-01-01T00:00:00Z",
          lastSeenOn: "2024-12-01T00:00:00Z",
          authUserId: "auth-123",
          isAdmin: true,
          isModerator: false,
        },
      };

      expect(mockData.user.id).toBe("1");
      expect(mockData.user.firstName).toBe("John");
      expect(mockData.user.lastName).toBe("Doe");
      expect(mockData.user.fullName).toBe("John Doe");
      expect(mockData.user.hasAvatar).toBe(true);
      expect(mockData.user.role).toBe(UserRole.Admin);
      expect(mockData.user.isAdmin).toBe(true);
      expect(mockData.user.isModerator).toBe(false);
    });

    it("compiles GetUser query variables type correctly", () => {
      const variables: GetUserQueryVariables = {
        id: "user-123",
      };

      expect(variables.id).toBe("user-123");
    });

    it("compiles GetCurrentUser query type correctly", () => {
      const mockData: GetCurrentUserQuery = {
        me: {
          id: "2",
          firstName: "Jane",
          lastName: "Smith",
          fullName: "Jane Smith",
          hasAvatar: false,
          role: UserRole.User,
          createdAt: "2024-06-01T00:00:00Z",
          lastSeenOn: null,
          authUserId: "auth-456",
          isAdmin: false,
          isModerator: false,
        },
      };

      expect(mockData.me.id).toBe("2");
      expect(mockData.me.firstName).toBe("Jane");
      expect(mockData.me.role).toBe(UserRole.User);
      expect(mockData.me.lastSeenOn).toBeNull();
    });
  });

  describe("Trip Query Types", () => {
    it("compiles GetTrip query type correctly", () => {
      const mockData: GetTripQuery = {
        trip: {
          id: "trip-1",
          name: "Summer Vacation",
          description: "A fun summer trip",
          startDate: "2024-07-01T00:00:00Z",
          endDate: "2024-07-15T00:00:00Z",
          status: TripStatus.Active,
          isActive: true,
          isPlanning: false,
          isCompleted: false,
          isCancelled: false,
          backgroundImagePath: "https://example.com/bg.jpg",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-06-01T00:00:00Z",
        },
      };

      expect(mockData.trip.id).toBe("trip-1");
      expect(mockData.trip.name).toBe("Summer Vacation");
      expect(mockData.trip.status).toBe(TripStatus.Active);
      expect(mockData.trip.isActive).toBe(true);
    });

    it("compiles GetTrip query variables type correctly", () => {
      const variables: GetTripQueryVariables = {
        id: "trip-123",
      };

      expect(variables.id).toBe("trip-123");
    });

    it("compiles GetTrips query type correctly", () => {
      const mockData: GetTripsQuery = {
        trips: {
          trips: [
            {
              id: "trip-1",
              name: "Trip One",
              description: "First trip",
              startDate: "2024-01-01T00:00:00Z",
              endDate: "2024-01-10T00:00:00Z",
              status: TripStatus.Planning,
              isActive: true,
              isPlanning: true,
              isCompleted: false,
              isCancelled: false,
              backgroundImagePath: null,
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            },
          ],
          pagination: {
            total: 1,
            hasMore: false,
            limit: 10,
            offset: 0,
          },
        },
      };

      expect(mockData.trips.trips).toHaveLength(1);
      expect(mockData.trips.pagination.total).toBe(1);
      expect(mockData.trips.pagination.hasMore).toBe(false);
    });

    it("compiles GetTrips query variables type correctly", () => {
      const variables: GetTripsQueryVariables = {
        pagination: {
          limit: 20,
          offset: 0,
        },
      };

      expect(variables.pagination?.limit).toBe(20);
      expect(variables.pagination?.offset).toBe(0);
    });

    it("handles optional pagination in GetTrips variables", () => {
      const variablesWithoutPagination: GetTripsQueryVariables = {};

      expect(variablesWithoutPagination.pagination).toBeUndefined();
    });
  });

  describe("Mutation Types", () => {
    it("compiles CreateTrip mutation type correctly", () => {
      const mockData: CreateTripMutation = {
        createTrip: {
          id: "new-trip-1",
          name: "New Trip",
          description: "A new trip description",
          startDate: "2024-08-01T00:00:00Z",
          endDate: "2024-08-10T00:00:00Z",
          status: TripStatus.Planning,
          isActive: true,
          backgroundImagePath: null,
          createdAt: "2024-07-01T00:00:00Z",
          updatedAt: "2024-07-01T00:00:00Z",
        },
      };

      expect(mockData.createTrip.id).toBe("new-trip-1");
      expect(mockData.createTrip.name).toBe("New Trip");
    });

    it("compiles CreateTrip mutation variables type correctly", () => {
      const variables: CreateTripMutationVariables = {
        input: {
          name: "New Trip",
          description: "Trip description",
          startDate: "2024-08-01T00:00:00Z",
          endDate: "2024-08-10T00:00:00Z",
        },
      };

      expect(variables.input.name).toBe("New Trip");
    });

    it("compiles UpdateTrip mutation type correctly", () => {
      const mockData: UpdateTripMutation = {
        updateTrip: {
          id: "trip-1",
          name: "Updated Trip Name",
          description: "Updated description",
          startDate: "2024-09-01T00:00:00Z",
          endDate: "2024-09-15T00:00:00Z",
          status: TripStatus.Active,
          isActive: true,
          isPlanning: false,
          isCompleted: false,
          isCancelled: false,
          backgroundImagePath: "https://example.com/new-bg.jpg",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-07-15T00:00:00Z",
        },
      };

      expect(mockData.updateTrip.name).toBe("Updated Trip Name");
    });

    it("compiles UpdateTrip mutation variables type correctly", () => {
      const variables: UpdateTripMutationVariables = {
        input: {
          id: "trip-1",
          name: "Updated Name",
        },
      };

      expect(variables.input.id).toBe("trip-1");
      expect(variables.input.name).toBe("Updated Name");
    });

    it("compiles DeleteTrip mutation type correctly", () => {
      const mockData: DeleteTripMutation = {
        deleteTrip: {
          success: true,
        },
      };

      expect(mockData.deleteTrip.success).toBe(true);
    });

    it("compiles DeleteTrip mutation variables type correctly", () => {
      const variables: DeleteTripMutationVariables = {
        id: "trip-to-delete",
      };

      expect(variables.id).toBe("trip-to-delete");
    });
  });

  describe("Fragment Types", () => {
    it("compiles UserFields fragment type correctly", () => {
      const mockUser: UserFieldsFragment = {
        id: "user-1",
        firstName: "Alice",
        lastName: "Johnson",
        fullName: "Alice Johnson",
        hasAvatar: true,
        role: UserRole.Moderator,
        createdAt: "2024-01-01T00:00:00Z",
        lastSeenOn: "2024-12-01T00:00:00Z",
      };

      expect(mockUser.id).toBe("user-1");
      expect(mockUser.role).toBe(UserRole.Moderator);
    });

    it("compiles TripFields fragment type correctly", () => {
      const mockTrip: TripFieldsFragment = {
        id: "trip-1",
        name: "My Trip",
        description: "Trip description",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-10T00:00:00Z",
        status: TripStatus.Cancelled,
        isActive: false,
        isPlanning: false,
        isCompleted: false,
        isCancelled: true,
        backgroundImagePath: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      expect(mockTrip.id).toBe("trip-1");
      expect(mockTrip.isCancelled).toBe(true);
      expect(mockTrip.status).toBe(TripStatus.Cancelled);
    });
  });

  describe("Enum Types", () => {
    it("exports UserRole enum correctly", () => {
      expect(UserRole.Admin).toBe("ADMIN");
      expect(UserRole.Moderator).toBe("MODERATOR");
      expect(UserRole.User).toBe("USER");
    });

    it("exports TripStatus enum correctly", () => {
      expect(TripStatus.Planning).toBe("PLANNING");
      expect(TripStatus.Active).toBe("ACTIVE");
      expect(TripStatus.Completed).toBe("COMPLETED");
      expect(TripStatus.Cancelled).toBe("CANCELLED");
    });
  });
});
