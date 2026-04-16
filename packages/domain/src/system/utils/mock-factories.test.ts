import { describe, it, expect } from "bun:test";
import {
  mockUser,
  mockAdmin,
  mockModerator,
  mockUsers,
  mockTrip,
  mockGroup,
  mockChallenge,
  Mocks,
} from "./mock-factories";
import { TestIds } from "./test-ids";
import { UserId, TripId, ChallengeId } from "../../index";
import { createBrandedId } from "./branded-id";

// Create GroupId locally (same pattern as in mock-factories.ts)
const GroupId = createBrandedId("GroupId", {
  validate: (id) => id?.trim() !== "",
});

describe("[UNIT] mock-factories", () => {
  // ===========================================================================
  // mockUser Tests
  // ===========================================================================
  describe("mockUser", () => {
    it("creates valid user object with default properties", () => {
      const user = mockUser();

      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("name");

      expect(user.email).toBe("user@example.com");
      expect(user.name).toBe("Test User");
    });

    it("creates user with default TestIds.USER", () => {
      const user = mockUser();
      const expectedId = UserId.create(TestIds.USER);

      expect(user.id).toBe(expectedId);
      expect(UserId.equals(user.id, expectedId)).toBe(true);
    });

    it("creates user with valid branded ID", () => {
      const user = mockUser();

      expect(typeof user.id).toBe("string");
      expect(() => UserId.toString(user.id)).not.toThrow();
    });

    it("overrides id with custom value", () => {
      const customId = "550e8400-e29b-41d4-a716-446655440999";
      const user = mockUser({ id: customId });

      expect(user.id).toBe(UserId.create(customId));
    });

    it("overrides email with custom value", () => {
      const customEmail = "custom@example.com";
      const user = mockUser({ email: customEmail });

      expect(user.email).toBe(customEmail);
    });

    it("overrides name with custom value", () => {
      const customName = "Custom Name";
      const user = mockUser({ name: customName });

      expect(user.name).toBe(customName);
    });

    it("overrides multiple properties at once", () => {
      const customId = "550e8400-e29b-41d4-a716-446655440999";
      const customEmail = "multi@example.com";
      const customName = "Multi Override";

      const user = mockUser({
        id: customId,
        email: customEmail,
        name: customName,
      });

      expect(user.id).toBe(UserId.create(customId));
      expect(user.email).toBe(customEmail);
      expect(user.name).toBe(customName);
    });

    it("applies partial overrides while keeping defaults", () => {
      const customEmail = "partial@example.com";
      const user = mockUser({ email: customEmail });

      expect(user.email).toBe(customEmail);
      expect(user.name).toBe("Test User");
      expect(user.id).toBe(UserId.create(TestIds.USER));
    });
  });

  // ===========================================================================
  // mockAdmin Tests
  // ===========================================================================
  describe("mockAdmin", () => {
    it("creates valid admin object with default properties", () => {
      const admin = mockAdmin();

      expect(admin).toHaveProperty("id");
      expect(admin).toHaveProperty("email");
      expect(admin).toHaveProperty("role");

      expect(admin.email).toBe("admin@example.com");
      expect(admin.role).toBe("ADMIN");
    });

    it("creates admin with default TestIds.ADMIN", () => {
      const admin = mockAdmin();
      const expectedId = UserId.create(TestIds.ADMIN);

      expect(admin.id).toBe(expectedId);
      expect(UserId.equals(admin.id, expectedId)).toBe(true);
    });

    it("creates admin with valid branded ID", () => {
      const admin = mockAdmin();

      expect(typeof admin.id).toBe("string");
    });

    it("overrides id with custom value", () => {
      const customId = "550e8400-e29b-41d4-a716-446655440999";
      const admin = mockAdmin({ id: customId });

      expect(admin.id).toBe(UserId.create(customId));
    });

    it("overrides email with custom value", () => {
      const customEmail = "admin.custom@example.com";
      const admin = mockAdmin({ email: customEmail });

      expect(admin.email).toBe(customEmail);
      expect(admin.role).toBe("ADMIN");
    });

    it("overrides multiple properties at once", () => {
      const customId = "550e8400-e29b-41d4-a716-446655440999";
      const customEmail = "superadmin@example.com";

      const admin = mockAdmin({
        id: customId,
        email: customEmail,
      });

      expect(admin.id).toBe(UserId.create(customId));
      expect(admin.email).toBe(customEmail);
      expect(admin.role).toBe("ADMIN");
    });
  });

  // ===========================================================================
  // mockModerator Tests
  // ===========================================================================
  describe("mockModerator", () => {
    it("creates valid moderator object with default properties", () => {
      const moderator = mockModerator();

      expect(moderator).toHaveProperty("id");
      expect(moderator).toHaveProperty("email");
      expect(moderator).toHaveProperty("role");

      expect(moderator.email).toBe("moderator@example.com");
      expect(moderator.role).toBe("MODERATOR");
    });

    it("creates moderator with default TestIds.MODERATOR", () => {
      const moderator = mockModerator();
      const expectedId = UserId.create(TestIds.MODERATOR);

      expect(moderator.id).toBe(expectedId);
      expect(UserId.equals(moderator.id, expectedId)).toBe(true);
    });

    it("creates moderator with valid branded ID", () => {
      const moderator = mockModerator();

      expect(typeof moderator.id).toBe("string");
    });

    it("overrides id with custom value", () => {
      const customId = "550e8400-e29b-41d4-a716-446655440999";
      const moderator = mockModerator({ id: customId });

      expect(moderator.id).toBe(UserId.create(customId));
    });

    it("overrides email with custom value", () => {
      const customEmail = "mod.custom@example.com";
      const moderator = mockModerator({ email: customEmail });

      expect(moderator.email).toBe(customEmail);
      expect(moderator.role).toBe("MODERATOR");
    });
  });

  // ===========================================================================
  // mockUsers Tests
  // ===========================================================================
  describe("mockUsers", () => {
    it("creates correct number of users", () => {
      const users = mockUsers(5);

      expect(users).toHaveLength(5);
    });

    it("creates empty array for count 0", () => {
      const users = mockUsers(0);

      expect(users).toHaveLength(0);
    });

    it("creates single user for count 1", () => {
      const users = mockUsers(1);

      expect(users).toHaveLength(1);
      expect(users[0]!.name).toBe("Test User 1");
      expect(users[0]!.email).toBe("user1@example.com");
    });

    it("creates users with sequential IDs", () => {
      const users = mockUsers(3);

      expect(users[0]!.id).toBe(
        UserId.create("550e8400-e29b-41d4-a716-446655440001"),
      );
      expect(users[1]!.id).toBe(
        UserId.create("550e8400-e29b-41d4-a716-446655440002"),
      );
      expect(users[2]!.id).toBe(
        UserId.create("550e8400-e29b-41d4-a716-446655440003"),
      );
    });

    it("creates users with sequential emails", () => {
      const users = mockUsers(3);

      expect(users[0]!.email).toBe("user1@example.com");
      expect(users[1]!.email).toBe("user2@example.com");
      expect(users[2]!.email).toBe("user3@example.com");
    });

    it("creates users with sequential names", () => {
      const users = mockUsers(3);

      expect(users[0]!.name).toBe("Test User 1");
      expect(users[1]!.name).toBe("Test User 2");
      expect(users[2]!.name).toBe("Test User 3");
    });

    it("creates users with unique IDs", () => {
      const users = mockUsers(10);
      const ids = users.map((u) => u.id);
      const uniqueIds = [...new Set(ids)];

      expect(uniqueIds).toHaveLength(ids.length);
    });

    it("creates users with all valid branded IDs", () => {
      const users = mockUsers(5);

      for (const user of users) {
        expect(typeof user.id).toBe("string");
        expect(() => UserId.toString(user.id)).not.toThrow();
      }
    });

    it("handles large counts", () => {
      const users = mockUsers(100);

      expect(users).toHaveLength(100);
      expect(users[99]!.name).toBe("Test User 100");
      expect(users[99]!.email).toBe("user100@example.com");
    });
  });

  // ===========================================================================
  // mockTrip Tests
  // ===========================================================================
  describe("mockTrip", () => {
    it("creates valid trip object with default properties", () => {
      const trip = mockTrip();

      expect(trip).toHaveProperty("id");
      expect(trip).toHaveProperty("name");
      expect(trip).toHaveProperty("createdAt");

      expect(trip.name).toBe("Test Trip");
      expect(trip.createdAt).toEqual(new Date("2026-01-01"));
    });

    it("creates trip with default TestIds.TRIP", () => {
      const trip = mockTrip();
      const expectedId = TripId.create(TestIds.TRIP);

      expect(trip.id).toBe(expectedId);
      expect(TripId.equals(trip.id, expectedId)).toBe(true);
    });

    it("creates trip with valid branded ID", () => {
      const trip = mockTrip();

      expect(typeof trip.id).toBe("string");
    });

    it("overrides id with custom value", () => {
      const customId = "550e8400-e29b-41d4-a716-446655440999";
      const trip = mockTrip({ id: customId });

      expect(trip.id).toBe(TripId.create(customId));
    });

    it("overrides name with custom value", () => {
      const customName = "Custom Trip Name";
      const trip = mockTrip({ name: customName });

      expect(trip.name).toBe(customName);
      expect(trip.createdAt).toEqual(new Date("2026-01-01"));
    });
  });

  // ===========================================================================
  // mockGroup Tests
  // ===========================================================================
  describe("mockGroup", () => {
    it("creates valid group object with default properties", () => {
      const group = mockGroup();

      expect(group).toHaveProperty("id");
      expect(group).toHaveProperty("name");
      expect(group).toHaveProperty("tripId");
      expect(group).toHaveProperty("coins");

      expect(group.name).toBe("Test Group");
      expect(group.coins).toBe(0);
    });

    it("creates group with default TestIds.GROUP", () => {
      const group = mockGroup();
      const expectedId = GroupId.create(TestIds.GROUP);

      expect(group.id).toBe(expectedId);
      expect(GroupId.equals(group.id, expectedId)).toBe(true);
    });

    it("creates group with default TestIds.TRIP for tripId", () => {
      const group = mockGroup();
      const expectedTripId = TripId.create(TestIds.TRIP);

      expect(group.tripId).toBe(expectedTripId);
    });

    it("creates group with valid branded IDs", () => {
      const group = mockGroup();

      expect(typeof group.id).toBe("string");
      expect(typeof group.tripId).toBe("string");
    });

    it("overrides id with custom value", () => {
      const customId = "custom-group-id-123";
      const group = mockGroup({ id: customId });

      expect(group.id).toBe(GroupId.create(customId));
    });

    it("overrides name with custom value", () => {
      const customName = "Custom Group Name";
      const group = mockGroup({ name: customName });

      expect(group.name).toBe(customName);
    });

    it("overrides tripId with custom value", () => {
      const customTripId = "550e8400-e29b-41d4-a716-446655440888";
      const group = mockGroup({ tripId: customTripId });

      expect(group.tripId).toBe(TripId.create(customTripId));
    });

    it("overrides multiple properties at once", () => {
      const customId = "custom-group-456";
      const customName = "Super Group";
      const customTripId = "550e8400-e29b-41d4-a716-446655440888";

      const group = mockGroup({
        id: customId,
        name: customName,
        tripId: customTripId,
      });

      expect(group.id).toBe(GroupId.create(customId));
      expect(group.name).toBe(customName);
      expect(group.tripId).toBe(TripId.create(customTripId));
    });
  });

  // ===========================================================================
  // mockChallenge Tests
  // ===========================================================================
  describe("mockChallenge", () => {
    it("creates valid challenge object with default properties", () => {
      const challenge = mockChallenge();

      expect(challenge).toHaveProperty("id");
      expect(challenge).toHaveProperty("title");
      expect(challenge).toHaveProperty("status");

      expect(challenge.title).toBe("Test Challenge");
      expect(challenge.status).toBe("ACTIVE");
    });

    it("creates challenge with default TestIds.CHALLENGE", () => {
      const challenge = mockChallenge();
      const expectedId = ChallengeId.create(TestIds.CHALLENGE);

      expect(challenge.id).toBe(expectedId);
      expect(ChallengeId.equals(challenge.id, expectedId)).toBe(true);
    });

    it("creates challenge with valid branded ID", () => {
      const challenge = mockChallenge();

      expect(typeof challenge.id).toBe("string");
    });

    it("overrides id with custom value", () => {
      const customId = "550e8400-e29b-41d4-a716-446655440999";
      const challenge = mockChallenge({ id: customId });

      expect(challenge.id).toBe(ChallengeId.create(customId));
    });

    it("overrides title with custom value", () => {
      const customTitle = "Custom Challenge Title";
      const challenge = mockChallenge({ title: customTitle });

      expect(challenge.title).toBe(customTitle);
      expect(challenge.status).toBe("ACTIVE");
    });
  });

  // ===========================================================================
  // Mocks Namespace Tests
  // ===========================================================================
  describe("Mocks namespace", () => {
    it("exports all full entity mock functions", () => {
      expect(typeof Mocks.user).toBe("function");
      expect(typeof Mocks.admin).toBe("function");
      expect(typeof Mocks.moderator).toBe("function");
      expect(typeof Mocks.users).toBe("function");
      expect(typeof Mocks.trip).toBe("function");
      expect(typeof Mocks.group).toBe("function");
      expect(typeof Mocks.challenge).toBe("function");
    });

    it("exports all ID-only shortcut functions", () => {
      expect(typeof Mocks.userId).toBe("function");
      expect(typeof Mocks.adminId).toBe("function");
      expect(typeof Mocks.moderatorId).toBe("function");
      expect(typeof Mocks.tripId).toBe("function");
      expect(typeof Mocks.groupId).toBe("function");
      expect(typeof Mocks.challengeId).toBe("function");
    });

    it("Mocks.user returns same as mockUser", () => {
      const fromNamespace = Mocks.user();
      const fromDirect = mockUser();

      expect(fromNamespace).toEqual(fromDirect);
    });

    it("Mocks.admin returns same as mockAdmin", () => {
      const fromNamespace = Mocks.admin();
      const fromDirect = mockAdmin();

      expect(fromNamespace).toEqual(fromDirect);
    });

    it("Mocks.moderator returns same as mockModerator", () => {
      const fromNamespace = Mocks.moderator();
      const fromDirect = mockModerator();

      expect(fromNamespace).toEqual(fromDirect);
    });

    it("Mocks.users returns same as mockUsers", () => {
      const fromNamespace = Mocks.users(3);
      const fromDirect = mockUsers(3);

      expect(fromNamespace).toEqual(fromDirect);
    });

    it("Mocks.trip returns same as mockTrip", () => {
      const fromNamespace = Mocks.trip();
      const fromDirect = mockTrip();

      expect(fromNamespace).toEqual(fromDirect);
    });

    it("Mocks.group returns same as mockGroup", () => {
      const fromNamespace = Mocks.group();
      const fromDirect = mockGroup();

      expect(fromNamespace).toEqual(fromDirect);
    });

    it("Mocks.challenge returns same as mockChallenge", () => {
      const fromNamespace = Mocks.challenge();
      const fromDirect = mockChallenge();

      expect(fromNamespace).toEqual(fromDirect);
    });

    it("Mocks.userId creates valid UserId with default", () => {
      const id = Mocks.userId();

      expect(id).toBe(UserId.create(TestIds.USER));
    });

    it("Mocks.userId creates valid UserId with custom value", () => {
      const customId = "550e8400-e29b-41d4-a716-446655440999";
      const id = Mocks.userId(customId);

      expect(id).toBe(UserId.create(customId));
    });

    it("Mocks.adminId creates valid UserId with default", () => {
      const id = Mocks.adminId();

      expect(id).toBe(UserId.create(TestIds.ADMIN));
    });

    it("Mocks.moderatorId creates valid UserId with default", () => {
      const id = Mocks.moderatorId();

      expect(id).toBe(UserId.create(TestIds.MODERATOR));
    });

    it("Mocks.tripId creates valid TripId with default", () => {
      const id = Mocks.tripId();

      expect(id).toBe(TripId.create(TestIds.TRIP));
    });

    it("Mocks.groupId creates valid GroupId with default", () => {
      const id = Mocks.groupId();

      expect(id).toBe(GroupId.create(TestIds.GROUP));
    });

    it("Mocks.challengeId creates valid ChallengeId with default", () => {
      const id = Mocks.challengeId();

      expect(id).toBe(ChallengeId.create(TestIds.CHALLENGE));
    });
  });

  // ===========================================================================
  // Branded ID Validation Tests
  // ===========================================================================
  describe("branded ID validation", () => {
    it("mockUser creates UserId that passes UserId.equals check", () => {
      const user = mockUser();
      const recreated = UserId.create(TestIds.USER);

      expect(UserId.equals(user.id, recreated)).toBe(true);
    });

    it("mockAdmin creates UserId that passes UserId.equals check", () => {
      const admin = mockAdmin();
      const recreated = UserId.create(TestIds.ADMIN);

      expect(UserId.equals(admin.id, recreated)).toBe(true);
    });

    it("mockModerator creates UserId that passes UserId.equals check", () => {
      const moderator = mockModerator();
      const recreated = UserId.create(TestIds.MODERATOR);

      expect(UserId.equals(moderator.id, recreated)).toBe(true);
    });

    it("mockTrip creates TripId that passes TripId.equals check", () => {
      const trip = mockTrip();
      const recreated = TripId.create(TestIds.TRIP);

      expect(TripId.equals(trip.id, recreated)).toBe(true);
    });

    it("mockGroup creates GroupId that passes GroupId.equals check", () => {
      const group = mockGroup();
      const recreated = GroupId.create(TestIds.GROUP);

      expect(GroupId.equals(group.id, recreated)).toBe(true);
    });

    it("mockChallenge creates ChallengeId that passes ChallengeId.equals check", () => {
      const challenge = mockChallenge();
      const recreated = ChallengeId.create(TestIds.CHALLENGE);

      expect(ChallengeId.equals(challenge.id, recreated)).toBe(true);
    });

    it("IDs from different entities do not equal each other", () => {
      const user = mockUser();
      const trip = mockTrip();

      expect(user.id).not.toBe(trip.id);
      expect(user.id).not.toEqual(trip.id);
    });

    it("different users have different IDs", () => {
      const users = mockUsers(3);

      expect(users[0]!.id).not.toBe(users[1]!.id);
      expect(users[1]!.id).not.toBe(users[2]!.id);
      expect(users[0]!.id).not.toBe(users[2]!.id);
    });

    it("same ID content creates equal branded IDs", () => {
      const id1 = UserId.create(TestIds.USER);
      const id2 = UserId.create(TestIds.USER);

      expect(UserId.equals(id1, id2)).toBe(true);
    });
  });
});
